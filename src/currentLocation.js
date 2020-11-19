/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import CurrentLocationStore from '/stores/currentLocation';
import geoproject from '/geoproject';
import material from '/material';
import RenderStore from '/stores/render';
import scene from '/scene';
var CurrentLocation = function ( ) {
  THREE.Object3D.call( this );
  this.sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry( 50, 32, 15 ),
    material.beacon );
  this.add( this.sphere );
  this.visible = false;
  scene.add( this );

  CurrentLocationStore.listen( this.update.bind( this ) );
  RenderStore.listen( this.tick.bind( this ) );
};

CurrentLocation.prototype = Object.create( THREE.Object3D.prototype );

CurrentLocation.prototype.update = function () {
  var state = CurrentLocationStore.getState();
  if ( !state.longitude || !state.latitude || state.tooFar ) {
    this.visible = false;
    return;
  } else {
    this.visible = true;
  }

  var latest = geoproject.project( [ state.longitude, state.latitude ] );
  this.position.copy( latest );
  this.sphere.material.uniforms.uAccuracy.value = state.accuracy || 0;
};

CurrentLocation.prototype.tick = function ( state ) {
  this.sphere.material.uniforms.uTime.value = state.clock.elapsedTime;
};

export default new CurrentLocation();
