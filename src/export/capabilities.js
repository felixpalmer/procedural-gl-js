/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import Procedural from '/export/core';
import webgl from '/webgl';
// External API to engine, listing webgl capabilites
// Expose state of WebGL support
Procedural.missingCapabilities = [];
if ( !webgl.supported || webgl.missing.length > 0 ) {
  Procedural.deviceCapable = false;
  if ( !webgl.supported ) {
    Procedural.missingCapabilities.push( 'WebGL not supported' );
  }

  for ( var i in webgl.missing ) {
    if ( webgl.missing.hasOwnProperty( i ) ) {
      Procedural.missingCapabilities.push( 'Missing required WebGL extension: ' + webgl.missing[ i ] );
    }
  }
} else {
  Procedural.deviceCapable = true;
}

// Signal Procedural API is ready in case where we are not
// capable so that client knows we can proceed
if ( !Procedural.deviceCapable ) {
  if ( typeof Procedural.onReady === 'function' ) { Procedural.onReady() }
}

export default Procedural;
