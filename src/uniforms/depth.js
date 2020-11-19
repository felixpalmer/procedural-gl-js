/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import CameraStore from '/stores/camera';
import composer from '/composer';
import webgl from '/webgl';
var depthUniforms = {};
if ( webgl.depthTexture ) {
  depthUniforms.uDepth = { type: 't', value: composer.renderTarget2.depthTexture };
}

depthUniforms.uReadDepthOverride = { type: 'f', value: 1.0 };

CameraStore.listen( function ( state ) {
  depthUniforms.uReadDepthOverride.value =
    state.controls.lock2D ? 0.0 : 1.0;
} );

export default depthUniforms;
