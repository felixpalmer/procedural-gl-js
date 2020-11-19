/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import alt from '/alt';
import proj4 from 'proj4';
import geoproject from '/geoproject';
import UserActions from '/actions/user';
import ApiUtils from '/utils/api';

// Configure useful projections
// Use http://spatialreference.org/ref/epsg/24817/proj4js/ to look up
// proj4.js was built using: node_modules/.bin/grunt build:laea,ortho
proj4.defs( [
  [ 'EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs' ],
] );

function GeoprojectStore() {
  this.projection = null;
  this.location = null;
  this.globalOffset = new THREE.Vector2();
  this.sceneScale = 1;

  this.bindListeners( {
    setCurrentPlace: UserActions.setCurrentPlace
  } );

  this.exportPublicMethods( {
    positionToTileFraction: this.positionToTileFraction.bind( this ),
  } );
}

GeoprojectStore.prototype.setCurrentPlace = function ( place ) {
  this.location = place.location;
  this.projection = 'EPSG:3857';

  // Setup projectors
  const lon = ApiUtils.snap( this.location[ 0 ] );
  const lat = ApiUtils.snap( this.location[ 1 ] );
  geoproject.projector = proj4( this.projection );
  geoproject.center = geoproject.project( [ lon, lat ], true );

  // For testing new data create temporary projector for 3035
  // TODO remove this once we don't use 3035 data
  geoproject.projector3035 = proj4( 'EPSG:3035' );
  var projected3035 = geoproject.projector3035.forward( [ lon, lat ] );
  geoproject.center3035 = { x: projected3035[ 0 ], y: projected3035[ 1 ] };

  // To make the heights match the projection, we need to obtain the
  // scene scale
  this.sceneScale = geoproject.calculateSceneScale( lon, lat );

  // Re-center our THREE Scene coordinate system such that it is 0, 0
  // at the location of the place
  this.globalOffset = geoproject.calculateGlobalOffset( lon, lat );
};

GeoprojectStore.prototype.positionToTileFraction = function ( position, z ) {
  const p = position.clone();
  p.x -= this.globalOffset.x;
  p.y += this.globalOffset.y;
  p.divideScalar( this.sceneScale * Math.pow( 2, 15 - z ) );
  return [ p.x, p.y, z ];
};

GeoprojectStore.displayName = 'GeoprojectStore';
export default alt.createStore( GeoprojectStore );
