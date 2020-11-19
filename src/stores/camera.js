/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import _ from 'lodash';
import alt from '/alt';
import camera from '/camera';
import { MapControls } from '/controls/OrbitControls';
import ConfigActions from '/actions/config';
import CurrentLocationActions from '/actions/currentLocation';
import CurrentLocationStore from '/stores/currentLocation';
import geoproject from '/geoproject';
import heightAt from '/heightAt';
import normalAt from '/normalAt';
import RenderStore from '/stores/render';
import StoreUtils from '/utils/store';
import UserActions from '/actions/user';
var up = new THREE.Vector3( 0, 0, 1 );

function CameraStore() {
  this.position = new THREE.Vector3( 0, 0, 16000 );
  this.target = new THREE.Vector3();
  this.hasZoomedOut = false;
  this.vantages = [];

  this.constrainCamera = true;
  this.minDistance = 100;
  this.minHeight = 200;
  this.maxDistance = 50000;
  this.maxBounds = 100000;

  camera.position.copy( this.position );
  camera.up.copy( up );
  camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
  this.controls = new MapControls( camera );

  var controls = this.controls;
  RenderStore.listen( function () {
    controls.update();
  } );

  // Transition durations & camera behavior
  this.zoomInDuration = 2.0;
  this.zoomOutDuration = 2.0;

  this.bindListeners( {
    animateAlongFeature: UserActions.animateAlongFeature,
    configure: ConfigActions.configureCamera,
    doubleTapZoom: UserActions.doubleTapZoom,
    focusOnBounds: UserActions.focusOnBounds,
    focusOnFeature: UserActions.focusOnFeature,
    focusOnLocation: UserActions.focusOnLocation,
    focusOnTarget: UserActions.focusOnTarget,
    orbitTarget: UserActions.orbitTarget,
    panToPosition: UserActions.panToPosition,
    rotateLeft: UserActions.rotateLeft,
    rotateRight: UserActions.rotateRight,
    setCamera: UserActions.setCamera,
    setCameraMode: UserActions.setCameraMode,
    setCameraPosition: UserActions.setCameraPosition,
    setCameraTarget: UserActions.setCameraTarget,
    setFromCurrentLocation: [ CurrentLocationActions.setPosition, CurrentLocationActions.toggleTracking ],
    zoomIn: UserActions.zoomIn,
    zoomOut: UserActions.zoomOut
  } );
}

// Direct setters, often want to use panToXXX actions instead
CameraStore.prototype.setCamera = function ( state ) {
  if ( state.position ) {
    this.position.copy( state.position );
    if ( !state.position.forceHeight ) {
      // TODO perhaps a better way would be to define the camera
      // position (and thus matrix) relative to the ground and
      // then store the height in a GPU render target? That way
      // we could avoid reading height data on the CPU and the
      // texture read should be very cache-friendly
      var h = heightAt( this.position );
      // Hard limit, would otherwise be below ground
      if ( this.position.z < h ) { this.position.z = h + 1 }

      // Soft limit (nudge toward minHeight)
      if ( this.constrainCamera && this.position.z < h + this.minHeight ) {
        this.position.z += 0.1 * ( h + this.minHeight - this.position.z );
      }
    }
  }

  if ( state.target ) {
    this.target.copy( state.target );
    var limit = this.maxBounds; // High-res data end at about 25km
    if ( Math.abs( this.target.x ) > limit ) {
      this.target.x = limit * Math.sign( this.target.x );
    }

    if ( Math.abs( this.target.y ) > limit ) {
      this.target.y = limit * Math.sign( this.target.y );
    }
  }

  // Update camera internals
  this.controls.target.copy( this.target );

  // Update actual camera
  camera.position.copy( this.position );
  camera.up.copy( up );

  if ( state.quaternion ) {
    camera.setRotationFromQuaternion( state.quaternion );
  } else {
    camera.lookAt( this.controls.target );
  }

  camera.updateMatrixWorld();
};

CameraStore.prototype.setCameraTarget = function ( target ) {
  this.setCamera( { target: target } );
};

CameraStore.prototype.setCameraPosition = function ( position ) {
  this.setCamera( { position: position } );
};

CameraStore.prototype.setFromCurrentLocation = function () {
  this.waitFor( CurrentLocationStore );

  var currentLocation = CurrentLocationStore.getState();
  if ( !currentLocation.tracking || currentLocation.tooFar ) {
    // We're not tracking, ignore
    return false;
  }

  if ( !currentLocation.longitude || !currentLocation.latitude ) {
    // We don't yet have a position, ignore
    return false;
  }

  //
  // Focus camera on current location
  var nextTarget = geoproject.project( [ currentLocation.longitude, currentLocation.latitude, 0 ] );
  nextTarget.z = heightAt( nextTarget );

  return this.focusOnTarget( nextTarget );
};

CameraStore.prototype.setCameraMode = function ( mode ) {
  if ( mode !== '2D' && mode !== '3D' ) {
    console.error( 'Unknown camera mode:', mode );
    return false;
  }

  this.controls.lock2D = ( mode !== '3D' );
};

CameraStore.prototype.vantageForTarget = function ( target ) {
  var vantage;
  if ( target.bearing !== undefined ) {
    // If we have a bearing use that for direction
    var theta = THREE.Math.degToRad( target.bearing );
    vantage = new THREE.Vector3(
      -Math.sin( theta ), -Math.cos( theta ), 0 );
  } else {
    // otherwise figure out vantage point from normal
    vantage = normalAt( target, 100 );
  }

  // Direction away from slope, at 30 degree angle
  var angle = ( target.angle !== undefined ) ? target.angle : 30;
  vantage.z = 0;
  vantage.normalize();
  vantage.z = Math.tan( THREE.Math.degToRad( angle ) );

  // Position similar distance away
  var distance = ( target.distance !== undefined ) ?
    target.distance : this.target.distanceTo( this.position );
  distance = Math.max( distance, 1.5 * this.minDistance );
  vantage.setLength( distance );
  vantage.add( target );

  return vantage;
};

CameraStore.prototype.focusOnBounds = function ( target ) {
  if ( !target.sw || !target.sw.longitude || !target.sw.latitude ||
       !target.ne || !target.ne.longitude || !target.ne.latitude ) {
    return;
  }

  // First build up bounding sphere
  var sw = geoproject.project( [ target.sw.longitude, target.sw.latitude, 0 ] );
  sw.z = heightAt( target.sw, true );
  var ne = geoproject.project( [ target.ne.longitude, target.ne.latitude, 0 ] );
  ne.z = heightAt( target.ne, true );
  var box = new THREE.Box3().expandByPoint( sw ).expandByPoint( ne );
  var boundingSphere = new THREE.Sphere();
  box.getBoundingSphere( boundingSphere );

  // Now get the desired distance
  var fov = THREE.Math.degToRad( camera.fov );
  var D = boundingSphere.radius / Math.tan( 0.5 * fov );

  // Convert into target to focus on
  var nextTarget = boundingSphere.center.clone();
  _.defaults( nextTarget, target );
  nextTarget.distance = D;
  return this.focusOnTarget( nextTarget );
};

CameraStore.prototype.focusOnFeature = function ( feature ) {
  var coordinates = feature.geometry.coordinates;
  if ( Array.isArray( coordinates[ 0 ] ) ) {
    // Take first point of Linestring
    coordinates = coordinates[ 0 ];
  } // Otherwise assume Point

  var nextTarget;
  if ( feature.projected === false ) {
    nextTarget = geoproject.project( coordinates );
  } else {
    nextTarget = new THREE.Vector3( coordinates[ 0 ], coordinates[ 1 ], 0 );
  }

  nextTarget.z = heightAt( nextTarget );
  return this.focusOnTarget( nextTarget );
};

CameraStore.prototype.focusOnLocation = function ( target ) {
  if ( !target.longitude || !target.latitude ) { return }

  var nextTarget = geoproject.project( [ target.longitude, target.latitude, 0 ] );
  // TODO make heightAt work everywhere
  nextTarget.z = target.height || heightAt( target, true ); // Don't geoproject
  _.defaults( nextTarget, target );
  return this.focusOnTarget( nextTarget );
};

CameraStore.prototype.focusOnTarget = function ( target ) {
  var duration = target.animationDuration;
  if ( duration === undefined ) {
    duration = 0.001 * this.target.distanceTo( target ); // Move at 1km per second
    duration = Math.min( 4.0, Math.max( 1.2, duration ) ); // Clamp between 1.2 - 4 seconds
  }

  if ( duration === 0 ) {
    return this.setCamera( {
      position: this.vantageForTarget( target ),
      target: target
    } );
  } else {
    var options = {
      position: this.vantageForTarget( target ),
      target: target,
      duration: duration,
      doNotCancel: true
    };
    if ( typeof target.onComplete === 'function' ) {
      options.onComplete = target.onComplete;
    }

    return this.panToPosition( options );
  }
};

CameraStore.prototype.rotateAngle = function ( angle ) {
  var delta = this.position.clone().sub( this.target );
  delta.applyAxisAngle( up, angle );
  var newPosition = this.controls.target.clone().add( delta );
  var options = {
    duration: 0.9,
    ease: StoreUtils.cubicIn,
    lerp: StoreUtils.lerp.vector3Angular( this.controls.target.clone() ),
    doNotCancel: true
  };
  StoreUtils.transition( UserActions.setCameraPosition,
    this.position.clone(), newPosition, options );
};

CameraStore.prototype.rotateLeft = function () {
  this.rotateAngle( 0.3 * Math.PI );
};

CameraStore.prototype.rotateRight = function () {
  this.rotateAngle( -0.3 * Math.PI );
};

// Spin around the current point
CameraStore.prototype.orbitTarget = function () {
  var delta = this.position.clone().sub( this.target );
  delta.applyAxisAngle( up, 0.5 * Math.PI );
  var newPosition = this.target.clone().add( delta );
  var options = {
    duration: 13.37,
    ease: StoreUtils.linear,
    lerp: StoreUtils.lerp.vector3Angular( this.target.clone() ),
    onComplete: this.orbitTarget.bind( this )
  };
  StoreUtils.transition( UserActions.setCameraPosition,
    this.position.clone(), newPosition, options );
};

CameraStore.prototype.zoomIn = function () {
  var delta = this.position.clone().sub( this.target );
  var l = delta.length();
  var bounce = ( l < this.minDistance + 1 );
  l = bounce ? 0.9 * this.minDistance : Math.max( this.minDistance, 0.5 * l );
  delta.setLength( l );
  var self = this;
  return this.panToPosition( {
    position: this.target.clone().add( delta ),
    duration: bounce ? 0.15 : 0.5,
    ease: StoreUtils.cubicIn,
    doNotCancel: true,
    onComplete: function () {
      // Bounce back if outside of range
      if ( bounce ) {
        delta.setLength( self.minDistance );
        self.panToPosition( {
          position: self.target.clone().add( delta ),
          duration: 0.2,
          ease: StoreUtils.cubicIn,
          doNotCancel: true
        } );
      }
    }
  } );
};

CameraStore.prototype.zoomOut = function () {
  var delta = this.position.clone().sub( this.target );
  var l = delta.length();
  var bounce = ( l > this.maxDistance - 1 );
  l = bounce ? 1.1 * this.maxDistance : Math.min( this.maxDistance, 2 * l );
  delta.setLength( l );
  var self = this;
  return this.panToPosition( {
    position: this.target.clone().add( delta ),
    duration: bounce ? 0.15 : 0.5,
    ease: StoreUtils.cubicIn,
    doNotCancel: true,
    onComplete: function () {
      // Bounce back if outside of range
      if ( bounce ) {
        delta.setLength( self.maxDistance );
        self.panToPosition( {
          position: self.target.clone().add( delta ),
          duration: 0.2,
          ease: StoreUtils.cubicIn,
          doNotCancel: true
        } );
      }
    }
  } );
};

CameraStore.prototype.doubleTapZoom = function () {
  var delta = this.position.clone().sub( this.target );
  var l = delta.length();
  var zoomIn = l > this.minDistance * 1.05;
  if ( zoomIn ) { this.zoomIn() } else { this.zoomOut() }
};

var lastPosition = new THREE.Vector3();
var lastTarget = new THREE.Vector3();
var nextPosition = new THREE.Vector3();
var nextTarget = new THREE.Vector3();
var lastQuaternion = new THREE.Quaternion();
var nextQuaternion = new THREE.Quaternion();
CameraStore.prototype.panToPosition = function ( options ) {
  if ( options.position === undefined ) { options.position = this.position.clone() }

  if ( options.target === undefined ) { options.target = this.target.clone() }

  // Make local copies to capture state
  lastPosition.copy( this.position );
  nextPosition.copy( options.position );
  lastTarget.copy( this.target );
  nextTarget.copy( options.target );
  lastQuaternion.copy( camera.quaternion );
  if ( this.controls.lock2D ) {
    nextQuaternion.copy( lastQuaternion );
  } else {
    var m = new THREE.Matrix4();
    m.lookAt( options.position, options.target, up );
    nextQuaternion.setFromRotationMatrix( m );
  }

  var interpolate = function ( u ) {
    UserActions.setCamera( {
      position: {
        forceHeight: true,
        ...StoreUtils.lerp.vector3( lastPosition, nextPosition, u )
      },
      target: StoreUtils.lerp.vector3( lastTarget, nextTarget, u ),
      quaternion: lastQuaternion.clone().slerp( nextQuaternion, u )
    } );
  };

  StoreUtils.transition( interpolate, 0, 1, options );
  return false;
};

// At the moment, a bit glitchy so do not expose API
CameraStore.prototype.animateAlongFeature = function ( options ) {
  var self = this;
  if ( this.controls.lock2D ) {
    this.setCameraMode( '3D' );
    setTimeout( function () {
      self.animateAlongFeature( options );
    }, 500 );
    return;
  }

  var chaseDistance = options.distance || 1000;
  var chaseHeight = Math.max( 1, 0.5 * chaseDistance );
  var chaseSpeed = options.speed || 100;
  var smoothTarget = new THREE.Vector3();
  var offset = new THREE.Vector3();
  var oldCameraNear = camera.near;

  camera.near = Math.min( 0.25 * chaseHeight, camera.near );
  camera.updateProjectionMatrix();
  var follow = function ( target ) {
    // Smooth the motion of the target
    smoothTarget.subVectors( target, self.target );
    smoothTarget.multiplyScalar( 0.1 );
    smoothTarget.add( self.target );

    var d = smoothTarget.distanceTo( self.position );

    // Chase at distance approaching the desired distance
    d = chaseDistance + 0.97 * ( d - chaseDistance );
    offset.subVectors( self.position, smoothTarget );
    offset.setLength( d );
    offset.add( smoothTarget );

    // Make sure we stay above ground
    var desiredH = heightAt( offset ) + chaseHeight;
    offset.z = desiredH + 0.97 * ( offset.z - desiredH );

    UserActions.setCamera( {
      position: offset,
      target: smoothTarget
    } );

    if ( options.onAnimationFrame ) {
      options.onAnimationFrame(
        geoproject.unproject( smoothTarget ) );
    }
  };

  var currentPosition = this.position.clone();
  var currentTarget = this.target.clone();
  this.constrainCamera = false;
  var onComplete = function () {
    self.constrainCamera = true;
    self.panToPosition( {
      position: currentPosition,
      target: currentTarget,
      duration: 2.0,
      ease: StoreUtils.smootherstep
    } );

    // Revert to old camera near
    setTimeout( function () {
      camera.near = oldCameraNear;
      camera.updateProjectionMatrix();
    }, 500 );

    if ( options.onComplete ) { options.onComplete() }
  };

  var features = Array.isArray( options.feature ) ?
    options.feature :
    [ options.feature ];

  var animateAlongFeatureWithIndex = function ( f ) {
    var feature = features[ f ];
    var segmentAnimation = function () {
      // Animate along curve
      StoreUtils.transition( follow, 0, 1, {
        duration: feature.curve.getLength() / chaseSpeed, // in m/s
        ease: StoreUtils.linear,
        // Convert u value into position on curve
        lerp: function ( initial, final, u ) {
          return feature.curve.getPointAt( u );
        },
        onCancel: onComplete,
        onComplete: function () {
          if ( f < features.length - 1 ) {
            // Move onto next feature
            animateAlongFeatureWithIndex( f + 1 );
          } else {
            // Finish animation and return to start
            onComplete();
          }
        }
      } );

      if ( options.onFeatureReached ) {
        options.onFeatureReached( feature.id );
      }
    };

    if ( f === 0 ) {
      // For first feature move to initial position and start
      var initialTarget = feature.curve.getPointAt( 0 );
      var initialStep = feature.curve.getPointAt( 0.01 );
      var initialPosition = initialTarget.clone().sub( initialStep );
      initialPosition.setLength( Math.max( chaseDistance, 100 ) );
      initialPosition.add( initialTarget );
      initialPosition.z += chaseHeight;
      self.panToPosition( {
        position: initialPosition,
        target: initialTarget,
        duration: 2,
        ease: StoreUtils.smootherstep,
        onComplete: segmentAnimation,
        onCancel: onComplete
      } );
    } else {
      // Otherwise smoothly continue
      segmentAnimation();
    }
  };

  // Animate along first feature, which will in turn animate along the next
  animateAlongFeatureWithIndex( 0 );
};


// Configure various parameters of camera
CameraStore.prototype.configure = function ( options ) {
  var self = this;
  _.forEach( options, function ( value, key ) {
    self[ key ] = value;
  } );
  var keys = [
    'minDistance', 'minHeight', 'maxBounds', 'maxDistance',
    'minPolarAngle', 'maxPolarAngle',
    'noPan', 'noRotate', 'noZoom'
  ];
  _.forEach( keys, function ( key ) {
    if ( self.hasOwnProperty( key ) ) { self.controls[ key ] = self[ key ] }
  } );
};

CameraStore.displayName = 'CameraStore';
export default alt.createStore( CameraStore );
