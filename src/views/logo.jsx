/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import logoStyle from '/views/logoStyle.css';
var Logo = React.createClass( {
  render: function () {
    var style = {};
    if ( this.props.color ) {
      style.background = this.props.color;
    }
    return (
      <div id="logo-container">
        <div className="square square-1" style={style}></div>
        <div className="square square-2" style={style}></div>
        <div className="square square-3" style={style}></div>
        <div className="square square-4" style={style}></div>
        <style>{logoStyle}</style>
      </div>
    );
  }
} );

export default Logo;
