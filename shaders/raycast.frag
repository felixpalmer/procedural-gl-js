/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

varying vec2 vPosition;

void main() {
  // Pack position xy into RGBA
  gl_FragColor = vec4( mod( vPosition.xy, 256.0 ),
                       floor( vPosition.xy / 256.0 ) ) / 255.0;
}
