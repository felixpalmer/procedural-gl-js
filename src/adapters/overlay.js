/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import _ from 'lodash';
import alt from '/alt';
import defer from '/utils/defer';
import FeatureUtils from '/utils/feature';
import GeodataActions from '/actions/geodata';
import OSMAdapter from '/adapters/osm';
import RenderActions from '/actions/render';
import track from '/track';
var DEFAULT = '____default____';
// Have other stores depend on this to get subsets of
// overlay data
function OverlayAdapter() {
  this.bindListeners( {
    addBuiltinOverlay: GeodataActions.addBuiltinOverlay,
    addOverlay: GeodataActions.addOverlay,
    updateOverlay: GeodataActions.updateOverlay,
    featureCreated: RenderActions.featureCreated,
    removeOverlay: GeodataActions.removeOverlay,
    setFeatures: GeodataActions.setFeatures
  } );

  // Hash to keep track of overlays added
  this.overlays = {};

  // Hash to keep track of when overlays are displayed
  this.overlayTracker = {};

  // Builtin overlays are not specified by the user,
  // but rather extracted from the OSM data
  this.builtinOverlays = [];
  this.supportedBuiltinOverlays = [ 'lifts', 'peaks', 'pistes', 'places' ];

  // Overlays which which don't want to generate new data
  // for, just mark whether to show them
  this.referenceOnlyBuiltinOverlays = [ 'lifts', 'pistes' ];

  // Collections to sort elements into
  this.lines = [];
  this.markers = [];
}

// Return collection to place feature into
OverlayAdapter.prototype.classify = function ( feature ) {
  if ( FeatureUtils.isLineString( feature ) ) {
    return this.lines;
  } else if ( FeatureUtils.isPoint( feature ) ) {
    return this.markers;
  }

  return null;
};

OverlayAdapter.prototype.removeFeature = function ( feature ) {
  var collection = this.classify( feature );
  if ( collection === null ) { return }

  var index = collection.indexOf( feature );
  if ( index !== -1 ) { collection.splice( index, 1 ) }
};

OverlayAdapter.prototype.addOverlay = function ( data ) {
  var builtin = this.builtinOverlays.indexOf( data.name ) !== -1;
  this.removeOverlay( data.name );

  // removeOverlay clears out the overlay from the builtinOverlays
  // list, which we do not want, so add it back
  // TODO doesn't work as we modify order of array!!!!
  if ( builtin ) { this.builtinOverlays.unshift( data.name ) }

  if ( data.name === undefined ) { data.name = DEFAULT }

  // Cache away overlay so we can later remove it
  this.overlays[ data.name ] = data;

  // Make a copy of the array, to avoid modifying original
  var features = data.features.concat();

  // Classify features, for now without duplication
  var feature;
  var startTime = track.now();

  while ( features.length > 0 ) {
    feature = features.pop();

    // Copy across default properties
    if ( data.defaults && data.defaults.properties ) {
      _.defaults( feature.properties, data.defaults.properties );
    }

    if ( feature.projected === undefined ) {
      feature.projected = false;
    }

    var collection = this.classify( feature );
    if ( collection ) {
      collection.push( feature );
      feature.overlayName = data.name;
      this.featureClassified( feature );
    }
  }

  var time = track.now() - startTime;
  track.timing( 'geodata', 'classify', 'overlay', time );
};

OverlayAdapter.prototype.updateOverlay = function ( data ) {
  var exists = this.overlays[ data.name ] !== undefined;
  if ( !exists ) {
    console.error( name + ' overlay has not been added, so cannot be updated' );
    return false;
  }

  var newFeatures = data.features, oldFeatures = this.overlays[ data.name ].features;
  var newL = newFeatures.length, oldL = oldFeatures.length;
  if ( newL !== oldL ) {
    console.error( 'Tried to call updateOverlay on overlay ' + data.name + ', but number of features does not match. Original: ' + oldL + ', new: ' + newL );
    return false;
  }

  // Is data already projected?
  // Note we do not support multiple different projections
  // or projections with different centers
  var projected = !!data.crs;

  var oldFeature, newFeature;
  for ( var n = 0; n < newL; n++ ) {
    var oldFeature = oldFeatures[ n ];
    var newFeature = newFeatures[ n ];
    // TODO should we check ids match?
    oldFeature.projected = newFeature.projected === undefined ? projected : newFeature.projected;
    oldFeature.geometry.coordinates = newFeature.geometry.coordinates;
  }
};

OverlayAdapter.prototype.addBuiltinOverlay = function ( overlay ) {
  // Support single and array parameters
  if ( !Array.isArray( overlay ) ) {
    overlay = [ overlay ];
  }

  for ( var n = 0, nl = overlay.length; n < nl; n++ ) {
    var name = overlay[ n ];
    var index = this.supportedBuiltinOverlays.indexOf( name );
    if ( index === -1 ) {
      console.error( name + ' is not a supported built-in overlay' );
      return false;
    }

    // Just mark that we want to use this overlay and rely
    // on updateBuiltinOverlays to populate data
    index = this.builtinOverlays.indexOf( name );
    if ( index === -1 ) { this.builtinOverlays.push( name ) }
  }

  return this.updateBuiltinOverlays();
};

OverlayAdapter.prototype.updateBuiltinOverlays = function () {
  this.waitFor( OSMAdapter );
  var osm = OSMAdapter.getState();
  for ( var o = 0, ol = this.builtinOverlays.length; o < ol; o++ ) {
    var name = this.builtinOverlays[ o ];
    if ( this.referenceOnlyBuiltinOverlays.indexOf( name ) !== -1 ) {
      continue;
    }

    this.addOverlay( {
      name: name,
      type: 'FeatureCollection',
      features: osm[ name ]
    } );
  }
};

OverlayAdapter.prototype.setFeatures = function () {
  return this.updateBuiltinOverlays();
};

OverlayAdapter.prototype.removeOverlay = function ( toRemove ) {
  if ( toRemove === undefined ) { toRemove = [ DEFAULT ] }

  if ( !Array.isArray( toRemove ) ) { toRemove = [ toRemove ] }

  for ( var n = 0, nl = toRemove.length; n < nl; n++ ) {
    var name = toRemove[ n ];
    var index = this.builtinOverlays.indexOf( name );
    if ( index !== -1 ) {
      this.builtinOverlays.splice( index, 1 );
    }

    if ( this.overlays[ name ] === undefined ) { continue }

    var overlay = this.overlays[ name ];
    for ( var f = 0, fl = overlay.features.length; f < fl; f++ ) {
      this.removeFeature( overlay.features[ f ] );
    }

    delete this.overlays[ name ];
  }
};

OverlayAdapter.prototype.featureClassified = function ( feature ) {
  if ( this.overlayTracker[ feature.overlayName ] === undefined ) {
    this.overlayTracker[ feature.overlayName ] = 1;
  } else {
    this.overlayTracker[ feature.overlayName ] += 1;
  }
};

OverlayAdapter.prototype.featureCreated = function ( feature ) {
  if ( this.overlayTracker[ feature.overlayName ] === undefined ) {
    return false;
  } else {
    this.overlayTracker[ feature.overlayName ] -= 1;
  }

  if ( this.overlayTracker[ feature.overlayName ] === 0 ) {
    var overlayName = feature.overlayName;
    delete this.overlayTracker[ feature.overlayName ];
    defer( function () {
      RenderActions.overlayDisplayed( overlayName );
    } );
  }

  delete feature.overlayName;
};

OverlayAdapter.displayName = 'OverlayAdapter';

export default alt.createStore( OverlayAdapter );
