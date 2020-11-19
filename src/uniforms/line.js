/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import ContainerStore from '/stores/container';

const lineUniforms = {
  uViewportInverse: { type: 'v2', value: new THREE.Vector2( 1.0, 1.0 ) },
};

ContainerStore.listen( ( { height, width } ) => {
  lineUniforms.uViewportInverse.value.set( 1.0 / width, 1.0 / height );
} );

export default lineUniforms;
