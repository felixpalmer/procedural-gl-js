/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// TODO split into separate files, one for each material
import THREE from 'three';

import _ from 'lodash';
import beaconVertex from 'shader/beacon.vert';
import beaconFragment from 'shader/beacon.frag';
import Color from '/patched/Color';
import {
  ELEVATION_POOL_SIZE, ELEVATION_TILE_SIZE,
  IMAGERY_POOL_SIZE, IMAGERY_TILE_SIZE,
  INTERPOLATE_FLOAT } from "/constants";
import depthUniforms from '/uniforms/depth';
import fogUniforms from '/uniforms/fog';
import heightUniforms from '/uniforms/height';
import ImageryDatasource from '/datasources/imagery';
import lineVertex from 'shader/line.vert';
import lineFragment from 'shader/line.frag';
import lineUniforms from '/uniforms/line';
import markerVertex from 'shader/marker.vert';
import markerFragment from 'shader/marker.frag';
import markerUniforms from '/uniforms/marker';
import skyVertex from 'shader/sky.vert';
import skyFragment from 'shader/sky.frag';
import skyUniforms from '/uniforms/sky';
import tagUniforms from '/uniforms/tag';
import terrainVertex from 'shader/terrain.vert';
import terrainFragment from 'shader/terrain.frag';
import terrainPickerVertex from 'shader/terrainPicker.vert';
import terrainPickerFragment from 'shader/terrainPicker.frag';
import tilepickerUniforms from '/uniforms/tilepicker';
import tonemapUniforms from '/uniforms/tonemap';
import webgl from '/webgl';

// Update shaders defines
// TODO also define picker.js shaders here and update defines
[
  beaconVertex, lineVertex, markerVertex, /*pickerVertex, raycastVertex,*/
  terrainVertex, terrainPickerVertex
].forEach( shader => {
  if ( !INTERPOLATE_FLOAT ) {
    shader.define( 'MANUAL_TEXTURE_BILINEAR', '1' );
  }

  shader.define(
    'VIRTUAL_TEXTURE_ARRAY_BLOCKS',
    Math.sqrt( ELEVATION_POOL_SIZE ).toExponential() );
  shader.define(
    'VIRTUAL_TEXTURE_ARRAY_SIZE',
    ELEVATION_TILE_SIZE.toExponential() );
} );
terrainFragment.define(
  'VIRTUAL_TEXTURE_ARRAY_BLOCKS',
  Math.sqrt( IMAGERY_POOL_SIZE ).toExponential() );
terrainFragment.define(
  'VIRTUAL_TEXTURE_ARRAY_SIZE',
  IMAGERY_TILE_SIZE.toExponential() );

// Materials that depend on extension support
if ( webgl.depthTexture ) {
  markerVertex.define( 'READ_DEPTH', 1 );
  markerFragment.define( 'READ_DEPTH', 1 );
}

// TODO too many similar blocks of code here. Should clean up the uniforms
// combining using _.assign or similar
var material = {
  beacon: new THREE.RawShaderMaterial( {
    name: '_beacon', // Names starting with _ will not be precompiled
    uniforms: _.assign( {
      uAccuracy: { type: 'f', value: 25 },
      uTime: { type: 'f', value: 0 }
    },
    heightUniforms
    ),
    depthWrite: false,
    vertexShader: beaconVertex.value,
    fragmentShader: beaconFragment.value,
    transparent: true
  } ),
  marker: ( () => {
    const m = new THREE.RawShaderMaterial( {
      name: 'marker',
      uniforms: _.assign( {},
        depthUniforms,
        heightUniforms,
        markerUniforms,
        tagUniforms
      ),
      vertexShader: markerVertex.value,
      fragmentShader: markerFragment.value,
      transparent: true
    } );
    m.defaultAttributeValues = {}; // Remove usual defaults as they are wrong
    return m;
  } )(),
  line: _.memoize( function ( color, thickness, outlineColor ) {
    // Cutoff dictates where we will begin to fade out line
    // For wider lines this is relatively later, so we don't have
    // fuzzy edges
    // The value will be at least 0.3, and tend to 1 for large thicknesses
    // Equivalent to the 2 edge pixels being used for the fade-out
    var cutoff = Math.max( 0.3, ( thickness - 2 ) / thickness );
    var c = new Color( color );
    color = [ c.r, c.g, c.b, c.a ];

    var haveOutline = outlineColor !== undefined;
    if ( haveOutline ) {
      c = new Color( outlineColor );
      if ( c.a === undefined ) { c.a = 1.0 }

      outlineColor = new THREE.Vector4( c.r, c.g, c.b, c.a );
    } else {
      outlineColor = new THREE.Vector4( 0, 0, 0, 0 );
    }

    var mat = new THREE.RawShaderMaterial( {
      name: 'line',
      uniforms: _.assign( {
        uCutoff: { type: 'f', value: cutoff },
        uOutlineColor: { type: 'c', value: outlineColor },
        uThickness: { type: 'f', value: thickness },
      },
      heightUniforms,
      lineUniforms,
      tagUniforms
      ),
      vertexShader: lineVertex.value,
      fragmentShader: lineFragment.value,
      transparent: true
    } );

    // To allow us to specify color both per-line
    // and per-vertex, use an attribute, not uniform
    mat.defaultAttributeValues.color = color;
    return mat;
  } ),
  sky: new THREE.RawShaderMaterial( {
    name: 'sky',
    uniforms: _.assign( {},
      skyUniforms,
      tonemapUniforms
    ),
    depthWrite: false, // Will render last and thus don't need depth
    vertexShader: skyVertex.value,
    fragmentShader: skyFragment.value,
    side: THREE.BackSide
  } ),
  terrain: ( uniforms ) => {
    const imagery = new THREE.RawShaderMaterial( {
      uniforms: _.assign( uniforms,
        { imageryArray: { value: ImageryDatasource.textureArray }, },
        fogUniforms,
        heightUniforms
      ),
      vertexShader: terrainVertex.value,
      fragmentShader: terrainFragment.value
    } );
    const picker = new THREE.RawShaderMaterial( {
      uniforms: _.assign( uniforms,
        heightUniforms,
        tilepickerUniforms
      ),
      vertexShader: terrainPickerVertex.value,
      fragmentShader: terrainPickerFragment.value
    } );

    return { imagery, picker };
  }
};

// Apparently makes things quicker as the offset
// attribute will always have data in it (ie it
// will never be set in defaultAttributesValues)
material.marker.index0AttributeName = 'offset';

// Optimize by emptying out default attribute values
// As these are not used, we can prevent THREE.js
// needlessly setting these on each frame
_.forOwn( material, function ( m ) {
  if ( m.type === "RawShaderMaterial" ) {
    m.defaultAttributeValues = {};
  }
} );

export default material;
