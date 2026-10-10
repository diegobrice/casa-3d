import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { S } from '../config/plan.js';

// Ambientes de iluminación. `background` va en valores HDR (se ven tras el tone mapping).
//   env    intensidad y tinte del entorno que reflejan vidrio, agua y metal
//   lamps  0..1, cuánto se encienden las luces interiores
export const LIGHTING_PRESETS = {
  day: {
    sun: { position: [-14, 26, 10], color: 0xfff0dc, intensity: 3.0 },
    sky: 0xdde9ff, ground: 0xb8a78c, ambient: 0.7,
    background: [2.6, 2.55, 2.45], exposure: 0.95,
    env: { intensity: 1, tint: [1, 1, 1] }, lamps: 0,
  },
  evening: {
    sun: { position: [-27, 9, 9], color: 0xff9a56, intensity: 2.8 },
    sky: 0xffc4a0, ground: 0x7a6258, ambient: 0.4,
    background: [2.3, 1.45, 0.95], exposure: 0.9,
    env: { intensity: 0.5, tint: [1, .8, .62] }, lamps: 0.3,
  },
  night: {
    sun: { position: [12, 24, -10], color: 0x8ea6ff, intensity: 0.3 },   // luna
    sky: 0x24356b, ground: 0x0b0d16, ambient: 0.3,
    background: [0.015, 0.022, 0.05], exposure: 1.05,
    env: { intensity: 0.06, tint: [.7, .8, 1] }, lamps: 1, dark: true,
  },
};

// Luces interiores [x, y] en píxeles del plano; se encienden con `lamps`
const LAMP = { color: 0xffd2a1, intensity: 16, height: 2.3, distance: 9 };
const LAMPS = [
  [300, 95], [130, 262], [130, 505], [215, 390], [155, 720],
  [170, 1040], [450, 960], [470, 1270],
];
const POOL_LAMP = { at: [516, 538], color: 0x58d8ff, intensity: 10, height: -0.7, distance: 7 };

const TRANSITION_SECONDS = 1.2;

// Tone mapping ACES de three.js aplicado en CPU. En el render directo (calidad "draft") el color
// de fondo no pasa por el tone mapping, así que se calcula aquí para que coincida con el final.
const rrtOdtFit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
function acesToneMap(color, exposure, out) {
  const k = exposure / 0.6, r = color.r * k, g = color.g * k, b = color.b * k;
  const x = rrtOdtFit(0.59719 * r + 0.35458 * g + 0.04823 * b);
  const y = rrtOdtFit(0.07600 * r + 0.90834 * g + 0.01566 * b);
  const z = rrtOdtFit(0.02840 * r + 0.13383 * g + 0.83777 * b);
  const clamp = THREE.MathUtils.clamp;
  return out.setRGB(
    clamp(1.60475 * x - 0.53108 * y - 0.07367 * z, 0, 1),
    clamp(-0.10208 * x + 1.10813 * y - 0.00605 * z, 0, 1),
    clamp(-0.00327 * x - 0.07276 * y + 1.07602 * z, 0, 1),
  );
}
const smooth = (t) => t * t * (3 - 2 * t);

// Un mapa de entorno por ambiente: la misma sala de RoomEnvironment con sus luces atenuadas y teñidas
function createEnvironments(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environments = {};
  for (const [name, { env }] of Object.entries(LIGHTING_PRESETS)) {
    const room = new RoomEnvironment(renderer);
    const [r, g, b] = env.tint.map(c => c * env.intensity);
    room.traverse(object => {
      if (object.isPointLight) object.color.setRGB(r, g, b);
      else if (object.material?.isMeshBasicMaterial) object.material.color.multiply(new THREE.Color().setRGB(r, g, b));
    });
    environments[name] = pmrem.fromScene(room, 0.04).texture;
  }
  pmrem.dispose();
  return environments;
}

function toState(preset) {
  return {
    sunPosition: new THREE.Vector3(...preset.sun.position),
    sunColor: new THREE.Color(preset.sun.color),
    sunIntensity: preset.sun.intensity,
    sky: new THREE.Color(preset.sky),
    ground: new THREE.Color(preset.ground),
    ambient: preset.ambient,
    background: new THREE.Color().setRGB(...preset.background),
    exposure: preset.exposure,
    lamps: preset.lamps,
  };
}

function mix(a, b, t, out) {
  for (const key of Object.keys(a)) {
    if (typeof a[key] === 'number') out[key] = THREE.MathUtils.lerp(a[key], b[key], t);
    else if (a[key].isColor) out[key].lerpColors(a[key], b[key], t);
    else out[key].lerpVectors(a[key], b[key], t);
  }
  return out;
}

// Sol, cielo, entorno y luces interiores, con transición suave entre día, tarde y noche.
export function createLighting(scene, renderer) {
  const environments = createEnvironments(renderer);

  const hemisphere = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.autoUpdate = false;   // escena casi estática: el mapa de sombras se recalcula bajo demanda
  scene.add(hemisphere, sun);
  scene.background = new THREE.Color();

  // Cada luz puntual encarece todos los materiales, así que de día el grupo se oculta entero
  // (a cambio de recompilar shaders una vez al encenderlas)
  const lamps = new THREE.Group();
  const lampLights = [...LAMPS.map(at => ({ ...LAMP, at })), POOL_LAMP].map(({ at, color, intensity, height, distance }) => {
    const light = new THREE.PointLight(color, 0, distance, 2);
    light.position.set(at[0] * S, height, at[1] * S);
    light.userData.intensity = intensity;
    lamps.add(light);
    return light;
  });

  const current = toState(LIGHTING_PRESETS.day);
  let from = null, to = null, progress = 1, pendingEnvironment = null;
  let toneMappedBackground = false;

  function applyBackground() {
    if (toneMappedBackground) acesToneMap(current.background, current.exposure, scene.background);
    else scene.background.copy(current.background);
  }

  function apply() {
    sun.position.copy(current.sunPosition);
    sun.color.copy(current.sunColor);
    sun.intensity = current.sunIntensity;
    hemisphere.color.copy(current.sky);
    hemisphere.groundColor.copy(current.ground);
    hemisphere.intensity = current.ambient;
    applyBackground();
    renderer.toneMappingExposure = current.exposure;
    lamps.visible = current.lamps > 0.001;
    for (const light of lampLights) light.intensity = light.userData.intensity * current.lamps;
    sun.shadow.needsUpdate = true;
  }

  scene.environment = environments.day;
  apply();

  return {
    lamps,   // en coordenadas del plano: se añade al grupo de la casa

    requestShadowUpdate() { sun.shadow.needsUpdate = true; },

    // true: el fondo se entrega ya con tone mapping (render directo, sin postproceso)
    setToneMappedBackground(enabled) {
      toneMappedBackground = enabled;
      applyBackground();
    },

    setPreset(name) {
      from = toState(LIGHTING_PRESETS.day);
      mix(current, current, 0, from);   // copia del estado actual como punto de partida
      to = toState(LIGHTING_PRESETS[name]);
      pendingEnvironment = environments[name];
      progress = 0;
    },

    // Devuelve true mientras dura la transición
    update(dt) {
      if (progress >= 1) return false;
      progress = Math.min(1, progress + dt / TRANSITION_SECONDS);
      mix(from, to, smooth(progress), current);
      if (progress >= 0.5 && pendingEnvironment) {
        scene.environment = pendingEnvironment;
        pendingEnvironment = null;
      }
      apply();
      return true;
    },
  };
}
