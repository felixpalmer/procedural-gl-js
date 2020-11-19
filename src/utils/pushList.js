/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
// Sugar around array, that let's us determine
// if it only contains duplicates of a set of
// values. Useful to build a buffer for an attribute
// and if it is all the same, use a defaultAttributeValue
// instead
var PushList = function () {
  this.defaultValue = Array.prototype.slice.call( arguments );
  if ( this.defaultValue.length === 0 ) {
    console.error( 'Need to provide default value(s)' );
  }

  this.array = [];
  this.firstValue = null;
  this.onlyDuplicates = true;
};

// Push and keep track of whether the array only contains
// duplicates
PushList.prototype.push = function () {
  var value = Array.prototype.slice.call( arguments );
  if ( this.defaultValue.length !== value.length ) {
    console.error( 'Pushed item with incorrect length to PushList' );
  }

  if ( this.firstValue === null ) {
    this.firstValue = value;
  } else if ( this.onlyDuplicates && !_.isEqual( this.firstValue, value ) ) {
    this.onlyDuplicates = false;
  }

  this.array.push.apply( this.array, value );
};

PushList.prototype.pushDefault = function () {
  this.push.apply( this, this.defaultValue );
};

export default PushList;
