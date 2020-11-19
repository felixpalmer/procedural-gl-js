/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import AppStore from '/stores/app';
import GeodataActions from '/actions/geodata';
import log from '/log';
import RenderActions from '/actions/render';
import track from '/track';
var GeodataAPI = function () {
  this.loader = new THREE.FileLoader();
  this.baseUrl = null;
  var self = this;

  // TODO this implicitly relies on the resourceUrl being configured before
  // any requests are fired. Could be more robust.
  AppStore.listen( function ( state ) {
    if ( state.resourceUrl !== null ) { self.baseUrl = state.resourceUrl }
  } );
};

GeodataAPI.prototype.onNetworkError = function () {
  if ( navigator.onLine ) {
    RenderActions.fatalError( 'Failed to download geodata. ' +
      'Please check your internet connection and try again.' );
  } else {
    RenderActions.fatalError( 'No internet connection. ' +
      'This area is not available offline, please connect ' +
      'to the internet and try again.' );
  }
};

GeodataAPI.prototype.loadFeatures = function ( place ) {
  var startTime = track.now();
  var features = place.features ?
    place.features.replace( /[^a-z-]/gi, '' ) :
    'features';
  var url = this.baseUrl + features + '/' + place.name + '.geojson';
  this.loader.load( url, function ( result ) {
    var time = track.now() - startTime;
    track.timing( 'geodata', 'load', place.name, time );

    // Parse result
    startTime = track.now();
    var data = JSON.parse( result );
    time = track.now() - startTime;
    track.timing( 'geodata', 'json_parse', place.name, time );
    if ( data.type !== 'FeatureCollection' ) {
      log( 'Error - expected FeatureCollection' );
      log( data );
      return;
    }

    GeodataActions.setFeatures( data );
  }, GeodataActions.featuresProgress, function () {
    log( 'Error - failed to download feature data' );
    GeodataActions.setFeatures( { features: [] } );
  } );
};

export default new GeodataAPI();
