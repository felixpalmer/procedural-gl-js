/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import UserActions from '/actions/user';
function FeaturesStore() {
  this.selected = null;

  this.bindListeners( {
    animateAlongFeature: UserActions.animateAlongFeature,
    onFeatureSelected: UserActions.featureSelected
  } );
}


FeaturesStore.prototype.animateAlongFeature = function () {
  this.selected = null;
};

FeaturesStore.prototype.onFeatureSelected = function ( feature ) {
  this.selected = feature;
};

FeaturesStore.displayName = 'FeaturesStore';
export default alt.createStore( FeaturesStore );
