/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import ButtonRow from '/views/buttonRow.jsx';
import UserActions from '/actions/user';
import UserInterfaceStore from '/stores/userInterface';
var zoomButtons = [
  { icon : 'b1 fa fa-minus', action : UserActions.zoomOut },
  { icon : 'b1 fa fa-plus', action : UserActions.zoomIn }
];
var camButtons = [
  { text : '2D',
    action : function () {
      UserActions.setCameraMode( '2D' );
      UserActions.setTerrainEffectContours();
    }
  },
  { text : '3D',
    action : function () {
      UserActions.setCameraMode( '3D' );
      UserActions.setTerrainEffectNone();
    }
  },
];
var rotateButtons = [
  { icon : 'b1 fa fa-rotate-right', action : UserActions.rotateRight },
  { icon : 'b1 fa fa-rotate-left', action : UserActions.rotateLeft }
];

var EngineControlsTop = React.createClass( {
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
    return this.state.cameraModeControlVisible !== nextState.cameraModeControlVisible ||
           this.state.rotationControlVisible !== nextState.rotationControlVisible ||
           this.state.zoomControlVisible !== nextState.zoomControlVisible;
  },
  render: function () {
    var buttons = [];
    if ( this.state.zoomControlVisible ) {
      buttons.push( <ButtonRow className='engine-controls-zoom' buttons={zoomButtons}/> );
    }
    if ( this.state.cameraModeControlVisible ) {
      buttons.push( <ButtonRow className='engine-controls-cam' buttons={camButtons}/> );
    }
    if ( this.state.rotationControlVisible ) {
      buttons.push( <ButtonRow className='engine-controls-rotate' buttons={rotateButtons}/> );
    }
    var style = {
      position: 'absolute',
      top: 6,
      right: 8
    }
    return (
      <div style={style} className='engine-controls'>
        {buttons}
      </div>
    );
  }
} );

export default EngineControlsTop;
