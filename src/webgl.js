/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import gl from '/gl';
import utils from '/glUtils';
import track from '/track';
var extensions = ( gl !== null ) ? gl.getSupportedExtensions() : [];

// Find missing extensions
var needed = [ 'ANGLE_instanced_arrays',
  'OES_standard_derivatives' ];
var optional = [ 'WEBGL_depth_texture' ];
var missing = needed.filter( function ( ext ) {
  return extensions.indexOf( ext ) === -1;
} );
var missingOptional = optional.filter( function ( ext ) {
  return extensions.indexOf( ext ) === -1;
} );

// Test for ability to render to textures with different formats
// For discussion, see: http://stackoverflow.com/questions/28827511/webgl-ios-render-to-floating-point-texture

var testFramebuffer = function ( ext, format ) {
  var tex, fb;
  var ok = false;
  try {
    // Optionally check for extension
    if ( ext ) {
      var hasExt = gl.getExtension( ext );
      if ( !hasExt ) {
        return false;
      }
    }

    tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex );
    // Note using RGB for 565
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, format, null );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    fb = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, fb );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );
    var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
    ok = ( status === gl.FRAMEBUFFER_COMPLETE );
  } catch ( e ) {
    ok = false;
  } finally {
    if ( tex ) { gl.deleteTexture( tex ) }

    if ( fb ) { gl.deleteFramebuffer( fb ) }
  }

  return ok;
};

// The webgl module typically loads before we are ready, so track stats once loaded
track.onload = function () {
  track.event( 'webgl', 'supported', webgl.supported ? 'yes' : 'no' );
  track.event( 'webgl', 'render_565', webgl.render565 ? 'yes' : 'no' );
  if ( webgl.missing.length > 0 ) {
    for ( var i = 0; i < webgl.missing.length; i++ ) {
      track.event( 'webgl', 'missing_extension', webgl.missing[ i ] );
    }
  }

  if ( webgl.missingOptional.length > 0 ) {
    for ( var i = 0; i < webgl.missingOptional.length; i++ ) {
      track.event( 'webgl', 'missing_optional_extension', webgl.missingOptional[ i ] );
    }
  }
};

var webgl = {
  supported: ( gl !== null ),
  supports: function ( extension ) {
    return extensions.indexOf( extension ) !== -1;
  },
  extensions: extensions,
  render565: false,
  s3tc: false,
  pvrtc: false,
  missing: missing,
  missingOptional: missingOptional,
  workers: !!window.Worker
};

if ( webgl.supported ) {
  var program = utils.createProgram(
    'void main() { gl_Position = vec4( 1.0, 1.0, 1.0, 1.0); }',
    'precision mediump float; uniform sampler2D uiiii_tex; void main() { gl_FragColor = texture2D( uiiii_tex, vec2( 0.5, 0.5 ) ); }'
  );

  // Check for ability to render to a 565 texture. If we can do this
  // we can reduce our memory footprint
  webgl.render565 = testFramebuffer( null, gl.UNSIGNED_SHORT_5_6_5 );

  gl.deleteProgram( program );
  program = undefined;

  // Check texture compression support
  var s3tc = gl.getExtension( 'WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'MOZ_WEBGL_compressed_texture_s3tc' ) || gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_s3tc' );
  var pvrtc = gl.getExtension( 'WEBGL_compressed_texture_pvrtc' ) || gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_pvrtc' );
  webgl.s3tc = ( s3tc !== null );
  webgl.pvrtc = ( pvrtc !== null );

  // Check for depth texture
  webgl.depthTexture = webgl.supports( 'WEBGL_depth_texture' );
}

export default webgl;
