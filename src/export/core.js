/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';

import ConfigActions from '/actions/config';
import GeodataActions from '/actions/geodata';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

const Procedural = {};

// External API to engine, bridges between our code and the
// exported `Procedural` object
function CoreExport() {
  this.appContainer = null;
  this.bindListeners( {
    onBoundsFocused: RenderActions.onBoundsFocused,
    onLocationFocused: RenderActions.onLocationFocused,
    fatalError: RenderActions.fatalError,
    signalUserInteraction: UserActions.inputStarted,
    setElevation: GeodataActions.setElevation,
    setElevationBig: GeodataActions.setElevationBig
  } );
}

/**
 * @exports Procedural
 * @name Core
 * @description The Procedural JavaScript library enables developers to embed
 * the Procedural engine into their web pages. To use this library
 * include a script tag on your page like so:
 * <pre>&lt;script
 *   src="https://unpkg.com/procedural-gl/build/procedural-gl.js"&gt;
 * &lt;/script&gt;
 * </pre>
 * This will create a <tt>Procedural</tt> object that your JavaScript code
 * will be able to call. Once you have loaded the Procedural library, you can load in a location and add the visualization to your page. A typical pattern of initialization is as follows:
 * @example
 * Procedural.init( {
 *   container: document.getElementById( 'app' ),
 *   datasource: {
 *     elevation: {
 *       apiKey: 'GET_AN_API_KEY_FROM_www.nasadem.xyz'
 *     },
 *     imagery: {
 *       apiKey: 'GET_AN_API_KEY_FROM_YOUR_IMAGERY_PROVIDER',
 *       urlFormat: 'https://imagery.example.com/tiles/{z}/{x}/{y}.jpg?key={apiKey}',
 *       attribution: 'Imagery attribution'
 *     },
 *   }
 * } );
 * Procedural.displayLocation( { latitude: 47.25, longitude: 13.55 } );
 */

/**
 * @name init
 * @memberof module:Core
 * @function
 * @param {HTMLElement} container
 * @description Appends a canvas element to the specified container where the
 * engine will draw its output.
 * @example
 * var container = document.getElementById( 'app' );
 * Procedural.init( {
 *   container: document.getElementById( 'app' ),
 *   datasource: {
 *     elevation: {
 *       apiKey: 'GET_AN_API_KEY_FROM_www.nasadem.xyz'
 *     },
 *     imagery: {
 *       apiKey: 'GET_AN_API_KEY_FROM_YOUR_IMAGERY_PROVIDER',
 *       urlFormat: 'https://imagery.example.com/tiles/{z}/{x}/{y}.jpg?key={apiKey}',
 *       attribution: 'Imagery attribution'
 *     },
 *   }
 * } );
 */
Procedural.init = function ( { container, datasource } ) {
  if ( container === undefined || container === null ) {
    console.error( 'Error: tried to init Procedural API with invalid container' );
    return;
  }

  if ( datasource === undefined || datasource === null ) {
    console.error( 'Error: tried to init Procedural API without datasource definition' );
    return;
  }

  const { elevation, imagery } = datasource;
  if ( elevation === undefined || elevation.apiKey === undefined ) {
    console.error( 'Error: elevation datasource configuration is invalid' );
    return;
  }

  if ( imagery === undefined || imagery.urlFormat === undefined ) {
    console.error( 'Error: imagery datasource configuration is invalid' );
    return;
  }

  ConfigActions.configureElevationDatasource( elevation );
  ConfigActions.configureImageryDatasource( imagery );
  ConfigActions.setAppContainer( container );
};

/**
 * @name onUserInteraction
 * @memberof module:Core
 * @function
 * @description Callback function for when engine recieves input from the
 * user. Can be used to hide overlays when the user interacts with
 * the map
 * @example
 * Procedural.onUserInteraction = function () {
 *   Procedural.removeOverlay( 'popup' );
 * }
 */

/**
 * @name onBoundsFocused
 * @memberof module:Core
 * @function
 * @description Callback function for when the transition for `focusOnBounds` completes
 * @example
 * Procedural.onBoundsFocused = function () {
 *   Procedural.orbitTarget();
 * };
 */

/**
 * @name onLocationError
 * @memberof module:Core
 * @function
 * @description Callback function for when location data failed to downloaded. This could be because the network request failed, or because the region is not available. See also [Core.setDisplayErrors]{@link module:Core.setDisplayErrors}
 * @example
 * Procedural.onLocationError = function ( message ) {
 *   // Handle error
 *   console.error( message );
 * };
 */

/**
 * @name onLocationFocused
 * @memberof module:Core
 * @function
 * @description Callback function for when the transition for `focusOnLocation` completes
 * @example
 * Procedural.onLocationFocused = function () {
 *   console.log( 'Location focused' );
 * };
 */

/**
 * @name onLocationLoaded
 * @memberof module:Core
 * @function
 * @description Callback function for when location data has been downloaded and displayed
 * @example
 * Procedural.onLocationLoaded = function () {
 *   var container = document.getElementById( 'app' );
 *   Procedural.init( container );
 * };
 */
//onLocationLoaded

// API Listeners
CoreExport.prototype.fatalError = function ( message ) {
  if ( typeof Procedural.onLocationError === 'function' ) { Procedural.onLocationError( message ) }
};

CoreExport.prototype.onBoundsFocused = function () {
  if ( typeof Procedural.onBoundsFocused === 'function' ) { Procedural.onBoundsFocused() }
};

CoreExport.prototype.onLocationFocused = function () {
  if ( typeof Procedural.onLocationFocused === 'function' ) { Procedural.onLocationFocused() }
};

CoreExport.prototype.setElevation = function () {
};

CoreExport.prototype.setElevationBig = function () {
};

/**
 * @name setDisplayErrors
 * @memberof module:Core
 * @function
 * @param {Boolean} value pass true to show errors, false to only report via API
 * @description Configure whether errors should be displayed to the user. See also [Core.onLocationError]{@link module:Core.onLocationError}
 */
Procedural.setDisplayErrors = function ( value ) {
  setTimeout( function () { ConfigActions.setDisplayErrors( value ) }, 0 );
};

CoreExport.prototype.signalUserInteraction = function () {
  if ( typeof Procedural.onUserInteraction === 'function' ) { Procedural.onUserInteraction() }
};

CoreExport.displayName = 'CoreExport';

alt.createStore( CoreExport );
export default Procedural;
