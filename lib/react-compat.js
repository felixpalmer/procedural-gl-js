import Preact from 'preact.umd.min';
  // Keep compat layer minimal so we can more easily
  // track the differences
  var AUTOBIND_BLACKLIST = {
    constructor: 1,
    render: 1,
    shouldComponentUpdate: 1,
    componentWillReceiveProps: 1,
    componentWillUpdate: 1,
    componentDidUpdate: 1,
    componentWillMount: 1,
    componentDidMount: 1,
    componentWillUnmount: 1,
    componentDidUnmount: 1
  };
  function bindAll(ctx) {
    for (var i in ctx) {
      var v = ctx[i];
      if (typeof v === 'function' && !v.__bound && !AUTOBIND_BLACKLIST.hasOwnProperty(i)) {
        (ctx[i] = v.bind(ctx)).__bound = true;
      }
    }
  }

  var React = Preact;
  React.createClass = function ( obj ) {
    function F(props, context) {
      bindAll(this);
      Preact.Component.call( this, props, context );
    }

    var p = F.prototype = new Preact.Component;
    // copy our skeleton into the prototype:
    for ( var i in obj ) { p[i] = obj[i]; }
    // restore constructor:
    return p.constructor = F;
  }

  var _render = React.render;
  React.render = function ( obj, el ) {
    el.innerHTML = null;
    _render( obj, el );
  }

  export default React;
