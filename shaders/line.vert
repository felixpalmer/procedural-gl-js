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

attribute vec3 tag;
attribute vec4 tangent;
attribute vec3 position;
attribute vec4 color;

uniform float uThickness;
uniform vec3 uSelectedTag;

varying vec4 vColor;
varying float vAlpha;

#include positionFromTangent.glsl
#include getHeight.glsl

void main() {
  // Vertices are placed based on tangent, to give constant width on screen
  vec3 center = position;
  center.z += getHeight( center.xy );
  gl_Position = positionFromTangent( center, uThickness );

  vColor = color;

  // Is line selected?
  float selected = step( distance( tag, uSelectedTag ), 0.0 );
  gl_Position.z -= 0.5 + 0.01 * selected;
  vColor.rgb = mix( vColor.rgb, vec3( 1.0 ), 0.8 * selected );

  // Safe way to identify side of line
  vAlpha = sign( tangent.w );

  // Dashed line
  // float D = ( viewMatrix * vec4( position, 1.0 ) ).z;
  // Round to log values
  // D = pow( 2.0, floor( log2( D ) ) );
  // Modulate distance along line by depth
  // float dash = position.w * D;

}
