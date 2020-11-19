/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// Class for managing a set of indices
// `next()` returns a integer
class IntegerPool {
  constructor( capacity ) {
    this.capacity = capacity;
    this.index = 0;
    this.items = [];
  }

  next() {
    let i;
    // Once we hit capacity, start re-using stale entries
    if ( this.index >= this.capacity ) {
      i = this.items.splice( 0, 1 )[ 0 ];
    } else {
      // ...otherwise allocate sequentially
      i = this.index++;
    }

    this.items.push( i );
    return i;
  }

  // Method to keep element alive
  tap( item ) {
    let i = this.items.indexOf( item );
    if ( i !== -1 ) {
      this.items.splice( i, 1 );
      this.items.push( item );
    }
  }
}

export default IntegerPool;
