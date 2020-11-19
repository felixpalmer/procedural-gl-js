/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import React from 'react';
import bindToVisible from '/utils/bindToVisible';
import CameraStore from '/stores/camera';
import UserActions from '/actions/user';
import UserInterfaceStore from '/stores/userInterface';
var height = 14;
var width = 4;
var padding = 3;
var style = {
  position: 'absolute',
  top: 9, left: 11,
  padding: padding + 'px ' + ( padding + height - width ) + 'px',
  border: '1px solid white',
  borderRadius: 2 * ( height + padding ),
  backgroundColor: '#333542'
};

var b = 'solid ' + width + 'px transparent';
var north = {
  borderBottom: 'solid ' + height + 'px #b33330',
  borderLeft: b, borderRight: b
};
var south = {
  borderTop: 'solid ' + height + 'px #cccccc',
  borderLeft: b, borderRight: b
};
var direction = new THREE.Vector3();
var Compass = React.createClass( {
  getInitialState: function () {
    return {
      azimuth: 0,
      visible: UserInterfaceStore.getState().compassVisible
    };
  },
  componentDidMount: function () {
    CameraStore.listen( this.onStoreChange );
    UserInterfaceStore.listen( bindToVisible( 'compassVisible' ).bind( this ) );
  },
  onStoreChange: function ( storeState ) {
    direction.subVectors( storeState.position, storeState.target );
    var azimuth = 0.5 * Math.PI + Math.atan2( direction.y, direction.x );

    // Round so we don't constantly update with tiny changes
    azimuth = 0.01 * Math.round( azimuth * 100 );
    this.setState( { azimuth: azimuth } );
  },
  shouldComponentUpdate: function ( nextProps, nextState ) {
    return this.state.azimuth !== nextState.azimuth ||
           this.state.visible !== nextState.visible;
  },
  render: function () {
    if ( this.state.visible === false ) { return null; }
    style.transform = 'rotate(' + this.state.azimuth + 'rad) translateZ(0)';
    return (
      <div className='compass'
           style={Object.assign({}, style)}>
        <div style={north}/>
        <div style={south}/>
      </div>
      );
  }
} );

export default Compass;
