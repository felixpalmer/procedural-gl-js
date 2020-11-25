/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import CameraStore from '/stores/camera';
import ContainerStore from '/stores/container';
import '/stores/engine';
import '/gui';
import '/envParams';

// Scene objects
import '/currentLocation';
import '/lines';
import '/markers';
import '/sky';
import '/skyBox';
import '/terrain';

import picker from '/picker';
import UserActions from '/actions/user';
import UserInputStore from '/stores/userInput';
var container = ContainerStore.getState().element;
var app = {
  mouse: { x: 0, y: 0 },
  init: function () {
    var raycastMouse = function () {
      // Convert to raycasting coordinate space
      var vector = ContainerStore.toClipSpace( app.mouse );

      var zoomArea = 0.2;
      var shouldZoom = Math.abs( vector.x ) < zoomArea && Math.abs( vector.y ) < zoomArea;
      // If more or less tapping on where we are, interpret as zoom
      if ( shouldZoom ) {
        UserActions.doubleTapZoom();
        return;
      }

      // ...otherwise as pan
      var p = picker.raycastTerrain( app.mouse );
      if ( Math.abs( p.x ) < 7500 && Math.abs( p.y ) < 7500 ) {
        UserActions.focusOnTarget( p );
      }
    };

    var raycastFeature = function () {
      return picker.pickFeature( app.mouse );
    };

    // Mouse input
    var lastFeature = null;
    var updateMouse = function ( e ) {
      var userInput = UserInputStore.getState();
      if ( userInput.interacting ) {
        return;
      }

      // Reliably get mouse position across browsers
      var target = e.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = e.clientX || e.pageX,
        offsetY = e.clientY || e.pageY;
      offsetX -= rect.left,
      offsetY -= rect.top;
      if ( isNaN( offsetX ) || isNaN( offsetY ) ) {
        // Ignore events without coordinates (e.g. touchend)
        return;
      }

      app.mouse = { x: offsetX, y: offsetY };

      // Disable raycasting for now
      return; // Get spurious errors with this enabled
      var feature = raycastFeature();
      if ( feature !== lastFeature ) {
        UserActions.featureSelected( feature );
        lastFeature = feature;
      }
    };

    var isTouchCapable = 'ontouchstart' in window ||
       window.DocumentTouch && document instanceof window.DocumentTouch ||
       navigator.maxTouchPoints > 0 ||
       window.navigator.msMaxTouchPoints > 0;
    if ( !isTouchCapable ) {
      container.addEventListener( 'mousemove', function ( e ) {
        updateMouse( e );
      } );
    }

    // Handle container clicks
    var onContainerClick = e => {
      if ( e.detail === 2 ) {
        // On double click
        raycastMouse();
      } else {
        var feature = raycastFeature();
        if ( feature ) { UserActions.featureClicked( feature ) }
      }

      return true;
    };

    const controls = CameraStore.getState().controls;
    controls.addEventListener( 'click', e => {
      updateMouse( e );
      onContainerClick( e );
    } );
  }
};

export default app;
