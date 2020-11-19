/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import log from '/log';
var FeatureUtils = {
  // TODO perhaps better to inline these, as we're parsing a lot of data???
  isLineString: function ( feature ) {
    return feature.geometry.type === 'LineString';
  },
  isPolygon: function ( feature ) {
    return feature.geometry.type === 'Polygon';
  },
  isMultiPolygon: function ( feature ) {
    return feature.geometry.type === 'MultiPolygon';
  },
  isPoint: function ( feature ) {
    return feature.geometry.type === 'Point';
  },
  tagValue: function ( feature, tag ) {
    if ( !feature.properties.tags ) { return null }

    return feature.properties.tags[ tag ];
  },
  hasTag: function ( feature, tag ) {
    return !!FeatureUtils.tagValue( feature, tag );
  },
  isPiste: function ( feature ) {
    return FeatureUtils.isLineString( feature ) && FeatureUtils.hasTag( feature, 'piste:type' );
  },
  isAerial: function ( feature ) {
    return FeatureUtils.isLineString( feature ) && FeatureUtils.hasTag( feature, 'aerialway' );
  },
  isHighway: function ( feature ) {
    return FeatureUtils.isLineString( feature ) && FeatureUtils.hasTag( feature, 'highway' );
  },
  isTrack: function ( feature ) {
    if ( !FeatureUtils.isLineString( feature ) ) { return false }

    var highway = FeatureUtils.tagValue( feature, 'highway' );
    return ( highway === 'track' ||
               highway === 'footway' ||
               highway === 'path' ||
               highway === 'cycleway' ||
               highway === 'bridleway' );
  },
  isRiver: function ( feature ) {
    return FeatureUtils.isLineString( feature ) && FeatureUtils.hasTag( feature, 'waterway' );
  },
  isBuilding: function ( feature ) {
    return FeatureUtils.isPolygon( feature ) && FeatureUtils.hasTag( feature, 'building' );
  },
  isForest: function ( feature ) {
    return ( FeatureUtils.isPolygon( feature ) || FeatureUtils.isMultiPolygon( feature ) ) &&
        !FeatureUtils.isBuilding( feature );
  },
  color: function ( feature ) {
    var difficulty = !!feature.properties.tags && feature.properties.tags[ 'piste:difficulty' ];
    if ( difficulty ) {
      if ( difficulty === 'advanced' || difficulty === 'expert' || difficulty === 'freeride' ) { return '#030512' }

      if ( difficulty === 'intermediate' ) { return '#ef2415' }

      if ( difficulty === 'easy' ) { return '#1976d2' }

      if ( difficulty === 'novice' ) { return '#4caf50' }

      log( 'Unknown piste difficulty', difficulty );
      return '#17afef';
    }

    if ( FeatureUtils.isAerial( feature ) ) { return '#0c0c0c' }

    if ( FeatureUtils.isTrack( feature ) ) { return 'rgba(46, 42, 22, 0.5)' }

    if ( FeatureUtils.isHighway( feature ) ) { return '#222120' }

    if ( feature.properties.color ) { return feature.properties.color }

    if ( FeatureUtils.isRiver( feature ) ) {
      // Hack this in to allow memoize to work
      return feature.properties.tags.waterway === 'stream' ? 5 : 100;
    }

    log( 'Unknown feature color', feature );
  },
  thickness: function ( feature ) {
    if ( feature.properties.thickness ) { return feature.properties.thickness }

    if ( FeatureUtils.isPiste( feature ) ) { return 2.7 }

    if ( FeatureUtils.isAerial( feature ) ) { return 3.0 }

    if ( FeatureUtils.isTrack( feature ) ) { return 3 }

    if ( FeatureUtils.isHighway( feature ) ) {
      var highway = FeatureUtils.tagValue( feature, 'highway' );
      if ( highway === 'motorway' ) { return 13 }

      if ( highway === 'trunk' ) { return 11 }

      if ( highway === 'primary' ) { return 10 }

      if ( highway === 'secondary' ) { return 8 }

      return 5;
    }

    if ( FeatureUtils.isRiver( feature ) ) {
      if ( feature.properties.tags.width ) { return feature.properties.tags.width }

      return feature.properties.tags.waterway === 'stream' ? 2 : 3.7;
    }

    return 2.5;
  }
};

export default FeatureUtils;

