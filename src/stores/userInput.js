/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import alt from '/alt';
import CurrentLocationActions from '/actions/currentLocation';
import UserActions from '/actions/user';
// Special store to trigger on any user input
// Primarily used for cancelling transitions (see `utils/store`)
function UserInputStore() {
  this.clock = new THREE.Clock();
  this.lastInput = this.clock.getElapsedTime();
  this.interacting = false;

  // Any action in this list will cause a running transition be cancelled
  this.bindListeners( {
    onInput: [
      CurrentLocationActions.toggleTracking,
      UserActions.animateAlongFeature,
      UserActions.doubleTapZoom,
      UserActions.focusOnFeature,
      UserActions.focusOnLocation,
      UserActions.focusOnTarget,
      UserActions.inputStarted,
      UserActions.inputEnded,
      UserActions.rotateLeft,
      UserActions.rotateRight,
      UserActions.featureClicked,
      UserActions.setCurrentPlace,
      UserActions.startFlyover,
      UserActions.zoomIn,
      UserActions.zoomOut
    ],
    inputStarted: UserActions.inputStarted,
    inputEnded: UserActions.inputEnded
  } );
}

UserInputStore.prototype.onInput = function () {
  this.lastInput = this.clock.getElapsedTime();
};

UserInputStore.prototype.inputStarted = function () {
  this.interacting = true;
};

UserInputStore.prototype.inputEnded = function () {
  this.interacting = false;
  this.onInput();
};

UserInputStore.displayName = 'UserInputStore';
export default alt.createStore( UserInputStore );
