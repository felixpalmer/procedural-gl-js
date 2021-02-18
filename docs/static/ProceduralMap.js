import React from 'react';

const SUPPORTED_SETTERS = [
  'setCameraMode',
  'setCameraModeControlVisible',
  'setCompassVisible',
  'setDisplayErrors',
  'setEnvironment',
  'setGeography',
  'setLayersControlVisible',
  'setRotationControlVisible',
  'setUserLocation',
  'setUserLocationControlVisible',
  'setZoomControlVisible'
];

const SUPPORTED_CALLBACKS = [
  'onBoundsFocused',
  'onFeatureClicked',
  'onFeatureSelected',
  'onFeaturesLoaded',
  'onLocationError',
  'onLocationFocused',
  'onLocationLoaded',
  'onOverlayAdded',
  // 'onReady', handled manually, see below
  'onUserInteraction'
];

const SUPPORTED_METHODS = [
  'addBuiltinOverlay',
  'addOverlay',
  'animateAlongFeature',
  'datafileForLocation',
  'displayLocation',
  'environmentEditor',
  'focusOnBounds',
  'focusOnFeature',
  'focusOnLocation',
  'geographyEditor',
  'highlightFeature',
  'orbitTarget',
  'pause',
  'play',
  'removeOverlay',
  'toggleUserLocationTracking',
  'updateOverlay'
];

export default class ProceduralMap extends React.Component {
  constructor(props) {
    super(props);
    if ( typeof Procedural === 'undefined' ) {
      window.Procedural = {};
    }
    this.generateMethods();
  }

  proxyProps( nextProps, force ) {
    // Support invoking of methods using props
    for ( let setter of SUPPORTED_SETTERS ) {
      let prop = setter;
      if ( setter.slice(0, 3) === 'set' ) {
        prop = setter.slice(3);
        prop = prop.charAt( 0 ).toLowerCase() + prop.slice(1);
      }

      if ( nextProps[prop] !== this.props[prop] ||
           ( force && nextProps[prop] !== undefined ) ) {
        const value = nextProps[prop];
        Procedural[setter](value);
      }
    }

    // Support proxying handlers via props
    for ( let callback of SUPPORTED_CALLBACKS ) {
      if ( nextProps[callback] !== Procedural[callback] &&
           typeof(nextProps[callback]) === 'function' ) {
        Procedural[callback] = nextProps[callback];
      }
    }
  }

  generateMethods() {
    for ( let method of SUPPORTED_METHODS ) {
      this[method] = (...args) => {
        Procedural[method](...args);
      }
    }
  }

  get ready() {
    return !!Procedural.ready;
  }

  componentDidMount() {
    const init = () => {
      this.proxyProps( this.props, true );
      Procedural.init( this.el );
      if ( typeof(this.props.onReady) === 'function' ) {
        this.props.onReady();
      }
    };

    // When engine is ready initialize
    if ( Procedural.ready ) {
      init();
    } else {
      Procedural.onReady = init;
    }
  }

  shouldComponentUpdate( nextProps ) {
    // Pass through props to Procedural lib
    this.proxyProps( nextProps );

    // Never trigger a React update
    return false;
  }

  render() {
    return React.createElement( 'div', {
      ref: el => this.el = el,
      style: { height: '100%', width: '100%' }
    } );
  }
}
