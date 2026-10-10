import * as THREE from 'three';
import { FINISH_CATALOG, DEFAULT_COLOR } from './finishes.js';

const MIN_ROUGHNESS = 0.04;
const TEXTURE_SLOTS = ['map', 'bumpMap', 'normalMap', 'roughnessMap'];

// Superficies editables del modelo (cada muro, cada piso, cada zona exterior).
// Cada una tiene su propio material, de modo que GeometryBatch la fusiona en una malla
// independiente que se puede seleccionar y modificar sin afectar al resto.
//
// Estado de una superficie: { finish, color, gloss, scale }
export class SurfaceRegistry {
  #library;
  #onTextureLoaded;
  #byId = new Map();
  #byMaterial = new Map();

  // `onTextureLoaded` avisa cuando un acabado descargado en segundo plano ya se aplicó
  constructor(textureLibrary, onTextureLoaded = () => {}) {
    this.#library = textureLibrary;
    this.#onTextureLoaded = onTextureLoaded;
  }

  // Devuelve el material de la superficie `id`, creándola la primera vez.
  material(id, label, finish, overrides = {}) {
    let surface = this.#byId.get(id);
    if (!surface) {
      const preset = FINISH_CATALOG[finish];
      const initial = { finish, color: preset.color ?? DEFAULT_COLOR, gloss: preset.gloss, scale: 1, ...overrides };
      surface = {
        id, label, mesh: null,
        material: new THREE.MeshStandardMaterial(),
        textures: { finish: null, meters: 1, maps: {} },   // copias propias de las texturas en uso
        initial, state: { ...initial },
      };
      this.#byId.set(id, surface);
      this.#byMaterial.set(surface.material, surface);
      this.#apply(surface);
    }
    return surface.material;
  }

  // Asocia a cada superficie la malla fusionada que usa su material
  attachMeshes(root) {
    root.traverse(object => {
      const surface = object.isMesh && this.#byMaterial.get(object.material);
      if (surface) surface.mesh = object;
    });
  }

  find(material) {
    return this.#byMaterial.get(material) ?? null;
  }

  // Aplica cambios parciales. Al cambiar de acabado se adoptan su color y brillo por defecto.
  update(surface, patch) {
    if (patch.finish && patch.finish !== surface.state.finish) {
      const preset = FINISH_CATALOG[patch.finish];
      patch = { color: preset.color ?? DEFAULT_COLOR, gloss: preset.gloss, ...patch };
    }
    Object.assign(surface.state, patch);
    this.#apply(surface);
  }

  reset(surface) {
    surface.state = { ...surface.initial };
    this.#apply(surface);
  }

  #apply(surface) {
    const { material, state, textures } = surface;
    const { finish } = state;

    if (textures.finish !== finish) {
      const set = this.#library.peek(finish);
      if (!set) {
        // Texturas PBR aún sin descargar: la superficie conserva su aspecto hasta que lleguen
        this.#library.load(finish)
          .then(() => {
            if (surface.state.finish !== finish) return;
            this.#apply(surface);
            this.#onTextureLoaded();
          })
          .catch(error => console.warn(`No se pudo cargar el acabado "${finish}"`, error));
        return;
      }
      this.#swapTextures(surface, finish, set);
    }

    // Escala de textura: las UV están en metros, así que repeat = 1 / tamaño real
    const repeat = 1 / (textures.meters * state.scale);
    for (const texture of Object.values(textures.maps)) texture.repeat.setScalar(repeat);

    const preset = FINISH_CATALOG[finish];
    material.bumpScale = preset.bumpScale ?? 0;
    material.color.set(state.color);
    // Con mapa de rugosidad el valor actúa de multiplicador: brillo 0.5 respeta el escaneo
    const roughness = preset.pbr ? 2 * (1 - state.gloss) : 1 - state.gloss;
    material.roughness = Math.max(MIN_ROUGHNESS, roughness);
    material.envMapIntensity = .3 + state.gloss * .5;
  }

  // Sustituye las texturas del material por copias del nuevo juego. Las copias comparten
  // la imagen con el original; solo tienen transformación propia para escalarse por superficie.
  #swapTextures(surface, finish, set) {
    const { material, textures } = surface;
    for (const texture of new Set(Object.values(textures.maps))) texture.dispose();

    const clones = new Map();
    textures.maps = {};
    for (const [slot, source] of Object.entries(set.maps)) {
      if (!clones.has(source)) {
        const clone = source.clone();
        clone.needsUpdate = true;
        clones.set(source, clone);
      }
      textures.maps[slot] = clones.get(source);
    }
    for (const slot of TEXTURE_SLOTS) material[slot] = textures.maps[slot] ?? null;

    textures.finish = finish;
    textures.meters = set.meters;
    material.needsUpdate = true;
  }
}
