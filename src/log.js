/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
let log;
if ( __dev__ ) {
  log = function () {
    if ( arguments.length ) {
      console.log.apply( console, arguments );
    }
  };
} else {
  log = () => {}; // Disable logging
}

export default log;
