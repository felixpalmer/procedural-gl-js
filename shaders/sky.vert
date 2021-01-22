/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

attribute vec3 position;

varying vec3 vPosition;

void main() {
  // vPosition is the ray direction for sky shader
  vPosition = position.xzy;
  vPosition.y = max( 0.0, vPosition.y );

  // Shift entire sky dome with camera
  vec3 p = position;
  p.xy += cameraPosition.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
}
