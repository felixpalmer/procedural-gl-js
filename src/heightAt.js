/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
/// Looks up height at specific location in height dataset
import tilebelt from "@mapbox/tilebelt";

import GeoprojectStore from '/stores/geoproject';
import ElevationDatasource from '/datasources/elevation';

const earthScale = 0.0008176665341588574;
function heightScale( p ) {
  const sceneScale = GeoprojectStore.getState().sceneScale;
  let tile;
  if ( p.longitude ) {
    tile = tilebelt.pointToTile( p.longitude, p.latitude, 10 );
  } else {
    tile = GeoprojectStore.positionToTileFraction( p, 10 );
  }

  const n = 3.141592653589793 - 0.006135923151542565 * tile[ 1 ];
  return Math.cosh( n ) / ( earthScale * sceneScale );
}

function dataToHeight( data ) {
  return 256 * data[ 0 ] + data[ 1 ] - 32768;
}

// Simplified height lookup, doesn't interpolate between points
// just picks the nearest pixel
function heightAt( p, callback ) {
  const data = ElevationDatasource.dataAtPoint( p );
  if ( !data ) {
    if ( typeof callback === 'function' ) {
      const listener = () => {
        // Now that data has updated, try again to fetch
        const data = ElevationDatasource.dataAtPoint( p );
        if ( data ) {
          ElevationDatasource.removeListener( listener );
          callback( dataToHeight( data ) * heightScale( p ) );
        }
      };

      // Don't have data yet, but want to register for callback
      // once available
      ElevationDatasource.addListener( listener );
    }

    return 0;
  }

  const H = dataToHeight( data ) * heightScale( p );
  if ( typeof callback === 'function' ) { callback( H ) }

  return H;
}

export default heightAt;
