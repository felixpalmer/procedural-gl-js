/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import alt from '/alt';
import AnimationStore from '/stores/animation';
import CurrentLocationActions from '/actions/currentLocation';
import GeodataActions from '/actions/geodata';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';
// Store used to synchronize rendering events, from 3D engine to label overlays
// To request a render, use the RenderActions.needsRender action
function RenderStore() {
  this.needsRender = false;
  this.animating = false;
  this.env = false;
  this.clock = new THREE.Clock();

  this.bindListeners( {
    scheduleRender: [
      CurrentLocationActions.panToPosition,
      CurrentLocationActions.setPosition,
      GeodataActions.addBuiltinOverlay,
      GeodataActions.addOverlay,
      GeodataActions.setFeatures,
      GeodataActions.setImageryBig,
      RenderActions.containerMounted,
      RenderActions.containerResized,
      RenderActions.needsRender,
      RenderActions.setHD,
      UserActions.featureSelected,
      UserActions.focusOnLocation,
      UserActions.inputEnded,
      UserActions.setCameraMode,
      UserActions.setCamera,
      UserActions.setCameraTarget,
      UserActions.setCameraPosition,
      UserActions.setTerrainEffectContours,
      UserActions.setTerrainEffectFlats,
      UserActions.setTerrainEffectGrade,
      UserActions.setTerrainEffectHeight,
      UserActions.setTerrainEffectNone
    ],
    scheduleRenderAnimated: GeodataActions.updateOverlay
  } );

  AnimationStore.listen( this.tick.bind( this ) );
}

// Do not immediately trigger a render, rely on AnimationStore to fire
RenderStore.prototype.scheduleRender = function ( options ) {
  if ( options ) {
    if ( options.animating ) { this.animating = true }

    if ( options.env ) { this.env = true }
  }

  this.needsRender = true;
  return false;
};

RenderStore.prototype.scheduleRenderAnimated = function () {
  return this.scheduleRender( { animating: true } );
};

console.warn( 'Need to fix controls&render loop' );

// To avoid renders piling up emit changes syncronized by AnimationStore
RenderStore.prototype.tick = function () {
  if ( this.needsRender ) {
    this.clock.getElapsedTime();
    this.emitChange();
  }

  // Temporarily enable renderering at all time to make controls work
  //this.needsRender = false;
  this.animating = false;
  this.env = false;
};

RenderStore.displayName = 'RenderStore';
export default alt.createStore( RenderStore );
