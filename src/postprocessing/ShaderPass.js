/**
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from 'three.lib';
import { Pass } from "../postprocessing/Pass";
const getFullscreenTriangleWithSize = function ( w, h ) {
  // Create triangle that covers the area produced by:
  //return new THREE.PlaneBufferGeometry( w, h );

  var vertices = new Float32Array( [
    -0.5 * w, -0.5 * h, 0,
    1.5 * w, -0.5 * h, 0,
    -0.5 * w, 1.5 * h, 0
  ] );
  var uvs = new Float32Array( [0, 0, 2, 0, 0, 2] );
  var geom = new THREE.BufferGeometry();
  if ( geom.setAttribute !== undefined ) {
    geom.setAttribute( "position", new THREE.BufferAttribute( vertices, 3 ) );
    geom.setAttribute( "uv", new THREE.BufferAttribute( uvs, 2 ) );
  } else {
    geom.addAttribute( "position", new THREE.BufferAttribute( vertices, 3 ) );
    geom.addAttribute( "uv", new THREE.BufferAttribute( uvs, 2 ) );
  }

  return geom;
}

// Full screen triangle is more cache-friendly than
// two triangles
const _fullScreenTriangle = null;
const getFullscreenTriangle = function ( w, h ) {
	if ( _fullScreenTriangle === null ) {
    _fullScreenTriangle = getFullscreenTriangleWithSize( 2, 2 );
	}

	return _fullScreenTriangle;
}

const ShaderPass = function ( shader, textureID ) {

	Pass.call( this );

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	if ( shader instanceof THREE.ShaderMaterial ||
	     shader instanceof THREE.RawShaderMaterial ) {

		this.uniforms = shader.uniforms;

		this.material = shader;

	} else if ( shader ) {

		this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

		this.material = new THREE.RawShaderMaterial( {

			defines: Object.assign( {}, shader.defines ),
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader

		} );

	}

	this.fsQuad = new Pass.FullScreenQuad( this.material );

};

ShaderPass.prototype = Object.assign( Object.create( Pass.prototype ), {

	constructor: ShaderPass,

	render: function ( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer.texture;

		}

		this.fsQuad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.setRenderTarget( null );
			this.fsQuad.render( renderer );

		} else {

			renderer.setRenderTarget( writeBuffer );
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if ( this.clear ) renderer.clear( renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil );
			this.fsQuad.render( renderer );

		}

	},

  compile: function ( renderer ) {
    var tmpScene = new THREE.Scene();
    var obj = new THREE.Object3D();
    obj.material = this.material;
    tmpScene.add( obj );
    renderer.compile( tmpScene, this.fsQuad._camera );
    tmpScene.children = [];
  }
} );

export { getFullscreenTriangleWithSize, ShaderPass };
