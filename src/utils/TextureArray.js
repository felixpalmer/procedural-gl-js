/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { ELEVATION_TILE_SIZE } from '/constants';
import renderer from '/renderer';

const canvas = document.createElement( 'canvas' );
const width = ELEVATION_TILE_SIZE;
const height = ELEVATION_TILE_SIZE;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext( '2d' );
const N = width * height;

const insertIntoTextureArray = ( textureArray, index, image ) => {
  const w = textureArray.image.width / textureArray.__blocks;
  const h = textureArray.image.height / textureArray.__blocks;
  const x = w * ( Math.floor( index ) % textureArray.__blocks );
  const y = h * Math.floor( Math.floor( index ) / textureArray.__blocks );

  if ( textureArray.useFloat ) {
    ctx.drawImage( image, 0, 0 );
    let imgData = ctx.getImageData( 0, 0, width, height ).data;

    let data = new Float32Array( N );

    const baseVal = -32768;
    //const interval = 1 / 256;
    let dataView = new DataView( imgData.buffer );
    for ( let i = 0; i < N; ++i ) {
      //let h = interval * (
      //  256 * 256 * imgData[ 4 * i ] +
      //  256 * imgData[ 4 * i + 1 ] +
      //  imgData[ 4 * i + 2 ]
      //) + baseVal;
      // Read as big-endian data (skipping B channel), equivalent to above
      let H = dataView.getUint16( 4 * i, false ) + baseVal;

      // Handle NODATA value, clamping to 0
      data[ i ] = ( H === baseVal ? 0 : H );
    }

    // Do we need float? Perhaps just converting to data is
    // enough?
    renderer.copyTextureToTexture( { x, y }, {
      image: { data, width, height },
      isDataTexture: true
    }, textureArray );
  } else {
    renderer.copyTextureToTexture( { x, y }, { image },
      textureArray );
  }
};

export { insertIntoTextureArray };
