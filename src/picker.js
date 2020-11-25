/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import _ from 'lodash';
import camera from '/camera';
import ContainerStore from '/stores/container';
import heightAt from '/heightAt';
import heightUniforms from '/uniforms/height';
import material from '/material';
import pickerVertex from 'shader/picker.vert';
import pickerFragment from 'shader/picker.frag';
import pickerUniforms from '/uniforms/picker';
import raycastVertex from 'shader/raycast.vert';
import raycastFragment from 'shader/raycast.frag';
import RenderStore from '/stores/render';
import renderer from '/renderer';
import tagUniforms from '/uniforms/tag';

var oldAutoClearDepth;
var tagId;
var id, store, s, sl, feature, f, fl;

// Implements GPU picking
var picker = {
  mouse: { x: 0, y: 0 },
  raycastPosition: new THREE.Vector3(),
  init: function () {
    // Render at smaller size, we don't need pixel perfect accuracy
    // and it saves a lot of memory
    // Don't want this too low, or the picking is inaccurate
    picker.resolution = 0.2;

    // Create materials for picking and raycasting and create scenes
    var pickerMaterial = new THREE.RawShaderMaterial( {
      name: 'picker',
      uniforms: _.assign( {},
        heightUniforms,
        pickerUniforms
      ),
      vertexShader: pickerVertex.value,
      fragmentShader: pickerFragment.value
    } );

    pickerMaterial.defaultAttributeValues = material.marker.defaultAttributeValues;
    picker.pickerScene = new THREE.Scene();
    picker.pickerScene.overrideMaterial = pickerMaterial;
    picker.pickerScene.lastCameraPosition = camera.position.clone();

    var raycastMaterial = new THREE.RawShaderMaterial( {
      name: 'raycast',
      uniforms: heightUniforms,
      vertexShader: raycastVertex.value,
      fragmentShader: raycastFragment.value
    } );
    picker.raycastScene = new THREE.Scene();
    picker.raycastScene.overrideMaterial = raycastMaterial;

    var state = ContainerStore.getState();
    var parameters = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter
    };

    // Downsized renderTarget for GPU picking
    picker.renderTarget = new THREE.WebGLRenderTarget( picker.resolution * state.width, picker.resolution * state.height, parameters );
    // Single pixel render target, for position raycasting
    // we'll set a viewOffset when rendering to crop out
    //the correct portion on the view
    picker.renderTarget1px = new THREE.WebGLRenderTarget( 1, 1, parameters );
    picker.viewOffsetWidth = state.width;
    picker.viewOffsetHeight = state.height;

    // Picked pixel will be written into here
    picker.buffer = new Uint8Array( 4 );
  },
  stores: [],
  tagId: 1,
  featureIdtoTagId: new Map(),
  // Tags all features in a store to enable GPU picking
  registerStore: function ( store ) {
    if ( picker.stores.indexOf( store ) === -1 ) {
      picker.stores.push( store );
    }

    store.data.forEach( function ( feature ) {
      // Unless explicitly marked as unselectable, default to tagging
      if ( feature.properties.selectable !== false ) {
        // Use feature id, this way we can create compound
        // markers, that get selected together
        if ( feature.id !== undefined ) {
          tagId = picker.featureIdtoTagId.get( feature.id );
          if ( !tagId ) {
            tagId = picker.tagId++;
            picker.featureIdtoTagId.set( feature.id, tagId );
          }

          feature.tag = tagId;
        } else {
          feature.tag = picker.tagId++;
          feature.id = 1000000 + picker.tagId++;
        }
      }
    } );
  },
  pickFeature: function ( mouse ) {
    picker.mouse.x = mouse.x;
    picker.mouse.y = mouse.y;
    if ( mouse.clipspace ) {
      picker.mouse = ContainerStore.fromClipSpace( picker.mouse );
    }

    // Transform coordinates
    picker.mouse.x = picker.resolution * picker.mouse.x;
    picker.mouse.y = picker.renderTarget.height - picker.resolution * picker.mouse.y;

    // Cache camera location to avoid unnecessary re-renders
    if ( !picker.pickerScene.lastCameraPosition.equals( camera.position ) ) {
      picker.pickerScene.lastCameraPosition.copy( camera.position );
      // In the case of picking, we have to render the terrain
      // first, to make sure the picker scene is correctly
      // obscured
      // TODO would be nice if we could re-use the depthTexture
      // for this, but it doesn't seem to work...
      renderer.setRenderTarget( picker.renderTarget );
      renderer.render( picker.raycastScene, camera );

      oldAutoClearDepth = renderer.autoClearDepth;
      renderer.autoClearDepth = false;
      renderer.render( picker.pickerScene, camera );
      renderer.autoClearDepth = oldAutoClearDepth;
      // TODO don't execute when performing tex copy
    }

    renderer.readRenderTargetPixels( picker.renderTarget,
      picker.mouse.x, picker.mouse.y,
      1, 1, picker.buffer );

    // Interpret as id
    /*jslint bitwise: true */
    id = ( picker.buffer[ 0 ] << 16 ) | ( picker.buffer[ 1 ] << 8 ) | ( picker.buffer[ 2 ] );
    /*jslint bitwise: false */

    // Update uniform so shaders can highlight
    tagUniforms.uSelectedTag.value.set( id === 0 ? 65536 : id );

    // Lookup actual feature
    for ( s = 0, sl = picker.stores.length; s < sl; s++ ) {
      store = picker.stores[ s ];
      for ( f = 0, fl = store.data.length; f < fl; f++ ) {
        feature = store.data[ f ];
        if ( feature.tag === id ) { return feature }
      }
    }

    return null;
  },
  raycastTerrain: function ( mouse ) {
    picker.mouse.x = mouse.x;
    picker.mouse.y = mouse.y;
    if ( mouse.clipspace ) {
      picker.mouse = ContainerStore.fromClipSpace( picker.mouse );
    }

    // As we're just rendering one pixel at the location of the
    // mouse, set a viewOffset, which we'll later clear
    camera.setViewOffset(
      picker.viewOffsetWidth, picker.viewOffsetHeight,
      picker.mouse.x, picker.mouse.y,
      1, 1
    );

    // Render single pixel and read out value
    renderer.setRenderTarget( picker.renderTarget1px );
    renderer.render( picker.raycastScene, camera );
    renderer.readRenderTargetPixels( picker.renderTarget1px,
      0, 0, 1, 1, picker.buffer );
    camera.clearViewOffset();

    // Extract packed position from buffer
    picker.raycastPosition.set(
      picker.buffer[ 0 ] + 256 * picker.buffer[ 2 ] - 32768,
      picker.buffer[ 1 ] + 256 * picker.buffer[ 3 ] - 32768
    );
    if ( picker.raycastPosition.x === 32768 &&
         picker.raycastPosition.y === 32768 ) {
      return null;
    }

    picker.raycastPosition.z = heightAt( picker.raycastPosition );
    return picker.raycastPosition;
  },
  render: function () {
    // Testing, render to screen
    renderer.setScissorTest( true );
    var w = 50;

    // Transfrom coordinates back again
    var x = picker.mouse.x / picker.resolution;
    var y = ( picker.renderTarget.height - picker.mouse.y ) / picker.resolution;
    renderer.setScissor( x - w, y - w, 2 * w, 2 * w );

    //renderer.render( picker.pickerScene, camera );
    // Testing picker
    renderer.render( picker.raycastScene, camera );
    oldAutoClearDepth = renderer.autoClearDepth;
    renderer.autoClearDepth = false;
    renderer.setClearColor( '#ff0000', 1.0 );

    renderer.render( picker.pickerScene, camera );
    renderer.autoClearDepth = oldAutoClearDepth;

    // Testing raycast
    //renderer.render( picker.raycastScene, camera );
    renderer.setScissorTest( false );
  }
};

ContainerStore.listen( function ( state ) {
  picker.renderTarget.setSize( picker.resolution * state.width,
    picker.resolution * state.height );
  picker.viewOffsetWidth = state.width;
  picker.viewOffsetHeight = state.height;
} );

RenderStore.listen( function ( state ) {
  if ( state.animating ) {
    // Move last camera to force re-render
    picker.pickerScene.lastCameraPosition.x += 1000000;
  }
} );

picker.init();
export default picker;
