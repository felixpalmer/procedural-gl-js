/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import alt from '/alt';
import GeodataActions from '/actions/geodata';
import OverlayAdapter from '/adapters/overlay';
import picker from '/picker';
import UserActions from '/actions/user';
// Data for showing lines, inside 3D world
function LineData() {
  this.data = {};

  this.bindListeners( {
    clearFeatures: UserActions.setCurrentPlace,
    addOverlay: [ GeodataActions.addOverlay, GeodataActions.removeOverlay ]
  } );
}

LineData.prototype.clearFeatures = function () {
  this.data = [];
  return false;
};

LineData.prototype.addOverlay = function () {
  this.waitFor( OverlayAdapter );
  var lines = OverlayAdapter.getState().lines;
  if ( _.isEqual( this.data, lines ) ) {
    // Do not broadcast if data is unchanged
    return false;
  }

  this.data = lines.concat();
  picker.registerStore( this );
};

LineData.displayName = 'LineData';

export default alt.createStore( LineData );
