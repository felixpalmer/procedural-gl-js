/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import CameraStore from '/stores/camera';
import skyColor from '/utils/skyColor';
var direction = new THREE.Vector3();
var lastDirection = new THREE.Vector3();
var forceUpdate = false;

// Uniforms required where drawing basic fog
var fogUniforms = {
  uFogDropoff: { type: 'f', value: 0.0006 },
  uFogIntensity: { type: 'f', value: 0.1 },
  uFogColor: { type: 'c', value: new THREE.Color() },
  update: function ( state ) {
    forceUpdate = !state;
    state = state || CameraStore.getState();

    // Sky uses different coordinate system
    direction.copy( state.target ).sub( state.position );

    direction.z = direction.y;

    // Flatten y component to look at horizon
    direction.y = 0.0;
    direction.normalize();

    if ( forceUpdate || direction.distanceToSquared( lastDirection ) > 0.01 ) {
      fogUniforms.uFogColor.value.copy( skyColor( direction ) );
      lastDirection.copy( direction );
    }
  }
};

CameraStore.listen( fogUniforms.update );
export default fogUniforms;
