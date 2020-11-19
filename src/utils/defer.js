/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var queue = [];
var processNext = function () { queue.shift()() };

var enqueue = function ( fn ) {
  if ( typeof fn !== 'function' ) {
    console.error( 'Tried to enqueue non-function' );
    return;
  }

  queue.push( fn );
  setTimeout( processNext, 0 );
};

export default enqueue;
