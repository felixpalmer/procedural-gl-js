/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;

uniform float uAccuracy;

varying vec3 vPosition;
varying vec3 vCenter; // Center of beacon
varying float vRingRadius; // Radius to draw inner ring at

// Radius of beacon geometry, as defined in JS
#define BEACON_RADIUS 50.0

#include saturate.glsl
#include getHeight.glsl

void main() {
  vCenter = position - BEACON_RADIUS * normal;
  vec4 c4 = modelMatrix * vec4( vCenter, 1.0 );
  vec3 worldCenter = c4.xyz / c4.w;
  vCenter = worldCenter;

  // Get distance to camera, and scale so that all beacon has constant screen size
  float D = abs( ( viewMatrix * vec4( worldCenter, 1.0 ) ).z );
  vRingRadius = 25.0 * clamp( D / 1000.0, 0.01, 10.0 ); // Cap size at so don't get artifacts when zooming

  // Now have the minimum visible radius for beacon, adjust if smaller than accuracy
  float radius = max( vRingRadius, uAccuracy );

  vPosition = vCenter + radius * normal;

  // Correct height
  float height = getHeight( vPosition.xy );

  // Place at correct height (flattening sphere in process)
  float delta = height - vPosition.z + D / 1000.0 - 0.3 * radius; // Lift up at large distance so terrain doesn't swallow us & sink into ground
  vPosition.z = height;


  // To ensure beacon appears on top of forests & pistes, move towards camera
  vec3 view = cameraPosition - vPosition;
  float d = length( view );
  view = normalize( view );
  // Do not apply if too close, as it screws up geometry too much
  float scale = 230.0 * smoothstep( 50.0, 250.0, d );

  gl_Position = projectionMatrix * viewMatrix * vec4( vPosition + scale * view, 1.0 );
}
