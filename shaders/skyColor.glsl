/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// Derived uniforms
uniform vec3 sunDirection;
uniform vec3 betaRM;
uniform vec3 betaRnorm;
uniform vec3 betaMnorm;
uniform vec4 constants; // sunE, hgPhaseA, hgPhaseB & LinWeight
uniform float gamma;
uniform float tonemapScale;

// Safe functions
float spow( const float x, const float y ) {
  return pow( abs( x ), y );
}

vec3 spow( const vec3 x, const vec3 y ) {
  return pow( abs( x ), y );
}

vec3 ssqrt( const vec3 x ) {
  return sqrt( abs( x ) );
}

#include tonemap.glsl

vec3 skyColor( vec3 direction ) {
  float cosZenithAngle = max( 0.0, direction.y );
  // Approximate acos( x ) by pi/2 - x
  // This allows us to simplify and error is only large when looking up
  float denom = cosZenithAngle + spow( 17.6579343808112 + cosZenithAngle * 260.41830500372932, -1.253 );

  // combined extinction factor	
  vec3 Fex = exp( -betaRM / denom );

  // in scattering
  float cosTheta = dot( direction, sunDirection );
  float rPhase = cosTheta + 1.0;
  vec3 betaRTheta = betaRnorm * ( 4.0 + rPhase * rPhase );
  vec3 betaMTheta = betaMnorm * spow( constants.y * cosTheta + constants.z, -1.5 );

  vec3 tmp = betaRTheta + betaMTheta;
  vec3 Lin = spow( tmp * ( 1.0 - Fex ), vec3( 1.5 ) );
  Lin *= mix( vec3( 1.0 ), ssqrt( tmp * Fex ), constants.w );

  // nightsky
  vec3 L0 = 0.1 * Fex;

  #ifdef SUN_DISK
  L0 += constants.x * Fex * smoothstep( 0.9999566769, 0.9999766769, cosTheta );
  #endif

  // Combine all components
  vec3 color = 0.04 * ( Lin + L0 ) + vec3( 0.0, 0.0003, 0.00075 );   
  color = Tonemap( tonemapScale * color );
  return spow( color, vec3( gamma ) );
}
