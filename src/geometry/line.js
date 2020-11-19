/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 *   The MIT License
 *
 *   Copyright © 2010-2020 three.js authors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 */
import THREE from 'three';

// So we can better optimize, hard code radial segments and thickness
// Only support "flat" tubes. This works well for roads and rivers
// For lines the shader aligns the triangles in screen-space
// anyway, to keep a constant on-screen width
var radialSegments = 2;


var radialDir = new Array( radialSegments );
for ( var r = 0; r < radialSegments; r++ ) {
  radialDir[ r ] = ( 1 - 2 * r );
}

var LineGeometry = function ( feature, segments, options, attributes ) {
  this.type = 'LineGeometry';
  segments = segments || 64;
  attributes = attributes || [ 'position', 'normal', 'tangent' ];

  var color, tangent,
    numpoints = segments + 1,
    u, tmp,
    i, j, p,
    ip, jp,
    a, b, c, d;

  // Only generate the attributes we need
  var createColors = attributes.indexOf( 'color' ) !== -1;
  var createNormals = attributes.indexOf( 'normal' ) !== -1;
  var createTangents = attributes.indexOf( 'tangent' ) !== -1;

  // Only create buffers for attributes we need
  var positionBuffer, colorBuffer, normalBuffer, tangentBuffer;
  // Alway create position buffer
  positionBuffer = new Float32Array( 3 * numpoints * radialSegments );
  this.attributes = {
    position: new THREE.BufferAttribute( positionBuffer, 3 )
  };
  if ( createColors ) {
    colorBuffer = new Uint8Array( 4 * numpoints * radialSegments );
    this.attributes.color = new THREE.BufferAttribute( colorBuffer, 4, false );
  }

  if ( createNormals ) {
    normalBuffer = new Int8Array( 3 * numpoints * radialSegments );
    this.attributes.normal = new THREE.BufferAttribute( normalBuffer, 3, false );
  }

  if ( createTangents ) {
    tangentBuffer = new Int8Array( 4 * numpoints * radialSegments );
    this.attributes.tangent = new THREE.BufferAttribute( tangentBuffer, 4, false );
  }

  var offset = 0;
  var tangentDir = 0;

  // consruct the grid
  var grid = new Array( numpoints );
  for ( i = 0; i < numpoints; i++ ) {
    grid[ i ] = [];
    u = i / segments;

    // Get attribute value at this point
    tmp = feature.curve.getPointAndTangentAt( u );
    tangent = tmp.tangent;

    // TODO get color from feature
    color = tmp.color;

    p = i * radialSegments;
    for ( j = 0; j < radialSegments; j++ ) {
      var offset4 = 4 * offset / 3;
      grid[ i ][ j ] = p + j;

      positionBuffer[ offset ] = tmp.position.x;
      positionBuffer[ offset + 1 ] = tmp.position.y;
      positionBuffer[ offset + 2 ] = tmp.position.z;

      // Some objects do not care about their height (they read height map)
      // but need direction of flow. Use spare position z direction to pass
      if ( options.writeTangent ) {
        positionBuffer[ offset + 2 ] = Math.atan2( tangent.y, tangent.x );
      }

      if ( createColors ) {
        colorBuffer[ offset4 ] = 255 * color.r;
        colorBuffer[ offset4 + 1 ] = 255 * color.g;
        colorBuffer[ offset4 + 2 ] = 255 * color.b;
        colorBuffer[ offset4 + 3 ] = 255 * color.a;
      }

      if ( createNormals ) {
        // Cross product of tangent with (0,0,1)
        normalBuffer[ offset ] = 127 * radialDir[ j ] * tangent.y;
        normalBuffer[ offset + 1 ] = -127 * radialDir[ j ] * tangent.x;
        normalBuffer[ offset + 2 ] = 0.0;
      }

      if ( createTangents ) {
        // TODO, perhaps would be quicker to use set() on Float32Array,
        // but only would make sense if lineCurve etc were modified

        tangentDir = 127 - 254 * j;
        tangentBuffer[ offset4 ] = tangentDir * tangent.x;
        tangentBuffer[ offset4 + 1 ] = tangentDir * tangent.y;
        tangentBuffer[ offset4 + 2 ] = tangentDir * tangent.z;
        tangentBuffer[ offset4 + 3 ] = 0.5 * tangentDir;
      }

      offset += 3;
    }
  }

  // construct the mesh
  var n = segments * radialSegments * 6;
  var indices = ( positionBuffer.length / 3 ) > 65535 ? new Uint32Array( n ) : new Uint16Array( n );
  this.index = new THREE.BufferAttribute( indices, 1 );
  offset = 0;

  for ( i = 0; i < segments; i++ ) {
    ip = i + 1;
    for ( j = 0; j < radialSegments; j++ ) {
      jp = ( j + 1 ) % radialSegments;

      a = grid[ i ][ j ];		// *** NOT NECESSARILY PLANAR ! ***
      b = grid[ ip ][ j ];
      c = grid[ ip ][ jp ];
      d = grid[ i ][ jp ];

      indices[ offset ] = a;
      indices[ offset + 1 ] = b;
      indices[ offset + 2 ] = d;

      indices[ offset + 3 ] = b;
      indices[ offset + 4 ] = c;
      indices[ offset + 5 ] = d;

      offset += 6;
    }
  }
};

LineGeometry.prototype.constructor = LineGeometry;

LineGeometry.prototype.dispose = function () {
  this.index = null;
  delete this.attributes;
};

export default LineGeometry;
