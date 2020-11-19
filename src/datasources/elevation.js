/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import AppStore from '/stores/app';
import BaseDatasource from './base';
import { ELEVATION_TILE_SIZE, ELEVATION_POOL_SIZE } from '/constants';

const ElevationDatasource = new BaseDatasource( {
  urlFormat: 'https://www.nasadem.xyz/api/v1/dem/{z}/{x}/{y}.png?key={apiKey}',
  textureSize: ELEVATION_TILE_SIZE,
  poolSize: ELEVATION_POOL_SIZE,
  useFloat: true
} );

AppStore.listen( ( { datasource } ) => {
  if ( datasource.elevation ) {
    ElevationDatasource.apiKey = datasource.elevation.apiKey;
  }
} );

export default ElevationDatasource;
