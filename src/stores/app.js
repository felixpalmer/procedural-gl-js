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
function AppStore() {
  this.appContainer = null;
  this.datasource = {};
  this.fatalError = false;
  this.initialized = false;
  this.resourceUrl = null;
  this.bindListeners( {
    configureElevationDatasource: ConfigActions.configureElevationDatasource,
    configureImageryDatasource: ConfigActions.configureImageryDatasource,
    setAppContainer: ConfigActions.setAppContainer,
    setFatalError: RenderActions.fatalError,
    setResourceUrl: ConfigActions.setResourceUrl
  } );
}

AppStore.prototype.checkInitialized = function () {
  this.initialized = ( this.appContainer !== null ) &&
                     ( this.resourceUrl !== null );
};

AppStore.prototype.configureElevationDatasource = function ( elevation ) {
  this.datasource.elevation = elevation;
};

AppStore.prototype.configureImageryDatasource = function ( imagery ) {
  this.datasource.imagery = imagery;
};

AppStore.prototype.setFatalError = function () {
  this.fatalError = true;
};

AppStore.prototype.setAppContainer = function ( container ) {
  this.appContainer = container;
  this.checkInitialized();
};

AppStore.prototype.setResourceUrl = function ( url ) {
  this.resourceUrl = url;
  this.checkInitialized();
};

AppStore.displayName = 'AppStore';
export default alt.createStore( AppStore );
