/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import RenderActions from '/actions/render';

const Procedural = {};

/**
 * @exports Procedural
 * @name Rendering
 * @description The engine will only re-render the scene when
 * needed, and automatically pause rendering when appropriate,
 * e.g. when the containing browser tab is in the background.
 *
 * Using the [play]{@link module:Rendering.play} and [pause]{@link module:Rendering.pause} methods the engine can also be paused manually. This can
 * be used to pause the engine when the containing element scrolls
 * off the page.
 */

/**
 * @name play
 * @memberof module:Rendering
 * @function
 * @description Resumes the engine. See also [Rendering.pause]{@link module:Rendering.pause}
 */
Procedural.play = function () {
  setTimeout( function () { RenderActions.play() }, 0 );
};

/**
 * @name pause
 * @memberof module:Rendering
 * @function
 * @description Pauses the engine. See also [Rendering.play]{@link module:Rendering.play}
 */
Procedural.pause = function () {
  setTimeout( function () { RenderActions.pause() }, 0 );
};

export default Procedural;
