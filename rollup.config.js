/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import shader from './src/rollup-plugin-shader';
import { string } from 'rollup-plugin-string';
import sucrase from '@rollup/plugin-sucrase';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import rootImport from 'rollup-plugin-root-import';
import visualizer from 'rollup-plugin-visualizer';
import pkg from "./package.json";

const DEV = !!process.env.DEV;
const SHADER_DIR = DEV ? 'shaders' : 'shaders/min';
export default {
  input: 'src/index.js',
  output: {
    name: 'Procedural',
    file: `build/procedural-gl${ DEV ? '.module' : '' }.js`,
    // To allow three to be imported as module in DEV use 'esm'
    format: DEV ? 'esm' : 'umd',
    sourcemap: true
  },
  treeshake: !DEV,
	plugins: [ 
    replace( {
      __buildVersion__: `'${pkg.version}'`,
      __dev__: DEV
    } ),
		alias({
			entries: [
				{ find: 'dat', replacement: 'dat.gui.min' },
				{ find: '/gui', replacement: DEV ? '/gui' : '/empty' },
				{ find: 'lodash', replacement: 'lodash.min' },
				{ find: '@mapbox/tilebelt', replacement: 'tilebelt' },
				{ find: 'react', replacement: 'react-compat' },
				{ find: 'shader', replacement: `../${SHADER_DIR}` },
				{ find: 'three.lib', replacement: 'three.module.js' }
			]
		}),
		resolve( {
      extensions: ['.js', '.jsx'],
      customResolveOptions: {
        moduleDirectory: 'lib'
      }
    } ),
		rootImport({
      root: `${__dirname}/src`,
      useInput: 'prepend',

      // If we don't find the file verbatim, try adding these extensions
      extensions: '.js',
    }),
    shader( { include: `${SHADER_DIR}/**` } ),
    commonjs({
      include: [
        'node_modules/**',
        'lib/**'
      ],
      exclude: [
        'node_modules/process-es6/**'
      ]
    }),
		string( { include: [/\.css$/, /\.json$/, /\.svg$/] } ),
		sucrase( {
      exclude: [ 'node_modules/**', `${SHADER_DIR}/**` ],
      production: true,
      transforms: [ 'jsx' ]
    } ),
    !DEV && visualizer( { gzipSize: true } )
  ],
	onwarn: function ( warning ) {
		if ( warning.code === 'THIS_IS_UNDEFINED' ) { return }
		console.error(warning.message);
	},
  // For faster builds, treat three as external in DEV mode
  external: DEV ? [ '/lib/three.module.js' ] : []
};
