/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

const Procedural = {};

/**
 * @exports Procedural
 * @name Camera
 * @description Use the Camera API methods to change the user's
 * view of the rendered scene.
 */

/**
 * @name focusOnBounds
 * @memberof module:Camera
 * @function
 * @description Animates the engine camera to focus on a region
 * specified by a bounding box. The engine will calculate the correct
 * view such that the bounds are fully displayed.
 * @param {Object} bounds An Object specifying a bounding box. Pass the coordinates for the south-west and north-east corners of the box.
 * @example
 * var bounds = {
 *   sw: { latitude: 44.5, longitude: 6.3 },
 *   ne: { latitude: 44.4, longitude: 6.4 }
 * };
 * Procedural.focusOnBounds ( bounds );
 *
 * // Optionally can also supply:
 * // - viewing angle,
 * // - a bearing,
 * // - animation duration (in seconds)
 * var bounds = {
 *   sw: { latitude: 44.5, longitude: 6.3 },
 *   ne: { latitude: 44.4, longitude: 6.4 },
 *   angle: 25, bearing: 180,
 *   animationDuration: 0.5
 * };
 * Procedural.focusOnBounds ( bounds );
 */
Procedural.focusOnBounds = function ( target ) {
  if ( !target.sw || !target.sw.longitude || !target.sw.latitude ||
       !target.ne || !target.ne.longitude || !target.ne.latitude ) {
    console.log( 'Invalid target passed' );
    console.log( 'Please use following format: { sw: { latitude: 44.5, longitude: 6.3 }, ne: { latitude: 44.4, longitude: 6.4 } }' );
    console.log( '{ longitude: 1.23, latitude: 4.56 }' );
    return;
  }

  var nextTarget = { onComplete: RenderActions.onBoundsFocused };
  _.defaults( nextTarget, target );
  setTimeout( function () { UserActions.focusOnBounds( nextTarget ) }, 0 );
};

/**
 * @name focusOnLocation
 * @memberof module:Camera
 * @function
 * @description Animates the engine camera to focus on a location
 * @param {Object} location An Object specifying a longitude and latitude
 * @example
 * var target = { latitude: 44.5, longitude: 6.3 };
 * Procedural.focusOnLocation ( target );
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
 * Procedural.focusOnLocation ( target );
 */
Procedural.focusOnLocation = function ( target ) {
  if ( !target.longitude || !target.latitude ) {
    console.log( 'Invalid target passed' );
    console.log( 'Please use following format:' );
    console.log( '{ longitude: 1.23, latitude: 4.56 }' );
    return;
  }

  var nextTarget = { onComplete: RenderActions.onLocationFocused };
  _.defaults( nextTarget, target );
  setTimeout( function () { UserActions.focusOnLocation( nextTarget ) }, 0 );
};

/**
 * @name orbitTarget
 * @memberof module:Camera
 * @function
 * @description Animates the engine camera around the current
 * camera target
 */
Procedural.orbitTarget = function () {
  setTimeout( function () { UserActions.orbitTarget() }, 0 );
};

/**
 * @name setCameraMode
 * @memberof module:Camera
 * @function
 * @description Selects the current camera mode for the engine
 * @param {String} mode An String specifying the camera mode. Currently '2D' and '3D' are supported
 * @example
 * Procedural.setCameraMode ( '2D' );
 */
Procedural.setCameraMode = function ( mode ) {
  setTimeout( function () { UserActions.setCameraMode( mode ) }, 0 );
};

export default Procedural;
