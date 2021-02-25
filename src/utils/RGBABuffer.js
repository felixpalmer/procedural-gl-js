/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// Class for managing a Float32Array which is expected to be
// read torioidally - that is data which is written beyond
// one edge, appears on the other.
// This class is useful for preparing an buffer for writing
// to an RGBA square floating point texture.
// It expects that values are to be set in groups of 4,
// corresponding to the 4 channels
// The main benefit it offers is quickly filling square
// regions with the same value
class RGBABuffer {
  constructor( size ) {
    this.size = size;
    this.data = new Float32Array( 4 * size * size );
  }

  // Sets a single RGBA "pixel"
  set( p, r, g, b, a ) {
    this.data[ 4 * p ] = r;
    this.data[ 4 * p + 1 ] = g;
    this.data[ 4 * p + 2 ] = b;
    this.data[ 4 * p + 3 ] = a;
  }

  // Fills a region with a RGBA "pixel" value
  fillRect( p, width, height, r, g, b, a ) {
    if ( ( width <= 0 ) || ( height <= 0 ) ) {
      return;
    }

    if ( ( width === this.size ) || ( height === this.size ) ) {
      this.fill( r, g, b, a );
      return;
    }

    // First set top-left pixel to correct value
    this.set( p, r, g, b, a );

    // Next copy across row, doubling up each time
    // As we are copying within the same Float32Array
    // this is fast
    for ( let i = 1; i < width; i *= 2 ) {
      let offset = p + i; // Destination pixel

      // Number of pixels to copy (cap at width for non-POT copy)
      let count = Math.min( i, width - i );
      this.data.set(
        this.data.subarray( 4 * p, 4 * ( p + count ) ),
        4 * offset );
    }

    // Now copy row itself
    const row = this.data.subarray( 4 * p, 4 * ( p + width ) );
    for ( let j = 1; j < height; j++ ) {
      let offset = p + this.size * j; // Destination row
      this.data.set( row, 4 * offset );
    }
  }

  // Fills entire buffer
  // Allows even faster copying than `fillRect`
  fill( r, g, b, a ) {
    this.set( 0, r, g, b, a );
    for ( let i = 1, il = this.size * this.size; i < il; i *= 2 ) {
      this.data.set( this.data.subarray( 0, 4 * i ), 4 * i );
    }
  }
}

export default RGBABuffer;
