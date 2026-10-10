import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createLighting } from './lighting.js';

export const FRUSTUM = 10;  // semialtura de la cámara ortográfica con zoom 1

// Calidades de render (ver renderLoop.js):
//  draft  render directo al canvas a baja resolución, sin postproceso
//  final  resolución completa a través del compositor (oclusión ambiental)
const QUALITY = {
  draft: { pixelRatio: 1, postprocess: false },
  final: { pixelRatio: 2, postprocess: true },
};

// Renderizador, escena, cámara, luces y postproceso.
export function createStage(container, labelsEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = (max) => Math.min(window.devicePixelRatio, max);
  renderer.setPixelRatio(pixelRatio(QUALITY.final.pixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.prepend(renderer.domElement);

  const labelRenderer = new CSS2DRenderer({ element: labelsEl });

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-FRUSTUM, FRUSTUM, FRUSTUM, -FRUSTUM, 0.1, 300);

  const lighting = createLighting(scene, renderer);

  // Postproceso: oclusión ambiental + tone mapping, con MSAA en el buffer principal
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.2, thickness: 1, scale: 1.1, samples: 16 });
  composer.addPass(gtao);
  composer.addPass(new OutputPass());

  let quality = null, postprocess = true;

  return {
    renderer, scene, camera, lighting,
    labelsEl,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),

    setSize(width, height) {
      const aspect = width / height;
      camera.left = -FRUSTUM * aspect; camera.right = FRUSTUM * aspect;
      camera.top = FRUSTUM; camera.bottom = -FRUSTUM;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      labelRenderer.setSize(width, height);
    },

    setQuality(name) {
      if (quality === name) return;
      quality = name;
      postprocess = QUALITY[name].postprocess;
      renderer.setPixelRatio(pixelRatio(QUALITY[name].pixelRatio));   // redimensiona el canvas
      lighting.setToneMappedBackground(!postprocess);
    },

    updateShadows() { lighting.requestShadowUpdate(); },

    render() {
      if (postprocess) composer.render();
      else renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    },
  };
}
