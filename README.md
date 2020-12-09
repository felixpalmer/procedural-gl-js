procedural-gl.js
================

<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/title.jpg" width="40%" align="right" />

Procedural GL JS is a library for creating 3D map experiences on the web, written in JavaScript and WebGL. It is built on top of [THREE.js](https://github.com/mrdoob/three.js).

It provides an easy-to-use, but powerful framework to allow 3D maps to be embedded into web pages. Super-fast loading and optimized for mobile devices.

[Demo](https://felixpalmer.github.io/procedural-gl-js/) | [Docs](https://felixpalmer.github.io/procedural-gl-js/docs/) | [Overlay playground](https://felixpalmer.github.io/procedural-gl-js/docs/overlays.html) | [Elevation data](https://www.nasadem.xyz) | [Source](https://github.com/felixpalmer/procedural-gl-js)

Key features
============

- Stream in standard raster imagery tiles. Supports map tiles from a variety of providers
- Batteries included elevation data. Global 3D data coverage courtesy of [nasadem.XYZ](https://www.nasadem.xyz)
- Powerful overlay capabilities. Draw crisp markers and lines
- Well-thought-out API, complex applications can be built without needing to deal with 3D concepts
- Great UX and intuitive controls, mouse-based on desktop & touch-based on mobile
- Tiny filesize means library is parsed fast. Package size is less than THREE.js thanks to code stripping
- Novel GPU powered level-of-detail system. Off-loading to the GPU frees up the main JavaScript UI thread

Install
=======

    npm install procedural-gl

Usage
=====

```javascript
import Procedural from 'procedural-gl';

// Choose a DOM element into which the library should render
const container = document.getElementById( 'container' );

// Configure datasources (see documentation for details)
const datasource = { ... };

// Initialize library and optionally add UI controls
Procedural.init( { container, datasource } );
Procedural.setRotationControlVisible( true );

// Load real-world location
const montBlanc = { latitude: 45.8326364, longitude: 6.8564201 };
Procedural.displayLocation( montBlanc );
```

Screenshots
===========
<p>
<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/1.jpg" width="17%" >
<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/2.jpg" width="17%" align="left" />
<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/3.jpg" width="17%" align="left" />
<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/4.jpg" width="17%" align="left" />
<img src="https://raw.githubusercontent.com/felixpalmer/procedural-gl-js/main/screenshots/5.jpg" width="17%" align="left" />
</p>

Examples
========

- [New Zealand National Parks](https://github.com/felixpalmer/new-zealand-3d/)

License
=======

Procedural GL JS is licensed under the [Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/).
