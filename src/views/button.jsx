/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
var defaultStyle = {
  border: '1px solid white',
  margin: 4,
  color: 'white',
  width: 36,
  height: 36,
  lineHeight: '32px',
  textAlign: 'center',
  padding: 0,
  borderRadius: 18,
  backgroundColor: '#333542',
  outline: 'none',
  WebkitTransition: 'background-color 0.5s',
  transition: 'background-color 0.5s',
  cursor: 'pointer',
};
var hoverStyle = {
  backgroundColor: 'rgba(97, 97, 97, 0.5)'
};

var Button = React.createClass( {
  getInitialState: function () { return { hover: false }; },
  mouseOver: function () { this.setState( { hover: true } ); },
  mouseOut: function () { this.setState( { hover: false } ); },
  render: function () {
    var style = Object.assign( {},
      defaultStyle, 
      this.state.hover ? hoverStyle : undefined,
      this.props.style
    );
    return (
      <button className={this.props.icon} 
              onClick={this.props.action}
              onMouseOver={this.mouseOver}
              onMouseOut={this.mouseOut}
              style={style}>{this.props.text}</button>
    );
  }
} );

export default Button;
