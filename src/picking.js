/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import renderer from '/renderer';
import ContainerStore from '/stores/container';
import tilepickerUniforms from '/uniforms/tilepicker';

// Picking
const canvas = renderer.domElement;
const TilePicker = {
  data: new Uint8Array( 4 * canvas.width * canvas.height ),
  target: new THREE.WebGLRenderTarget( canvas.width, canvas.height ),
}

// Make independent target for picking to not intefere with terrain
const FeaturePicker = {
  data: new Uint8Array( 4 * canvas.width * canvas.height ),
  target: new THREE.WebGLRenderTarget( canvas.width, canvas.height ),
}

function updateSize( { width, height, renderRatio } ) {
  // Want to scale down so that resulting canvas is 500 pixels
  // This means 500 pixels total not 500 wide!!!
  let downScale = Math.sqrt( ( width * height ) / 500 );
  let w = 2 * Math.round( 0.5 * width / downScale );
  let h = 2 * Math.round( 0.5 * height / downScale );
  if ( !TilePicker.target ||
       w !== TilePicker.target.width ||
       h !== TilePicker.target.height ) {
    TilePicker.target = new THREE.WebGLRenderTarget( w, h );
    TilePicker.data = new Uint8Array( 4 * TilePicker.target.width * TilePicker.target.height );

    // 16X picker to be improve click accuracy
    FeaturePicker.target = new THREE.WebGLRenderTarget( 16 * w, 16 * h );
    FeaturePicker.data = new Uint8Array( 4 * FeaturePicker.target.width * FeaturePicker.target.height );

    // Update shaders
    tilepickerUniforms.uScaling.value.set(
      0.5 * w, 0.5 * h, // Location of center pixel
      256 / ( renderRatio * downScale ) // Scaling factor for uv error to compensate downScale
    );
  }
}

ContainerStore.listen( updateSize );

export {
  TilePicker, FeaturePicker 
}
