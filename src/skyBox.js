/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import _ from 'lodash';
import renderer from '/renderer';
import skyUniforms from '/uniforms/sky';
import skyBoxUniforms from '/uniforms/skyBox';
import skySpheremapFragment from 'shader/skySpheremap.frag';
import tonemapUniforms from '/uniforms/tonemap';
import quadVertex from 'shader/quad.vert';
import RenderStore from '/stores/render';
import webgl from '/webgl';
// Renders sky onto plane render target
var skyBox = {
  camera: null,
  enabled: true,
  renderTarget: null,
  scene: new THREE.Scene(),
  init: function () {
    var parameters = {
      format: THREE.RGBFormat,
      type: ( webgl.render565 ? THREE.UnsignedShort565Type :
        THREE.UnsignedByteType ),
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    };

    // Render quad orthographically
    skyBox.width = 256; // 256KB of memory (if just using for fog do not need accuracy)
    skyBox.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 10000 );
    skyBox.scene.add( skyBox.camera );
    skyBox.camera.position.z = 10;
    skyBox.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) ); // Look up at sky!
    skyBox.renderTarget = new THREE.WebGLRenderTarget( skyBox.width, skyBox.width, parameters );
    skyBoxUniforms.uSkybox.value = skyBox.renderTarget.texture;

    var plane = new THREE.PlaneBufferGeometry( 2, 2 );
    skySpheremapFragment.define( 'STEP', ( 1.0 / skyBox.width ).toExponential() );
    var material = new THREE.RawShaderMaterial( {
      name: 'skybox',
      uniforms: _.assign( {},
        skyUniforms,
        tonemapUniforms
      ),
      vertexShader: quadVertex.value,
      fragmentShader: skySpheremapFragment.value
    } );
    var quad = new THREE.Mesh( plane, material );
    skyBox.scene.add( quad );

    // Trigger renders
    RenderStore.listen( function ( state ) {
      if ( state.env ) { skyBox.process() }
    } );
  },
  process: function () {
    renderer.setRenderTarget( skyBox.renderTarget );
    renderer.render( skyBox.scene, skyBox.camera );
  }
};

skyBox.init();

export default skyBox;
