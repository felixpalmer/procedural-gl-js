/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
#extension GL_OES_standard_derivatives : enable  
precision highp float;

uniform vec3 uScaling; // xy: center pixel, z: downScaling

varying vec4 vUV; // xy: actual uv across tile, zw: encodedTileId

void main() {
  // Assess our screen space error, both for tile size and texture blur
  // For now not actually using the texture blur error, as it is best to
  // fetch just based on the tile geometry, makes things more stable
  vec2 deltaUV = dFdx( vUV.xy );

  float err = log2( length( deltaUV ) );

  vec2 encodedTileId = vUV.zw;

  // TODO perhaps we could encode this the same way we encode Z
  // and save some instructions
  // Store error clamped to range -5 > 5 (log encoded)
  float encodedError = 0.1 * err + 0.5;

  // Scale to fill 0->1 to 16bit capacity
  float scaledZ = 256.0 * 255.0 * gl_FragCoord.z;
  vec2 encodedZ = vec2(
    floor( scaledZ / 256.0 ),
    mod( scaledZ, 256.0 )
   ) / 255.0;
  float isCenter = step( distance( gl_FragCoord.xy, uScaling.xy ), 4.0 );

  vec4 standard = vec4( encodedTileId, 0.0, encodedError );
  vec4 centerPixels = vec4( 0.0, 0.0, encodedZ );
  gl_FragColor = mix( standard, centerPixels, isCenter );
}
