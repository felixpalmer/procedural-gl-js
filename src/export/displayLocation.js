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

// TODO we should remove the displayLocation API as it overlaps
// with focusOnLocation and confuses people. For now detect
// when repeated calls are near to last target and forward
// call to `focusOnLocation` if we are close by
let _lastTarget = null;

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
 *
 * // Optionally can also supply:
 * // - viewing angle,
 * // - a bearing,
 * // - a distance,
 * // - animation duration (in seconds)
 * var target = {
 *   latitude: 44.5, longitude: 6.3,
 *   angle: 20, bearing: 30, distance: 1000
 *   animationDuration: 0.5
 * };
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

  function dist( a, b ) { return Math.sqrt( a * a + b * b ) }
  if ( _lastTarget === null || 
       dist( _lastTarget.longitude - target.longitude,
             _lastTarget.latitude - target.latitude ) > 5 ) {
    // For first invocation or nearby repeat calls, re-init
    // library (this sets the overall geoprojection
    setTimeout( function () {
      UserActions.setCurrentPlace( { ...template, ...target } );
    }, 0 );
    _lastTarget = { ...target };
  } else {
    // For small movements simply focus on new location
    setTimeout( function () { UserActions.focusOnLocation( target ) }, 0 );
  }

};

export default Procedural;
