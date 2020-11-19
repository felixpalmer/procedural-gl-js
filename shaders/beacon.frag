/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

uniform float uTime;

varying vec3 vPosition;
varying vec3 vCenter;
varying float vRingRadius;

const vec4 white = vec4( 1.0, 1.0, 1.0, 0.9 );

void main() {
  float fractionalR = distance( vPosition.xy, vCenter.xy ) / vRingRadius;
  vec3 baseColor = mix( vec3( 0.0, 0.0, 1.0 ), vec3( 0.0, 0.5, 1.0 ), 0.2 * fractionalR );
  vec4 color = vec4( baseColor * sin( uTime ), 0.5 );
  
  // White ring
  color = mix( color, white, smoothstep( 0.75, 0.8, fractionalR ) );
  color = mix( color, vec4( baseColor.rgb, 0.15 ), smoothstep( 1.0, 1.05, fractionalR ) );

  // Gamma
  color.rgb = pow( abs( color.rgb ), vec3( 0.4545 ) );

  gl_FragColor = color;
}
