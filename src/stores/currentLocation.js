/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import CurrentLocationActions from '/actions/currentLocation';
import geoproject from '/geoproject';
import StoreUtils from '/utils/store';
import UserActions from '/actions/user';
function CurrentLocationStore() {
  // Whether current location is too far away to be tracked
  this.tooFar = true;

  // Whether we are current tracking the current location with camera
  this.tracking = false;

  // Geolocation parameters
  this.parameters = [ 'latitude', 'longitude', 'altitude', 'accuracy',
    'altitudeAccuracy', 'heading', 'speed' ];
  this.latitude = null;
  this.longitude = null;
  this.altitude = 0;
  this.accuracy = 0;
  this.altitudeAccuracy = 0;
  this.heading = 0;
  this.speed = 0;

  this.bindListeners( {
    panToPosition: CurrentLocationActions.panToPosition,
    setPosition: CurrentLocationActions.setPosition,
    cancelTracking: [ UserActions.doubleTapZoom, UserActions.setCamera ],
    toggleTracking: CurrentLocationActions.toggleTracking
  } );
}

CurrentLocationStore.prototype.checkTooFar = function () {
  if ( !this.longitude || !this.latitude ) {
    this.tooFar = true;
    return;
  }

  var lonlatH = [ this.longitude, this.latitude, 0 ];
  var position = geoproject.project( lonlatH );
  var limit = 100000;
  this.tooFar = ( Math.abs( position.x ) > limit ||
                  Math.abs( position.y ) > limit );
};

CurrentLocationStore.prototype.setPosition = function ( position ) {
  var self = this;
  this.parameters.forEach( function ( key ) {
    self[ key ] = position.coords[ key ];
  } );
  this.checkTooFar();
};

CurrentLocationStore.prototype.panToPosition = function ( position ) {
  // No position yet, do not pan, just jump
  if ( !this.longitude || !this.latitude ) {
    return this.setPosition( position );
  }

  // No longer have position, null out
  if ( position.longitude === null || position.latitude === null ) {
    return this.setPosition( position );
  }

  // Otherwise, animate
  var lastPosition = { coords: {} };
  var self = this;
  this.parameters.forEach( function ( key ) {
    lastPosition.coords[ key ] = self[ key ];
  } );
  var lerp = function ( initial, final, u ) {
    var out = { coords: {} };
    self.parameters.forEach( function ( key ) {
      out.coords[ key ] = StoreUtils.lerp.scalar( initial.coords[ key ],
        final.coords[ key ],
        u );
    } );
    return out;
  };

  StoreUtils.transition( CurrentLocationActions.setPosition,
    lastPosition, position,
    { duration: 1.0, lerp: lerp } );
};

CurrentLocationStore.prototype.cancelTracking = function () {
  this.tracking = false;
};

CurrentLocationStore.prototype.toggleTracking = function () {
  this.tracking = !this.tracking;
};

CurrentLocationStore.displayName = 'CurrentLocationStore';
export default alt.createStore( CurrentLocationStore );
