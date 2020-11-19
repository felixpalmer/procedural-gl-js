/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

varying vec3 vPosition;

// Not including sun disk for now as we rarely see it anyway
#include skyColor.glsl

void main() {
  vec3 direction = normalize( vPosition );
  vec3 color = skyColor( direction );
  // Stars
  //float r = 500.0;
  //vec3 rounded = floor( 0.4999999 + r * direction ) / r;
  //float hash = fract( sin( 21041.4 * rounded.x ) + sin( 317041.4 * rounded.z ) + sin( 210041.4 * rounded.x ) + sin( 217041.4 * rounded.y ));
  //float star = distance( rounded, direction );
  //star = smoothstep( 0.5 / r, 0.0, star );
  //color += vec3( star * smoothstep( 0.97, 1.0, hash ) * smoothstep( 0.01, 0.05, direction.y) );
  gl_FragColor = vec4( color, 1.0 );
}
