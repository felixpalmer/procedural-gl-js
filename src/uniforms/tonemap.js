/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import Tonemap from '/utils/tonemap';
var tonemapUniforms = {
  exposureBias: { type: 'f', value: 1 },
  whitePoint: { type: 'f', value: 11.2 },

  // Calculate the white scale from the white point
  uTonemapExposureBias: { type: 'f', value: 1 },
  uTonemapWhiteScale: { type: 'f', value: 1 },
  update: function () {
    tonemapUniforms.uTonemapExposureBias.value =
      tonemapUniforms.exposureBias.value;
    tonemapUniforms.uTonemapWhiteScale.value =
      1.0 / Tonemap( tonemapUniforms.whitePoint.value );
  }
};

export default tonemapUniforms;
