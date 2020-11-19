/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var A = 0.15;
var B = 0.50;
var C = 0.10;
var D = 0.20;
var E = 0.02;
var F = 0.30;

var RawTonemap = function ( x ) {
  return ( ( x * ( A * x + C * B ) + D * E ) / ( x * ( A * x + B ) + D * F ) ) - E / F;
};

export default RawTonemap;
