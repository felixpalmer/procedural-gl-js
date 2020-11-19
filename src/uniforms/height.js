/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import ElevationDatasource from '/datasources/elevation';
import GeoprojectStore from '/stores/geoproject';

// Uniforms for shaders that lookup height
const heightUniforms = {
  elevationArray: { value: ElevationDatasource.textureArray },
  indirectionTexture: { value: ElevationDatasource.indirectionTexture },
  uGlobalOffset: { type: 'v2', value: new THREE.Vector2() },
  uSceneScale: { type: 'f', value: 1 }
};

GeoprojectStore.listen( ( { globalOffset, sceneScale } ) => {
  heightUniforms.uGlobalOffset.value.copy( globalOffset );
  heightUniforms.uSceneScale.value = sceneScale;
} );

export default heightUniforms;
