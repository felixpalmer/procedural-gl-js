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

import Color from '/patched/Color';
// To avoid creating garbage when calculating catmull, re-use variables
var v0, v1, t2, t3, A, B;
var catmullGenerator = {
  position: 0,
  tangent: 0,
  generate: function ( p0, p1, p2, p3, t, createTangent ) {
    v0 = ( p2 - p0 ) * 0.5;
    v1 = ( p3 - p1 ) * 0.5;
    t2 = t * t;
    t3 = t * t2;
    A = ( 2 * p1 - 2 * p2 + v0 + v1 );
    B = ( -3 * p1 + 3 * p2 - 2 * v0 - v1 );
    catmullGenerator.position = A * t3 + B * t2 + v0 * t + p1;
    if ( createTangent ) {
      catmullGenerator.tangent = 3 * A * t2 + 2 * B * t + v0;
    }
  }
};


var points, point, intPoint, weight, p0, p1, p2, p3;
var vector = new THREE.Vector3(),
  color = new Color(),
  position = new THREE.Vector3(),
  tangent = new THREE.Vector3();
var tmp = {
  color: color,
  position: position,
  tangent: tangent
};

var LineCurve = function ( points, colors ) {
  THREE.Curve.call( this );

  this.hDelta = 3;
  this.points = ( points === undefined ) ? [] : points;

  // Optionally pass a set of colors to map to each point
  if ( colors ) {
    this.colors = colors.map( function ( c ) {
      return new Color( c );
    } );
  } else {
    this.colors = undefined;
  }
};

LineCurve.prototype = Object.create( THREE.Curve.prototype );

LineCurve.prototype.getPoint = function ( t ) {
  points = this.points;
  point = ( points.length - 1 ) * t;

  intPoint = Math.floor( point );
  weight = point - intPoint;

  p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
  p1 = points[ intPoint ];
  p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
  p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

  // TODO should avoid new creation
  vector = new THREE.Vector3();
  catmullGenerator.generate( p0.x, p1.x, p2.x, p3.x, weight );
  vector.x = catmullGenerator.position;
  catmullGenerator.generate( p0.y, p1.y, p2.y, p3.y, weight );
  vector.y = catmullGenerator.position;
  vector.z = this.hDelta;

  return vector;
};

// Replace with derivative?
LineCurve.prototype.getTangentAt = function ( u ) {
  var delta = 0.00001;
  var u1 = u - delta;
  var u2 = u + delta;

  // Capping in case of danger
  if ( u1 < 0 ) { u1 = 0 }

  if ( u2 > 1 ) { u2 = 1 }

  var pt1 = this.getPointAt( u1 );
  var pt2 = this.getPointAt( u2 );

  var vec = pt2.clone().sub( pt1 );
  return vec.normalize();
};

// Calculate both position and tangent together as it is
// more efficient and we need both anyway
LineCurve.prototype.getPointAndTangentAt = function ( u ) {
  var t = this.getUtoTmapping( u );
  return this.getPointAndTangent( t );
};

LineCurve.prototype.getPointAndTangent = function ( t ) {
  points = this.points;
  point = ( points.length - 1 ) * t;

  intPoint = Math.floor( point );
  weight = point - intPoint;

  p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
  p1 = points[ intPoint ];
  p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
  p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

  // Potentially expensive, should look at optimizing. E.g. store curve
  // in st coordinate space?
  catmullGenerator.generate( p0.x, p1.x, p2.x, p3.x, weight, true );
  position.x = catmullGenerator.position;
  tangent.x = catmullGenerator.tangent;
  catmullGenerator.generate( p0.y, p1.y, p2.y, p3.y, weight, true );
  position.y = catmullGenerator.position;
  tangent.y = catmullGenerator.tangent;
  position.z = this.hDelta;
  tangent.z = 0; // As position.z is constant, this is always 0
  tangent.normalize();

  if ( this.colors ) {
    p1 = this.colors[ intPoint ];
    p2 = this.colors[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
    color.set( p1 ).lerp( p2, weight );
  }

  return tmp;
};

export default LineCurve;
