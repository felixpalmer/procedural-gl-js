/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 *   The MIT License
 *
 *   Copyright © 2010-2020 three.js authors
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 */
import THREE from 'three';

function Color( r, g, b, a ) {
  if ( g === undefined && b === undefined ) {
    // r is THREE.Color, hex or string
    return this.set( r );
  }

  if ( a === undefined ) { a = 1 }

  return this.setRGB( r, g, b, a );
}

Object.assign( Color.prototype, {

  isColor: true,

  r: 1, g: 1, b: 1, a: 1,

  set: function ( value ) {
    if ( value && value.isColor ) {
      this.copy( value );
    } else if ( typeof value === 'number' ) {
      this.setHex( value );
    } else if ( typeof value === 'string' ) {
      this.setStyle( value );
    }

    return this;
  },

  setScalar: function ( scalar ) {
    this.r = scalar;
    this.g = scalar;
    this.b = scalar;

    return this;
  },

  setHex: function ( hex ) {
    hex = Math.floor( hex );

    this.r = ( hex >> 16 & 255 ) / 255;
    this.g = ( hex >> 8 & 255 ) / 255;
    this.b = ( hex & 255 ) / 255;

    return this;
  },

  setRGB: function ( r, g, b, a ) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;

    return this;
  },


  setStyle: function ( style ) {
    function handleAlpha( string ) {
      if ( string === undefined ) return 1;
      return parseFloat( string );
    }


    var m;

    if ( m = /^((?:rgb)a?)\(\s*([^\)]*)\)/.exec( style ) ) {
      // rgb / hsl

      var color;
      var name = m[ 1 ];
      var components = m[ 2 ];

      switch ( name ) {
      case 'rgb':
      case 'rgba':

        if ( color = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {
          // rgb(255,0,0) rgba(255,0,0,0.5)
          this.r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
          this.g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
          this.b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;

          this.a = handleAlpha( color[ 5 ] );

          return this;
        }

        if ( color = /^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {
          // rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
          this.r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
          this.g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
          this.b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;

          this.a = handleAlpha( color[ 5 ] );

          return this;
        }

        break;
      }
    } else if ( m = /^\#([A-Fa-f0-9]+)$/.exec( style ) ) {
      // hex color

      var hex = m[ 1 ];
      var size = hex.length;

      if ( size === 3 ) {
        // #ff0
        this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 0 ), 16 ) / 255;
        this.g = parseInt( hex.charAt( 1 ) + hex.charAt( 1 ), 16 ) / 255;
        this.b = parseInt( hex.charAt( 2 ) + hex.charAt( 2 ), 16 ) / 255;

        return this;
      } else if ( size === 6 ) {
        // #ff0000
        this.r = parseInt( hex.charAt( 0 ) + hex.charAt( 1 ), 16 ) / 255;
        this.g = parseInt( hex.charAt( 2 ) + hex.charAt( 3 ), 16 ) / 255;
        this.b = parseInt( hex.charAt( 4 ) + hex.charAt( 5 ), 16 ) / 255;

        return this;
      }
    }

    if ( style && style.length > 0 ) {
      // color keywords
      var hex = THREE.Color.NAMES[ style ];

      if ( hex !== undefined ) {
        // red
        this.setHex( hex );
      } else {
        // unknown color
        console.warn( 'THREE.Color: Unknown color ' + style );
      }
    }

    return this;
  },

  clone: function () {
    return new this.constructor( this.r, this.g, this.b, this.a );
  },

  copy: function ( color ) {
    this.r = color.r;
    this.g = color.g;
    this.b = color.b;
    this.a = color.a;

    return this;
  },

  copyGammaToLinear: function ( color, gammaFactor ) {
    if ( gammaFactor === undefined ) gammaFactor = 2.0;

    this.r = Math.pow( color.r, gammaFactor );
    this.g = Math.pow( color.g, gammaFactor );
    this.b = Math.pow( color.b, gammaFactor );

    return this;
  },

  copyLinearToGamma: function ( color, gammaFactor ) {
    if ( gammaFactor === undefined ) gammaFactor = 2.0;

    var safeInverse = ( gammaFactor > 0 ) ? ( 1.0 / gammaFactor ) : 1.0;

    this.r = Math.pow( color.r, safeInverse );
    this.g = Math.pow( color.g, safeInverse );
    this.b = Math.pow( color.b, safeInverse );

    return this;
  },

  convertGammaToLinear: function () {
    var r = this.r, g = this.g, b = this.b;

    this.r = r * r;
    this.g = g * g;
    this.b = b * b;

    return this;
  },

  convertLinearToGamma: function () {
    this.r = Math.sqrt( this.r );
    this.g = Math.sqrt( this.g );
    this.b = Math.sqrt( this.b );

    return this;
  },

  getHex: function () {
    return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;
  },

  getHexString: function () {
    return ( '000000' + this.getHex().toString( 16 ) ).slice( -6 );
  },

  getHSL: function ( optionalTarget ) {
    // h,s,l ranges are in 0.0 - 1.0

    var hsl = optionalTarget || { h: 0, s: 0, l: 0 };

    var r = this.r, g = this.g, b = this.b;

    var max = Math.max( r, g, b );
    var min = Math.min( r, g, b );

    var hue, saturation;
    var lightness = ( min + max ) / 2.0;

    if ( min === max ) {
      hue = 0;
      saturation = 0;
    } else {
      var delta = max - min;

      saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

      switch ( max ) {
      case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
      case g: hue = ( b - r ) / delta + 2; break;
      case b: hue = ( r - g ) / delta + 4; break;
      }

      hue /= 6;
    }

    hsl.h = hue;
    hsl.s = saturation;
    hsl.l = lightness;

    return hsl;
  },

  getStyle: function () {
    return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';
  },

  offsetHSL: function ( h, s, l ) {
    var hsl = this.getHSL();

    hsl.h += h; hsl.s += s; hsl.l += l;

    this.setHSL( hsl.h, hsl.s, hsl.l );

    return this;
  },

  add: function ( color ) {
    this.r += color.r;
    this.g += color.g;
    this.b += color.b;

    return this;
  },

  addColors: function ( color1, color2 ) {
    this.r = color1.r + color2.r;
    this.g = color1.g + color2.g;
    this.b = color1.b + color2.b;

    return this;
  },

  addScalar: function ( s ) {
    this.r += s;
    this.g += s;
    this.b += s;

    return this;
  },

  sub: function ( color ) {
    this.r = Math.max( 0, this.r - color.r );
    this.g = Math.max( 0, this.g - color.g );
    this.b = Math.max( 0, this.b - color.b );

    return this;
  },

  multiply: function ( color ) {
    this.r *= color.r;
    this.g *= color.g;
    this.b *= color.b;

    return this;
  },

  multiplyScalar: function ( s ) {
    this.r *= s;
    this.g *= s;
    this.b *= s;

    return this;
  },

  lerp: function ( color, alpha ) {
    this.r += ( color.r - this.r ) * alpha;
    this.g += ( color.g - this.g ) * alpha;
    this.b += ( color.b - this.b ) * alpha;
    this.a += ( color.a - this.a ) * alpha;

    return this;
  },

  equals: function ( c ) {
    return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );
  },

  fromArray: function ( array, offset ) {
    if ( offset === undefined ) offset = 0;

    this.r = array[ offset ];
    this.g = array[ offset + 1 ];
    this.b = array[ offset + 2 ];

    return this;
  },

  toArray: function ( array, offset ) {
    if ( array === undefined ) array = [];
    if ( offset === undefined ) offset = 0;

    array[ offset ] = this.r;
    array[ offset + 1 ] = this.g;
    array[ offset + 2 ] = this.b;

    return array;
  },

  toJSON: function () {
    return this.getHex();
  }

} );

export default Color;
