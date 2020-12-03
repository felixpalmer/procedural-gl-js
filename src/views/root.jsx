/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import app from '/app';
import AppStore from '/stores/app';
import Compass from '/views/compass.jsx';
import ConfigActions from '/actions/config';
import Container from '/views/container.jsx';
import Credits from '/views/credits.jsx';
import Engine from '/views/engine.jsx';
import EngineControlsBottom from '/views/engineControlsBottom.jsx';
import EngineControlsTop from '/views/engineControlsTop.jsx';
import EnvironmentStore from '/stores/environment';
import PoweredBy from '/views/poweredBy.jsx';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

// Root React component
var App = React.createClass( {
  render: function () {
    return (
      <Container>
        <Engine/>
        <Credits/>
        <EngineControlsTop/>
        <EngineControlsBottom/>
        <Compass/>
        <PoweredBy/>
      </Container>
    );
  }
} );

var renderApp = function ( state ) {
  if ( state.appContainer ) {
    React.render( <App/>, state.appContainer );
  }
};
AppStore.listen( renderApp );

ConfigActions.configureCamera( {
  minDistance: 500,
  minHeight: 250,
  zoomInDuration: 0.8,
  zoomOutDuration: 1
} );

app.init();
