/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import dat from 'dat';
import envParams from '/envParams';
import RenderActions from '/actions/render';
var out = {
  gui: null,
  onChange: null,
  initEnv: function () {
    if ( out.envGui ) { return }

    var guiChanged = function () {
      envParams.update();
      RenderActions.needsRender( { env: true } );
      if ( out.onChange ) { out.onChange() }
    };

    var envGui = new dat.GUI();
    out.envGui = envGui;
    envGui.remember( envParams );

    var guiSky = envGui.addFolder( 'Sky' );
    guiSky.add( envParams, 'turbidity', 1.0, 20.0 ).onChange( guiChanged );
    guiSky.add( envParams, 'reileigh', 0.0, 4 ).onChange( guiChanged );
    guiSky.add( envParams, 'mieCoefficient', 0.0, 0.1 ).onChange( guiChanged );
    guiSky.add( envParams, 'mieDirectionalG', 0.0, 1 ).onChange( guiChanged );
    guiSky.add( envParams, 'luminance', 0.0, 2 ).onChange( guiChanged );
    guiSky.add( envParams, 'inclination', 0.4, 1 ).onChange( guiChanged );
    guiSky.add( envParams, 'azimuth', 0, 1 ).onChange( guiChanged );

    var guiFog = envGui.addFolder( 'Fog' );
    guiFog.add( envParams, 'fogDropoff', 0, 0.0001 ).onChange( guiChanged );
    guiFog.add( envParams, 'fogIntensity', 0, 2.5 ).onChange( guiChanged );

    var guiScene = envGui.addFolder( 'Scene' );
    guiScene.add( envParams, 'exposureBias', 0.1, 10 ).onChange( guiChanged );
    guiScene.add( envParams, 'whitePoint', 0.1, 30 ).onChange( guiChanged );
  },
};

// Quick display of GUI
window.letMePlay = function () {
  out.initEnv();
};

export default out;
