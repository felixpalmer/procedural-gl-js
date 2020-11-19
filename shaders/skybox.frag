/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
varying vec3 vPosition;

#include skyboxColor.glsl

void main() {
  vec3 direction = normalize( vPosition );
  vec3 color = skyColor( direction );
  gl_FragColor = vec4( color, 1.0 );
}
