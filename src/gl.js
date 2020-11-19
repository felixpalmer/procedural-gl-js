/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var canvas = document.createElement( 'canvas' );
var gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );
canvas = undefined;
export default gl;
