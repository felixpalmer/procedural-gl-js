/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// TODO set these from JS
#define VIRTUAL_TEXTURE_ARRAY_BLOCKS 4.0
#define VIRTUAL_TEXTURE_ARRAY_SIZE 512.0

#include readTexVirtual.glsl

uniform lowp sampler2D indirectionTexture;
uniform vec2 uGlobalOffset;
uniform float uSceneScale;

// Function to scale height such that one unit in the
// horizontal plane is equal to one vertical unit
// Basically comes down to the Mercator projection
// Math.pow(2, 15) / 40075016.686
const float earthScale = 0.0008176665341588574;
float heightScale ( in float y ) {
  // PI - 2 * PI * y / pow( 2, 10 ) [ z is fixed to 10 ]
  float n = 3.141592653589793 - 0.006135923151542565 * y;
  // cosh( n ) / ( earthScale * uSceneScale)
  float cosh_n = dot( vec2( 0.5 ), exp( vec2( n, -n ) ) );
  return cosh_n / ( earthScale * uSceneScale );
}

// TODO should this be highp? Seems OK on iOS
// From: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
//     If you have a float texture, iOS requires that you use highp sampler2D foo;
//     or it will very painfully give you lowp texture samples!
//     (+/-2.0 max is probably not good enough for you)
// +/-2 seems OK, but should revisit if artifacts present
uniform lowp sampler2D elevationArray;
float getHeight( in vec2 p ) {
  // Get tile coord (at z = 10), currently we are at z = 15
  const float zoomScale = 32.0; // pow( 2, 15 - 10 )
  const float indirectionSize = 1024.0;
  vec2 tile = p.xy - uGlobalOffset;
  tile /= ( uSceneScale * zoomScale );
  tile *= vec2( 1.0, -1.0 );

  // Unsnapped uv will be used below for secondary lookup
  vec2 indirectionUv = tile / indirectionSize;

  // Snap as on Windows/ANGLE Nearest filtering is not respected
  const vec2 halfTexel = vec2( 0.5 );
  vec2 snapped = ( floor( tile - halfTexel ) + halfTexel );
  snapped += step( halfTexel, tile - snapped );
  vec2 indirectionUvRounded = snapped / indirectionSize;

  vec4 indirection = texture2D( indirectionTexture, indirectionUvRounded );

  // Update index from indirection
  float index = indirection.r;
  float tileSize = indirection.g;
  vec2 tileOrigin = indirection.ba;

  // We know index of texture to do lookup in, but now
  // we need to know the uv coordinates within the tile
  // For this we need to know what the tile origin and size are
  // At first glance it might seem possible to derive the tile origin
  // mathematically from the indirectionUv (using `fract`), but the issue
  // then is numerical precision. On some GPUs the lack of precision
  // means that the data we read from the indirection texture doesn't
  // align with that derived in the shader. It is more reliable to
  // store the entire transformation from the indirectionUv to
  // scaledUv in the texture, that way it will be no spurious errors
  vec2 scaledUv = indirectionUv * tileSize + tileOrigin;

  // Finally read out height, and unpack to single float
  return heightScale( tile.y ) * readTex( elevationArray, scaledUv, index ).a;
}
