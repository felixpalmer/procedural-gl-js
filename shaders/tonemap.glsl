/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const float A = 0.15;
const float B = 0.50;
const float C = 0.10;
const float D = 0.20;
const float E = 0.02;
const float F = 0.30;

uniform float uTonemapExposureBias;
uniform float uTonemapWhiteScale;

vec3 RawTonemap( vec3 x )
{
  return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

vec3 Tonemap( vec3 color ) {
  return uTonemapExposureBias * RawTonemap( uTonemapWhiteScale * color );
}
