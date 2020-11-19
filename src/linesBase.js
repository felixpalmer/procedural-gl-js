/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import _ from 'lodash';
import BufferMergeGeometry from '/geometry/bufferMerge';
import FeatureUtils from '/utils/feature';
import geoproject from '/geoproject';
import LineCurve from '/lineCurve';
import LineGeometry from '/geometry/line';
import log from '/log';
import RenderActions from '/actions/render';
import scene from '/scene';
import track from '/track';
import WorkQueue from '/utils/workQueue';
var LinesBase = function () {
  THREE.Object3D.call( this );
  this.features = []; // Base data defined in terms of lat/lon

  scene.add( this );

  this.maxIndex = 65535;
  this.projectTime = 0;
  this.curveTime = 0;
  this.geomTime = 0;
  this.mergeTime = 0;

  // Prevent recalculation of matrix, as we are static
  this.matrixAutoUpdate = false; this.updateMatrixWorld = function () {};

  this.parent = null; // To let us have lines in two scenes, remove first scene as parent

  // Set to true when drawing geometry that will have constant width on-screen,
  // like an overlay, rather than a width in world space (like a river etc)
  // This affects what attributes are generated
  this.constantWidth = false;
};

LinesBase.prototype = Object.create( THREE.Object3D.prototype );

LinesBase.prototype.onNewData = function ( state ) {
  this.features = state.data;
  this.update();
};

// Should this be broken up or run in worker?
LinesBase.prototype.remove = function () {
  // Remove old meshes
  this.children.forEach( function ( c ) { c.geometry.dispose() } );
  this.children = [];
};

// Should this be broken up or run in worker?
LinesBase.prototype.update = function () {
  var self = this;
  this.remove();

  if ( this.constantWidth ) {
    this.bufferGeomAttributes = [ 'position', 'tangent' ];
  } else {
    this.bufferGeomAttributes = [ 'position' ];
  }

  // Keep an array of buffer geometries we'll merge into, keyed of the material.uuid
  // This allows us to have lines of different color merged
  this.bufferGeoms = {};
  this.materials = {};

  // Add lines gradually, using work queue, to not block main thread
  this.curveTime = 0;
  this.projectTime = 0;
  this.geomTime = 0;
  this.mergeTime = 0;

  log( 'Starting processing', self.name );

  WorkQueue.createTask( self.features,
    self.addMesh.bind( self ), // Invoked on each item in queue
    function () { // Finish up
      var startTime = track.now();
      _.each( self.bufferGeoms, function ( bufferGeom, uuid ) {
        mesh = new THREE.Mesh( bufferGeom.freeze(), self.materials[ uuid ] );
        mesh.frustumCulled = false; // TODO is this too aggressive??
        self.add( mesh );
      } );

      self.constructTime = track.now() - startTime;

      // Notify that we have parsed new lines
      log( 'Parsed', self.name );
      track.timing( self.name, 'project', null, self.projectTime );
      track.timing( self.name, 'curve', null, self.curveTime );
      track.timing( self.name, 'geom', null, self.geomTime );
      track.timing( self.name, 'merge', null, self.mergeTime );
      track.timing( self.name, 'construct', null, self.constructTime );
      log( 'instances:', self.children.length );
      RenderActions.renderedFeatureDisplayed( self.name );
    }
  );
};

var mat, mesh, color;
LinesBase.prototype.createGeometry = function ( feature ) {
  // Recalculate curves (as elevation data has changed)
  var startTime = track.now();
  var projected = geoproject.vectorizeFeature( feature );
  var time = track.now() - startTime; this.projectTime += time;
  startTime = track.now();

  var colors;
  if ( feature.geometry.colors ) {
    if ( feature.geometry.coordinates.length !==
         feature.geometry.colors.length ) {
      console.error( 'colors array for feature must have same length as positions array' );
    } else {
      colors = feature.geometry.colors;
      feature.perVertexColors = true;
    }
  }

  var curve = new LineCurve( projected, colors );
  feature.curve = curve;
  time = track.now() - startTime; this.curveTime += time;

  startTime = track.now();
  feature.thickness = FeatureUtils.thickness( feature );
  curve.hDelta = 3 + 0.5 * feature.thickness;

  // We need the curve length, but this is expensive to calculate,
  // as a rough estimate is fine here, reduce the number of arc
  // divisions to get the estimate, then update once we have resolution required
  // This leads to a big speed boost for shorter curves, as the
  // default value is 200, which is far too high for a short curve
  feature.curve.arcLengthDivisions = 10;
  var length = feature.curve.getLength();

  // Resolution determines how many portions the curve is made up of
  // use a number of heuristics to make sure we get nice looking curves
  // Note that points will be equally spaced along curve, so if source data
  // has fine detail, this may be skipped
  var resolution = Math.round( length / 25 );
  resolution = Math.max( resolution, 2 * feature.geometry.coordinates.length );
  resolution = resolution < 10 ? 10 : resolution;

  feature.curve.arcLengthDivisions = resolution;
  feature.curve.needsUpdate = true;

  var options = {
    writeTangent: this.writeTangent
  };
  if ( !this.constantWidth ) { options.thickness = feature.thickness }

  feature.geom = new LineGeometry(
    feature, resolution, options,
    feature.perVertexColors ?
      this.bufferGeomAttributes.concat( 'color' ) :
      this.bufferGeomAttributes );

  time = track.now() - startTime; this.geomTime += time;

  // Now we have the 3D geom, dump the geojson to conserve memory
  delete feature.geometry.colors;
  // Deleting coordinates breaks CameraStore.focusOnFeature. Simple
  // hack is just to keep the first coordinate (even if a big ugly)
  feature.geometry.coordinates = [ feature.geometry.coordinates[ 0 ] ];
};

LinesBase.prototype.addMesh = function ( feature ) {
  if ( feature.geom === undefined ) {
    this.createGeometry( feature );
  }

  // Get material for this line
  color = feature.perVertexColors ? null : FeatureUtils.color( feature );
  // Material function is memoized off first parameter, so pass
  // null where we have per-vertex colors to create material
  // just for that
  mat = this.material( color,
    feature.thickness,
    ( feature.properties ? feature.properties.outlineColor : undefined ) );

  // Stash away used materials, need them when combining merged geometries
  if ( !this.materials[ mat.uuid ] ) {
    this.materials[ mat.uuid ] = mat;
  }

  var startTime = track.now();
  var count = feature.geom.attributes.position.count;
  var attributes = feature.perVertexColors ?
    this.bufferGeomAttributes.concat( 'color' ) :
    this.bufferGeomAttributes;

  if ( count > this.maxIndex ) {
    // Geometry too large for combining, just add directly
    // TODO not clear why it is necessary to convert to BufferMergeGeometry???
    var tmpGeom = new BufferMergeGeometry( count, attributes, !!feature.tag );
    tmpGeom.merge( feature.geom, feature.tag );
    mesh = new THREE.Mesh( tmpGeom.freeze(), mat );
    this.add( mesh );
    tmpGeom.dispose();
  } else { // Combine by merging into larger geometry
    // Retrieve geometry for this material
    if ( !this.bufferGeoms[ mat.uuid ] ) {
      // Lazily create per material geometries
      this.bufferGeoms[ mat.uuid ] = new BufferMergeGeometry( this.maxIndex, attributes, !!feature.tag );
    }

    var bufferGeom = this.bufferGeoms[ mat.uuid ];

    if ( count > bufferGeom.capacity() ) {
      // Have filled current buffer enough, add to scene
      mesh = new THREE.Mesh( bufferGeom.freeze(), mat );
      mesh.frustumCulled = false; // TODO is this too aggressive??
      this.add( mesh );

      // Split to next geom
      this.bufferGeoms[ mat.uuid ] = new BufferMergeGeometry( this.maxIndex, attributes, !!feature.tag );
      bufferGeom = this.bufferGeoms[ mat.uuid ];
    }

    // Finally actually perform merge
    bufferGeom.merge( feature.geom, feature.tag );
  }

  var time = track.now() - startTime; this.mergeTime += time;
  RenderActions.featureCreated( feature );
};

export default LinesBase;
