/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
//#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform vec4 uImageryUvOffset;

varying vec4 vUV; // xy: scaled for imagery lookup, zw: actual uv across tile

varying float D;

uniform lowp sampler2D imageryArray;

#include fog.glsl

#define VIRTUAL_TEXTURE_ARRAY_BLOCKS 16.0
#define VIRTUAL_TEXTURE_ARRAY_SIZE 256.0
#include readTexVirtual.glsl

void main() {
  vec3 color = readTex( imageryArray, vUV.xy, uImageryUvOffset.w ).rgb;

  float fogAmount = fogFactor( D );
  color = mix( color, uFogColor, fogAmount );

  gl_FragColor = vec4( color, 1.0 );

  //// Edge debug
  //gl_FragColor.r *= 1.0 - dot( vec2( 1.0 ), step( vUV.xy, vec2( 0.01 ) ) );
  //gl_FragColor.g *= 1.0 - dot( vec2( 1.0 ), step( vUV.zw, vec2( 0.01 ) ) );

  // Error calc (mimics picker shader)
  //vec4 error = dFdx( vUV );
  //error *= 256.0;
  //float E = log2( length( error.zw ) ) - 0.75;
  //float cap = 0.75; // Value to cap error display at
  //vec3 errorColor = mix( vec3( 1.0 ), vec3( 1.0, 0.0, 0.0 ),
  //  max( 0.0, E / cap ) );
  //errorColor = mix( errorColor, vec3( 0.0, 1.0, 0.0 ),
  //  max( 0.0, -E / cap ) );

  //// Tile outlines
  //vec4 wire = smoothstep(
  // 0.48, 0.49,
  // fract( vec4( 1.0, -1.0, 1.0, -1.0 ) * 2.0 * vUV.zzww + vec4( 0.5 ) ) );
  //float wireframe = min( 1.0, wire.x * wire.y + wire.z * wire.w );
  //gl_FragColor.rgb = mix( gl_FragColor.rgb, errorColor, wireframe );
}
