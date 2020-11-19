/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import gui from '/gui';
import UserActions from '/actions/user';

const Procedural = {};

/**
 * @exports Procedural
 * @name Environment
 * @description Environments describe how the scene is rendered,
 * for example the color of the lighting, or the position of the
 * sun.
 *
 * To interactively adjust the values of the environment
 * you can use the editor, launched using:
 * [Procedural.environmentEditor]{@link module:Environment.environmentEditor}
 */

/**
 * @name setEnvironment
 * @memberof module:Environment
 * @function
 * @param {Object} environment
 * @description Update the engine's environment to the environment
 * configuration passed.
 * @example
 * var environment = {
 *   title: 'custom',
 *   parameters: {
 *     inclination: 0.6,
 *     fogDropoff: 0.0002
 *   }
 * };
 * Procedural.setEnvironment( environment )
 */
Procedural.setEnvironment = function ( environment ) {
  setTimeout( function () { UserActions.setEnvironment( environment ) }, 0 );
};

/**
 * @name environmentEditor
 * @memberof module:Environment
 * @function
 * @description Launches the environment editor
 */
Procedural.environmentEditor = function () { gui.initEnv() };

export default Procedural;
