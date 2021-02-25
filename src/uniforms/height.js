/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import AppStore from '/stores/app';
import ElevationDatasource from '/datasources/elevation';
import GeoprojectStore from '/stores/geoproject';

// Uniforms for shaders that lookup height
const heightUniforms = {
  elevationArray: { value: ElevationDatasource.textureArray },
  indirectionTexture: { value: ElevationDatasource.indirectionTexture },
  uGlobalOffset: { type: 'v2', value: new THREE.Vector2() },
  uSceneScale: { type: 'v3', value: new THREE.Vector3(
    1, // sceneScale
    1, // earthScale
    1 // tileScale
  ) }
};

function updateSceneScale () {
  const sceneScale = GeoprojectStore.getState()[ 'sceneScale' ];
  const maxZoom = ElevationDatasource.maxZoom;

  // Compute compound values to ease work in shader and improve
  // accuracy
  const zoomScale = Math.pow( 2, 15 - maxZoom );
  const earthScale = 40075016.686 / ( sceneScale * Math.pow( 2, 15 ) );
  const earthShift = -6.283185307179586 / Math.pow( 2.0, maxZoom );
  const tileScale = 1 / ( sceneScale * zoomScale );
  heightUniforms.uSceneScale.value.set(
    earthShift, earthScale, tileScale );
}

AppStore.listen( () => { updateSceneScale() } );

GeoprojectStore.listen( ( { globalOffset, sceneScale } ) => {
  heightUniforms.uGlobalOffset.value.copy( globalOffset );
  updateSceneScale();
} );

export default heightUniforms;
