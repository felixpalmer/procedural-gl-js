/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import alt from '/alt';
import AnimationStore from '/stores/animation';
import RenderStore from '/stores/render';
import RenderActions from '/actions/render';
import UserActions from '/actions/user';
import webgl from '/webgl';
// The ContainerStore provides access to the dom element that houses
// the rendering engine, to allow for attahcing of touch events etc
function ContainerStore() {
  // Actual size of canvas element, as measured on page
  this.width = 256;
  this.height = 256;
  this.lastResize = 0;

  // Size at which scene is rendered, derived from actual size
  // scaled by the calculated pixel ratio such that performance
  // doesn't suffer
  this.renderRatio = 1;
  this.renderWidth = 256;
  this.renderHeight = 256;

  // Size at which to render HD layers, such as labels and markers.
  // These we cannot render at a lower resolution as they get too blurred. This size is derived from the actual size scaled by the
  // devicePixelRatio
  this.pixelRatio = window.devicePixelRatio;
  this.canvasWidth = 256;
  this.canvasHeight = 256;

  this.aspect = 1;
  this.fov = 70;
  this.lodScale = 10.0; // Control how far to have LOD levels
  this.hd = true;
  this.forceHd = false;

  // Do not enable for non-depthTexture code path. It is more
  // trouble than it is worth as the labels jump in size
  this.lowDefMove = webgl.depthTexture; // If enabled, when moving render at half-resolution
  this.lowDefScale = 1.0;

  this.element = document.createElement( 'div' );
  this.element.style.position = 'relative';
  this.element.style.width = '100%';
  this.element.style.height = '100%';

  this.bindListeners( {
    containerResized: [ RenderActions.containerResized, RenderActions.containerMounted ],
    featureSelected: UserActions.featureSelected,
    setFieldOfView: RenderActions.setFieldOfView,
    forceHD: RenderActions.forceHD,
    setHD: RenderActions.setHD,
    setSize: RenderActions.setSize,
    inputStarted: UserActions.inputStarted,
    inputEnded: UserActions.inputEnded
  } );

  this.exportPublicMethods( {
    toClipSpace: this.toClipSpace.bind( this ),
    fromClipSpace: this.fromClipSpace.bind( this ),
    flipY: this.flipY.bind( this )
  } );

  var self = this;
  AnimationStore.listen( function () {
    if ( self.element.offsetWidth === 0 ||
         self.element.offsetHeight === 0 ) {
      return;
    }

    // Prior to each render check our size and aspect
    var rect = self.element.getBoundingClientRect();
    var aspect = rect.width / rect.height;
    if ( aspect !== self.aspect ||
         self.element.offsetWidth !== self.width ||
         self.element.offsetHeight !== self.height ) {
      RenderActions.containerResized();
    }
  } );
}

// Just trigger change events, do not provide mechanism for setting container
ContainerStore.prototype.containerResized = function () {
  if ( this.element.offsetWidth > 0 && this.element.offsetHeight > 0 ) {
    // Calculate aspect from actual visible rect as a CSS transform
    // may mean our actual size on screen is different to that
    // given by offsetWidth/offsetHeight. However use offsetWidth
    // and offsetHeight for the width/height as otherwise our
    // container size is wrong. This approach enables us to animate the
    // size and aspect of the engine, although touch-events are off
    // when CSS scaling is applied
    var rect = this.element.getBoundingClientRect();
    this.aspect = rect.width / rect.height;
    this.setSize( {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight
    } );
    this.lastResize = RenderStore.getState().clock.getElapsedTime();
  }
};

ContainerStore.prototype.featureSelected = function ( feature ) {
  this.element.style.cursor = feature ? 'pointer' : 'auto';
  return false;
};

ContainerStore.prototype.updateSizes = function () {
  this.renderWidth = this.width * this.renderRatio;
  this.renderHeight = this.height * this.renderRatio;

  // If we don't have depth texture support,
  // HD renders are just the same as standard
  this.pixelRatio = webgl.depthTexture ?
    window.devicePixelRatio : this.renderRatio;
  this.canvasWidth = this.width * this.pixelRatio;
  this.canvasHeight = this.height * this.pixelRatio;
};

// Calculates the pixel ratio at which we should render
// the scene relative to the size of our canvas
ContainerStore.prototype.getRenderRatio = function () {
  if ( !webgl.depthTexture ) { return 1.0 }

  var ratios = [ 1.0, 1.2, 1.5, 2.0 ];
  //ratios = [ 0.5 ];
  var limit = 1500000; // Max number of pixels to render
  var r = 0;
  var self = this;
  var pixelCount = function ( r ) {
    return ratios[ r ] * self.width * ratios[ r ] * self.height;
  };

  // Check if next level would result in too many pixels drawn
  while ( ratios[ r + 1 ] && pixelCount( r + 1 ) < limit ) {
    r++;
  }

  // Return lowest acceptable level
  return ratios[ r ];
};

ContainerStore.prototype.inputStarted = function () {
  if ( this.lowDefMove ) {
    var renderRatio = this.getRenderRatio();
    this.renderRatio = Math.max( 0.8, 0.75 * renderRatio );
    this.lowDefScale = this.renderRatio / renderRatio;
    this.updateSizes();
  } else {
    return false;
  }
};

ContainerStore.prototype.inputEnded = function () {
  if ( this.lowDefMove ) {
    this.renderRatio = this.getRenderRatio();
    this.lowDefScale = 1.0;
    this.updateSizes();
  } else {
    return false;
  }
};


// Manually set size of container. Useful for getting renderer right
// size/fov before it is displayed
ContainerStore.prototype.setSize = function ( size ) {
  this.width = size.width;
  this.height = size.height;
  this.lodScale = 1.5 * Math.min( 1000.0 / this.width, 1.0 ); // works with camera.js
  this.renderRatio = this.getRenderRatio();
  this.updateSizes();
};

ContainerStore.prototype.forceHD = function ( hd ) {
  this.forceHd = hd;
  this.renderRatio = this.getRenderRatio();
  this.updateSizes();
};

ContainerStore.prototype.setHD = function ( hd ) {
  this.hd = hd;
  this.renderRatio = this.getRenderRatio();
  this.updateSizes();
};

ContainerStore.prototype.setFieldOfView = function ( fov ) {
  this.fov = fov;
};

// Utility functions to convert to and from clipspace
ContainerStore.prototype.toClipSpace = function ( position ) {
  return new THREE.Vector2(
    ( position.x / this.width ) * 2 - 1, // -1 -> 1
    1 - ( position.y / this.height ) * 2 ); // 1 -> -1
};

ContainerStore.prototype.fromClipSpace = function ( position ) {
  return new THREE.Vector2(
    0.5 * ( 1 + position.x ) * this.width, // 0 -> width
    0.5 * ( 1 - position.y ) * this.height ); // 0 - > height
};

ContainerStore.prototype.flipY = function ( position ) {
  return new THREE.Vector2( position.x, this.height - position.y );
};

ContainerStore.displayName = 'ContainerStore';
export default alt.createStore( ContainerStore );
