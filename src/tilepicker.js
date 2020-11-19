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
const tilepicker = {
  data: new Uint8Array( 4 * canvas.width * canvas.height ),
  target: new THREE.WebGLRenderTarget( canvas.width, canvas.height )
};

function updateSize( { width, height, renderRatio } ) {
  // Want to scale down so that resulting canvas is 500 pixels
  let downScale = Math.sqrt( ( width * height ) / 500 );
  let w = 2 * Math.round( 0.5 * width / downScale );
  let h = 2 * Math.round( 0.5 * height / downScale );
  if ( !tilepicker.target ||
       w !== tilepicker.target.width ||
       h !== tilepicker.target.height ) {
    tilepicker.target = new THREE.WebGLRenderTarget( w, h );
    tilepicker.data = new Uint8Array( 4 * tilepicker.target.width * tilepicker.target.height );

    // Update shaders
    tilepickerUniforms.uScaling.value.set(
      0.5 * w, 0.5 * h, // Location of center pixel
      256 / ( renderRatio * downScale ) // Scaling factor for uv error to compensate downScale
    );
  }
}

ContainerStore.listen( updateSize );

export default tilepicker;
