/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import ContainerStore from '/stores/container';

const markerUniforms = {
  uMap: { type: 't', value: null },
  uPixelRatio: { type: 'f', value: 1.0 },
  uViewportInverse: { type: 'v2', value: new THREE.Vector2( 1.0, 1.0 ) },
};

ContainerStore.listen( ( { canvasHeight, pixelRatio, canvasWidth } ) => {
  markerUniforms.uViewportInverse.value.set(
    1.0 / canvasWidth, 1.0 / canvasHeight );
  markerUniforms.uPixelRatio.value = pixelRatio;
} );

export default markerUniforms;
