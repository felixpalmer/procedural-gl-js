/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
uniform sampler2D uSkybox;
// Only works for 0 < f < 1.0
// Saves 6 instructions? (12->6) relative to asin()
float asin_lowp( float f ) {
  float x = clamp( f, 0.0, 1.0 );
  float result = 0.2120531 * x - 1.57073;
  result *= sqrt( 1.0 - x ) - 1.57073;
  return result;
}

#include lengthNormalize.glsl

vec3 skyboxColor( vec2 st ) {
  return texture2D( uSkybox, st ).rgb;
}

vec3 skyColor( vec3 direction ) {
  direction.y = 0.0;
  float r = lengthNormalize( direction );
  r = 0.63661977236758 * asin( r ); // convert to standard polar
  vec2 st = vec2( 0.5 ) + 0.5 * r * direction.xz;
  return skyboxColor( st );
}
