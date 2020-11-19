/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import THREE from 'three';
import { EffectComposer } from '/postprocessing/EffectComposer';
import { RenderPass } from '/postprocessing/RenderPass';
import { SavePass } from '/postprocessing/SavePass';
import { ShaderPass } from '/postprocessing/ShaderPass';
import camera from '/camera';
import ContainerStore from '/stores/container';
import defer from '/utils/defer';
import renderer from '/renderer';
import scene from '/scene';
import postprocessUniforms from '/uniforms/postprocess';
import postProcessFragment from 'shader/postprocess.frag';
import quadVertex from 'shader/quad_uv.vert';
import RenderStore from '/stores/render';
import webgl from '/webgl';
var state = ContainerStore.getState();
var parameters = {
  type: ( webgl.render565 ? THREE.UnsignedShort565Type :
    THREE.UnsignedByteType ),
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBFormat,
  stencilBuffer: false
};

var resolution = new THREE.Vector2( 1.0 / state.canvasWidth,
  1.0 / state.canvasHeight );
postprocessUniforms.uResolution.value.copy( resolution );

var renderTarget = new THREE.WebGLRenderTarget( state.renderWidth, state.renderHeight, parameters );

ContainerStore.listen( function ( state ) {
  composer.setSize(
    state.renderWidth, state.renderHeight,
    state.canvasWidth, state.canvasHeight );
  var resolution = new THREE.Vector2( 1.0 / state.canvasWidth,
    1.0 / state.canvasHeight );
  postprocessUniforms.uResolution.value.copy( resolution );
} );

var enableHDPass = webgl.depthTexture;
var composer = new EffectComposer( renderer, renderTarget, enableHDPass );

// Render actual scene
var renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

if ( enableHDPass ) {
  // Copy rendered scene to hd render target
  var savePass = new SavePass( composer.renderTargetHD );
  savePass.src = composer.renderTarget2;
  composer.addPass( savePass );
}

// The HD pass is drawn after everything else,
// optionally in a higher resolution (this is dependent
// on an extension). As we are drawing on top of the
// standard scene, we want to maintain color and depth,
// so we disable autoClear.
// In the case of a HD pass,  we are using a different
// buffer, so we do want to clear the depth, otherwise
// we'll keep the depth values from last time
var hdrenderPass = new RenderPass( scene.hd, camera );
hdrenderPass.autoClearColor = false;
hdrenderPass.autoClearDepth = enableHDPass;
hdrenderPass.hd = enableHDPass;
composer.addPass( hdrenderPass );

// Add postprocessing
var postprocessShader = {
  name: 'postprocess',
  uniforms: postprocessUniforms,
  vertexShader: quadVertex.value,
  fragmentShader: postProcessFragment.value
};
var postprocessPass = new ShaderPass( postprocessShader );
postprocessPass.uniforms = postprocessUniforms;
postprocessPass.material.uniforms = postprocessUniforms;
postprocessPass.hd = enableHDPass;
// Disable ping-ponging. Means we create one less render target
// saving on GPU memory (3MB or so)
postprocessPass.needsSwap = false;
composer.addPass( postprocessPass );
//defer( function () { postprocessPass.compile( renderer ); } );

// Tie rendering to render notifications
var tick = composer.render.bind( composer );

// Ensure that other actions get called before
// we render (otherwise LOD etc may not update)
defer( function () { RenderStore.listen( tick ) } );

export default composer;
