/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
'use strict';

function _interopDefault( ex ) { return ( ex && ( typeof ex === 'object' ) && 'default' in ex ) ? ex[ 'default' ] : ex }

const { readFileSync } = require( 'fs' );
const { dirname } = require( 'path' );
var rollupPluginutils = require( 'rollup-pluginutils' );
var MagicString = _interopDefault( require( 'magic-string' ) );

// Loads #includes into passed shader
function loadIncludes( source, id ) {
  // First, search for any include statements
  var matches = [];
  source.replace( /#include (.*)/g, function ( match, includeFile ) {
    matches.push( includeFile );
  } );
  if ( matches.length === 0 ) { return source }

  var pathName = dirname( id );
  for ( var m = 0; m < matches.length; m++ ) {
    var includeFile = matches[ m ];
    var includeShader = readFileSync(
      `${pathName}/${includeFile}`, { encoding: 'utf8' } );
    var regexp = new RegExp( "#include " + includeFile, "g" );
    source = source.replace( regexp, includeShader );
  }

  return loadIncludes( source, id );
}

// Plugin to load shader files and return them wrapped in Shader class
function shader( options ) {
  if ( options === void 0 ) options = {};

  var filter = rollupPluginutils.createFilter(
    options.include, options.exclude );

  return {
    name: 'shader',

    transform: function transform( source, id ) {
      if ( !filter( id ) ) return;

      // TODO perhaps could be nice to sourcemap this also?
      source = loadIncludes( source, id );

      var s = new MagicString( source.replace( /`/g, '\\`' ) );
      s.prepend( 'import Shader from "/utils/shader"; export default new Shader(`' )
        .append( '`);' );
      var code = s.toString();

      var result = { code };
      result.map = s.generateMap( { hires: true } );
      return result;
    }
  };
}

export default shader;
