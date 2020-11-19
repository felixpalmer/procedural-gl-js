/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

uniform sampler2D tDiffuse;
uniform vec2 uResolution;

varying vec2 vUv;

#define FXAA_REDUCE_MIN   0.0078125 // (1.0/128.0)
#define FXAA_REDUCE_MUL   0.03125   // (1.0/32.0)
#define FXAA_SPAN_MAX     8.0

const vec3 luma = vec3( 0.299, 0.587, 0.114 );
const vec2 fxaa_span = vec2( FXAA_SPAN_MAX );

void main() {
  // FXAA
  vec4 uv = vec4( vUv + uResolution, vUv - uResolution );
  vec3 rgbNW = texture2D( tDiffuse, uv.zw ).rgb;
  vec3 rgbNE = texture2D( tDiffuse, uv.xw ).rgb;
  vec3 rgbSW = texture2D( tDiffuse, uv.zy ).rgb;
  vec3 rgbSE = texture2D( tDiffuse, uv.xy ).rgb;
  vec4 lumas = vec4( dot( rgbNW, luma ),
                     dot( rgbNE, luma ),
                     dot( rgbSW, luma ),
                     dot( rgbSE, luma ) );

  // Precalculate common combinations
  vec4 tmp = lumas.xzxy + lumas.ywzw;
  vec2 dir = tmp.yz - tmp.xw;
  float dirReduce = FXAA_REDUCE_MUL * max( tmp.x + tmp.y, FXAA_REDUCE_MIN / FXAA_REDUCE_MUL );
  float dirMin = min( abs( dir.x ), abs( dir.y ) ) + dirReduce;
  dir = uResolution * clamp( dir / dirMin, -fxaa_span, fxaa_span );
  vec4 rgbA = (
      texture2D( tDiffuse, vUv - dir * 0.16666666666667 ) +
      texture2D( tDiffuse, vUv + dir * 0.16666666666667 ) );
  vec4 rgbM = texture2D( tDiffuse, vUv );

  // We used to check the range of the luma of rgbB against max/min of
  // lumas above, to determine whether to use rgbA or rgbB
  // but it didn't make much difference, with rgbB used most of the time
  // So just used that as it saved us computing lumaMin/lumaMax

  // Testing, draw different regions with different AA
  //if ( vUv.x < 0.25 ) {
  //  gl_FragColor = 0.5 * rgbA; // Just blurred
  //} else if ( vUv.x < 0.5 ) {
  //  gl_FragColor = 0.36 * ( rgbA + rgbM ); // Slight original pixel 2 : 1
  //} else if ( vUv.x < 0.75 ) {
  //  gl_FragColor = 0.25 * ( rgbA + 2.0 * rgbM ); // More 1 : 1
  //} else {
  //  gl_FragColor = 1.1 * rgbM; // No anti-alias
  //}
  gl_FragColor = 0.33333333333 * ( rgbA + rgbM ); // Slight original pixel 2 : 1

  // Vignette
  float d = distance( vUv, vec2( 0.5 ) );
  gl_FragColor.rgb *= 1.0 - 0.17 * smoothstep( 0.42, 0.65, d );
}
