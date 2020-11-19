/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
attribute vec3 position;

void main() {
  // Do not need any matrix multiplications as positions already in clip
  // space
  gl_Position = vec4( position, 1.0 );
}
