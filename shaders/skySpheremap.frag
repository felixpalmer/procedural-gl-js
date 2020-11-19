/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

#define SUN_DISK
#include skyColor.glsl

// 1 / 2048.0 (texture width)
#define STEP 0.00048828125

void main() {
  // Map to sphere normal direction
  vec2 uv = gl_FragCoord.xy * STEP;
  vec3 direction = 2.0 * vec3( uv - 0.5, 0.0 ); // Switch to polar coordaintes
  float r = min( 0.99999, length( direction ) ); // Limit to unit length
  r = sin( 1.5707963267949 * r ); // store linear in polar angle
  direction = r * normalize( direction );
  direction.z = sqrt( max( 0.0, 1.0 - dot( direction, direction ) ) ); // Get z-coordinate from Pythagorus
  vec3 color = skyColor( normalize( direction.xzy ) );
  gl_FragColor = vec4( color, 1.0 );
}
