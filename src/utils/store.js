/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import AnimationStore from '/stores/animation';
import log from '/log';
import UserInputStore from '/stores/userInput';
var StoreUtils = {
  // Transitions between an initial and final value, firing the `action` with the
  // intermediate value
  cancelStack: [], // Track transitions to enable cancelling them (UserInputStore.listen below)
  transition: function ( action, initial, final, options ) {
    if ( typeof initial !== typeof final ) {
      log( 'Error: types do not match for transition:', typeof initial, '!==', typeof final );
      return;
    }

    // Get correct lerp method based on type
    var lerp;
    if ( options.lerp ) {
      lerp = options.lerp;
    } else if ( initial instanceof THREE.Vector3 ) {
      lerp = StoreUtils.lerp.vector3;
    } else if ( !isNaN( initial ) ) {
      lerp = StoreUtils.lerp.scalar;
    } else {
      log( 'Error: no lerp function for object:' );
      log( initial );
      return;
    }

    // options defaults
    if ( options === undefined ) { options = {} }

    if ( options.duration === undefined ) { options.duration = 1 } // in seconds

    if ( options.ease === undefined ) {
      options.ease = StoreUtils.smootherstep;
    } else if ( typeof StoreUtils[ options.ease ] === 'function' ) {
      // Support passing of ease function by name
      options.ease = StoreUtils[ options.ease ];
    }

    // We're set, perform transition
    var transition = {
      startTime: null,
      options: options
    };
    transition.step = function () {
      // Lazily init start time for smoother animations
      // Otherwise we may wait too long before first frame
      if ( !transition.startTime ) { transition.startTime = new Date().getTime() }

      var t = new Date().getTime() - transition.startTime;
      var u = 0.001 * t / options.duration;
      if ( u >= 1 ) {
        // Transition complete, stop listening to animation ticks
        u = 1;
        AnimationStore.unlisten( transition.step );
        var index = StoreUtils.cancelStack.indexOf( transition.step );
        if ( index !== -1 ) {
          StoreUtils.cancelStack.splice( index, 1 );
        }
      }

      // Perform action, interpolating between initial and final values with easing
      var eased = options.ease( u );
      action( lerp( initial, final, eased ) );
      if ( u === 1 && typeof options.onComplete === 'function' ) {
        options.onComplete();
      }
    };

    if ( !options.doNotCancel ) {
      StoreUtils.cancelStack.push( transition );
    }

    AnimationStore.listen( transition.step );
  },
  // Easing functions
  cubicOut: function ( u ) { return Math.pow( u, 3 ) },
  cubicIn: function ( u ) { return 1 - Math.pow( 1 - u, 3 ) },
  linear: function ( u ) { return u },
  smootherstep: function ( u ) { return THREE.Math.smootherstep( u, 0, 1 ) },
  // Lerp functions
  lerp: {
    scalar: function ( initial, final, u ) {
      if ( isNaN( initial ) ) { return final }

      return initial + u * ( final - initial );
    },
    array: function ( initial, final, u ) {
      return initial.map( function ( i, n ) {
        return StoreUtils.lerp.scalar( i, final[ n ], u );
      } );
    },
    vector3: function ( initial, final, u ) {
      return initial.clone().lerp( final, u );
    },
    // Quadratic jump on top of standard transition
    vector3Hop: function ( height ) {
      return function ( initial, final, u ) {
        var v = StoreUtils.lerp.vector3( initial, final, u );
        v.z += height * ( 1 - Math.pow( 2 * u - 1, 2 ) );
        return v;
      };
    },
    // Transition while keeping set distance from center
    vector3AngularHop: function ( center, height ) {
      var v1 = new THREE.Vector3();
      var v2 = new THREE.Vector3();
      var axis = new THREE.Vector3( 0, 0, 1 );
      return function ( initial, final, u ) {
        // Move into space with center at 0,0 and flatten Z
        var h1 = v1.subVectors( initial, center ).z;
        var h2 = v2.subVectors( final, center ).z;
        v1.setZ( 0 );
        v2.setZ( 0 );
        var l1 = v1.length();
        var l2 = v2.length();
        var theta = Math.atan2( v2.y, v2.x ) - Math.atan2( v1.y, v1.x );
        if ( theta > Math.PI ) { theta -= 2 * Math.PI }

        if ( theta < -Math.PI ) { theta += 2 * Math.PI }

        // Rotate initial vector towards final and interpolate the length and height
        var h = StoreUtils.lerp.scalar( h1, h2, u );
        var l = StoreUtils.lerp.scalar( l1, l2, u );
        v1.applyAxisAngle( axis, theta * u ).setLength( l ).setZ( h );

        // Return to world space
        v1.add( center );
        v1.z += height * ( 1 - Math.pow( 2 * u - 1, 2 ) );
        return v1;
      };
    },
    vector3Angular: function ( center ) {
      return StoreUtils.lerp.vector3AngularHop( center, 0 );
    },
    // For interpolating parameter objects for environment
    // and geography
    params: function ( initial, final, u ) {
      var out = {};
      for ( var p in final ) {
        if ( final.hasOwnProperty( p ) ) {
          //out[p] = interpolate( initial[ p ], final[ p ], u );
          if ( initial[ p ] === undefined ) {
            // Handle case where oldParams not yet defined
            out[ p ] = final[ p ];
            continue;
          }

          if ( typeof final[ p ] === 'number' ) {
            out[ p ] = ( 1 - u ) * initial[ p ] + u * final[ p ];
          } else if ( typeof final[ p ] === 'string' ) {
            // For now assume this is a color
            var color = new THREE.Color( initial[ p ] );
            var newColor = new THREE.Color( final[ p ] );
            var c = '#' + color.lerp( newColor, u ).getHexString();
            out[ p ] = c;
          } else {
            out[ p ] = final[ p ];
          }
        }
      }

      return out;
    }
  }
};

// Whenever we get any user input cancel transitions
UserInputStore.listen( function () {
  var transition;
  while ( ( transition = StoreUtils.cancelStack.pop() ) ) {
    if ( typeof transition.options.onCancel === 'function' ) {
      transition.options.onCancel();
    }

    AnimationStore.unlisten( transition.step );
  }
} );

export default StoreUtils;
