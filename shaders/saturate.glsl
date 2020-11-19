/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
float saturate( float t ) { return clamp( t, 0.0, 1.0 ); }
vec2 saturate( vec2 t ) { return clamp( t, 0.0, 1.0 ); }
vec3 saturate( vec3 t ) { return clamp( t, 0.0, 1.0 ); }
vec4 saturate( vec4 t ) { return clamp( t, 0.0, 1.0 ); }
