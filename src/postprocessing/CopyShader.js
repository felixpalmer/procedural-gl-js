/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */



var CopyShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"opacity": { value: 1.0 }

	},

	vertexShader: [
    "precision highp float;",

    "uniform mat4 modelViewMatrix;",
    "uniform mat4 projectionMatrix;",

    "attribute vec3 position;",
    "attribute vec2 uv;",

		"varying vec2 vUv;",

		"void main() {",

		"	vUv = uv;",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

    "precision highp float;",

		"uniform float opacity;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

		"	vec4 texel = texture2D( tDiffuse, vUv );",
		"	gl_FragColor = opacity * texel;",

		"}"

	].join( "\n" )

};

export { CopyShader };
