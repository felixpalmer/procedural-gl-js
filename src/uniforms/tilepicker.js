/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';

const tilepickerUniforms = {
  // Combine center pixel location (xy) and uv downscaling (z) into one
  // Update happens in tilepicker.js
  uScaling: { value: new THREE.Vector3() }
};

export default tilepickerUniforms;
