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

varying vec2 vPosition;

#include getHeight.glsl

// TODO, not yet working, but shader should look something like this
void main() {
  // Move into place by shifting instanced position by tile offset
  vec4 p = vec4( position.xy, 0.0, 1.0 );
  p.xy *= uOffset.z; // Scale
  p.xy += uOffset.xy; // Shift

  vPosition = p.xy + vec2( 32768.0 );
  p.z = getHeight( p.xy );
	gl_Position = projectionMatrix * viewMatrix * p;
}
