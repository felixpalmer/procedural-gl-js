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
uniform vec3 cameraPosition;

attribute vec4 position;

uniform vec4 uOffset;
uniform vec4 uImageryUvOffset;

varying vec4 vUV;
varying float D;

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

  // Scale image uv lookup for fragment shader
  vUV.xy = uImageryUvOffset.z * uv.xy + uImageryUvOffset.xy;
  vUV.zw = uv.xy;

  // Distance for fog
  D = distance( cameraPosition, p.xyz );

	gl_Position = projectionMatrix * viewMatrix * p;
}
