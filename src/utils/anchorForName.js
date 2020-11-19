/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var mapping = {
  'top-left': { x: 1, y: -1 },
  'top': { x: 0, y: -1 },
  'top-right': { x: -1, y: -1 },
  'left': { x: 1, y: 0 },
  'center': { x: 0, y: 0 },
  'right': { x: -1, y: 0 },
  'bottom-left': { x: 1, y: 1 },
  'bottom': { x: 0, y: 1 },
  'bottom-right': { x: -1, y: 1 }
};

export default function ( name ) {
  if ( name !== undefined && !isNaN( name.x ) && !isNaN( name.y ) ) {
    // If we just have coordinates, e.g. {x: 0.5, y: 0.1} just return
    return name;
  }

  return mapping[ name ] || mapping.bottom;
}
