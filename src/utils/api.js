/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var spacing = 0.05;

var ApiUtils = {
  snap: function ( n ) {
    return Math.round( n / spacing ) * spacing;
  },
  datafileForLocation: function ( lon, lat ) {
    lon = ApiUtils.snap( lon );
    lat = ApiUtils.snap( lat );

    // Calculate NS and EW
    var ns = lat > 0 ? 'N' : 'S';
    var ew = lon > 0 ? 'E' : 'W';
    lon = Math.abs( lon );
    lat = Math.abs( lat );

    // Display same number of decimal places as spacing
    var decimalPlaces = spacing.toPrecision().split( '.' )[ 1 ];
    decimalPlaces = decimalPlaces ? decimalPlaces.length : 0;
    lon = lon.toFixed( decimalPlaces );
    lat = lat.toFixed( decimalPlaces );

    // Construct name of datafile
    return ns + lat + ew + lon;
  }
};

export default ApiUtils;
