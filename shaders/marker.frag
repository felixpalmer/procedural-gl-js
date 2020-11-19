/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

#ifdef READ_DEPTH
uniform sampler2D uDepth;
uniform vec2 uViewportInverse;
#endif
uniform sampler2D uMap;

varying vec4 vUv;
varying vec4 vBox;
varying vec4 vBackground;
varying vec4 vColor;
varying float vReadDepth;
varying vec3 vLayout;

#define SIZE 512.0

void main() {
  //gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
  //return;
  // Partially hide label (per-pixel depth check)
  #ifdef READ_DEPTH
  float fragCoordZ = texture2D(uDepth, uViewportInverse * gl_FragCoord.xy).x;

  float visibility = vUv.w * step( vReadDepth * gl_FragCoord.z, fragCoordZ );
  #else
  float visibility = vUv.w;
  #endif

  // Background color
  gl_FragColor = vBackground;

  // Padding
  vec2 limit = 0.5 * vBox.zw - vec2( vLayout.x + vLayout.y );
  vec2 clamped = clamp( gl_FragCoord.xy,
      vBox.xy - limit,
      vBox.xy + limit );
  float inside = step( distance( clamped, gl_FragCoord.xy ), 0.0 );

  // Image
  // TODO not the correct blend operation, but works on black
  // background
  // Should switch to over operator
  // e.g. https://en.wikipedia.org/wiki/Alpha_compositing
  vec4 image = texture2D( uMap, vUv.xy );

  // Mask out correct channel
  // 1: R, 2: B, 3: G, 4: A - see atlas.js
  vec4 channel = step( vec4( 1.0, 3.0, 2.0, 4.0 ), vec4( vUv.y ) );
  channel *= step( vec4( vUv.y ), vec4( 2.0, 4.0, 3.0, 5.0 ) );
  float monochrome = length( channel );
  image = mix( image,
               vec4( vec3( 1.0 ), dot( channel, image ) ),
               monochrome );

  // Clip image by padding
  image.a *= inside;

  // Colorize image
  image *= vColor;

  gl_FragColor.rgb = mix( gl_FragColor.rgb, image.rgb, image.a );
  gl_FragColor.a = max( gl_FragColor.a, image.a );

  // Radius of border
  float radius = vLayout.z;

  // Modify clamp to be circular
  limit = 0.5 * vBox.zw - vec2( radius + vLayout.y );
  clamped = clamp( gl_FragCoord.xy,
                   vBox.xy - limit,
                   vBox.xy + limit );
  float d = distance( clamped, gl_FragCoord.xy );

  // Draw border (similarly smoothstepping to reduce aliasing)
  limit = vec2( max( radius - 1.0, 0.0 ), radius ); // Inner radius of border
  float border = smoothstep( limit.x, limit.y, d );
  border *= step( 0.4999, vLayout.y ); // Do not draw border if width less than 0.5
  gl_FragColor = mix( gl_FragColor, vec4( 1.0 ), border );
  limit += vLayout.yy; // Outer radius of border

  // Fade out rounded border over one pixel to reduce aliasing
  gl_FragColor.a *= smoothstep( limit.y, limit.x, d );

  // Highlight and visibility
  gl_FragColor.rgb += vUv.z;
  gl_FragColor.a *= visibility;

  // Debug
  // Check that uv is always centered on texel
  // Get constant color when we disable snapping
  //gl_FragColor.rg = 10.0 * abs( fract( SIZE * vUv.xy ) - vec2( 0.5 ) );

  // Display channel used
  //gl_FragColor.rgb = mix( gl_FragColor.rgb, channel.rgb, vUv.z );

  // Show entire quad
  //gl_FragColor += vec4(1.0, 0.0, 0.0, 0.1);
  if ( gl_FragColor.a < 0.0001 ) { discard; }
}
