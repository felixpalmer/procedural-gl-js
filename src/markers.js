/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import _ from 'lodash';
import anchorForName from '/utils/anchorForName';
import Atlas from '/atlas';
import camera from '/camera';
import CameraStore from '/stores/camera';
import clippingForName from '/utils/clippingForName';
import Color from '/patched/Color';
import defer from '/utils/defer';
import MarkerData from '/data/marker';
import geoproject from '/geoproject';
import glyphForIcon from '/utils/glyphForIcon';
import log from '/log';
import material from '/material';
import normalAt from '/normalAt';
import PlacesStore from '/stores/places';
import picker from '/picker';
import PushList from '/utils/pushList';
import RenderActions from '/actions/render';
import scene from '/scene';
import track from '/track';
var Markers = function () {
  // For instancing to work, the position attribute must
  // have the instance in it, although this breaks the
  // bounding sphere/box calculations, see below
  var quad = [ -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1 ];
  this.positions = new THREE.BufferAttribute( new Float32Array( quad ), 2 );

  var geom = new THREE.InstancedBufferGeometry();
  geom.setAttribute( 'position', this.positions );
  THREE.Mesh.call( this, geom, material.marker );
  this.name = 'markers';
  RenderActions.renderedFeatureRegister( this.name );
  this.renderOrder = 1000;
  this.atlas = new Atlas();
  //this.material.uniforms.uMap.value = this.atlas.renderTarget.texture;
  this.material.uniforms.uMap.value = this.atlas.texture;
  //this.material = picker.pickerScene.overrideMaterial;

  MarkerData.listen( this.onNewData.bind( this ) );

  scene.hd.add( this );
  this.parent = null; // To let us have markers in two scenes, remove first scene as parent
  picker.pickerScene.add( this );
  this.parent = null;
  this.visible = false;

  var self = this;

  this.empty = true;
  CameraStore.listen( this.checkVisibility.bind( this ) );

  PlacesStore.listen( function () {
    self.atlas.clear();
  } );
};

Markers.prototype = Object.create( THREE.Mesh.prototype );

Markers.prototype.checkVisibility = function () {
  this.visible = !this.empty && ( camera.near > 20 );
};

Markers.prototype.onNewData = function ( state ) {
  if ( state.isUpdate ) {
    this.onUpdatedData( state );
    return;
  }

  var startTime = track.now();
  var self = this;
  var features = state.data;
  this.empty = features.length === 0;
  this.checkVisibility();
  if ( this.empty ) {
    this.atlas.clear();
    defer( function () {
      RenderActions.renderedFeatureDisplayed( self.name );
    } );
    return;
  } else {
    defer( function () {
      RenderActions.renderedFeatureRegister( self.name );
    } );
  }

  this.geometry = new THREE.InstancedBufferGeometry();
  this.geometry.setAttribute( 'position', this.positions );

  // Define attributes, with default values
  var defaultAnchor = anchorForName();
  var defaultClipping = clippingForName( 'pixel' );
  var attrs = {
    anchor: new PushList( defaultAnchor.x, defaultAnchor.y,
      0, 0 ),
    atlas: new PushList( 0, 0, 0, 0 ),
    background: new PushList( 255, 255, 255, 0 ),
    clipping: new PushList( defaultClipping.x, defaultClipping.y ),
    color: new PushList( 255, 255, 255, 255 ),
    layout: new PushList( 0, 0, 0 ),
    normal: new PushList( 0, 0, 1, 100000 ),
    offset: new PushList( 0, 0, 0, 100000 ),
    tag: new PushList( 0, 0, 0, 0.2 )
  };

  // Some attributes need special configuration
  attrs.background.normalized = true;
  attrs.color.normalized = true;
  attrs.normal.dynamic = true;
  attrs.offset.dynamic = true;

  // Trying to optimize these leads to weird glitches
  // where labels disappear, so alway create actual attributes
  // for them
  attrs.normal.onlyDuplicates = false;
  attrs.offset.onlyDuplicates = false;

  var anchor, anchorOffset, atlas, background, clipping, color,
    collapseDistance, drawImmediate, fadeDistance, layout = { x: 0, y: 0, z: 0 },
    highlightOpacity, normal, offset, props, text;

  var cameraX = camera.position.x;
  var cameraY = camera.position.y;
  features.forEach( function ( feature ) {
    props = feature.properties;
    if ( feature.tag ) {
      color = new Color( feature.tag );
    } else {
      color = new Color( 0 );
    }

    highlightOpacity = props.highlightOpacity !== undefined ?
      props.highlightOpacity : 0.2;
    attrs.tag.push( color.r, color.g, color.b, highlightOpacity );

    if ( props.color ) {
      color = new Color( props.color );
      attrs.color.push( 255 * color.r, 255 * color.g, 255 * color.b, 255 * color.a );
    } else {
      attrs.color.pushDefault();
    }

    if ( props.background ) {
      background = new Color( props.background );
      attrs.background.push( 255 * background.r, 255 * background.g, 255 * background.b, 255 * background.a );
    } else if ( props.color ) {
      // If have no background, use transparent version of colour
      // to avoid halo due to transparency fading to white
      attrs.background.push( 255 * color.r, 255 * color.g, 255 * color.b, 0 );
    } else {
      attrs.background.push( 255, 255, 255, 0 );
    }


    collapseDistance = props.collapseDistance || 100000;
    fadeDistance = props.fadeDistance || 100000;
    offset = geoproject.vectorizeFeature( feature );
    attrs.offset.push( offset.x, offset.y, offset.z, fadeDistance );

    if ( props.image ) {
      atlas = self.atlas.addImage( props.image,
        props.width,
        props.height );
      attrs.atlas.push( atlas.x, atlas.y, atlas.z, atlas.w );
    } else if ( props.name !== undefined ||
                props.icon !== undefined ) {
      clipping = clippingForName( 'object' );
      text = '';
      if ( props.icon !== undefined ) {
        text += glyphForIcon( props.icon );
        if ( props.name !== undefined ) {
          text += '  ';
        }
      }

      if ( props.name !== undefined ) {
        text += props.name;
      }

      drawImmediate = Math.abs( cameraX - offset.x ) < 4000 &&
                      Math.abs( cameraY - offset.y ) < 4000;

      atlas = self.atlas.addText( text, props.fontSize, drawImmediate );
      attrs.atlas.push( atlas.x, atlas.y, atlas.z, atlas.w );
    } else {
      clipping = clippingForName( 'object' );
      attrs.atlas.pushDefault();
    }

    if ( props.clipping ) {
      clipping = clippingForName( props.clipping || 'pixel' );
    } else {
      clipping = clipping || defaultClipping;
    }

    attrs.clipping.push( clipping.x, clipping.y );

    anchor = anchorForName( props.anchor );
    anchorOffset = props.anchorOffset || { x: 0, y: 0 };
    attrs.anchor.push( anchor.x, anchor.y,
      parseFloat( anchorOffset.x ) || 0,
      parseFloat( anchorOffset.y ) || 0 );

    layout.x = props.padding || 0;
    layout.y = props.borderWidth || 0;
    layout.z = props.borderRadius || 0;
    attrs.layout.push( layout.x, layout.y, layout.z );

    normal = normalAt( offset );
    attrs.normal.push( normal.x, normal.y, normal.z, collapseDistance );
  } );

  // Atlas processes text in batches, trigger to complete final
  // one
  this.atlas.processQueue();

  // TODO, switch Float32Arrays to smaller data types
  // Apply all atributes to geometry
  _.forOwn( attrs, function ( attr, key ) {
    if ( attr.onlyDuplicates ) {
      var value = attr.firstValue || attr.defaultValue;
      if ( attr.normalized ) {
        value = value.map( function ( v ) { return v / 255.0 } );
      }

      self.material.defaultAttributeValues[ key ] = value;
    } else {
      var TypeArray = ( attr.normalized ? Uint8Array : Float32Array );
      var bufferAttribute = new THREE.InstancedBufferAttribute(
        new TypeArray( attr.array ), attr.defaultValue.length,
        attr.normalized, 1 );
      if ( attr.dynamic ) {
        bufferAttribute.setUsage( THREE.DynamicDrawUsage );
      }

      self.geometry.setAttribute( key, bufferAttribute );
    }
  } );

  // Bounding sphere calculations are broken as the position
  // attribute doesn't contain the label positions but rather
  // the instance. To workaround, temporarily swap attributes
  // and calculate
  var position = this.geometry.attributes.position;
  this.geometry.attributes.position = this.geometry.attributes.offset;
  this.geometry.computeBoundingSphere();
  this.geometry.attributes.position = position;

  // As we don't know the label heights, expand sphere so we are safe
  this.geometry.boundingSphere.center.z = 2000;
  const R = this.geometry.boundingSphere.radius;
  this.geometry.boundingSphere.radius = Math.max( R, 2000 );

  // Do not draw if we do not have any markers
  this.visible = attrs.offset.array.length > 0;

  var constructTime = track.now() - startTime;
  log( 'Parsed', this.name );
  log( 'Blit count', this.atlas.blitCount );
  track.timing( this.name, 'construct', null, constructTime );
  defer( function () {
    RenderActions.renderedFeatureDisplayed( self.name );
    features.forEach( function ( feature ) {
      RenderActions.featureCreated( feature );
    } );
  } );
};

Markers.prototype.onUpdatedData = function ( state ) {
  var offsetAttribute = this.geometry.attributes.offset;
  var normalAttribute = this.geometry.attributes.normal;
  if ( offsetAttribute === undefined ) { return }

  var offset, normal, i = 0;
  state.data.forEach( function ( feature ) {
    offset = geoproject.vectorizeFeature( feature );
    offsetAttribute.array[ i ] = offset.x;
    offsetAttribute.array[ i + 1 ] = offset.y;
    offsetAttribute.array[ i + 2 ] = offset.z;
    normal = normalAt( offset );
    normalAttribute.array[ i ] = normal.x;
    normalAttribute.array[ i + 1 ] = normal.y;
    normalAttribute.array[ i + 2 ] = normal.z;
    i += 4;
  } );
  offsetAttribute.needsUpdate = true;
  normalAttribute.needsUpdate = true;
  // Should use updateBuffer so bufferSubData is used
};

export default new Markers();
