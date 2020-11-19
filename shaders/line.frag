/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

uniform float uCutoff;
uniform vec4 uOutlineColor;

varying vec4 vColor;
varying float vAlpha;

void main() {
  // Smoothly interpolate between:
  // x: line color and edge color
  // y: line alpha and transparent antialiased edge
  vec2 f = smoothstep(
   vec2( 0.4, 1.0 ) * uCutoff,
   vec2( 0.5, 1.0 ),
   abs( vec2( vAlpha ) ) );

  // Multiply application of edge line with alpha
  f.x *= uOutlineColor.a;

  gl_FragColor = mix(
    vColor,
    vec4( uOutlineColor.rgb, 0.0 ),
    f.xxxy );
}
