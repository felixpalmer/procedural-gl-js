/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// Normalized the input vector in place at the same
// time as finding its lengt
// Doesn't appear to be faster than length() & normalize() (same speed)
float lengthNormalize( inout vec3 v ) {
  float lengthSquared = dot( v, v );
  float rcpLength = inversesqrt( lengthSquared );
  v = rcpLength * v; // Normalized vector
  return lengthSquared * rcpLength; // Vector length
}
