/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import ConfigActions from '/actions/config';

const Procedural = {};

/**
 * @exports Procedural
 * @name Controls
 * @description Use the Controls API methods to configure
 * how the user can interact with the scene
 */

/**
 * @name configureControls
 * @memberof module:Controls
 * @function
 * @description Pass configuration to set parameters for controls
 * @param {Object} configuration An Object specifying the configuration
 * @example
 * // All parameters are optional
 * var configuration = {
 *   // Minimum distance camera can approach scene
 *   minDistance: 1000,
 *   // Maximum distance camera can move from scene
 *   maxDistance: 5000,
 *   // Maximum distance camera target can move from scene
 *   maxBounds: 7500,
 *   // Minimum polar angle of camera
 *   minPolarAngle: 0.25 * Math.PI,
 *   // Maximum polar angle of camera
 *   maxPolarAngle: 0.8 * Math.PI,
 *   // Set to true to disable panning
 *   noPan: true,
 *   // Set to true to disable rotating
 *   noRotate: false,
 *   // Set to true to disable zooming
 *   noZoom: false
 * };
 * Procedural.configureControls( configuration );
 */
Procedural.configureControls = function ( config ) {
  if ( !config ) {
    console.log( 'No configuration passed' );
    return;
  }

  var filtered = {};
  var keys = [
    'minDistance', 'maxBounds', 'maxDistance',
    'minPolarAngle', 'maxPolarAngle',
    'noPan', 'noRotate', 'noZoom'
  ];
  for ( var k in keys ) {
    var key = keys[ k ];
    if ( config.hasOwnProperty( key ) ) { filtered[ key ] = config[ key ] }
  }

  setTimeout( function () { ConfigActions.configureCamera( filtered ) }, 0 );
};

export default Procedural;
