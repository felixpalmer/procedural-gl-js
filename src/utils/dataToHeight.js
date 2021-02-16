import { ELEVATION_TILE_SIZE,
  PIXEL_ENCODING_NASADEM, PIXEL_ENCODING_TERRARIUM, PIXEL_ENCODING_TERRAIN_RGB } from '/constants';

const MULTIPLIER_TERRARIUM = [ 256, 1, 1 / 256, -32768 ];
const MULTIPLIER_TERRAIN_RGB = [ 0.1 * 256 * 256, 0.1 * 256, 0.1, -10000 ];

function dataToHeight( data, pixelEncoding ) {
  if ( data[ 0 ] === 0 && data[ 1 ] === 0 ) {
    // NODATA values return 0
    return 0;
  }

  let m;
  if ( pixelEncoding === PIXEL_ENCODING_TERRARIUM || 
       pixelEncoding === PIXEL_ENCODING_NASADEM ) {
    m = MULTIPLIER_TERRARIUM;
  } else if ( pixelEncoding === PIXEL_ENCODING_TERRAIN_RGB ) {
    m = MULTIPLIER_TERRAIN_RGB;
  }

  return m[ 0 ] * data[ 0 ] +
         m[ 1 ] * data[ 1 ] +
         m[ 2 ] * data[ 2 ] +
         // This is correct, we don't want to multiply by data[ 3 ]
         m[ 3 ];
}

export default dataToHeight;
