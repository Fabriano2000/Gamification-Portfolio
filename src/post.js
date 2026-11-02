// Post-FX chain from the Figma "Render Spec": bloom, tilt-shift DOF, chromatic aberration,
// vignette, film grain, SMAA, ACES tone mapping.
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, DepthOfFieldEffect, VignetteEffect,
  NoiseEffect, ChromaticAberrationEffect, SMAAEffect, ToneMappingEffect, ToneMappingMode, BlendFunction,
} from 'postprocessing';

export function createPost(renderer, scene, camera, quality, focusTarget) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));

  let dof = null;
  if (quality.dof) {
    dof = new DepthOfFieldEffect(camera, {
      worldFocusDistance: 30,
      worldFocusRange: 9,
      bokehScale: 3,
      resolutionScale: 0.5,
    });
    dof.target = focusTarget; // keeps the player's depth in focus (tilt-shift look)
    composer.addPass(new EffectPass(camera, dof));
  }

  const bloom = new BloomEffect({
    intensity: 1.4,
    luminanceThreshold: 0.6,
    luminanceSmoothing: 0.25,
    mipmapBlur: true,
    radius: 0.75,
    resolutionScale: quality.bloomRes,
  });
  const vignette = new VignetteEffect({ darkness: 0.65, offset: 0.3 });
  const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
  noise.blendMode.opacity.value = 0.18;
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  composer.addPass(new EffectPass(camera, bloom, tone, vignette, noise));

  if (quality.chroma) {
    const ca = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0015, 0.0015),
      radialModulation: true,
      modulationOffset: 0.35,
    });
    composer.addPass(new EffectPass(camera, ca));
  }
  composer.addPass(new EffectPass(camera, new SMAAEffect()));

  return { composer, dof, bloom };
}
