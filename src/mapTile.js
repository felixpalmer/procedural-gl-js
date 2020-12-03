/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import tilebelt from "@mapbox/tilebelt";

import material from '/material';
import scene from '/scene';
import MapTileGeometry from "/geometry/mapTile";

import ImageryDatasource from '/datasources/imagery';
import ElevationDatasource from '/datasources/elevation';

import GeoprojectStore from '/stores/geoproject';

// Relative scale of terrain and imagery
const exponent = 2; // Remember terrain tiles are 512, imagery 256

let tilePool = [];
let idCounter = 1;

class Tile {
  // To implement tile pool, use init to setup instance
  // see `Tile.nextTile` below
  constructor() {
    this.id = idCounter++;

    // Hack in listeners here for now
    const onUpdate = this.refreshIndices.bind( this );
    ImageryDatasource.addListener( onUpdate );
    ElevationDatasource.addListener( onUpdate );

    // Default geometry. Will be changed in init() anyway
    let geometry = Tile.geometry[ 64 ];

    this.offset = new THREE.Vector4( 0, 0, 1, 1 );
    this.imageryUvOffset = new THREE.Vector4();

    // Create materials and set unchanging uniforms
    let terrainMaterial = material.terrain( {
      uOffset: { value: this.offset },
      uImageryUvOffset: { value: this.imageryUvOffset }
    } );
    this.mesh = new THREE.Mesh( geometry, terrainMaterial.imagery );
    this.pickerMesh = new THREE.Mesh( geometry, terrainMaterial.picker );

    // Configure tile
    this.init( ...arguments );
  }

  init( x, y, z ) {
    if ( isNaN( x ) || isNaN( y ) || isNaN( z ) ) {
      throw Error( 'Invalid tile initialization' );
    }

    // Set to true if tile is drawn at least once
    this.wasSeen = false;
    this.wasRendered = false;

    // Add to scene so we get drawn (removed again in recycle)
    scene.add( this.mesh );
    scene.tilepickerScene.add( this.pickerMesh );

    // x, y, z reference to imagery tile
    this.x = x;
    this.y = y;
    this.z = z;

    // x, y, z reference to elevation tile
    let exp = Math.max( exponent, this.z - 10 ); // Cap elevation tile level to 10
    this.x2 = Math.floor( this.x / Math.pow( 2, exp ) );
    this.y2 = Math.floor( this.y / Math.pow( 2, exp ) );
    this.z2 = this.z - exp;

    // Update geometry based on terrain resolution
    // At exp level 0 (max terrain resolution) we want one vertex
    // per terrain tile pixel (so 512). As tile size is double
    // of imagery, multiply by 2 to get 1024
    let segments = 1024 / Math.pow( 2, exp );

    // Cap segment to reasonable range 1-64
    segments = Math.min( 64, Math.max( 1, segments ) );
    let geometry = Tile.geometry[ segments ].clone();
    let pickerGeometry = Tile.geometry[ Math.max( 1, segments / 8 ) ].clone();
    this.mesh.geometry = geometry;
    this.pickerMesh.geometry = pickerGeometry;

    // Position on scene
    this.calculateOffset();

    // Keys to identify imagery and elevation
    this.imageryKey = tilebelt.tileToQuadkey( [
      this.x, this.y, this.z ] );
    this.elevationKey = tilebelt.tileToQuadkey( [
      this.x2, this.y2, this.z2 ] );
    this.imageryIndex = 0;
    this.elevationIndex = 0;

    // Calculate bounding sphere
    let minH = -200, maxH = 4000; // Guess terrain height
    let center = new THREE.Vector3(
      this.offset.x + 0.5 * this.offset.z,
      this.offset.y - 0.5 * this.offset.z,
      this.offset.w * 0.5 * ( minH + maxH )
    );
    // Radius could be calculated more exactly, assume max
    // of width and height and then take 3D diagonal
    let R = Math.max( 0.5 * this.offset.w * ( maxH - minH ), 0.5 * this.offset.z );
    R *= Math.sqrt( 3 );

    let sphere = new THREE.Sphere( center, R );
    this.mesh.geometry.boundingSphere = sphere;
    this.pickerMesh.geometry.boundingSphere = sphere;
    // TODO, annoying we have to clone geom

    return this;
  }

  calculateOffset() {
    const { sceneScale, globalOffset } = GeoprojectStore.getState();
    let scale = Math.pow( 2, 15 - this.z ) * sceneScale;
    this.offset.set(
      this.x * scale + globalOffset.x,
      -this.y * scale + globalOffset.y,
      scale,
      this.id ); // Put id here to avoid another uniform
  }

  // Split into four tiles of next zoom level
  split() {
    let children = tilebelt.getChildren( [ this.x, this.y, this.z ] );
    children = [
      this.init( ...children[ 0 ] ), // Re-use this as first child
      Tile.next( ...children[ 1 ] ), // ...and emit 3 more
      Tile.next( ...children[ 2 ] ),
      Tile.next( ...children[ 3 ] )
    ];

    return children;
  }

  // Grow into parent tile of previous zoom level
  grow() {
    this.init( ...tilebelt.getParent( [ this.x, this.y, this.z ] ) );
    return this;
  }

  // Shifts tile a set number of units at a given zoom level
  // (this.z will remain the same)
  shift( deltaX, deltaY, z ) {
    if ( z > this.z ) {
      console.error( 'Cannot shift at zoom level bigger than this.z' );
    }

    const x = Math.round( this.x + deltaX * Math.pow( 2, this.z - z ) );
    const y = Math.round( this.y + deltaY * Math.pow( 2, this.z - z ) );
    this.init( x, y, this.z );
    return this;
  }

  recycle() {
    tilePool.push( this );
    scene.remove( this.mesh );
    scene.tilepickerScene.remove( this.pickerMesh );
  }

  fetchData() {
    // Don't fetch unless we have drawn this tile to screen
    // This avoids the situation where a tile is split and
    // before we even get to draw it it is split again. In
    // this scenario it is wasteful to download data for
    // a tile that is unneeded.
    // Allow an exception for low-res data, so that there
    // is always something to be drawn
    if ( this.wasSeen || this.z < 8 ) {
      ElevationDatasource.fetchIfNeeded( this.elevationKey );
      ImageryDatasource.fetchIfNeeded( this.imageryKey );

    // Where we are present in scene, but not seen get
    // get lower resolution data (2 tile levels below),
    // so as we pan around we don't have gaps
    } else if ( this.wasRendered && this.z > 10 ) {
      ImageryDatasource.fetchIfNeeded( this.imageryKey.slice( 0, -2 ) );
    // To make sure we always have someting to show, get some very
    // low res data
    } else {
      ImageryDatasource.fetchIfNeeded( this.imageryKey.slice( 0, 5 ) );
      ElevationDatasource.fetchIfNeeded( this.elevationKey.slice( 0, 5 ) );
    }

    this.refreshIndices();
  }

  calculateImageryOffset( bestImagery ) {
    let downsample = bestImagery.quadkey ?
      this.imageryKey.length - bestImagery.quadkey.length : 0;
    let downScale = Math.pow( 2, -downsample );
    let [ x, y ] = bestImagery.quadkey ?
      tilebelt.quadkeyToTile( bestImagery.quadkey ) :
      [ this.x, this.y, this.z ];
    this.imageryUvOffset.set(
      this.x * downScale - x,
      this.y * downScale - y,
      downScale,
      this.imageryIndex ); // Put imagery index here to avoid another uniform
  }

  // Sets uniforms to use best available data
  refreshIndices() {
    let tile = tilebelt.quadkeyToTile( this.imageryKey );
    let key = tilebelt.tileToQuadkey( tile );
    this.elevationIndex = ElevationDatasource.findBestAvailableData( key, true ).index;

    this.bestImagery = ImageryDatasource.findBestAvailableData( this.imageryKey );
    this.imageryIndex = this.bestImagery.index;
    this.calculateImageryOffset( this.bestImagery );
  }

  onSeen() {
    ElevationDatasource.indexPool.tap( this.elevationIndex );
    ImageryDatasource.indexPool.tap( this.imageryIndex );
  }
}

Tile.next = function () {
  if ( tilePool.length > 0 ) {
    return tilePool.splice( 0, 1 )[ 0 ].init( ...arguments );
  } else {
    return new Tile( ...arguments );
  }
};

let segments = 64;
Tile.geometry = [];
while ( segments >= 1 ) {
  let geom = new MapTileGeometry( [ 1, 1 ], segments );
  let bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.setAttribute( 'position',
    new THREE.Float32BufferAttribute( geom.positions, 4 ) );
  Tile.geometry[ segments ] = bufferGeometry;
  segments /= 2;
}

export default Tile;
