/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/*global performance*/
import log from '/log';
let timeSource = performance || Date;
let track;

if ( __dev__ ) {
  track = {
    raw: function () {
      // Parse out object for display
      // At the moment we do not collect analytics, but keeping
      // format in case we want to change in future
      var tag = arguments[ 1 ].toUpperCase();
      var args = [ tag ];
      var obj = arguments[ 2 ];
      var labels = [
        'eventCategory', 'eventAction', 'eventLabel', 'eventValue',
        'timingCategory', 'timingVar', 'timingLabel', 'timingValue'
      ];
      labels.forEach( function ( label ) {
        if ( obj[ label ] !== undefined ) {
          if ( label === 'timingValue' ) {
            args.push( obj[ label ].toFixed( 0 ) + 'ms' );
          } else {
            args.push( obj[ label ] );
          }
        }
      } );
      log.apply( window, args );
    },
    event: function ( category, action, label, value ) {
      var obj = {};
      if ( category ) { obj.eventCategory = category }

      if ( action ) { obj.eventAction = action }

      if ( label ) { obj.eventLabel = label }

      if ( value ) { obj.eventValue = value }

      track.raw( 'send', 'event', obj );
    },
    timing: function ( category, variable, label, value ) {
      var obj = {};
      if ( category ) { obj.timingCategory = category }

      if ( variable ) { obj.timingVar = variable }

      if ( label ) { obj.timingLabel = label }

      if ( value ) { obj.timingValue = Math.round( value ) }

      track.raw( 'send', 'timing', obj );
    },
    onload: null,
    now: function () { return timeSource.now() }
  };
  setTimeout( function () {
    if ( track.onload ) { track.onload() }
  } );
} else {
  // Mock out in production build
  track = {
    event: () => {},
    timing: () => {},
    onload: null,
    now: () => 0
  };
}

export default track;
