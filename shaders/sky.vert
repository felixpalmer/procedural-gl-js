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

attribute vec3 position;

varying vec3 vPosition;

void main() {
  vPosition = position.xzy;
  vPosition.y = max( 0.0, vPosition.y );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
