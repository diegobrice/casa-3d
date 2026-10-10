import * as THREE from 'three';
import { S, EXT, WALL_HEIGHT as H, OPENING, WALLS } from '../config/plan.js';

const SKIRTING_HEIGHT = 0.09;

// Tramo de muro: corte oscuro arriba si llega a la altura total, zócalo si nace del suelo
function wallSegment(batch, M, wall, axis, c, u0, u1, y0, y1, t) {
  batch.wallBox(axis, c, u0, u1, y0, y1, t, wall, { topMaterial: y1 === H ? M.cap : null });
  if (y0 === 0) batch.wallBox(axis, c, u0, u1, 0, SKIRTING_HEIGHT, t + 0.024, M.base);
}

function addWindow(batch, M, axis, c, f, g, sill, head, t) {
  const fw = 0.05, d = t + 0.03;
  batch.wallBox(axis, c, f, f + fw, sill, head, d, M.frame);
  batch.wallBox(axis, c, g - fw, g, sill, head, d, M.frame);
  batch.wallBox(axis, c, f + fw, g - fw, sill, sill + fw, d, M.frame);
  batch.wallBox(axis, c, f + fw, g - fw, head - fw, head, d, M.frame);

  const panes = Math.max(2, Math.round((g - f) / 1.1));
  for (let i = 1; i < panes; i++) {
    const m = f + (g - f) * i / panes;
    batch.wallBox(axis, c, m - fw / 2, m + fw / 2, sill + fw, head - fw, d, M.frame);
  }
  batch.wallBox(axis, c, f + fw, g - fw, sill + fw, head - fw, 0.02, M.glass, { cast: false, receive: false });

  if (sill > 0) batch.wallBox(axis, c, f - 0.04, g + 0.04, sill - 0.04, sill, t + 0.10, M.sill);  // alféizar
  else batch.wallBox(axis, c, f, g, -0.01, 0.015, t + 0.02, M.frame);                              // umbral
}

const handleGeometry = new THREE.BoxGeometry(0.13, 0.022, 0.13);  // manilla a ambos lados de la hoja

// Marco fijo (fusionado) + hoja sobre un pivote en la bisagra, que es lo único que se anima
function addDoor(batch, M, group, axis, c, f, g, head, t, dir = 1) {
  const fw = 0.05, d = t + 0.04;
  batch.wallBox(axis, c, f, f + fw, 0, head, d, M.door);
  batch.wallBox(axis, c, g - fw, g, 0, head, d, M.door);
  batch.wallBox(axis, c, f + fw, g - fw, head - fw, head, d, M.door);

  const lw = g - f - 2 * fw, lh = head - fw;
  const pivot = new THREE.Group();
  pivot.position.set(axis === 'h' ? f + fw : c, 0, axis === 'h' ? c : f + fw);

  const leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.04), M.door);
  leaf.position.set(lw / 2, lh / 2, 0);
  leaf.castShadow = leaf.receiveShadow = true;

  const handle = new THREE.Mesh(handleGeometry, M.metal);
  handle.position.set(lw - 0.11, 1.0, 0);
  handle.castShadow = true;

  pivot.add(leaf, handle);
  pivot.userData = { base: axis === 'h' ? 0 : -Math.PI / 2, dir };
  group.add(pivot);
  return pivot;
}

// Levanta todos los muros con sus aberturas. Cada muro es una superficie editable.
// Devuelve los pivotes de las puertas.
export function buildWalls(batch, group, M, surfaces) {
  const doorPivots = [];
  const count = { ext: 0, int: 0 };

  for (const [axis, C, A, B, t, openings = []] of WALLS) {
    const c = C * S;
    const label = t === EXT ? `Muro exterior ${++count.ext}` : `Tabique ${++count.int}`;
    const wall = surfaces.material(`wall-${count.ext}-${count.int}`, label, 'paint');
    let cursor = A * S - t / 2;           // se prolonga medio espesor para cerrar esquinas
    const end = B * S + t / 2;

    for (const [F, G, type, dir] of [...openings].sort((p, q) => p[0] - q[0])) {
      const f = F * S, g = G * S, [sill, head] = OPENING[type];
      wallSegment(batch, M, wall, axis, c, cursor, f, 0, H, t);
      wallSegment(batch, M, wall, axis, c, f, g, 0, sill, t);   // antepecho
      wallSegment(batch, M, wall, axis, c, f, g, head, H, t);   // dintel
      if (type === 'door') doorPivots.push(addDoor(batch, M, group, axis, c, f, g, head, t, dir));
      else if (type !== 'open') addWindow(batch, M, axis, c, f, g, sill, head, t);
      cursor = g;
    }
    wallSegment(batch, M, wall, axis, c, cursor, end, 0, H, t);
  }
  return doorPivots;
}
