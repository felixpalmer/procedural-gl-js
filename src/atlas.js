/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import glyphForIcon from '/utils/glyphForIcon';
import log from '/log';
import RenderActions from '/actions/render';
import uiFont from '/utils/uiFont';
import webgl from '/webgl';
import WorkQueue from '/utils/workQueue';
// Polyfill for IE
Math.log2 = Math.log2 || function ( x ) { return Math.log( x ) * Math.LOG2E };

/**
 * Texture atlas class
 * @param size width of texture to render into
 * @param spriteSize width of each sprite rendered into atlas
 * @param padding padding either side of each sprite
 */
var Atlas = function ( size, spriteSize, padding ) {
  // Match display density when drawing fonts
  // Note if the user zooms in the web page, this will change,
  // but for now do not worry about this
  this.pixelRatio = window.devicePixelRatio;
  if ( !webgl.depthTexture ) { this.pixelRatio = 1.0 }

  this.pixelRatio = Math.min( this.pixelRatio, 4 );
  this.size = ( size || 512 ) * this.pixelRatio;

  // Make sure we use power of two
  this.size = Math.pow( 2, Math.ceil( Math.log2( this.size ) ) );
  this.width = this.size;
  this.height = 2 * this.size;
  this.spriteSize = 40;
  this.monochromeBegin = 0.25 * this.height;
  this.queue = [];

  // Add spacing between slots to ensure we don't bleed
  // sprites into each other
  this.padding = padding || 0;

  // Stores object transform mapping
  this.mapping = new Map();

  // Scratch canvas, we'll use for writing,
  // before copying to the texture. This allows us
  // to write text into a single channel
  // TODO should we share the scratch canvas with e.g. geoutils?
  this.scratchCanvas = document.createElement( 'canvas' );
  this.scratchCanvas.width = this.width;
  this.scratchCanvas.height = this.height;
  this.scratch = this.scratchCanvas.getContext( '2d' );
  this.scratch.textBaseline = 'middle';
  this.scratch.fillStyle = 'rgba(255, 255, 255, 1.0)';

  // Texture we'll copy our rasterized images to
  this.texture = new THREE.Texture( this.scratchCanvas );
  this.texture.wrapS = THREE.RepeatWrapping;
  this.texture.wrapT = THREE.RepeatWrapping;
  this.texture.minFilter = THREE.NearestFilter;
  this.texture.magFilter = THREE.NearestFilter;
  this.texture.generateMipmaps = false;
  this.texture.flipY = false;
  this.clear();

  // Debug, view canvas
  var self = this;
  window.showAtlas = function () {
    self.scratchCanvas.style.position = 'absolute';
    self.scratchCanvas.style.width = '512px';
    self.scratchCanvas.style.height = '512px';
    self.scratchCanvas.style[ 'pointer-events' ] = 'none';
    self.scratchCanvas.style.opacity = '0.9';
    document.children[ 0 ].children[ 1 ].appendChild( self.scratchCanvas );
  };

  this.defaultFontSize = 11;
  this.checkFontAvailable();
};

var checkCount = 30;
Atlas.prototype.checkFontAvailable = function () {
  if ( !this.testCanvas ) {
    this.testCanvas = document.createElement( 'canvas' );
    this.testCanvas.width = 16;
    this.testCanvas.height = 16;
  }

  var ctx = this.testCanvas.getContext( '2d' );

  // Draw square character for font-awesome to detect
  // if the font is loaded
  ctx.font = '32px FontAwesome';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  var text = glyphForIcon( 'minus' );
  ctx.fillText( text, 0, 16 );
  var fontAvailable = ctx.getImageData( 15, 0, 1, 1 ).data[ 0 ] > 250;

  if ( fontAvailable ) {
    RenderActions.fontsLoaded();
  } else {
    var self = this;
    setTimeout( function () {
      self.checkFontAvailable();
      checkCount--;
      if ( checkCount === 0 ) {
        console.error( 'FontAwesome has not loaded' );
        console.error( 'Please make sure you are including the relevant CSS in the <head> element, e.g.' );
        console.error( '<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css" rel="stylesheet">' );
      }
    }, 333 );
  }
};

Atlas.prototype.checkContainerFont = function () {
  // Setup text font (extracting what is applied by CSS)
  var c = document.getElementById( 'container' );
  var containerFont = c ? document.defaultView.getComputedStyle( c )[ 'font-family' ] : null;
  containerFont = containerFont || '';
  this.font = 'FontAwesome, ' + containerFont + ", " + uiFont;
  this.setFontSize( this.defaultFontSize );
};

Atlas.prototype.setFontSize = function ( size ) {
  if ( size === undefined ) { size = this.defaultFontSize }

  if ( size === this.fontSize ) { return }

  if ( isNaN( size ) ) {
    console.error( 'Invalid font size' );
    return;
  }

  this.fontSize = size;
  var font = this.pixelRatio * Math.round( size ) + 'px ';
  font += this.font;
  this.scratch.font = font;
  this.textHeight = this.getTextHeight();
};

Atlas.prototype.getTextHeight = function () {
  // Estimate text height. Not perfect, but close enough for now
  // TODO, fix
  return 1.3 * this.scratch.measureText( 'M' ).width;
};

// Fill a slot in atlas by downloading an image from a given URL
Atlas.prototype.addImage = function ( url, width, height ) {
  var key = url;
  if ( width !== undefined ) { key += '#_#' + width }

  if ( height !== undefined ) { key += '#_#' + height }

  var transform = this.mapping.get( key );
  if ( transform !== undefined ) {
    // Already added, just return the location in atlas
    return transform;
  }

  transform = this.createTransform( {
    width: this.pixelRatio * ( width !== undefined ? width : this.spriteSize ),
    height: this.pixelRatio * ( height !== undefined ? height : this.spriteSize )
  } );
  this.mapping.set( key, transform );

  // Do not draw if we have a zero size area
  if ( transform.z * transform.w === 0 ) { return transform }

  var imageLoader = new THREE.ImageLoader();
  imageLoader.setCrossOrigin( 'Anonymous' );
  var self = this;
  imageLoader.load( url, function ( image ) {
    // Draw image
    var t = transform.clone();
    t.x *= self.width;
    t.y *= self.height;
    t.z *= self.width;
    t.w *= self.height;
    self.scratch.clearRect( t.x, t.y, t.z, t.w );
    self.scratch.globalCompositeOperation = 'lighter';
    self.scratch.drawImage( image, t.x, t.y, t.z, t.w );
    self.texture.needsUpdate = true;
    RenderActions.needsRender();
  } );

  return transform;
};

// Helper method to write alpha channel of text to either
// RGBA channel only.
Atlas.prototype.fillTextToChannel = function ( text, transform ) {
  var channel = Math.floor( transform.y / this.height );

  // If we draw the text with red or blue channels only,
  // it ends up being thinner than it should be. Not 100%
  // sure why this is, perhaps it is to do with sub-pixel
  // rendering. To fix, render with green channel also,
  // and then later clear green channel when we come to use it
  // To make this simpler, we arrange the channels RBG not RGB
  // as might be otherwise expected
  if ( channel === 1 ) {
    this.scratch.fillStyle = 'rgba(255, 255, 0, 1)';
  } else if ( channel === 2 ) {
    this.scratch.fillStyle = 'rgba(0, 255, 255, 1)';
  } else if ( channel === 3 ) {
    if ( !this.greenCleared ) { this.clearGreen() }

    this.scratch.fillStyle = 'rgba(0, 255, 0, 1)';
  }

  // Draw text onto scratch
  this.scratch.globalCompositeOperation = 'lighter';
  var y = ( transform.y % this.height ) + 0.5 * transform.w;
  this.scratch.fillText( text, transform.x, y );
};

// Clears green in region of text. Used when we switch to
// channel 3, as drawing in channels 1 and 2 pollutes
// the green channel in order for font rendering to work
Atlas.prototype.clearGreen = function () {
  this.scratch.globalCompositeOperation = 'multiply';
  this.scratch.fillStyle = 'rgba(255, 0, 255, 1)';
  this.scratch.fillRect( 0, this.monochromeBegin,
    this.width, this.height );
  this.greenCleared = true;
};

Atlas.prototype.addText = function ( text, fontSize, drawImmediate ) {
  if ( !this.font ) { this.checkContainerFont() }

  this.setFontSize( fontSize );
  var key = text;
  if ( fontSize !== undefined ) { key += '#_#' + fontSize }

  var transform = this.mapping.get( key );
  if ( transform !== undefined ) {
    // Already added, just return the location in atlas
    return transform;
  }

  // Default lead space to make icons look good
  // Center the middle of the first character with the border radius
  // TODO should this be optional?
  var iconWidth = this.scratch.measureText( text.slice( 0, 1 ) ).width;
  var iconLeadSpace = 0.5 * ( this.textHeight - iconWidth );

  var textWidth = this.scratch.measureText( text ).width;
  var width = Math.ceil( textWidth + 2 * iconLeadSpace );

  // Center narrow text
  if ( width < this.textHeight ) {
    width = this.textHeight;
    iconLeadSpace = Math.floor( 0.5 * ( width - textWidth ) );
  }

  transform = this.createTransform( {
    width: width,
    height: this.textHeight
  }, true );
  this.mapping.set( key, transform );

  // Do not draw if we have a zero size area
  if ( transform.z * transform.w === 0 ) { return transform }

  // As creating a lot of text is expensive (getImageData is slow)
  // defer actually rendering till later. To process the queue
  // `processQueue` must be called
  var t = transform.clone();
  t.x *= this.width;
  t.y *= this.height;
  t.z *= this.width;
  t.w *= this.height;
  t.x += iconLeadSpace;

  // Cannot draw immediately if we're going to draw to green
  // channel. This is a bit of a hack, would be better if we sorted
  // the text to avoid this
  if ( drawImmediate && transform.y < 3 ) {
    this.fillTextToChannel( text, t );
  } else {
    this.queue.push( {
      fontSize: fontSize,
      text: text,
      transform: t
    } );
  }

  return transform;
};

Atlas.prototype.processQueue = function () {
  var self = this;
  WorkQueue.createTask( this.queue,
    function ( item ) {
      self.setFontSize( item.fontSize );
      self.fillTextToChannel( item.text, item.transform );
    },
    function () {
      RenderActions.needsRender();
      self.queue = [];
      self.texture.needsUpdate = true;
      log( 'Atlas text drawn' );
    },
    true );
};

Atlas.prototype.clear = function () {
  this.mapping.clear();
  log( 'ATLAS CLEAR' );

  // Only fill text area with black, by using 'copy'
  // the image area will be made transparent, which
  // is better for images as nothing is shown during loading
  this.scratch.globalCompositeOperation = 'copy';
  this.scratch.fillStyle = 'rgba(0, 0, 0, 1)';
  this.scratch.fillRect( 0, this.monochromeBegin, this.width, this.height - this.monochromeBegin );
  //this.scratch.fillRect( 0, 0, this.width, this.height );

  // We fill up the atlas with images (which use all 4 channels)
  // and text (which only uses 1). usedX/usedY tracks the space
  // used by images, while usedMonochrome tracks text
  this.usedX = 0;
  this.usedY = 0;
  this.greenCleared = false;
  this.rowHeight = 0;
  this.usedMonochromeX = 0;
  this.usedMonochromeY = this.height + this.monochromeBegin;
  this.rowMonochromeHeight = 0;
};

// Allocate and return the transform applied to uv to determine
// where image/text is in atlas:
// uv = transform.xy + transform.zw * uv
// To specify the object is monochrome (for text) we return
// a uv value where v is greater than 1, the fractional
// part has the usual meaning, while the integer part
// specifies the channel used 1: R, 2: G, 3: B, 4: A
Atlas.prototype.createTransform = function ( object, monochrome ) {
  var transform = new THREE.Vector4();

  var width = Math.ceil( object.width );
  var height = Math.ceil( object.height );

  // Add padding to object to calculate slot we'll
  // allocate to object
  var slotWidth = width + 2 * this.padding;
  var slotHeight = height + 2 * this.padding;
  var channelTop = 0;
  var channelBottom = 0;

  // Check if we can fit into atlas at all
  if ( slotWidth > this.width || slotHeight > this.height ) {
    console.error( 'Cannot fit object in atlas' );
    return transform;
  }

  if ( monochrome ) {
    // Move to next row if we cannot fit on this one
    if ( this.usedMonochromeX + slotWidth > this.width ) {
      this.usedMonochromeX = 0;
      this.usedMonochromeY += this.rowMonochromeHeight;
      this.rowMonochromeHeight = 0;
    }

    // Keep row as tall as biggest object
    this.rowMonochromeHeight = Math.max( this.rowMonochromeHeight, slotHeight );

    // Detect when top of text is in different channel to bottom
    channelTop = Math.floor( this.usedMonochromeY / this.height );
    channelBottom = Math.floor( ( this.usedMonochromeY + this.rowMonochromeHeight ) / this.height );

    // When we reach bottom, jump back up
    if ( channelTop !== channelBottom ) {
      this.usedMonochromeX = 0;
      this.usedMonochromeY = channelBottom * this.height + this.monochromeBegin;
      this.rowMonochromeHeight = slotHeight;
    }

    if ( this.usedMonochromeY + this.rowMonochromeHeight >
         4 * this.height ) {
      console.error( 'Atlas capacity exceeded!' );
      transform.z = 0; transform.w = 0;
      return transform;
    }
  } else {
    if ( this.usedX + slotWidth > this.width ) {
      this.usedX = 0;
      this.usedY += this.rowHeight;
      this.rowHeight = 0;
    }

    this.rowHeight = Math.max( this.rowHeight, slotHeight );
    if ( this.usedY + this.rowHeight >= this.monochromeBegin ) {
      console.error( 'Atlas capacity exceeded!' );
      transform.z = 0; transform.w = 0;
      return transform;
    }
  }

  // Create transform (snapping to pixels)
  if ( monochrome ) {
    transform.x = Math.round( this.usedMonochromeX + this.padding );
    transform.y = Math.round( this.usedMonochromeY + this.padding );
    this.usedMonochromeX += slotWidth;
  } else {
    transform.x = Math.round( this.usedX + this.padding );
    transform.y = Math.round( this.usedY + this.padding );
    this.usedX += slotWidth;
  }

  transform.z = width;
  transform.w = height;

  // Convert to 0->1 range
  transform.x /= this.width;
  transform.y /= this.height;
  transform.z /= this.width;
  transform.w /= this.height;

  return transform;
};

export default Atlas;
