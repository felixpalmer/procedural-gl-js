/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import ButtonRow from '/views/buttonRow.jsx';
import CurrentLocationActions from '/actions/currentLocation';
import UserInterfaceStore from '/stores/userInterface';

// Listen for geolocation
var userLocation = null;
var registered = false;
if ( 'geolocation' in navigator ) {
  var toggleTracking = function () {
    if ( !registered ) {
      navigator.geolocation.watchPosition( CurrentLocationActions.panToPosition );
      registered = true;
    }

    CurrentLocationActions.toggleTracking();
  }
  userLocation = {
    icon : 'b1 fa fa-location-arrow',
    action : toggleTracking
  }
}

var EngineControlsBottom = React.createClass( {
  getInitialState: function () {
    return UserInterfaceStore.getState();
  },
  componentDidMount: function () {
    UserInterfaceStore.listen( this.onStoreChange );
    this.setState( this.getInitialState() );
  },
  onStoreChange: function ( storeState ) {
    this.setState( storeState );
  },
  shouldComponentUpdate: function ( nextProps, nextState ) {
    return this.state.userLocationControlVisible !== nextState.userLocationControlVisible;
  },
  render: function () {
    var buttons = [];
    if ( this.state.userLocationControlVisible ) {
      buttons.push( <ButtonRow className='engine-controls-user-location' buttons={[userLocation]}/> );
    }
    var style = {
      position: 'absolute',
      top: 'initial',
      bottom: 15,
      right: 8
    }
    return (
      <div style={style} className='engine-controls bottom'>
        {buttons}
      </div>
    );
  }
} );

export default EngineControlsBottom;
