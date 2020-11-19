/**
 * @author alteredq / http://alteredqualia.com/
 */

import {
	Clock,
  DepthTexture,
	LinearFilter,
	Mesh,
	OrthographicCamera,
	PlaneBufferGeometry,
	RGBAFormat,
	Vector2,
	WebGLRenderTarget
} from "three.lib";
import { CopyShader } from "../postprocessing/CopyShader.js";
import { ShaderPass } from "../postprocessing/ShaderPass.js";

var EffectComposer = function ( renderer, renderTarget, hd ) {
  // When we have HD passes enabled, we first render normal
  // passes, keeping the depth buffer available for the
  // HD pass after. This is useful e.g. for rendering a
  // low-resolution scene and then adding high-resolution
  // labels on top
  this.hd = !!hd;

	this.renderer = renderer;

	if ( renderTarget === undefined ) {

		var parameters = {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat,
			stencilBuffer: false
		};

		var size = renderer.getSize( new Vector2() );
		renderTarget = new WebGLRenderTarget( size.width, size.height, parameters );
		renderTarget.texture.name = 'EffectComposer.rt1';

	}

	this.renderTarget1 = renderTarget;
	this.renderTarget2 = renderTarget.clone();
	this.renderTarget2.texture.name = 'EffectComposer.rt2';

  // For HD passes, need to setup depth texture
  // that allows us to pass the depth from the
  // original (non-HD) passes to the HD pass
  var depthTexture;
  if ( this.hd ) {
    this.renderTargetHD = renderTarget.clone();
    depthTexture = new DepthTexture();
    this.renderTarget1.depthTexture = depthTexture;
    this.renderTarget2.depthTexture = depthTexture;
  }

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.renderToScreen = true;

	this.passes = [];

	// dependencies

	if ( CopyShader === undefined ) {

		console.error( 'THREE.EffectComposer relies on CopyShader' );

	}

	if ( ShaderPass === undefined ) {

		console.error( 'THREE.EffectComposer relies on ShaderPass' );

	}

	this.copyPass = new ShaderPass( CopyShader );

	this.clock = new Clock();

};

Object.assign( EffectComposer.prototype, {

	swapBuffers: function () {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {
    if ( pass.hd && !this.hd ) {
      console.error( 'Cannot add HD pass to a non-HD EffectComposer' );
    }

		this.passes.push( pass );
		var size = this.renderer.getSize( new Vector2() );
		pass.setSize( size.width, size.height );

	},

	insertPass: function ( pass, index ) {

		this.passes.splice( index, 0, pass );

	},

	isLastEnabledPass: function ( passIndex ) {

		for ( var i = passIndex + 1; i < this.passes.length; i ++ ) {

			if ( this.passes[ i ].enabled ) {

				return false;

			}

		}

		return true;

	},

	render: function ( deltaTime ) {

		// deltaTime value is in seconds

		if ( deltaTime === undefined ) {

			deltaTime = this.clock.getDelta();

		}

		var currentRenderTarget = this.renderer.getRenderTarget();

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( pass.enabled === false ) continue;
    
      var src = this.readBuffer;
      if ( pass.hd ) { src = this.renderTargetHD; }
      if ( pass.src ) { src = pass.src; }

			pass.renderToScreen = ( this.renderToScreen && this.isLastEnabledPass( i ) );
			pass.render( this.renderer, this.writeBuffer, src, deltaTime, maskActive );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.getContext();
					var stencil = this.renderer.state.buffers.stencil;

					//context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
					stencil.setFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, deltaTime );

					//context.stencilFunc( context.EQUAL, 1, 0xffffffff );
					stencil.setFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

		}

		this.renderer.setRenderTarget( currentRenderTarget );

	},

	reset: function ( renderTarget ) {

		if ( renderTarget === undefined ) {

			var size = this.renderer.getSize( new Vector2() );
			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize( size.width, size.height );

		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	},

	setSize: function ( width, height, hdWidth, hdHeight ) {

		this.renderTarget1.setSize( width, height );
		this.renderTarget2.setSize( width, height );

    if ( this.hd ) {
      this.renderTargetHD.setSize( hdWidth, hdHeight );
    }

		for ( var i = 0; i < this.passes.length; i ++ ) {

			this.passes[ i ].setSize(
        this.hd && this.passes[i].hd ? hdWidth : width,
        this.hd && this.passes[i].hd ? hdHeight : height );

		}

	}
} );


var Pass = function () {

	// if set to true, the pass is processed by the composer
	this.enabled = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	this.needsSwap = true;

	// if set to true, the pass clears its buffer before rendering
	this.clear = false;

	// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
	this.renderToScreen = false;

};

Object.assign( Pass.prototype, {

	setSize: function ( /* width, height */ ) {},

	render: function ( /* renderer, writeBuffer, readBuffer, deltaTime, maskActive */ ) {

		console.error( 'THREE.Pass: .render() must be implemented in derived pass.' );

	}

} );

// Helper for passes that need to fill the viewport with a single quad.
Pass.FullScreenQuad = ( function () {

	var camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	var geometry = new PlaneBufferGeometry( 2, 2 );

	var FullScreenQuad = function ( material ) {

		this._mesh = new Mesh( geometry, material );

	};

	Object.defineProperty( FullScreenQuad.prototype, 'material', {

		get: function () {

			return this._mesh.material;

		},

		set: function ( value ) {

			this._mesh.material = value;

		}

	} );

	Object.assign( FullScreenQuad.prototype, {

		dispose: function () {

			this._mesh.geometry.dispose();

		},

		render: function ( renderer ) {

			renderer.render( this._mesh, camera );

		}

	} );

	return FullScreenQuad;

} )();

export { EffectComposer, Pass };
