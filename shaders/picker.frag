/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

varying vec4 vTag;

void main() {
  gl_FragColor = vTag;
  // For testing draw more visible colors
  //gl_FragColor.rgb = mod( 10000.0 * vTag.rgb, vec3( 1.0 ) );
  //gl_FragColor.a = 1.0;
}
