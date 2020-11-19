/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import ContainerStore from '/stores/container';
import ErrorStore from '/stores/error';
import renderer from '/renderer';
import RenderActions from '/actions/render';
var container = ContainerStore.getState().element;
var Engine = React.createClass( {
  componentDidMount: function () {
    var domNode = this.base || this.getDOMNode();
    domNode.appendChild( container );
    container.appendChild( renderer.domElement );
    setTimeout( function () { RenderActions.containerMounted(); }, 0 );
    ErrorStore.listen( this.onError );
    this.setState( this.getInitialState() );
  },
  getInitialState: function () {
    return { error: ErrorStore.getState().message }
  },
  onError: function ( state ) {
    if ( state.displayErrors ) {
      this.setState( { error: state.message } );
    }
  },
  render: function () {
    var style = {
      width: '100%',
      height: '100%',
      touchAction: 'none'
    }
    if ( this.state.error ) {
      var errorContainerStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 10,
        background: 'black',
      };
      var errorStyle = {
        padding: 10,
        textAlign: 'center'
      };
      return (
        <div style={style}>
          <div style={errorContainerStyle}>
            <h2 style={errorStyle}>Error</h2>
            <p style={errorStyle}>{this.state.error}</p>
          </div>
        </div>
      );
    }
    return <div style={style}/>;
  }
} );

export default Engine;
