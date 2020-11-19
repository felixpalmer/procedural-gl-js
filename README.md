procedural-gl.js
================

<img src="https://github.com/felixpalmer/procedural-gl-js/blob/main/screenshots/title.jpg" width="40%" align="right" />

Procedural GL JS is a library for creating 3D map experiences on the web, written in JavaScript and WebGL. It is built on top [THREE.js](https://github.com/mrdoob/three.js).

It provides an easy-to-use, but powerful framework to allow 3D maps to be embedded into web pages. Super-fast loading and optimized for mobile devices.

[Examples](https://www.procedural.eu) | [Docs](https://www.procedural.eu) | [Overlay playground](https://www.procedural.eu) | [Elevation data](https://www.nasadem.xyz)

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

License
=======

Procedural GL JS is licensed under the [Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/).
