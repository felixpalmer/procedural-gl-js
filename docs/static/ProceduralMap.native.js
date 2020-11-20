import React, {Component} from 'react';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';

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

export default class ProceduralMap extends Component {
  constructor(props) {
    super(props);
    this.generateMethods();
    this._ready = false;
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
        this.webview.injectJavaScript(`
          Procedural.${setter}( ${JSON.stringify(value)} ); true;
        `);
      }
    }

    // Support proxying handlers via props
    for ( let callback of SUPPORTED_CALLBACKS ) {
      if ( typeof(nextProps[callback]) === 'function' ) {
        this.webview.injectJavaScript(`
          Procedural.${callback} = function ( data ) {
            const payload = { name: '${callback}', data };
            window.ReactNativeWebView.postMessage( JSON.stringify( payload ) );
          };
          true;
        `);
      }
    }
  }

  onMessage({ nativeEvent: state }) {
    const payload = JSON.parse( state.data );
    const name = payload.name;
    if ( name === 'onReady' ) {
      this._ready = true;
      this.proxyProps( this.props, true );
      if ( typeof( this.props.onReady ) === 'function' ) {
        this.props.onReady();
      }
    } else if ( SUPPORTED_CALLBACKS.indexOf( name ) !== -1 &&
         typeof( this.props[name] ) === 'function' ) {
      this.props[name](payload.data);
    }
  }

  generateMethods() {
    for ( let method of SUPPORTED_METHODS ) {
      this[method] = (...args) => {
        const argValues = JSON.stringify( args ).slice(1, -1);
        this.webview.injectJavaScript(`
          Procedural.${method}( ${argValues} ); true;
        `);
      }
    }
  }

  get ready() {
    return this._ready;
  }

  shouldComponentUpdate( nextProps ) {
    // Pass through props to Procedural lib
    this.proxyProps( nextProps );

    // Never trigger a React update
    return false;
  }

  render() {
    const initScript = `
    if ( typeof window.Procedural === 'undefined' ) { Procedural = {}; };
    var init = function () {
      var container = document.getElementById( 'app' );
      Procedural.init( container );
      window.ReactNativeWebView.postMessage( JSON.stringify( {
        name: 'onReady'
      } ) );
    };

    // When engine is ready initialize
    if ( Procedural.ready ) {
      init();
    } else {
      Procedural.onReady = init;
    }

    true;
    `;

    let uri = 'Web.bundle/index.html';
    if ( Platform.OS === 'android' ) {
      uri = 'file:///android_asset/' + uri;
    }
    return (
      <WebView
      source={{uri}}
      useWebKit={true}
      injectedJavaScript={initScript}
      javaScriptEnabled={true}
      // Do not include https to allow logo to load in external browser
      originWhitelist={['file://', 'http://']}
      allowFileAccess={true}
      onMessage={this.onMessage.bind(this)}
      ref={ref => (this.webview = ref)}
      />
    );
  }
}
