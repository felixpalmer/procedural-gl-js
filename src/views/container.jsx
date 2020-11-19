/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
// So we can inline the styles wrapping the engine, use this simple
// component, to wrap other parts of app
var Container = React.createClass( {
  render: function () {
    var outerStyle = {
      position: 'relative',
      height: '100%',
      overflow: 'hidden'
    };
    var innerStyle = {
      fontSize: '14px',
      color: '#fff',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    return (
      <div style={outerStyle}>
        <div id='container' style={innerStyle}>
          {this.props.children}
        </div>
      </div>
    );
  }
} );

export default Container;
