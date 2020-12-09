/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import tilebelt from '@mapbox/tilebelt';

import MapTile from '/mapTile';
import renderer from '/renderer';
import scene from '/scene';
import tilepicker from '/tilepicker';

import ImageryDatasource from '/datasources/imagery';
import ElevationDatasource from '/datasources/elevation';

import camera from '/camera';
import CameraStore from '/stores/camera';
import GeoprojectStore from '/stores/geoproject';
import log from '/log';
import PlacesStore from '/stores/places';
import RenderStore from '/stores/render';
import ApiUtils from '/utils/api';

let x, y, z;
const baseZ = 5;
const tileDelta = new THREE.Vector2();
let shiftThreshold = Infinity;
PlacesStore.listen( ( { currentPlace } ) => {
  [ x, y, z ] = tilebelt.pointToTileFraction(
    ApiUtils.snap( currentPlace.location[ 0 ] ),
    ApiUtils.snap( currentPlace.location[ 1 ] ),
    baseZ );
  const W = GeoprojectStore.getState().sceneScale;
  shiftThreshold = 0.6 * W * Math.pow( 2, 15 - baseZ );
  x = Math.floor( x ); y = Math.floor( y );

  // TODO don't create scene everytime location changes
  createScene();
} );

let tiles = [];

let framerate, readTime, scanTime, updateTime, tileCount;
if ( __dev__ ) {
  class Stat {
    constructor( name, unit, samples ) {
      this.name = name;
      this.unit = unit === undefined ? 'ms' : unit;
      let info = document.getElementById( 'debug-info' );
      if ( !info ) {
        info = document.createElement( 'div' );
        info.id = 'debug-info';
        info.style = 'position: absolute; bottom: 0; padding: 10px; pointer-events: none;';
        document.body.appendChild( info );
      }

      this.element = document.createElement( 'div' );
      if ( window.location.protocol === 'http:' ) {
        info.appendChild( this.element );
      }

      this.values = ( new Array( samples || 100 ) ).fill( 0 );
    }

    add( v ) {
      this.values.unshift( v ); this.values.pop();
      let average = this.values.reduce( ( a, b ) => a + b ) / this.values.length;
      average = Math.round( 100 * average ) / 100;
      let max = Math.round( Math.max( ...this.values ) );
      if ( this.inverse ) { average = Math.round( 1000 / average ) }

      this.element.innerHTML = `${this.name}: ${average}${this.unit} (max: ${max})`;
    }

    start() {
      this.startTime = performance.now();
    }

    stop() {
      this.add( performance.now() - this.startTime );
    }
  }

  framerate = new Stat( 'FPS', '', 60 );
  framerate.inverse = true;
  readTime = new Stat( 'readTime' );
  scanTime = new Stat( 'scanTime' );
  updateTime = new Stat( 'updateTime' );
  tileCount = new Stat( 'tiles', '', 10 );
}

let framesSinceSeen = {};
let frame = 0;
let projectedDistance = null;

let debugClick = null;
if ( __dev__ ) {
  window.addEventListener( 'mousedown', e => {
    if ( e.altKey ) {
      const rect = e.target.getBoundingClientRect();
      debugClick = {
        x: ( e.clientX - rect.x ) / rect.width,
        y: ( e.clientY - rect.y ) / rect.height
      };
    }
  }, false );
}

// At start want to cut up terrain as quickly as possible
let pipelinePicker = false;
let projectionMatrix;

__dev__ && framerate.start();
function draw() {
  if ( tiles.length === 0 ) { return }

  __dev__ && framerate.stop();
  __dev__ && framerate.start();
  frame++;

  let tilesSeen = new Set(); // All tiles we see
  let toSplit = new Set(); // Tiles whose detail is too low
  let toCombine = new Set(); // Tiles whose detail is too high
  let toCombineGroups = {};

  // Picker render staggered over frames
  // Render, wait, read, process
  // The biggest issue appears to be the pipeline stalling if we try to
  // read too early after rendering. Once this is fixed then splitting
  // the read up doesn't seem to offer benefits.
  let sliceN = 1; // Number of slices to split picker read into
  let waitFrames = 4; // How many frames to wait between render and read
  let skipFrames = 1; // How many frames to skip between reads (2 means skip 1 frame, 3 = skip 2 etc)
  const N = 1 + waitFrames + skipFrames * sliceN + 1;
  let frameN = frame % N;
  let doPickerRender = frameN === 0;
  // Read out results at a later frame (pipelining)
  let doPickerRead = ( frameN - 1 - waitFrames ) % skipFrames === 0 &&
    frameN > waitFrames && frameN < 1 + waitFrames + skipFrames * sliceN;
  let doPickerProcess = frameN === ( N - 1 );

  if ( !pipelinePicker ) {
    doPickerRender = true;
    doPickerRead = true;
    doPickerProcess = true;
    sliceN = 1;
  }

  if ( doPickerRender ) {
    __dev__ && performance.mark( 'Render-start' );
    renderer.setRenderTarget( tilepicker.target );
    renderer.clear( true, true, true );
    renderer.render( scene.tilepickerScene, camera );

    // Get matrix at point of render so it matches what
    // is in the render target
    projectionMatrix = camera.projectionMatrix.elements;
    __dev__ && performance.mark( 'Render-end' );
    __dev__ && performance.measure( 'Render', 'Render-start', 'Render-end' );
  }

  if ( doPickerRead ) {
    __dev__ && performance.mark( 'Read-start' );
    __dev__ && readTime.start();

    // Grab pixels
    let slice = pipelinePicker ? ( frameN - 1 - waitFrames ) / skipFrames : 0;
    let bytesPerSlice = 4 * tilepicker.target.width * tilepicker.target.height / sliceN;
    let view = new Uint8Array( tilepicker.data.buffer,
      slice * bytesPerSlice, bytesPerSlice );
    renderer.readRenderTargetPixels( tilepicker.target,
      0, slice * tilepicker.target.height / sliceN,
      tilepicker.target.width, tilepicker.target.height / sliceN,
      view );
    renderer.setRenderTarget( null );
    __dev__ && readTime.stop();
    __dev__ && performance.mark( 'Read-end' );
    __dev__ && performance.measure( 'Read', 'Read-start', 'Read-end' );
  }

  if ( doPickerProcess ) {
    __dev__ && performance.mark( 'Process-start' );
    __dev__ && scanTime.start();
    let pickedTile, terrainError;

    // Get center pixel and extract distance
    let p = 2 * ( tilepicker.target.width + tilepicker.target.width * tilepicker.target.height );
    p = Math.round( p );
    let fragZ = 256 * tilepicker.data[ p + 2 ] + tilepicker.data[ p + 3 ];
    fragZ /= 256.0 * 255.0;
    projectedDistance = projectionMatrix[ 14 ] / ( 2 * fragZ - 1.0 + projectionMatrix[ 10 ] );
    CameraStore.getState().controls.setDistanceToTarget( projectedDistance );

    // Debug tile
    if ( __dev__ && debugClick ) {
      let pixel = {};
      pixel.x = Math.round( debugClick.x * tilepicker.target.width );
      pixel.y = Math.round( ( 1 - debugClick.y ) * tilepicker.target.height );
      let p = 4 * ( pixel.x + tilepicker.target.width * pixel.y );
      pickedTile = 256 * tilepicker.data[ p ] + tilepicker.data[ p + 1 ];
      terrainError = ( tilepicker.data[ p + 3 ] / 255 ); // range 0-1
      terrainError = 10 * terrainError - 5; // re-bias to -5 > 5
      let tile = tiles.find( x => x.id === pickedTile );
      if ( tile ) {
        log( `[${tile.x},${tile.y},${tile.z}] (${tile.imageryKey})`, terrainError, `${tile.bestImagery.quadkey}(${tile.bestImagery.downsample})` );
        window.debugTile = tile;
      }

      debugClick = null;
    }

    let pl = tilepicker.data.length;
    for ( p = 0; p < pl; p += 4 ) {
      pickedTile = 256 * tilepicker.data[ p ] + tilepicker.data[ p + 1 ];
      terrainError = ( tilepicker.data[ p + 3 ] / 255 ); // range 0-1
      terrainError = 10 * terrainError - 5; // re-bias to -5 > 5

      if ( pickedTile === 0 ) {
        // Missed tile, ignore
        continue;
      }

      // Debug, check tile exists!
      let tile = tiles.find( x => x.id === pickedTile );
      if ( tile === undefined ) { continue }

      // terrainError of 0 is 1:1 pixel:texel
      if ( terrainError < ( window.minError || -1.5 ) && tile.z < 18 ) {
        toSplit.add( tile );
        tilesSeen.add( tile );
      } else if ( terrainError > ( window.maxError || 0 ) && tile.z > 7 ) {
        toCombine.add( tile );
      } else {
        tilesSeen.add( tile );
      }
    }

    __dev__ && scanTime.stop();

    // Keep track of which tiles we don't see
    __dev__ && updateTime.start();
    tiles.forEach( tile => {
      if ( framesSinceSeen[ tile.imageryKey ] === undefined ) {
        framesSinceSeen[ tile.imageryKey ] = 0;
      }

      if ( tilesSeen.has( tile ) ) {
        framesSinceSeen[ tile.imageryKey ] = 0;
      } else {
        let frames = framesSinceSeen[ tile.imageryKey ]++;
        if ( frames > 5 ) { toCombine.add( tile ) }
      }
    } );

    // Remove any common tiles to reduce flicker
    let commonTiles = new Set( [ ...toCombine ].filter( x => toSplit.has( x ) ) );
    // Don't combine tiles that hae been marked as normally visible,
    // as if we combine them they will split again right away
    toCombine = new Set( [ ...toCombine ].filter( x =>
      !commonTiles.has( x ) && !tilesSeen.has( x ) ) );
    // Equally it doesn't make sense to split a tile that is also
    // marked to be combined
    toSplit = new Set( [ ...toSplit ].filter( x => !commonTiles.has( x ) ) );

    // Mark tiles which have been seen & rendered
    [ ...tilesSeen ].filter( x => !toSplit.has( x ) )
      .forEach( tile => tile.wasSeen = true );
    [ ...tiles ].filter( x => !toSplit.has( x ) )
      .forEach( tile => tile.wasRendered = true );

    // Group combine tiles
    toCombine.forEach( tile => {
      let parentKey = tile.imageryKey.slice( 0, -1 );
      if ( toCombineGroups[ parentKey ] === undefined ) {
        toCombineGroups[ parentKey ] = new Set( [ tile ] );
      } else {
        toCombineGroups[ parentKey ].add( tile );
      }
    } );

    // Split tile by modifying it to become the first child and
    // then adding the new 3 tiles
    toSplit.forEach( tile => {
      if ( window.noSplit ) return;
      let newTiles = tile.split();
      newTiles.forEach( t => t.fetchData() );
      tiles.push( ...newTiles.splice( 1, 3 ) );
    } );

    // We've reached the right size, so start more efficient
    // pipelining of picker routine
    if ( toSplit.size === 0 ) { pipelinePicker = true }

    // Combine tiles by modifying the first tile in group
    // to become parent, and recycling the others
    Object.values( toCombineGroups ).forEach( group => {
      if ( group.size !== 4 ) { return }

      let array = [ ...group ];
      let tile0 = array[ 0 ];
      let tiles1to3 = array.splice( 1, 3 );

      delete framesSinceSeen[ tile0.imageryKey ];
      tile0.grow().fetchData();

      tiles1to3.forEach( tile => {
        let i = tiles.indexOf( tile );
        tiles.splice( i, 1 );
        delete framesSinceSeen[ tile.imageryKey ];
        tile.recycle();
      } );
    } );

    // When tiles get too far from the camera, shift them around
    // to fill the terrain where it ends. This way we give the
    // illusion that the landscape is infinite
    const target = CameraStore.getState().target;
    tiles.forEach( tile => {
      tileDelta.copy( tile.mesh.geometry.boundingSphere.center );
      tileDelta.sub( target );
      const deltaX = Math.abs( tileDelta.x ) > shiftThreshold ?
        -Math.sign( tileDelta.x ) : 0;
      const deltaY = Math.abs( tileDelta.y ) > shiftThreshold ?
        Math.sign( tileDelta.y ) : 0;
      if ( deltaX || deltaY ) {
        tile.shift( deltaX, deltaY, baseZ );
        tile.fetchData();
      }
    } );

    // Finally check if any tiles are low-res and need better data
    tiles.filter( t => t.bestImagery.downsample > 0 )
      .forEach( t => t.fetchData() );

    // Notify tiles that they are being seen
    tiles.forEach( tile => {
      if ( framesSinceSeen[ tile.imageryKey ] < 10 ) {
        tile.onSeen();
      }
    } );
    __dev__ && updateTime.stop();
    __dev__ && performance.mark( 'Process-end' );
    __dev__ && performance.measure( 'Process', 'Process-start', 'Process-end' );
  }

  // Update tiles if we have imagery changes
  if ( ImageryDatasource.hasUpdates ) {
    ImageryDatasource.broadcastUpdate();
  }

  if ( ElevationDatasource.hasUpdates ) {
    ElevationDatasource.broadcastUpdate();
  }

  __dev__ && tileCount.add( tiles.length );
}

function createScene() {
  tiles.forEach( ( tile ) => tile.recycle() );
  tiles = [];
  tiles.push( MapTile.next( x, y, z ) );
  let newTiles = tiles[ 0 ].split();
  tiles.push( ...newTiles.splice( 1, 3 ) );
  tiles.forEach( tile => tile.fetchData() );
}

RenderStore.listen( draw );
