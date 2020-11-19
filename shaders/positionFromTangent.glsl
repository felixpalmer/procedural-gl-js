/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
uniform vec2 uViewportInverse;

// Calculate our position from the center and tangent of line
vec4 positionFromTangent( const in vec3 center,
                          const in float thickness ) {
  // Get clipspace positions of center and center + tangent
  vec4 p = vec4( center, 1.0 );
  vec4 c4 = projectionMatrix * viewMatrix * p;

  p.xyz += tangent.xyz;
  vec4 cplust4 = projectionMatrix * viewMatrix * p;

  // Tangent vector in clipspace (normalizing by w!)
  vec2 t4 = cplust4.xy / cplust4.w - c4.xy / c4.w;

  // Issue here when line is going towards screen, up and
  // then down. The tangent will then flip from up to down
  // and the line normal will also switch sides, leading
  // to a fold in the quads forming the line
  // Not really clear how to overcome this...

  // Get normal in clipspace by crossing with vec3(0, 0, 1)
  vec2 delt = t4.yx * vec2( 1.0, -1.0 ); // Move one side one way, the other the other way (tangent is opposite for vertices in pair)
  delt = thickness * c4.w * normalize( delt ) * uViewportInverse;

  c4.xy += delt;
  return c4;
}
