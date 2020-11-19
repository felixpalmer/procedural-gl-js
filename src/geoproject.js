/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import tilebelt from "@mapbox/tilebelt";

// A collection of utility functions for converting between coordinate
// systems
var geoproject = {
  center: new THREE.Vector2( 0, 0 ), // Coordinate map is centered on (projected coordinates)
  center3035: new THREE.Vector2( 0, 0 ), // Coordinate map is centered on (projected coordinates)
  projector: null,

  calculateGlobalOffset: function ( lon, lat ) {
    // TODO define `baseZ` in one place!!!
    const baseZ = 7;
    const [ x, y, z ] = tilebelt.pointToTileFraction( lon, lat, baseZ );
    const scale = Math.pow( 2, 15 - z ) *
      geoproject.calculateSceneScale( lon, lat );
    return new THREE.Vector2( -x, y ).multiplyScalar( scale );
  },

  // Calculate scale factor at zoom level 15
  // This will let us scale the terrain to match features in scene
  calculateSceneScale: function ( lon, lat ) {
    var tile15 = tilebelt.pointToTile( lon, lat, 15 );
    var bbox15 = tilebelt.tileToBBOX( tile15 );
    var size = geoproject.project( [ bbox15[ 2 ], bbox15[ 3 ] ] )
      .sub( geoproject.project( [ bbox15[ 0 ], bbox15[ 1 ] ] ) );
    return size.x;
  },

  project: function ( lonlatH, absolute ) {
    if ( typeof lonlatH[ 0 ] !== 'number' ) {
      // Assume we have an array, iterate over it
      return lonlatH.map( function ( x ) {
        return geoproject.project( x, absolute );
      } );
    }

    var projected = geoproject.projector.forward( lonlatH );
    if ( !absolute ) {
      // Hot function, so in-line vector math
      projected[ 0 ] -= geoproject.center.x;
      projected[ 1 ] -= geoproject.center.y;
    }

    return new THREE.Vector3( projected[ 0 ], projected[ 1 ], lonlatH[ 2 ] ); // Pass through the height
  },
  unproject: function ( v, absolute ) {
    if ( Array.isArray( v ) ) {
      return v.map( function ( x ) {
        return geoproject.unproject( x, absolute );
      } );
    }

    var projected = [ v.x, v.y ];
    if ( !absolute ) {
      projected[ 0 ] += geoproject.center.x;
      projected[ 1 ] += geoproject.center.y;
    }

    var unprojected = geoproject.projector.inverse( projected );
    return [ unprojected[ 0 ], unprojected[ 1 ], v.z ]; // Pass through the height
  },
  unproject3035: function ( v, absolute ) {
    if ( Array.isArray( v[ 0 ] ) ) {
      return v.map( function ( x ) {
        return geoproject.unproject3035( x, absolute );
      } );
    }

    var projected = [ v[ 0 ], v[ 1 ] ];
    if ( !absolute ) {
      projected[ 0 ] += geoproject.center3035.x;
      projected[ 1 ] += geoproject.center3035.y;
    }

    var unprojected = geoproject.projector3035.inverse( projected );
    return [ unprojected[ 0 ], unprojected[ 1 ], v.z ]; // Pass through the height
  },
  vectorize: function ( lonlatH ) {
    if ( typeof lonlatH[ 0 ] !== 'number' ) {
      // Assume we have an array, iterate over it
      var result = new Array( lonlatH.length );
      for ( var i = 0, il = lonlatH.length; i < il; i++ ) {
        result[ i ] = geoproject.vectorize( lonlatH[ i ] );
      }

      return result;
    }

    return new THREE.Vector3( lonlatH[ 0 ], lonlatH[ 1 ], lonlatH[ 2 ] );
  },
  // Convert a JSON feature representation into arrays of THREE.Vectors
  vectorizeFeature: function ( feature ) {
    if ( feature.projected ) {
      return geoproject.vectorize( feature.geometry.coordinates );
    } else {
      return geoproject.project( feature.geometry.coordinates );
    }
  }
};

export default geoproject;
