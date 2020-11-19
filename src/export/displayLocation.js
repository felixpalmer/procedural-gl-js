/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import ApiUtils from '/utils/api';
import template from '/templates/default';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

const Procedural = {};

var placeForTarget = function ( target ) {
  // Create location definition
  var place = template;
  place.name = Procedural.datafileForLocation( target );
  place.location = [ target.longitude, target.latitude ];
  if ( target.features ) { place.features = target.features }

  return place;
};

/**
 * @name datafileForLocation
 * @memberof module:Core
 * @function
 * @param {Object} target An Object specifying a longitude and latitude
 * @description Returns the file name for a data file for a given location. Used mostly internally by engine to construct URLs.
 */
Procedural.datafileForLocation = function ( target ) {
  if ( !target || isNaN( target.latitude ) || isNaN( target.longitude ) ) {
    return null;
  }

  // Snap to nearest data point
  var lon = ApiUtils.snap( target.longitude );
  var lat = ApiUtils.snap( target.latitude );
  return ApiUtils.datafileForLocation( lon, lat );
};

/**
 * @name displayLocation
 * @memberof module:Core
 * @function
 * @param {Object} target An Object specifying a longitude and latitude
 * @description Instructs engine to download necessary data files for a location and to display it.
 * When the data is ready to be displayed [onLocationLoaded]{@link module:Core.onLocationLoaded} is fired.
 * @example
 * var target = { latitude: 43.21, longitude: 6.133 };
 * Procedural.displayLocation( target );
 */
Procedural.displayLocation = function ( target ) {
  if ( !target ) {
    RenderActions.fatalError( 'No place data passed' );
    return;
  }

  if ( isNaN( target.latitude ) || isNaN( target.longitude ) ) {
    RenderActions.fatalError( 'Invalid place data passed' );
    return;
  }

  setTimeout( function () {
    UserActions.setCurrentPlace( placeForTarget( target ) );
  }, 0 );
};

export default Procedural;
