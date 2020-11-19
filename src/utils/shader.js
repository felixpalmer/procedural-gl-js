/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const Shader = function ( value ) {
  this.value = value;
};

Shader.prototype.define = function ( define, value ) {
  var regexp = new RegExp( "#define " + define + " .*", "g" );
  var newDefine = "#define " + define + ( value ? " " + value : "" );
  if ( this.value.match( regexp ) ) {
    // #define already exists, update its value
    this.value = this.value.replace( regexp, newDefine );
  } else {
    // New #define, prepend to start of file
    this.value = newDefine + "\n" + this.value;
  }
};

Shader.prototype.clone = function () {
  return new Shader( this.value );
};

export default Shader;
