/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import ContainerStore from '/stores/container';
var renderer = new THREE.WebGLRenderer( {
  alpha: true,
  antialias: false,
  clearColor: 0x000000,
  logarithmicDepthBuffer: false
} );
renderer.sortObjects = true;

// Don't clear buffers we know will be overwritten
renderer.autoClear = false;
renderer.autoClearColor = false;
renderer.autoClearDepth = true;
renderer.autoClearStencil = false;
renderer.domElement.selectable = false;
// We do our own tonemapping, so disable otherwise get shader errors
renderer.toneMapping = THREE.NoToneMapping;

var state = ContainerStore.getState();
renderer.setPixelRatio( state.pixelRatio );
renderer.setSize( state.width, state.height );
ContainerStore.listen( function ( state ) {
  renderer.setPixelRatio( state.pixelRatio );
  renderer.setSize( state.width, state.height );
} );

export default renderer;
