/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import AppStore from '/stores/app';
import BaseDatasource from './base';
import { IMAGERY_TILE_SIZE, IMAGERY_POOL_SIZE } from '/constants';

const ImageryDatasource = new BaseDatasource( {
  textureSize: IMAGERY_TILE_SIZE,
  poolSize: IMAGERY_POOL_SIZE
} );

AppStore.listen( ( { datasource } ) => {
  if ( datasource.imagery ) {
    ImageryDatasource.apiKey = datasource.imagery.apiKey;
    ImageryDatasource.urlFormat = datasource.imagery.urlFormat;
  }
} );

export default ImageryDatasource;
