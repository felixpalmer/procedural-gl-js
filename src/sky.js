/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';

import material from '/material';
import scene from '/scene';

const hemisphere = new THREE.SphereBufferGeometry( 200000, 32, 6, 0, 2 * Math.PI, 0, 0.6 * Math.PI );
const m = new THREE.Matrix4();
m.makeRotationX( Math.PI / 2 );
hemisphere.applyMatrix4( m );

const mesh = new THREE.Mesh( hemisphere, material.sky );
mesh.geometry.computeBoundingBox();
mesh.renderOrder = 10000; // Render sky last as often obscured
scene.add( mesh );
export default mesh;
