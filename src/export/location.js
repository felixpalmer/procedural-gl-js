/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import CurrentLocationActions from '/actions/currentLocation';

const Procedural = {};

/**
 * @exports Procedural
 * @name Location
 * @description The Location API methods enable
 * a marker indicating where the user is located in the world
 */

/**
 * @name setUserLocation
 * @memberof module:Location
 * @function
 * @description Tells the engine where the current user is located, which
 * displays a marker in the 3D world
 * @param {Object} position An Object of the format produced by the HTML5 Geolocation API
 * @example
 * // Manually construct object, can also use navigator.geolocation.watchPosition
 * // to obtain
 * var position = {
 *   coords: {
 *     latitude: 46.46695,
 *     longitude: 7.52151,
 *     accuracy: 50
 *   }
 * };
 *
 * Procedural.setUserLocation( position );
 */
Procedural.setUserLocation = function ( position ) {
  // Detect object not in coords format and wrap
  var p;
  if ( position.latitude !== undefined &&
       position.longitude !== undefined ) {
    p = { coords: position };
  } else {
    p = position;
  }

  setTimeout( function () { CurrentLocationActions.panToPosition( p ) }, 0 );
};

/**
 * @name toggleUserLocationTracking
 * @memberof module:Location
 * @function
 * @description Toggles whether the camera automatically follows the user
 * when a new location update is sent using [Procedural.setUserLocation]{@link module:Location.setUserLocation}. Initially tracking is disabled.
 * Note tracking is automatically disabled when the user manipulates the camera
 */
Procedural.toggleUserLocationTracking = function () {
  setTimeout( function () { CurrentLocationActions.toggleTracking() }, 0 );
};

export default Procedural;
