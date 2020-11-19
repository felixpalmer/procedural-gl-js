/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import LinesBase from '/linesBase';
import material from '/material';
import picker from '/picker';
import LineData from '/data/line';
import RenderActions from '/actions/render';
var Lines = function () {
  LinesBase.call( this );

  LineData.listen( this.onNewData.bind( this ) );
  picker.pickerScene.add( this );

  this.material = material.line;
  this.name = 'lines';
  RenderActions.renderedFeatureRegister( this.name );

  this.constantWidth = true;
};

Lines.prototype = Object.create( LinesBase.prototype );

export default new Lines();
