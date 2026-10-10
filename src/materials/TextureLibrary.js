import * as THREE from 'three';
import { FINISH_CATALOG } from './finishes.js';

// Archivo de cada mapa de un material PBR y si contiene color (sRGB) o datos (lineal)
const PBR_MAPS = {
  map:          { file: 'diff.jpg',  srgb: true },
  normalMap:    { file: 'nor.jpg',   srgb: false },
  roughnessMap: { file: 'rough.jpg', srgb: false },
};

// Resuelve el juego de texturas de cada acabado: { meters, maps: { map, bumpMap, normalMap, roughnessMap } }.
// Los procedurales están disponibles al instante; los PBR se descargan bajo demanda y se cachean.
export class TextureLibrary {
  #procedural;
  #anisotropy;
  #loader = new THREE.TextureLoader();
  #sets = new Map();
  #pending = new Map();

  constructor(proceduralTextures, anisotropy) {
    this.#procedural = proceduralTextures;
    this.#anisotropy = anisotropy;
  }

  // Juego de texturas si ya está disponible; null si hay que descargarlo con load()
  peek(finishKey) {
    let set = this.#sets.get(finishKey);
    const preset = FINISH_CATALOG[finishKey];
    if (!set && !preset.pbr) {
      const texture = this.#procedural[preset.map ?? preset.bump];
      set = { meters: texture.userData.meters, maps: {} };
      if (preset.map) set.maps.map = texture;
      if (preset.bumpScale) set.maps.bumpMap = texture;
      this.#sets.set(finishKey, set);
    }
    return set ?? null;
  }

  load(finishKey) {
    const ready = this.peek(finishKey);
    if (ready) return Promise.resolve(ready);
    if (!this.#pending.has(finishKey)) this.#pending.set(finishKey, this.#loadPBR(finishKey));
    return this.#pending.get(finishKey);
  }

  async #loadPBR(finishKey) {
    const { pbr, meters } = FINISH_CATALOG[finishKey];
    const base = `${import.meta.env.BASE_URL}textures/${pbr}/`;
    try {
      const entries = await Promise.all(Object.entries(PBR_MAPS).map(async ([slot, { file, srgb }]) => {
        const texture = await this.#loader.loadAsync(base + file);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = this.#anisotropy;
        if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
        return [slot, texture];
      }));
      const set = { meters, maps: Object.fromEntries(entries) };
      this.#sets.set(finishKey, set);
      return set;
    } finally {
      this.#pending.delete(finishKey);   // si falló, un nuevo intento vuelve a descargar
    }
  }
}
