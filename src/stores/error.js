/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import ConfigActions from '/actions/config';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';
function ErrorStore() {
  this.message = null;
  this.displayErrors = true;
  this.bindListeners( {
    clearError: UserActions.setCurrentPlace,
    fatalError: RenderActions.fatalError,
    setDisplayErrors: ConfigActions.setDisplayErrors
  } );
}

ErrorStore.prototype.clearError = function () {
  this.message = null;
};

ErrorStore.prototype.fatalError = function ( message ) {
  this.message = message;
};

ErrorStore.prototype.setDisplayErrors = function ( value ) {
  this.displayErrors = value;
};

ErrorStore.displayName = 'ErrorStore';
export default alt.createStore( ErrorStore );
