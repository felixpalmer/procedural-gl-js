/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
precision highp float;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 uOrthoTransform;
uniform vec3 cameraPosition;
uniform float uLodScale;

uniform vec3 uSelectedTag;
uniform float uPixelRatio;
uniform vec2 uViewportInverse;
uniform float uReadDepthOverride;

#ifdef READ_DEPTH
uniform sampler2D uDepth;
#endif

// Can only have up to 16 attributes. Currently have 9
attribute vec2 position; // Not instanced, defines quad to draw

attribute vec4 anchor; // (xy: anchor, zw: anchor offset)
attribute vec4 atlas; // (xy: location in atlas, zw: size in atlas)
attribute vec4 background;
attribute vec4 clipping; // (x: per-object depth, y: per-pixel depth)
attribute vec4 color;
attribute vec3 layout; // (x: padding, y: borderWidth, z: borderRadius)
attribute vec4 normal; // (xyz: normal, w: collapseDistance)
attribute vec4 offset; // (xyz: offset, w: fadeDistance)
attribute vec4 tag; // (xyz: tag, w: highlightOpacity)

// Can have max 8 varyings. Currently have 6
varying vec4 vUv; // (xy: uv, z: selected, w: visibility)
varying vec4 vBox;
varying vec4 vBackground;
varying vec4 vColor;
varying float vReadDepth;
varying vec3 vLayout;

#include lengthNormalize.glsl
#include getHeight.glsl

// Size of atlas scaled by atlas pixel ratio
// Also set in picker.vert
#define SIZE vec2( 512.0, 1024.0 )

void main() {
  vec3 worldPosition = offset.xyz;
  worldPosition.z = getHeight( worldPosition.xy );

  // Pass on attributes for shading
  vBackground = background;
  vColor = color;
  vLayout = uPixelRatio * layout;
  vReadDepth = clipping.y * uReadDepthOverride;

  // Fade with distance
  vec3 reverseViewVec = cameraPosition - worldPosition;
  float D = lengthNormalize( reverseViewVec );

  // Convert from clip space to uv space
  // position          --> pointCoord
  // (-1,+1) - (+1,+1)     (0,0) - (1,0)
  //    |         |    -->   |       |
  // (-1,-1) - (-1,+1)     (0,1) - (1,1)
  vec2 flipped = vec2( 1.0, -1.0 ) * position;
  vec2 pointCoord = 0.5 * flipped + vec2( 0.5 );

  // Are we selected?
  vUv.z = step( distance( tag.xyz, uSelectedTag ), 0.0 );

  // Collapse/fade the label
  vec2 expandshow = vec2( normal.w, offset.w ) + 1000000.0 * vUv.zz;
  expandshow = smoothstep( expandshow, vec2( 0.95, 0.9 ) * expandshow, vec2( D ) );
  vUv.w = ( 0.6 * expandshow.x + 0.4 ) * expandshow.y;

  // Opacity of highlight
  vUv.z *= tag.w;

  // Calculate potentially collapsed size of label
  vec2 crop = mix( atlas.ww * vec2( SIZE.y / SIZE.x, 1.0 ),
    atlas.zw, expandshow.x );
  vUv.xy = atlas.xy + crop * pointCoord;

  // Hide when on slope facing away, disabled when
  // we perform per-pixel depth clipping
  vUv.w *= smoothstep( 0.0, 0.15, clipping.y + dot( reverseViewVec, normal.xyz ) );
  vUv.w *= step( 0.3, vUv.w );

  // Adding padding & border around marker
  vec2 padding = layout.xx + layout.yy;
  vUv.xy += ( padding * flipped ) / SIZE;
  vec2 aspect = SIZE * crop + 2.0 * padding;
  aspect *= uPixelRatio;

  // Position towards us so we show up above terrain
  // Make bigger for object clipping as to avoid flashing
  float bringForward = min( 0.5 * D, 100.0 + 200.0 * clipping.x );
  vec4 p = vec4( worldPosition + bringForward * reverseViewVec, 1.0 );
  //vec4 p = vec4( worldPosition, 1.0 );
  gl_Position = projectionMatrix * viewMatrix * p;

  // Convert between gl_Position.xy clip-space to pixels
  vec2 pixelScale = 2.0 * gl_Position.w * uViewportInverse; 

  #ifdef READ_DEPTH
  // Hide entire label if anchor obscured
  vec3 uvz = 0.5 * gl_Position.xyz / gl_Position.w + vec3( 0.5 );
  float fragCoordZ = texture2D( uDepth, uvz.xy ).x;

  // Move back by amount relative to precision limit of depth
  float b = projectionMatrix[3][2]; // -2 * far * near / ( far - near )
  // Not entirely clear why 0.01 is correct, but lower
  // than this leading to flashing on iOS
  fragCoordZ /= 1.0 + 0.02 * fragCoordZ / b;

  vUv.w *= step( clipping.x * uvz.z, fragCoordZ );
  #endif

  // Snap to position. Do this before applying anchor
  // to ensure composite markers stay together without wobbling
  // Final offset of vec2( 0.5 ) is to emulate round() using ceil()
  gl_Position.xy = pixelScale * floor( gl_Position.xy / pixelScale + vec2( 0.5 ) );

  // Half of box for marker in clipspace
  vec2 halfSize = 0.5 * pixelScale * aspect;

  // Shift entire marker based on anchor position
  gl_Position.xy += pixelScale * ( 0.5 * anchor.xy * aspect + anchor.zw );

  // Finally move out vertices to form quad
  // First get clipspace of top-left point
  gl_Position.xy -= halfSize;

  // box in fragCoord space, xy: center, zw: width/height
  const vec2 halfPixel = vec2( 0.5 );
  vBox.xy = ( gl_Position.xy + halfSize - halfPixel ) / pixelScale + vec2( 0.5 ) / uViewportInverse;
  vBox.zw = aspect;

  // Now calculate other vertices (relative to top-left)
  vec2 vertex = ( position + vec2( 1.0 ) ) * halfSize;

  // Shift by half pixel so that we are snapped to pixel for sharper text
  vertex -= halfPixel;

  // Only expand to primitive if visible, otherwise collapse to degenerate
  // triangle, avoiding the fragment shader having to execute
  gl_Position.xy += step( 0.0001, vUv.w ) * vertex;

  // Clamp border radius to sensible range
  vLayout.z = min( vLayout.z, 0.5 * vBox.w - vLayout.y ); // no larger than half of box
  vLayout.z = max( 0.0001, vLayout.z ); // 0 causes rendering issues
}
