import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { S } from '../config/plan.js';

const TOP_FACE = { start: 12, count: 6 };  // en un BoxGeometry sin índice: +x, -x, +y, -y, +z, -z (6 vértices por cara)
const ATTRIBUTES = ['position', 'normal', 'uv'];

// UV en metros de mundo según la orientación de cada cara
function applyWorldUV(geometry) {
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (Math.abs(n.getY(i)) > .5) uv.setXY(i, x, z);
    else if (Math.abs(n.getX(i)) > .5) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
}

function sliceVertices(geometry, start, count) {
  const out = new THREE.BufferGeometry();
  for (const name of ATTRIBUTES) {
    const a = geometry.attributes[name];
    out.setAttribute(name, new THREE.BufferAttribute(a.array.slice(start * a.itemSize, (start + count) * a.itemSize), a.itemSize));
  }
  return out;
}

// Acumula cajas estáticas y las fusiona en una sola malla por material:
// cientos de piezas se dibujan con una veintena de draw calls.
export class GeometryBatch {
  #buckets = new Map();

  #add(geometry, material, cast, receive) {
    const key = `${material.uuid}:${cast}:${receive}`;
    let bucket = this.#buckets.get(key);
    if (!bucket) this.#buckets.set(key, bucket = { material, cast, receive, geometries: [] });
    bucket.geometries.push(geometry);
  }

  // Caja centrada en (x, y, z). `topMaterial` asigna otro material a la cara superior.
  box(w, h, d, x, y, z, material, { cast = true, receive = true, topMaterial = null } = {}) {
    const geometry = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    geometry.translate(x, y, z);
    applyWorldUV(geometry);

    if (!topMaterial) return this.#add(geometry, material, cast, receive);

    const { start, count } = TOP_FACE, total = geometry.attributes.position.count;
    this.#add(sliceVertices(geometry, 0, start), material, cast, receive);
    this.#add(sliceVertices(geometry, start + count, total - start - count), material, cast, receive);
    this.#add(sliceVertices(geometry, start, count), topMaterial, cast, receive);
    geometry.dispose();
  }

  // Geometría cualquiera ya colocada en su sitio (muebles redondos, plantas…)
  geometry(geometry, material, { cast = true, receive = true } = {}) {
    this.#add(geometry.index ? geometry.toNonIndexed() : geometry, material, cast, receive);
  }

  // Caja en coordenadas de pared: u = a lo largo de la pared, c = posición fija, t = espesor
  wallBox(axis, c, u0, u1, y0, y1, t, material, options) {
    const len = u1 - u0, h = y1 - y0;
    if (len < 1e-4 || h < 1e-4) return;
    const u = u0 + len / 2, y = y0 + h / 2;
    if (axis === 'h') this.box(len, h, t, u, y, c, material, options);
    else this.box(t, h, len, c, y, u, material, options);
  }

  // Losa horizontal a partir de un rectángulo del plano [x0, y0, x1, y1] en píxeles
  slab([x0, y0, x1, y1], top, thickness, material, { pad = 0, ...options } = {}) {
    this.box((x1 - x0) * S + pad * 2, thickness, (y1 - y0) * S + pad * 2,
             (x0 + x1) / 2 * S, top - thickness / 2, (y0 + y1) / 2 * S,
             material, { cast: false, ...options });
  }

  // Fusiona lo acumulado y lo añade al grupo
  build(group) {
    for (const { material, cast, receive, geometries } of this.#buckets.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      geometries.forEach(g => g.dispose());
    }
    this.#buckets.clear();
  }
}
