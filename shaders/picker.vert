/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// RawShader
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float uPixelRatio;
uniform vec2 uViewportCanvasInverse;

// This material needs to handle both pistes and markers
// which is tricky as their attributes mean different things
// In particular position is instanced for markers but
// not for pistes

// Rather than have 2 materials we use the position attribute
// to decide what we are rendering. Perhaps it is faster to have
// two materials, but this is simpler and saves swapping programs

// For markers the position attribute is 1, 1 or similar
// assume that for pistes it is longer. A bit hacky but works
// Using another attribute isn't reliable, e.g. we cannot
// use the atlas which should be 0 for pistes as this randomly
// fails. TODO investigate more robust solution

// Shared attributes
attribute vec3 tag;
attribute vec3 position;

// Piste attribute
attribute vec3 tangent;

// Marker attributes
attribute vec4 atlas; // (xy: location in atlas, zw: size in atlas)
attribute vec4 anchor; // (xy: anchor, z: per-object depth, w: per-pixel depth)
attribute vec4 clipping; // (x: per-object depth, y: per-pixel depth)
attribute vec3 layout; // (x: padding, y: borderWidth, z: borderRadius)
attribute vec4 normal; // (xyz: normal, w: collapseDistance)
attribute vec4 offset; // (xyz: offset, w: fadeDistance)

varying vec4 vTag;

#include lengthNormalize.glsl
#include getHeight.glsl

#define TUBE_RADIUS 20.0
#define SIZE vec2( 512.0, 1024.0 )

#include positionFromTangent.glsl

void main() {
  vTag.rgb = tag;

  // If we have a tag of zero, do not even draw
  // TODO appears to break in Firefox!
  float visible = 1.0 - step( length( tag ), 0.0 );

  // Select which material this is
  // TODO also broken on FF?
  float l = length( position.x );
  float isMarker = step( l, 1.00001 );
  isMarker *= step( 0.99999, l );

  // Lookup height
  vec3 worldPosition = mix( position, offset.xyz, isMarker );
  worldPosition.z = getHeight( worldPosition.xy );

  // Render path for piste
  vec4 piste = positionFromTangent( worldPosition, TUBE_RADIUS );

  // Render path for markers
  vec3 reverseViewVec = cameraPosition - worldPosition;
  float D = lengthNormalize( reverseViewVec );

  // Pack all into one varying xy: uv, z: selected, w: visibility
  vec2 flipped = vec2( 1.0, -1.0 ) * position.xy;
  vec2 pointCoord = 0.5 * flipped + vec2( 0.5 );

  // Collapse/fade the label
  vec4 vUv;
  vec2 expandshow = vec2( normal.w, offset.w );
  expandshow = smoothstep( expandshow, vec2( 0.95, 0.9 ) * expandshow, vec2( D ) );
  vUv.w = ( 0.6 * expandshow.x + 0.4 ) * expandshow.y;

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
  vec4 marker = projectionMatrix * viewMatrix * p;

  // Pixel-snapping (means we can use nearest filtering on texture)
  vec2 pixelScale = uPixelRatio * marker.w * uViewportCanvasInverse; 

  #ifdef READ_DEPTH
  // Hide entire label if anchor obscured
  vec3 uvz = 0.5 * marker.xyz / marker.w + vec3( 0.5 );
  float fragCoordZ = texture2D( uDepth, uvz.xy ).x;

  // Move back by amount relative to precision limit of depth
  float b = projectionMatrix[3][2]; // -2 * far * near / ( far - near )
  // Not entirely clear why 0.01 is correct, but lower
  // than this leading to flashing on iOS
  fragCoordZ /= 1.0 + 0.02 * fragCoordZ / b;

  vUv.w *= step( clipping.x * uvz.z, fragCoordZ );
  #endif

  marker.xy = pixelScale * floor( marker.xy / pixelScale );

  // Half of box for marker in clipspace
  vec2 halfSize = 0.5 * pixelScale * aspect;

  // Shift entire marker based on anchor position
  marker.xy += pixelScale * ( 0.5 * anchor.xy * aspect + anchor.zw );


  // Finally move out vertices to form quad
  // First get clipspace of top-left point
  marker.xy -= halfSize;

  // Now calculate other vertices (relative to top-left)
  vec2 vertex = ( position.xy + vec2( 1.0 ) ) * halfSize;
  marker.xy += vertex;

  gl_Position = visible * mix( piste, marker, isMarker );
}
