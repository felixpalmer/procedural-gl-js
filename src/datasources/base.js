/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import tilebelt from '@mapbox/tilebelt';

import { INTERPOLATE_FLOAT } from "/constants";
import renderer from '/renderer';
import GeoprojectStore from '/stores/geoproject';
import log from '/log';
import IntegerPool from '/utils/IntegerPool';
import ImageLoader from '/utils/ImageLoader';
import { insertIntoTextureArray } from '/utils/TextureArray';

class BaseDatasource {
  constructor( { apiKey, poolSize, textureSize, useFloat, urlFormat } ) {
    this.apiKey = apiKey;
    this.urlFormat = urlFormat;
    this.useFloat = !!useFloat;
    this.hasUpdates = false;
    this.listeners = [];
    this.lookup = {};
    this.fetching = {};
    this.imgCache = {};
    this.indexPool = new IntegerPool( poolSize );

    // Emulate texture array by cutting up 2D texture
    let n = Math.sqrt( poolSize );
    if ( n % 1 ) {
      console.error( 'poolSize needs to be a power of 2' );
    }

    let virtualTextureSize = textureSize * n;

    const TextureFilter = ( this.useFloat && !INTERPOLATE_FLOAT ) ?
      THREE.NearestFilter : THREE.LinearFilter;

    this.textureArray = new THREE.DataTexture( null,
      virtualTextureSize, virtualTextureSize,
      // RGB seems to run *slower* than RGBA on iOS
      this.useFloat ? THREE.AlphaFormat : THREE.RGBAFormat,
      // HalfFloat doesn't work on iOS :(
      this.useFloat ? THREE.FloatType : THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
      TextureFilter, TextureFilter,
      //THREE.LinearFilter, THREE.LinearFilter,
      //THREE.NearestFilter, THREE.NearestFilter,
      renderer.capabilities.getMaxAnisotropy()
    );
    this.textureArray.__blocks = n;
    this.textureArray.useFloat = this.useFloat;

    if ( this.useFloat ) {
      const size = 1024; // TODO reduce in future!
      this.indirectionTexture = new THREE.DataTexture( null,
        size, size,
        // TODO Could perhaps use smaller format
        THREE.RGBAFormat, // Using RGB led to errors...
        // Need to use float type or get glitches on iOS
        THREE.FloatType,
        THREE.UVMapping,
        THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
        THREE.NearestFilter, THREE.NearestFilter,
        1 // anisotropy
      );
    }
  }

  urlForTile( x, y, z ) {
    return this.urlFormat.replace( '{x}', x ).replace( '{y}', y )
      .replace( '{z}', z ).replace( '{apiKey}', this.apiKey );
  }

  fetchIfNeeded( quadkey ) {
    if ( this.lookup[ quadkey ] !== undefined ||
      this.fetching[ quadkey ] !== undefined ) {
      // Have data, or download in progress, skip
      return;
    }

    // Throttle downloads
    let downloadIndices = Object.values( this.fetching );
    if ( downloadIndices.length > 32 ) {
      log( 'throttling...' );
      return;
    }

    let newIndex = this.findNewIndex( quadkey );

    // Mark as download in progress
    this.fetching[ quadkey ] = newIndex;

    // Actually fetch data
    let url = this.urlForTile( ...tilebelt.quadkeyToTile( quadkey ) );
    ImageLoader.load( url, ( image ) => {
      // Image loaded OK
        this.imgCache[ quadkey ] = image;
        insertIntoTextureArray( this.textureArray, newIndex, image );

        // Remove download and mark image location in lookup
        delete this.fetching[ quadkey ];
        this.lookup[ quadkey ] = newIndex;

        // TODO remove, just for demo page
        if ( this.useFloat ) {
          let el = document.getElementById( 'elevation-tile-count' );
          if ( el ) {
            let n = parseInt( el.innerHTML );
            if ( isNaN( n ) ) { n = 0 }

            el.innerHTML = ++n;
          }
        }

        this.updateIndirectionTexture();
        this.notifyUpdate();
      }, () => {
        console.error( 'Failed to get image', quadkey );
        delete this.fetching[ quadkey ];
      } );
  }

  findNewIndex( quadkey ) {
    // First request a new slot (index) to place image in
    let downloadIndices = Object.values( this.fetching );
    let newIndex;
    let oldQuadKey;
    let failed = true;
    for ( let i = 32; i > 0; i-- ) {
      // Try to obtain new index
      newIndex = this.indexPool.next();

      // Avoid situation where newIndex is used by an
      // in-progress download, as it'll get clobbered
      let goodIndex = downloadIndices.indexOf( newIndex ) === -1;

      // Check what data this is pointing at
      let oldDataSlot = Object.values( this.lookup ).indexOf( newIndex );
      oldQuadKey = Object.keys( this.lookup )[ oldDataSlot ];

      // Don't release tiles that are below us in
      // heirarchy, so that when we zoom out we always have
      // some data.
      // Without this, we eject the data and then later
      // tiles can end up having nothing to load! Resulting
      // in a weird glitch where the previous index set in
      // the uniform is used and some random tile is plastered
      // in its place :(
      let isParent = (
        oldQuadKey !== undefined &&
        quadkey.slice( 0, oldQuadKey.length - 1 ) === oldQuadKey.slice( 0, -1 ) );

      if ( goodIndex && !isParent ) {
        // Index is clean and not assigned being used by a download
        failed = false;
        break;
      }
    }

    if ( failed ) {
      log( `Failed to find index (${this.indexPool.capacity})` );
      log( 'Downloads: ', downloadIndices.length );
      // Fallback to using lowest resolution tile
      oldQuadKey = Object.keys( this.lookup ).sort(
        ( x, y ) => x.length - y.length )[ 0 ];
      newIndex = this.lookup[ oldQuadKey ];
    }

    // Next, remove any existing lookup entry that references
    // this index, as we are about to re-assign it. This should
    // be safe to do as the index should have been recycled
    // before
    if ( oldQuadKey !== undefined ) {
      delete this.lookup[ oldQuadKey ];
    }

    return newIndex;
  }

  updateIndirectionTexture() {
    // Update indirection texture, loop over all textures
    if ( this.indirectionTexture ) {
      let quadkeys = Object.keys( this.lookup );
      quadkeys.sort( ( a, b ) => Math.sign( a.length - b.length ) );
      for ( let q of quadkeys ) {
        let [ x, y, z ] = tilebelt.quadkeyToTile( q );
        let tileIndex = this.lookup[ q ];
        let size = Math.pow( 2, 10 - z );
        x *= size; y *= size; // Move to zoom level 10
        let data = new Float32Array( 4 * size * size );
        let tileSize = Math.pow( 2, z );
        let originScale = -tileSize / this.indirectionTexture.image.width;
        for ( let i = 0; i < data.length; i++ ) {
          // Location of tile in texture array
          data[ 4 * i ] = tileIndex;
          // Tile size
          data[ 4 * i + 1 ] = tileSize;
          // Tile origin position (scaled to save GPU instructions)
          data[ 4 * i + 2 ] = x * originScale;
          data[ 4 * i + 3 ] = y * originScale;
        }

        renderer.copyTextureToTexture( { x, y }, {
          image: { data, width: size, height: size },
          isDataTexture: true
        }, this.indirectionTexture );
      }
    }
  }

  // Locates the highest resolution data we have for this tile
  // return the data index and number of levels we are
  // downsampling by
  findBestAvailableData( quadkey, silent ) {
    for ( let downsample = 0; downsample < 20; downsample++ ) {
      // See if we have imagery already...
      let index = this.lookup[ quadkey ];
      if ( index !== undefined ) {
        return { index, downsample, quadkey };
      } else {
        // Try parent tile...
        // Parent key is just our key with last char removed
        quadkey = quadkey.slice( 0, -1 );
        if ( quadkey.length === 0 ) { break }
      }
    }

    if ( !silent ) {
      log( 'Failed to find data', quadkey );
    }

    return { index: null, downsample: 20, quadkey: null };
  }

  // Reads single point using local lookups
  dataAtPoint( p ) {
    let tile;
    if ( p.longitude ) {
      tile = tilebelt.pointToTileFraction( p.longitude, p.latitude, 10 );
    } else {
      tile = GeoprojectStore.positionToTileFraction( p, 10 );
    }

    const q = tilebelt.tileToQuadkey( tile );
    const { quadkey } = this.findBestAvailableData( q );

    // If we have no data, return 0 so at least something is
    // displayed
    if ( !quadkey ) { return [128,0] }

    // Convert to zoom level at which we have data
    const scale = Math.pow( 2, quadkey.length - tile[ 2 ] );
    tile[ 0 ] *= scale;
    tile[ 1 ] *= scale;

    const img = this.imgCache[ quadkey ];
    const canvas = document.createElement( 'canvas' );
    canvas.width = 1; canvas.height = 1;

    tile[ 0 ] = ( tile[ 0 ] % 1 ) * img.width;
    tile[ 1 ] = ( tile[ 1 ] % 1 ) * img.height;

    const ctx = canvas.getContext( '2d' );
    ctx.drawImage( img,
      tile[ 0 ], tile[ 1 ], 1, 1, // one pixel from src
      0, 0, 1, 1 ); // ..to 1x1 canvas
    return ctx.getImageData( 0, 0, 1, 1 ).data;
  }

  addListener( fn ) {
    this.listeners.push( fn );
  }

  removeListener( fn ) {
    let i = this.listeners.indexOf( fn );
    if ( i !== -1 ) { this.listeners.splice( i, 1 ) }
  }

  notifyUpdate() {
    this.hasUpdates = true;
  }

  broadcastUpdate() {
    this.listeners.forEach( l => l() );
    this.hasUpdates = false;
  }
}

export default BaseDatasource;
