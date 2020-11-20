/*global Procedural, CodeMirror, bbox, geojsonhint*/
if ( typeof window.Procedural === 'undefined' ) { window.Procedural = {}; }
var codeMirror;
var errorWidgets = [];
var app = document.getElementById( 'app' );
var editor = document.getElementById( 'editor' );
var clearButton = document.getElementById( 'clear-button' );
var updateButton = document.getElementById( 'update-button' );
var exampleList = document.getElementById( 'example-list' );
var li, a, ul, overlayExamples;
var exampleInUrl;

var D = function ( a, b ) {
  return Math.sqrt( a * a, b * b );
};

var overlayCenter = function ( overlay ) {
  var bounds = bbox( overlay );
  if ( !isFinite( bounds[0] ) ) { return null; }
  var distance = 250000 * D( bounds[2] - bounds[0], bounds[3] - bounds[1] );
  distance = Math.min( Math.max( distance, 1000 ), 6000 );
  return {
    longitude: 0.5 * ( bounds[0] + bounds[2] ),
    latitude: 0.5 * ( bounds[1] + bounds[3] ),
    distance: distance
  };
};

var addOverlay = function ( overlay ) {
  Procedural.addOverlay( overlay );
  var center = overlayCenter( overlay );
  if ( center ) { Procedural.focusOnLocation( center ); }
};

var loadSnippet = function ( snippet ) {
  var text = JSON.stringify( snippet, null, 2 );

  // Pretty hacky way to condense LineString and Point coordinates
  text = text.replace( /\[[^\{\]]+/g, function ( v ) { return v.replace( /\n\s+/g, ' '); } );
  text = text.replace( /\[ \[/g, '[\n          [' );
  codeMirror.setValue( text );
  addOverlay( JSON.parse( text ) );
};

var onEditorUpdate = function () {
  errorWidgets.forEach( function ( w ) {
    w.clear();
  } );
  var errors = geojsonhint.hint( codeMirror.getValue() );
  errorWidgets = errors.map( function ( error ) {
    var div = document.createElement( 'div' );
    div.innerText = error.message;
    div.className = 'cm-error';
    return codeMirror.addLineWidget( error.line + 1, div );
  } );
};

var init = function () {
  /*jshint newcap:false*/
  codeMirror = CodeMirror( editor, {
    lineNumbers: true,
    mode: 'application/json',
    matchBrackets: true,
    tabSize: 2,
    theme: 'blackboard',
    smartIndent: true
  } );

  codeMirror.on( 'change', onEditorUpdate );

  // Load in Obertauern
  Procedural.displayLocation( { latitude: 47.25, longitude: 13.55, features: 'hiking' } );
  Procedural.setCameraModeControlVisible( true );
  Procedural.setCompassVisible( true );
  Procedural.setRotationControlVisible( true );
  Procedural.setZoomControlVisible( true );

  // Once location data is loaded initialize in `app` element
  var datasource = {
    elevation: {
      apiKey: '12c27d08882df417c977cf5af64fd84f0'
    },
    imagery: {
      apiKey: 'EIvJ3LPyMVsxeNd3Lyao',
      urlFormat: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key={apiKey}',
      attribution: '<a href="https://www.maptiler.com/copyright/">Maptiler</a> <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  }

  Procedural.init( { container: app, datasource } );

  // Load in first example
  if ( exampleInUrl ) {
    loadSnippet( exampleInUrl );
  } else {
    loadSnippet( overlayExamples[ 2 ].items[ 2 ].value );
  }

  // Configure editor UI
  clearButton.onclick = function () {
    loadSnippet( {
     type: "FeatureCollection",
     features: []
    } );
  };
  updateButton.onclick = function () {
    addOverlay( JSON.parse( codeMirror.getValue() ) );
  };
};

var xhr = new XMLHttpRequest();
xhr.open( 'GET', 'examples.json' );
xhr.responseType = 'json';
xhr.onerror = function () {
  console.log( 'Error fetching overlay' );
};
xhr.onload = function() {
  overlayExamples = xhr.response;
  init();

  var hash = window.location.hash.split( '#' )[1];
  overlayExamples.forEach( function ( group ) {
    li = document.createElement( 'li' );
    a = document.createElement( 'a' );
    ul = document.createElement( 'ul' );
    a.innerText = group.group;
    li.appendChild( a );
    li.appendChild( ul );
    exampleList.appendChild( li );

    group.items.forEach( function ( example ) {
      var li = document.createElement( 'li' );
      var a = document.createElement( 'a' );

      // Provide links to examples
      var href = group.group + '/' + example.name;
      href = href.toLowerCase();
      href = href.replace( /\s-\s/g, '-' );
      href = href.replace( /\s/g, '-' );
      a.href = '#' + href;
      if ( href === hash ) {
        exampleInUrl = example.value;
      }

      a.innerText = example.name;
      a.onclick = function () {
        loadSnippet( example.value );
      };
      li.appendChild( a );
      ul.appendChild( li );
    } );
  } );
};

xhr.send();
