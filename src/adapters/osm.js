/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import GeodataActions from '/actions/geodata';
import geoproject from '/geoproject';
import FeatureUtils from '/utils/feature';
import track from '/track';
import UserActions from '/actions/user';

// Have other stores depend on this to get subsets of
// OSM data
function OSMAdapter() {
  this.bindListeners( {
    clearFeatures: UserActions.setCurrentPlace,
    setFeatures: GeodataActions.setFeatures
  } );

  this.clearFeatures();
}

OSMAdapter.prototype.clearFeatures = function () {
  this.buildings = [];
  this.forests = [];
  this.highways = [];
  this.lifts = [];
  this.peaks = [];
  this.places = [];
  this.pistes = [];
  this.lakes = [];
  this.rivers = [];
  this.unknown = [];
  return false;
};

// Return collection to place feature into
OSMAdapter.prototype.classify = function ( feature ) {
  if ( FeatureUtils.isLineString( feature ) ) {
    // Give top priority to pistes, so we don't classify as roads
    if ( FeatureUtils.hasTag( feature, 'piste:type' ) ) { return this.pistes }

    if ( FeatureUtils.hasTag( feature, 'highway' ) ) { return this.highways }

    if ( FeatureUtils.hasTag( feature, 'waterway' ) ) { return this.rivers }

    if ( FeatureUtils.hasTag( feature, 'aerialway' ) ) {
      return this.lifts;
    }

    // Assume this is a piste (or generic trail)
    // TODO, create another type?
    //if ( FeatureUtils.hasTag( feature, 'piste:type' ) ) {
    return this.pistes;
    //}
  } else if ( FeatureUtils.isPolygon( feature ) ) {
    if ( FeatureUtils.hasTag( feature, 'building' ) ) { return this.buildings }

    var natural = FeatureUtils.tagValue( feature, 'natural' );
    if ( natural === 'water' ) { return this.lakes }

    // For now, treat river areas as lakes, as we don't have flow
    // working yet
    var waterway = FeatureUtils.tagValue( feature, 'waterway' );
    if ( waterway === 'riverbank' ) { return this.lakes }

    return this.forests;
  } else if ( FeatureUtils.isMultiPolygon( feature ) ) {
    return this.forests;
  } else if ( FeatureUtils.isPoint( feature ) ) {
    var tags = feature.properties.tags;
    if ( tags.natural === 'peak' && tags.name ) {
      return this.peaks;
    } else if ( tags.place ) {
      return this.places;
    } else {
      return this.unknown;
    }
  }

  return this.unknown;
};


// Convert OSM data into something matching our API
// TODO should eventually deprecate and generate the
// data better, this is all pretty messy
OSMAdapter.prototype.normalize = function ( feature ) {
  if ( feature.properties.tags === undefined ) { return }

  var props = feature.properties;
  var tags = props.tags;
  delete props.tags;

  // Promote name to real property
  if ( tags.name ) { props.name = tags.name }

  // Figure out type and add icon
  if ( tags.natural === 'peak' ) {
    props.icon = 'caret-up';
    props.fadeDistance = 10000;
    if ( tags.ele && props.name ) {
      props.name += ' - ' + tags.ele + 'm';
    }
  } else if ( tags.place ) {
    props.icon = 'dot-circle-o';
    props.fadeDistance = 15000;
  }

  // TODO mark builtin features
  // TODO extract to default
  props.collapseDistance = 0.5 * props.fadeDistance;
  props.priority = -10;
  props.borderRadius = 20;
  props.background = 'rgba(0, 0, 0, 0.6)';
  props.color = '#fff';
  props.clipping = 'object';
  props.anchor = 'left';

  props.padding = 2;
};

OSMAdapter.prototype.setFeatures = function ( data ) {
  // Is data already projected?
  var projected = !!data.crs;

  // Classify features, for now without duplication
  var feature, collection;
  var startTime = track.now();
  while ( data.features.length > 0 ) {
    feature = data.features.pop();
    // Remove 3035 projection
    if ( projected ) {
      feature.geometry.coordinates =
        geoproject.unproject3035( feature.geometry.coordinates );
    }

    if ( feature.projected === undefined ) {
      feature.projected = false;
    }

    collection = this.classify( feature );
    collection.push( feature );
  }

  this.peaks.forEach( this.normalize.bind( this ) );
  this.places.forEach( this.normalize.bind( this ) );
  var time = track.now() - startTime;
  track.timing( 'geodata', 'classify', 'osm', time );
};

OSMAdapter.displayName = 'OSMAdapter';

export default alt.createStore( OSMAdapter );
