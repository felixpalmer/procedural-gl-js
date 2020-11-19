/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// On iOS standard texture linear filtering has
// artifacts, so use this manual replacement.
// It also doesn't work for FLOAT textures
#define TEX_SIZE (VIRTUAL_TEXTURE_ARRAY_SIZE * VIRTUAL_TEXTURE_ARRAY_BLOCKS)
const vec2 texelSize = vec2( 1.0 / TEX_SIZE, 0.0 );
vec4 texture2D_bilinear( const in sampler2D t, in vec2 uv )
{
  // Calculate pixels to sample and interpolating factor
  uv -= 0.5 * texelSize.xx;
  vec2 f = fract( uv * TEX_SIZE );
  // Snap to corner of texel and then move to center
  vec2 uvSnapped = uv - texelSize.xx * f + 0.5 * texelSize.xx;

  #ifdef HEIGHT_LOOKUP_BIAS
  // As we are sampling snapped pixels need to override
  // the mip-map selection by selecting a large negative
  // bias. Otherwise at boundaries the gradient of
  // uvSnapped is large and an incorrect mip-level is used
  // leading to artifacts
  vec4 tl = texture2D(t, uvSnapped, -10.0);
  vec4 tr = texture2D(t, uvSnapped + texelSize, -10.0 );
  vec4 bl = texture2D(t, uvSnapped + texelSize.yx, -10.0 );
  vec4 br = texture2D(t, uvSnapped + texelSize.xx, -10.0 );
  #else
  vec4 tl = texture2D(t, uvSnapped);
  vec4 tr = texture2D(t, uvSnapped + texelSize);
  vec4 bl = texture2D(t, uvSnapped + texelSize.yx);
  vec4 br = texture2D(t, uvSnapped + texelSize.xx);
  #endif
  vec4 tA = mix( tl, tr, f.x );
  vec4 tB = mix( bl, br, f.x );
  return mix( tA, tB, f.y );
}

// Virtual texture array lookup (WebGL1 fallback)
vec4 readTex( in sampler2D tex, in vec2 uv, in float index ) {
  // Convert index into spatial offset
  vec2 offset = vec2(
    mod( float( index ), VIRTUAL_TEXTURE_ARRAY_BLOCKS ),
    floor( float( index ) / VIRTUAL_TEXTURE_ARRAY_BLOCKS )
  );

  // Don't bleed across to next texture
  const float padding = 0.5;
  vec2 limits = vec2( padding, VIRTUAL_TEXTURE_ARRAY_SIZE - padding ) / VIRTUAL_TEXTURE_ARRAY_SIZE; 

  // Calculate uv for lookup
  vec2 scaledUv = ( clamp( uv, limits.x, limits.y ) + offset ) / VIRTUAL_TEXTURE_ARRAY_BLOCKS;
  #ifdef MANUAL_TEXTURE_BILINEAR
  return texture2D_bilinear( tex, scaledUv );
  #else
  return texture2D( tex, scaledUv );
  #endif
}
