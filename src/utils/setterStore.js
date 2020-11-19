/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var v, vl, item, action, actionName, defaultValue;
var extractKey = function ( actionName ) {
  if ( actionName.slice( 0, 3 ) !== 'set' ) {
    throw new Error( 'Action must be called setX' );
  }

  return actionName.charAt( 3 ).toLowerCase() +
           actionName.slice( 4 );
};

export default function ( config ) {
  // Extract listeners and method names
  function SetterStore() {
    var listeners = {};

    // Set defaults
    for ( v = 0, vl = config.length; v < vl; v++ ) {
      item = config[ v ];
      action = item[ 0 ];
      defaultValue = item[ 1 ];
      actionName = action.data.name;
      this[ extractKey( actionName ) ] = defaultValue;

      // Configure binding between action and function
      listeners[ actionName ] = action;
    }

    this.bindListeners( listeners );
  }

  // Define handler functions to set values
  for ( v = 0, vl = config.length; v < vl; v++ ) {
    item = config[ v ];
    action = item[ 0 ];
    actionName = action.data.name;
    SetterStore.prototype[ actionName ] = function ( key ) {
      return function ( value ) { this[ key ] = value };
    }( extractKey( actionName ) );
  }

  return SetterStore;
}
