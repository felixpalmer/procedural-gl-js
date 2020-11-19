/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/// Looks up normal at specific location in height dataset
/// Looks up normal at specific location in height dataset
import THREE from 'three';

import heightAt from '/heightAt';
var p1 = new THREE.Vector3( 0, 0, 0 );
var p2 = new THREE.Vector3( 0, 0, 0 );
var addNormal = function ( normal, origin, delta1, delta2 ) {
  p1.addVectors( origin, delta1 );
  delta1.z = heightAt( p1 ) - origin.z;

  p2.addVectors( origin, delta2 );
  delta2.z = heightAt( p2 ) - origin.z;

  delta1.cross( delta2 );
  delta1.normalize();
  normal.add( delta1 );
};

var n = 4, i;
var theta = 2 * Math.PI / n;
var origin = new THREE.Vector3();
var defaultStep = 25;
var normal = new THREE.Vector3( 0, 0, 1 );
var d1 = new THREE.Vector3( 0, 0, 0 );
var d2 = new THREE.Vector3( 0, 0, 0 );
var normalAt = function ( p, step ) {
  // TODO fix. Hardcoded normal along z-axis everywhere for now
  return normal;
  step = step ? step : defaultStep;

  origin.copy( p );
  origin.z = heightAt( origin );
  normal.set( 0, 0, 0 );
  for ( i = 0; i < n; i++ ) {
    d1.x = step * Math.cos( i * theta );
    d1.y = step * Math.sin( i * theta );
    d2.x = -d1.y;
    d2.y = d1.x;
    addNormal( normal, origin, d1, d2 );
  }

  normal.normalize();
  return normal;
};

export default normalAt;
