/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
var EE = 1000.0;
var cutoffAngle = 1.61107315568707; //pi/1.95;
var invSteepness = 0.66666666666667;
var rayleigh = new THREE.Vector3( 5.804542996261093e-06, 1.3562911419845635e-05, 3.026590246882488e-05 );
var mie = new THREE.Vector3( 7.633915830775757e-05, 7.544890573273999e-05, 7.411352687021361e-05 );


var skyUniforms = {
  luminance: { type: 'f', value: 1 },
  turbidity: { type: 'f', value: 2 },
  reileigh: { type: 'f', value: 1 },
  mieCoefficient: { type: 'f', value: 0.005 },
  mieDirectionalG: { type: 'f', value: 0.8 },
  sunPosition: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  // Derived uniforms
  sunDirection: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  lightDirection: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  betaRM: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  betaRnorm: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  betaMnorm: { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) },
  // To avoid using many uniforms, pass constants in block
  // sunE, hgPhaseA, hgPhaseB & LinWeight
  constants: { type: 'v4', value: new THREE.Vector4( 0, 0, 0, 0 ) },
  gamma: { type: 'f', value: 0 },
  tonemapScale: { type: 'f', value: 0 },

  // Calculate derived uniforms
  update: function () {
    // Sun direction (using different coordinate system, so convert)
    // TODO unify on single coordinate system
    var sunPosition = skyUniforms.sunPosition.value;
    var sunDirection = sunPosition.clone().normalize();
    var tmp = sunDirection.z;
    sunDirection.z = sunDirection.y;
    sunDirection.y = tmp;
    skyUniforms.sunDirection.value.copy( sunDirection );

    // Normal coordinate system for other shaders
    var lightDirection = sunPosition.clone().normalize();
    skyUniforms.lightDirection.value.copy( lightDirection );

    // Hg phase constants (refactored to minimize shader computation)
    var g = skyUniforms.mieDirectionalG.value;
    var B = Math.pow( 0.07957747154595 * ( 1 - g * g ), -0.666666666 );
    var hgPhaseA = -2 * B * g;
    var hgPhaseB = B * ( g * g + 1 );
    skyUniforms.constants.value.y = hgPhaseA;
    skyUniforms.constants.value.z = hgPhaseB;

    // Save on calulation power of sun direction
    var LinWeight = Math.pow( 1.0 - sunDirection.y, 5.0 );
    LinWeight = THREE.Math.clamp( LinWeight, 0.0, 1.0 );
    skyUniforms.constants.value.w = LinWeight;

    // Extinction
    var sunFade = 1.0 - THREE.Math.clamp( 1.0 - Math.exp( sunPosition.z / 450000.0 ), 0.0, 1.0 );
    var reileighCoefficient = skyUniforms.reileigh.value + sunFade - 1.0;

    var exponent = ( Math.acos( sunDirection.y ) - cutoffAngle ) * invSteepness;
    var sunE = EE * Math.max( 0.0, 1.0 - Math.exp( exponent ) );
    skyUniforms.constants.value.x = 19000 * sunE;

    var turbidity = skyUniforms.turbidity.value;
    var mieCoefficient = skyUniforms.mieCoefficient.value;

    var betaR = rayleigh.clone().multiplyScalar( reileighCoefficient );
    var betaM = mie.clone().multiplyScalar( turbidity * mieCoefficient );

    // betaMnorm & betaRnorm don't really mean anything, just save of shader work
    var A = new THREE.Vector3( sunE / ( betaR.x + betaM.x ),
      sunE / ( betaR.y + betaM.y ),
      sunE / ( betaR.z + betaM.z ) );
    var betaRnorm = betaR.clone().multiply( A ).multiplyScalar( 0.01492077591487 );
    var betaMnorm = betaM.clone().multiply( A );

    // Fold in zeniths
    betaR.multiplyScalar( 8400 );
    betaM.multiplyScalar( 1250 );

    skyUniforms.betaRM.value.copy( betaR.add( betaM ) );
    skyUniforms.betaRnorm.value.copy( betaRnorm );
    skyUniforms.betaMnorm.value.copy( betaMnorm );

    var gamma = 1.0 / ( 1.2 + ( 1.2 * sunFade ) );
    skyUniforms.gamma.value = gamma;

    var luminance = skyUniforms.luminance.value;

    // Magic 1.7 value to match tonemap of sky to scene
    var tonemapScale = 1.7 * Math.log( 2.0 / Math.pow( luminance, 4 ) ) / Math.LN2;
    skyUniforms.tonemapScale.value = tonemapScale;
  }
};

skyUniforms.update();
export default skyUniforms;
