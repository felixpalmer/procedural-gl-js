/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import gl from '/gl';
var createShader = function ( type, src ) {
  // Create and compile shader
  var shader = gl.createShader( type );
  gl.shaderSource( shader, src );
  gl.compileShader( shader );

  // Check for errors
  var status = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
  if ( !status ) {
    var error = gl.getShaderInfoLog( shader );
    console.error( 'Error compiling shader:\n\n', src, error );
    return null;
  }

  return shader;
};

var createProgram = function ( vertShader, fragShader ) {
  // Create and link program
  var program = gl.createProgram();
  var vs = gl.attachShader( program, createShader( gl.VERTEX_SHADER, vertShader ) );
  var fs = gl.attachShader( program, createShader( gl.FRAGMENT_SHADER, fragShader ) );
  gl.linkProgram( program );

  // Check for errors
  var status = gl.getProgramParameter( program, gl.LINK_STATUS );
  if ( !status ) {
    var error = gl.getProgramInfoLog( program );
    console.error( 'Error linking program', program, error );
    return null;
  }

  // Clean up
  gl.deleteShader( vs );
  gl.deleteShader( fs );
  return program;
};

export default {
  createProgram: createProgram
};
