/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import AppStore from '/stores/app';
import uiFont from '/utils/uiFont';
const style = {
  position : 'absolute',
  bottom : 0, right: 0,
  paddingTop: 1, paddingBottom: 1, paddingLeft: 4, paddingRight: 4,
  fontFamily : uiFont,
  textAlign : 'right',
  textTransform : 'none',
  color : 'white',
  background: 'rgba( 255, 255, 255, 0.1 )'
};
const pStyle = { color: 'white', fontSize : '6pt', margin: 0 };
const BASE_CREDIT = [
  '&copy;<a href="https://www.nasadem.xyz">nasadem.XYZ</a>'
];

const Credits = React.createClass( {
  getInitialState: () => AppStore.getState().datasource,
  componentDidMount: function () {
    AppStore.listen( this.onStoreChange );
    this.onStoreChange( AppStore.getState() );
  },
  onStoreChange: function ( { datasource } ) {
    this.setState( datasource );
  },
  render: function () {
    let credits = [...BASE_CREDIT];
    if ( this.state.imagery ) {
      credits.push( this.state.imagery.attribution );
    }

    // Inject link styles
    let aStyle = `color: ${pStyle.color}; font-size: ${pStyle.fontSize}; margin: ${pStyle.margin}; text-decoration: underline;`;
    credits = credits.map( credit =>
      credit.replace( /<a href=/g, '<a ' + 'style="' + aStyle + '" href=' )
    );

    return (
      <div className='credits' style={style}>
        <p style={pStyle}>Data: { credits.map( credit =>
          <>
            <span dangerouslySetInnerHTML={{ __html: credit }}/>
            <span> </span>
          </> ) }
        </p>
      </div>
    );
  }
} );

export default Credits;
