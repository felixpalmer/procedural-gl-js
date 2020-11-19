/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alt from '/alt';

import RenderActions from '/actions/render';
// In order to provide frame based animation, wrap requestAnimationFrame
// in a Store, so we can emit evens the rest of the app can listen to
// This allows us to have multiple syncronized animations, but only one RaF
function AnimationStore() {
  this.paused = false;
  this.time = 0;
  this.bindListeners( {
    play: RenderActions.play,
    pause: RenderActions.pause
  } );

  // Setup syncronizing RaF
  const tick = time => {
    window.requestAnimationFrame( tick );
    if ( !this.paused ) {
      this.time = time;
      this.emitChange();
    }
  };

  window.requestAnimationFrame( tick );
}

AnimationStore.prototype.play = function () {
  this.paused = false;
  return false;
};

AnimationStore.prototype.pause = function () {
  this.paused = true;
  return false;
};

AnimationStore.displayName = 'AnimationStore';

export default alt.createStore( AnimationStore );
