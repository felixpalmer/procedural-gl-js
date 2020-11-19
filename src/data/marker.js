/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import _ from 'lodash';
import GeodataActions from '/actions/geodata';
import OverlayAdapter from '/adapters/overlay';
import picker from '/picker';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';
function MarkerData() {
  this.data = [];
  this.haveFonts = false;
  this.isUpdate = false;

  this.bindListeners( {
    clearFeatures: UserActions.setCurrentPlace,
    fontsLoaded: RenderActions.fontsLoaded,
    addOverlay: [
      GeodataActions.addBuiltinOverlay,
      GeodataActions.addOverlay,
      GeodataActions.setFeatures,
      GeodataActions.removeOverlay
    ],
    updateOverlay: GeodataActions.updateOverlay
  } );
}

MarkerData.prototype.clearFeatures = function () {
  this.data = [];
  return true;
};

MarkerData.prototype.isReady = function () {
  return this.haveFonts;
};

MarkerData.prototype.fontsLoaded = function () {
  // Markers need fonts to be drawn to wait for them to arrive
  this.haveFonts = true;
  return this.isReady();
};

MarkerData.prototype.addOverlay = function () {
  this.waitFor( OverlayAdapter );
  var markers = OverlayAdapter.getState().markers;
  if ( _.isEqual( this.data, markers ) ) {
    // Do not broadcast if data is unchanged
    return false;
  }

  this.data = markers.concat();
  picker.registerStore( this );
  this.isUpdate = false;
  return this.isReady();
};

MarkerData.prototype.updateOverlay = function () {
  this.waitFor( OverlayAdapter );
  var markers = OverlayAdapter.getState().markers;
  this.data = markers.concat();
  this.isUpdate = true;
  return this.isReady();
};

MarkerData.displayName = 'MarkerData';

export default alt.createStore( MarkerData );
