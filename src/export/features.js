/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import _ from 'lodash';
import GeodataActions from '/actions/geodata';
import LineData from '/data/line';
import OverlayAdapter from '/adapters/overlay';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

const Procedural = {};

function FeaturesExport() {
  this.bindListeners( {
    featureClicked: UserActions.featureClicked,
    featureSelected: UserActions.featureSelected,
    overlayDisplayed: RenderActions.overlayDisplayed
  } );
}

// For now only supporting lines & labels, but should expand in future
var lookupFeature = function ( id ) {
  if ( id === undefined ) { return }

  // Support looking up an array of features
  if ( Array.isArray( id ) ) { return id.map( lookupFeature ) }

  // Get feature as represented by engine (this has actual
  // curve data)
  if ( id.geometry ) {
    // Backward compatibility for old engine.
    return _.find( LineData.getState().data,
      _.matchesProperty( 'geometry', id.geometry ) );
  }

  var feature = _.find( LineData.getState().data,
    _.matchesProperty( 'id', id ) );
  if ( feature ) { return feature }

  if ( feature ) { return feature }

  feature = _.find( OverlayAdapter.getState().points,
    _.matchesProperty( 'id', id ) );
  if ( feature ) { return feature }

  feature = _.find( OverlayAdapter.getState().markers,
    _.matchesProperty( 'id', id ) );
  return feature;
};

/**
 * @exports Procedural
 * @name Features
 * @description Features are elements in the rendered scene
 * that are displayed on top of the 3D world, such as lines
 * or POIs.
 *
 * Features are added as part of an overlay, which takes the
 * form of a [geojson]{@link http://geojson.org/} FeatureCollection.
 * Each feature should have a unique `id`, to allow referencing
 * later by other methods.
 *
 * To explore the different options available when styling
 * the overlays, take a look at the [Overlay Editor]{@link https://felixpalmer.github.io/procedural-gl-js/docs/overlays.html}
 *
 * @example
 * // Add an overlay and focus on features when clicked
 * var featureCollection = { ... };
 * Procedural.addOverlay( featureCollection );
 * Procedural.onFeatureClicked = function ( id ) {
 *   Procedural.focusOnFeature( id );
 * };
 */

/**
 * @name addBuiltinOverlay
 * @memberof module:Features
 * @function
 * @param {String|Array} id id of overlay to add, or array of ids
 * @description Adds a built-in overlay to the 3D world.
 * Currently supported overlays are: 'peaks', 'places'.
 * See also [Features.removeOverlay]{@link module:Features.removeOverlay}
  @example
 * Procedural.addBuiltinOverlay( 'peaks' );
 */
Procedural.addBuiltinOverlay = function ( id ) {
  setTimeout( function () { GeodataActions.addBuiltinOverlay( id ) }, 0 );
};

/**
 * @name addOverlay
 * @memberof module:Features
 * @function
 * @param {Object} overlay a geojson FeatureCollection
 * @description Adds an overlay to the 3D world. An overlay is a collection of `Features`, specified
 * in geojson format as a `FeatureCollection`. Each of these `Features` should have a unique id
 * which is used by other methods when referencing each `Feature`. See also the examples in the [Overlay Editor]{@link http://www.procedural.eu/js-sdk/overlays.html}. See also [Features.updateOverlay]{@link module:Features.updateOverlay}, [Features.removeOverlay]{@link module:Features.removeOverlay}
  @example
 * var featureCollection = {
 *   'name': 'example',
 *   'type': 'FeatureCollection',
 *   'features': [
 *     {
 *       'id': 0,
 *       'type': 'Feature',
 *       'geometry': {
 *         'type': 'LineString',
 *         'coordinates': [
 *           [ 13.55, 47.25 ],
 *           [ 13.56, 47.26 ]
 *         ]
 *       },
 *       'properties': {
 *         'color': '#f30e32'
 *       }
 *     }
 *   ]
 * }
 *
 * Procedural.addOverlay( featureCollection );
 */
Procedural.addOverlay = function ( overlay ) {
  setTimeout( function () { GeodataActions.addOverlay( overlay ) }, 0 );
};

/**
 * @name updateOverlay
 * @memberof module:Features
 * @function
 * @param {Object} overlay a geojson FeatureCollection
 * @description Updates an overlay that was previously added to the 3D world.
 * Using this method is much faster than repeatedly calling `addOverlay`,
 * but the update is limited to the positions of the features in the overlay.
 * The format is the same as for `addOverlay`, but only the `coordinates`
 * will be updated - all feature properties will be ignored.
 *
 * To update an overlay it is necessary to provide the
 * same `name` as was used for `addOverlay` and for the updated
 * data to have the same number of features as the original overlay, in
 * the same order.
 *
 * Note that currently only `Point` geometries can be updated.
 * See also [Features.addOverlay]{@link module:Features.addOverlay}
  @example
 * var featureCollection = {
 *   'name': 'example',
 *   'type': 'FeatureCollection',
 *   'features': [
 *     {
 *       'id': 0,
 *       'type': 'Feature',
 *       'geometry': {
 *         'type': 'Point',
 *         'coordinates': [ 13.55, 47.25 ]
 *       }
 *     }
 *   ]
 * }
 *
 * Procedural.updateOverlay( featureCollection );
 */
Procedural.updateOverlay = function ( overlay ) {
  setTimeout( function () { GeodataActions.updateOverlay( overlay ) }, 0 );
};

/**
 * @name removeOverlay
 * @memberof module:Features
 * @function
 * @param {String} name name of overlay to remove, defined when adding an overlay using [Features.addOverlay]{@link module:Features.addOverlay}
 * @description Removes an overlay from the 3D world. See also [Features.addOverlay]{@link module:Features.addOverlay}
 * @example
 *
 * var featureCollection = {
 *   'name': 'example',
 *   'type': 'FeatureCollection',
 *   'features': [ ... ]
 * }
 * Procedural.addOverlay( featureCollection );
 *
 * ...
 *
 * Procedural.removeOverlay( 'example' );
 *
 */
Procedural.removeOverlay = function ( id ) {
  setTimeout( function () { GeodataActions.removeOverlay( id ) }, 0 );
};

/**
 * @name highlightFeature
 * @memberof module:Features
 * @function
 * @param {Number} id id of Feature to highlight
 * @description Highlights a feature on the map
 * @example
 * Procedural.highlightFeature( 3 );
 */
Procedural.highlightFeature = function ( id ) {
  var feature = lookupFeature( id );
  if ( feature ) {
    setTimeout( function () { UserActions.featureSelected( feature ) } );
  }
};

/**
 * @name focusOnFeature
 * @memberof module:Features
 * @function
 * @param {Number} id id of Feature to focus on
 * @description Focuses the camera on a feature on the map
 * @example
 * Procedural.focusOnFeature( 3 );
 */
Procedural.focusOnFeature = function ( id ) {
  var feature = lookupFeature( id );
  if ( feature ) {
    setTimeout( function () { UserActions.focusOnFeature( feature ) } );
  }
};

// Not working so well, disable for now
///**
// * @name animateAlongFeature
// * @memberof module:Features
// * @function
// * @param {Number} id id of Feature to animate along
// * @param {Object} options options to specify how to animate
// * accepts `distance` and `speed`
// * @description Animates the camera along a LineString Feature
// * @example
// * Procedural.animateAlongFeature( 5 );
// */
//Procedural.animateAlongFeature = function ( id, options ) {
//  var feature = lookupFeature( id );
//  if ( feature ) {
//    options = options || {};
//    options.feature = feature;
//    setTimeout( function () { UserActions.animateAlongFeature( options );
//    } );
//  }
//};

Procedural.selectFeatures = function ( ids ) {
  if ( ids ) {
    setTimeout( function () { UserActions.selectFeatures( ids ) } );
  }
};

// API Listeners

var currentFeature = null;
/**
 * @name onFeatureSelected
 * @memberof module:Features
 * @function
 * @param {Number} id id of Feature that was selected
 * @description Callback function for when a feature is selected,
 * by hovering over it with the mouse
 * @example
 * Procedural.onFeatureSelected = function ( id ) {
 *   console.log( 'Feature selected:', id );
 * }
 */
FeaturesExport.prototype.featureSelected = function ( feature ) {
  // Only broadcast changes
  if ( currentFeature === feature ) { return }

  currentFeature = feature;

  if ( typeof Procedural.onFeatureSelected === 'function' &&
       feature && feature.id !== undefined ) {
    Procedural.onFeatureSelected( feature.id );
  }
};

/**
 * @name onFeatureClicked
 * @memberof module:Features
 * @function
 * @param {Number} id id of Feature that was clicked
 * @description Callback function for when a feature is clicked
 * @example
 * Procedural.onFeatureClicked = function ( id ) {
 *   console.log( 'Feature clicked:', id );
 * }
 */
FeaturesExport.prototype.featureClicked = function ( feature ) {
  if ( typeof Procedural.onFeatureClicked === 'function' &&
       feature && feature.id !== undefined ) {
    Procedural.onFeatureClicked( feature.id );
  }
};

/**
 * @name onOverlayAdded
 * @memberof module:Features
 * @function
 * @param {String} name name of overlay that was added
 * @description Callback function for when an overlay has been added
 * @example
 * Procedural.onOverlayAdded = function ( name ) {
 *   console.log( 'Overlay added:', name );
 * }
 */
FeaturesExport.prototype.overlayDisplayed = function ( name ) {
  if ( typeof Procedural.onOverlayAdded === 'function' && name ) {
    Procedural.onOverlayAdded( name );
  }
};

FeaturesExport.displayName = 'FeaturesExport';
alt.createStore( FeaturesExport );
export default Procedural;
