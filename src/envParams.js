/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import EnvironmentStore from '/stores/environment';
import fogUniforms from '/uniforms/fog';
import PlacesStore from '/stores/places';
import RenderActions from '/actions/render';
import StoreUtils from '/utils/store';
import skyUniforms from '/uniforms/sky';
import tonemapUniforms from '/uniforms/tonemap';
var envParams = {};

var distance = 400000; // Sun distance
envParams.update = function () {
  // Sky
  skyUniforms.turbidity.value = envParams.turbidity;
  skyUniforms.reileigh.value = envParams.reileigh;
  skyUniforms.luminance.value = envParams.luminance;
  skyUniforms.mieCoefficient.value = envParams.mieCoefficient;
  skyUniforms.mieDirectionalG.value = envParams.mieDirectionalG;

  var theta = Math.PI * ( envParams.inclination - 0.5 );
  var phi = 2 * Math.PI * ( envParams.azimuth - 0.5 );

  skyUniforms.sunPosition.value.set(
    distance * Math.sin( phi ) * Math.cos( theta ),
    distance * Math.cos( phi ) * Math.cos( theta ),
    distance * Math.sin( theta )
  );
  skyUniforms.update();
  fogUniforms.update();

  fogUniforms.uFogDropoff.value = envParams.fogDropoff;
  fogUniforms.uFogIntensity.value = envParams.fogIntensity;

  tonemapUniforms.exposureBias.value = envParams.exposureBias;
  tonemapUniforms.whitePoint.value = envParams.whitePoint;
  tonemapUniforms.update();
};

envParams.set = function ( params, duration ) {
  if ( duration === 0 ) {
    // Skip interpolation
    Object.assign( envParams, params );
    envParams.update();
    setTimeout( function () { RenderActions.needsRender( { env: true } ) } );
  } else {
    var oldParams = _.clone( envParams );
    var newParams = _.clone( params );
    StoreUtils.transition( function ( params ) {
      Object.assign( envParams, params );
      envParams.update();
      setTimeout( function () { RenderActions.needsRender( { env: true } ) } );
    }, oldParams, newParams, {
      duration: duration,
      doNotCancel: true,
      lerp: StoreUtils.lerp.params,
      onComplete: function () {
        RenderActions.needsRender( { env: true } );
      }
    } );
  }
};

// Sync up to EnvironmentStore
// TODO, perhaps cleaner to rename this to some sort of Transition class?
EnvironmentStore.listen( function ( state ) {
  var env = state.environment;
  envParams.set( env.parameters, env.animationDuration );
} );

PlacesStore.listen( function ( state ) {
  var place = state.currentPlace;
  if ( place.env ) { envParams.set( place.env, 0 ) }
} );

export default envParams;
