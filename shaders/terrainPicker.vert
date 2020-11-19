/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec4 position;

uniform vec4 uOffset;
uniform vec4 uImageryUvOffset;
uniform vec3 uScaling; // xy: center pixel, z: downScaling

varying vec4 vUV;

#define MANUAL_TEXTURE_BILINEAR 1
#include getHeight.glsl

void main() {
  // Move into place by shifting instanced position by tile offset
  vec4 p = vec4( position.xy, 0.0, 1.0 );
  p.xy *= uOffset.z; // Scale
  p.xy += uOffset.xy; // Shift

  // Extract the height (for skirting from the uv)
  vec2 skirt = 10.0 * floor( position.zw / 10.0 );
  vec2 uv = position.zw - skirt;

  p.z = getHeight( p.xy );

  // Pull down skirt vertices
  p.z -= 0.01 * uOffset.z * skirt.x;

  // Pass values through to fragment shader
  float tileId = uOffset.w;
  vec2 encodedTileId = vec2(
    floor( tileId / 256.0 ) / 256.0,
    fract( tileId / 256.0 )
    ) * ( 256.0 / 255.0 );

  // Scale error to texture width
  vUV.xy = uv.xy * uScaling.z;
  vUV.zw = encodedTileId;

	gl_Position = projectionMatrix * viewMatrix * p;
}
