/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var mapping = {
  'none': { x: 0, y: 0 },
  'object': { x: 1, y: 0 },
  'pixel': { x: 0, y: 1 }
};

export default function ( name ) {
  if ( name !== undefined && !isNaN( name.x ) && !isNaN( name.y ) ) {
    // If we just have coordinates, e.g. {x: 0.5, y: 0.1} just return
    return name;
  }

  return mapping[ name ] || mapping.pixel;
}
