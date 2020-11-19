/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import FeaturesStore from '/stores/features';

// Tag is used to identify the hovered over feature
const tagUniforms = {
  uSelectedTag: { type: 'c', value: new THREE.Color() }
};

FeaturesStore.listen( ( { selected } ) => {
  var id = selected && selected.tag ? selected.tag : 65536;
  tagUniforms.selectedTag.value.set( id );
} );

export default tagUniforms;
