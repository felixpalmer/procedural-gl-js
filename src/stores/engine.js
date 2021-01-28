/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';
import heightAt from '/heightAt';
import GeodataActions from '/actions/geodata';
import OSMAdapter from '/adapters/osm';
import PlacesStore from '/stores/places';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';

function EngineStore() {
  this.featuresLoaded = false;
  this.renderedFeatureStatus = {};
  this.featuresRendered = false;

  this.bindListeners( {
    renderedFeatureRegister: RenderActions.renderedFeatureRegister,
    renderedFeatureDisplayed: RenderActions.renderedFeatureDisplayed,
    setCurrentPlace: UserActions.setCurrentPlace,
    setFeatures: GeodataActions.setFeatures
  } );
}

EngineStore.prototype.setCurrentPlace = function () {
  this.featuresLoaded = false;

  // Clear out which features have been rendered
  var features = Object.keys( this.renderedFeatureStatus );
  for ( var f = 0; f < features.length; f++ ) {
    this.renderedFeatureStatus[ features[ f ] ] = false;
  }

  this.featuresRendered = false;

  this.waitFor( PlacesStore );
  var place = PlacesStore.getState().currentPlace;

  // TODO: Move default camera parameters to globally configurable location
  let CAMERA_ANGLE = 40;
  let CAMERA_DISTANCE = 5000;
  let CAMERA_BEARING = 0;
  let CAMERA_ANIMATION_DURATION = 0.5;

  // Use values in place object if they exist, otherwise default camera parameters
  let _angle = place.angle ? place.angle : CAMERA_ANGLE;
  let _distance = place.distance ? place.distance : CAMERA_DISTANCE;
  let _bearing = place.bearing ? place.bearing : CAMERA_BEARING;
  let _animationDuration = place.animationDuration ? place.animationDuration : CAMERA_ANIMATION_DURATION;

  setTimeout( function () {
    const loc = {
      longitude: place.location[ 0 ],
      latitude: place.location[ 1 ],
      angle: _angle, distance: _distance,
      bearing: _bearing, animationDuration: _animationDuration
    };
    heightAt( loc, H => {
      loc.height = H;
      UserActions.focusOnLocation( loc );
    } );
  }, 0 );
};

EngineStore.prototype.setFeatures = function () {
  this.waitFor( OSMAdapter );
  this.featuresLoaded = true;
};

// Keep track of what features are showing on map, and if they have been
// loaded into view. This lets us detect when the map is completely loaded
EngineStore.prototype.renderedFeatureRegister = function ( feature ) {
  this.renderedFeatureStatus[ feature ] = false;
  return false;
};

EngineStore.prototype.renderedFeatureDisplayed = function ( feature ) {
  this.renderedFeatureStatus[ feature ] = true;
  var features = Object.keys( this.renderedFeatureStatus );

  // Have we even downloaded them yet?
  this.featuresRendered = this.featuresLoaded;

  // Check if all features are shown
  for ( var f = 0; f < features.length; f++ ) {
    var featureDisplayed = this.renderedFeatureStatus[ features[ f ] ];
    if ( !featureDisplayed ) { this.featuresRendered = false }
  }

  return this.featuresRendered;
};

EngineStore.displayName = 'EngineStore';
export default alt.createStore( EngineStore );
