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
 * @name UI
 * @description User interface elements can be optionally shown
 * on top of the map
 */

/**
 * @name setCameraModeControlVisible
 * @memberof module:UI
 * @function
 * @param {Boolean} value pass true to show control, false to hide
 * @description Show/hide the camera mode control
 */
Procedural.setCameraModeControlVisible = function ( value ) {
  setTimeout( function () { ConfigActions.setCameraModeControlVisible( value ) }, 0 );
};

/**
 * @name setCompassVisible
 * @memberof module:UI
 * @function
 * @param {Boolean} value pass true to show control, false to hide
 * @description Show/hide the compass control
 */
Procedural.setCompassVisible = function ( value ) {
  setTimeout( function () { ConfigActions.setCompassVisible( value ) }, 0 );
};

/**
 * @name setRotationControlVisible
 * @memberof module:UI
 * @function
 * @param {Boolean} value pass true to show control, false to hide
 * @description Show/hide the camera rotation control
 */
Procedural.setRotationControlVisible = function ( value ) {
  setTimeout( function () { ConfigActions.setRotationControlVisible( value ) }, 0 );
};

/**
 * @name setUserLocationControlVisible
 * @memberof module:UI
 * @function
 * @param {Boolean} value pass true to show control, false to hide
 * @description Show/hide the user location control. If GPS location is
 * not available the control will not be shown.
 */
Procedural.setUserLocationControlVisible = function ( value ) {
  setTimeout( function () { ConfigActions.setUserLocationControlVisible( value ) }, 0 );
};

/**
 * @name setZoomControlVisible
 * @memberof module:UI
 * @function
 * @param {Boolean} value pass true to show control, false to hide
 * @description Show/hide the camera zoom control
 */
Procedural.setZoomControlVisible = function ( value ) {
  setTimeout( function () { ConfigActions.setZoomControlVisible( value ) }, 0 );
};

export default Procedural;
