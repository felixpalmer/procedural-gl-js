/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import logo from '/logo.svg';
var PoweredBy = React.createClass( {
  render: function () {
    var containerStyle = {
      position : 'absolute',
      padding : '11px 8px',
      bottom : 0,
      opacity : 0.9,
      WebkitTouchCallout : 'none',
      WebkitUserSelect : 'none',
      KhtmlUserSelect : 'none',
      MozUserSelect : 'none',
      MsUserSelect : 'none',
      userSelect : 'none'
    };
    var logoStyle = {
      backgroundImage: logo,
      backgroundRepeat: 'no-repeat',
      display: 'block',
      height: 40,
      width: 40
    };
    var link = 'https://github.com/felixpalmer/procedural-gl-js';
    return (
      <div className='powered-by' style={containerStyle}>
        <a href={link} target='_blank' style={logoStyle}></a>
      </div>
      );
  }
} );

export default PoweredBy;
