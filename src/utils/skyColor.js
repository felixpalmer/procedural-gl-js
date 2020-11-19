/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import skyUniforms from '/uniforms/sky';
import Tonemap from '/utils/tonemap';
import tonemapUniforms from '/uniforms/tonemap';
// Duplicate calculate to sky shader
var skyColor = function ( direction ) {
  var cosZenithAngle = Math.max( 0.0, direction.y );
  // Approximate acos( x ) by pi/2 - x
  // This allows us to simplify and error is only large when looking up
  var denom = cosZenithAngle + Math.pow( 17.6579343808112 + cosZenithAngle * 260.41830500372932, -1.253 );

  // combined extinction factor
  var betaRM = skyUniforms.betaRM.value.clone();
  var Fex = betaRM.multiplyScalar( -1 / denom );
  Fex.x = Math.exp( Fex.x );
  Fex.y = Math.exp( Fex.y );
  Fex.z = Math.exp( Fex.z );

  // in scattering
  var sunDirection = skyUniforms.sunDirection.value.clone();
  var constants = skyUniforms.constants.value.clone();
  var cosTheta = direction.dot( sunDirection );
  var rPhase = cosTheta + 1.0;
  var betaRTheta = skyUniforms.betaRnorm.value.clone();
  var betaMTheta = skyUniforms.betaMnorm.value.clone();
  betaRTheta.multiplyScalar( 4.0 + rPhase * rPhase );
  betaMTheta.multiplyScalar( Math.pow( constants.y * cosTheta + constants.z, -1.5 ) );

  var tmp = betaRTheta.clone().add( betaMTheta );
  var Lin = new THREE.Vector3(
    Math.pow( tmp.x * ( 1.0 - Fex.x ), 1.5 ),
    Math.pow( tmp.y * ( 1.0 - Fex.y ), 1.5 ),
    Math.pow( tmp.z * ( 1.0 - Fex.z ), 1.5 )
  );

  //vec3 Lin = spow( tmp * ( 1.0 - Fex ), vec3( 1.5 ) );
  Lin.x *= ( 1 - constants.w ) + constants.w * Math.sqrt( tmp.x * Fex.x );
  Lin.y *= ( 1 - constants.w ) + constants.w * Math.sqrt( tmp.y * Fex.y );
  Lin.z *= ( 1 - constants.w ) + constants.w * Math.sqrt( tmp.z * Fex.z );
  //Lin *= mix( vec3( 1.0 ), ssqrt( tmp * Fex ), constants.w );

  // nightsky
  var L0 = Fex.clone().multiplyScalar( 0.1 );

  //#ifdef SUN_DISK
  //L0 += constants.x * Fex * smoothstep( 0.9999566769, 0.9999766769, cosTheta );
  //#endif

  // Combine all components
  var color = Lin.clone().add( L0 ).multiplyScalar( 0.04 ).add( new THREE.Vector3( 0.0, 0.0003, 0.00075 ) );
  //0.04 * ( Lin + L0 ) + vec3( 0.0, 0.0003, 0.00075 );
  var tonemapScale = skyUniforms.tonemapScale.value;
  color.multiplyScalar( tonemapScale );

  // Precomputed whitescale with W = 1000
  //color = 1.07487246756328 * Tonemap( tonemapScale * color );
  var gamma = skyUniforms.gamma.value;
  var bias = tonemapUniforms.uTonemapExposureBias.value;
  var whiteScale = tonemapUniforms.uTonemapWhiteScale.value;
  color.x = Math.pow( bias * Tonemap( whiteScale * color.x ), gamma );
  color.y = Math.pow( bias * Tonemap( whiteScale * color.y ), gamma );
  color.z = Math.pow( bias * Tonemap( whiteScale * color.z ), gamma );

  return new THREE.Color( color.x, color.y, color.z );
};

export default skyColor;
