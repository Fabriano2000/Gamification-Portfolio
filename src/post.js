// Post-FX chain from the Figma "Render Spec": tilt-shift DOF, bloom, ACES tone mapping,
// vignette, film grain, chromatic aberration, SMAA. Strengths are retuned per environment.
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, DepthOfFieldEffect, VignetteEffect,
  NoiseEffect, ChromaticAberrationEffect, SMAAEffect, ToneMappingEffect, ToneMappingMode, BlendFunction,
} from 'postprocessing';

export function createPost(renderer, scene, camera, quality, focusTarget) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));

  if (quality.dof) {
    const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 30, worldFocusRange: 9, bokehScale: 3, resolutionScale: 0.5 });
    dof.target = focusTarget; // keeps the player's depth in focus (tilt-shift look)
    composer.addPass(new EffectPass(camera, dof));
  }

  const bloom = new BloomEffect({
    intensity: 1.4, luminanceThreshold: 0.6, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.75,
    resolutionScale: quality.bloomRes,
  });
  const vignette = new VignetteEffect({ darkness: 0.65, offset: 0.3 });
  const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
  noise.blendMode.opacity.value = 0.18;
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  composer.addPass(new EffectPass(camera, bloom, tone, vignette, noise));

  let caPass = null;
  if (quality.chroma) {
    const ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0015, 0.0015), radialModulation: true, modulationOffset: 0.35 });
    caPass = new EffectPass(camera, ca);
    composer.addPass(caPass);
  }
  composer.addPass(new EffectPass(camera, new SMAAEffect()));

  /** Retune for an environment's post settings. */
  const applyTheme = (p) => {
    bloom.intensity = p.bloom;
    bloom.luminanceMaterial.threshold = p.threshold;
    vignette.darkness = p.vignette;
    if (caPass) caPass.enabled = p.chroma;
  };

  return { composer, applyTheme };
}
