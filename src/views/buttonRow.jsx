/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import Button from '/views/button.jsx';
import UserActions from '/actions/user';
var ButtonRow = React.createClass( {
  render: function () {
    var buttons = this.props.buttons.map( function ( b ) {
      return <Button action={b.action} icon={b.icon} text={b.text}/>
    } );

    return <div>{buttons}</div>
  }
} );

export default ButtonRow;
