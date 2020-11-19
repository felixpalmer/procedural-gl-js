/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// Function to cull triangles in vertex shader by reducing their
// size to zero (degenerate), which means the fragment shader
// will not be invoked on them
// As we cannot operate on primitives (triangles) directly,
// we discard vertices by collapsing them onto a point.
// The collapse will drag geometry down below the terrain, 
// without making it apparent the triangles are being stretched
void vertexDiscard( in float D, in float cutoff ) {
  gl_Position = mix( vec4( 0.0, -1.0, 1.0, 0.0 ), gl_Position, step( D, cutoff ) );
}
