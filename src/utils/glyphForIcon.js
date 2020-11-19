/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
// Extract the glpyh for a FontAwesome icon
var iconElement = document.createElement( 'i' );
var wrapper = document.createElement( 'div' );
wrapper.style.position = 'absolute';
wrapper.style.left = '-999px';
wrapper.style.top = '-999px';
wrapper.appendChild( iconElement );
wrapper.style.display = 'none';
document.body.appendChild( wrapper );

var glyph;

export default _.memoize( function ( icon ) {
  wrapper.style.display = 'block';
  iconElement.className = 'fa fa-' + icon;
  glyph = window.getComputedStyle( iconElement, ':before' )
    .getPropertyValue( 'content' );
  glyph = glyph.replace( /['"]/g, '' );
  wrapper.style.display = 'none';
  return glyph;
} );
