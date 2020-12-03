/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import ContainerStore from '/stores/container';
// Changing the far parameter makes little difference,
// the key one is near, as we start losing depth
// precision based on that
// http://www.reedbeta.com/blog/depth-precision-visualized/
var camera = new THREE.PerspectiveCamera(
  45, // fov
  1, // aspect
  250, // near
  2500000 // far
);

ContainerStore.listen( function ( state ) {
  camera.aspect = state.aspect;
  camera.fov = state.fov / Math.max( camera.aspect, 1.0 );
  camera.updateProjectionMatrix();
} );

export default camera;
