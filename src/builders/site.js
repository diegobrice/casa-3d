import { S, EXT, FLOORS, FINISHES, OUTDOOR, LOT, POOL, POOL_DEPTH } from '../config/plan.js';

// Losa base y acabado de suelo de cada ambiente
export function buildFloors(batch, M, surfaces) {
  FLOORS.forEach(rect => batch.slab(rect, -0.004, 0.12, M.plinth, { pad: EXT / 2 }));
  FINISHES.forEach(([finish, rect, id, label]) =>
    batch.slab(rect, 0, 0.1, surfaces.material(`floor-${id}`, `Piso · ${label}`, finish)));
}

// Terrazas, deck, senderos y terreno de césped (con el hueco de la piscina)
export function buildOutdoor(batch, M, surfaces) {
  OUTDOOR.forEach(([finish, rect, top, id, label]) =>
    batch.slab(rect, top, 0.1, surfaces.material(`outdoor-${id}`, `Exterior · ${label}`, finish)));

  const grass = surfaces.material('outdoor-lot', 'Exterior · Césped', 'grass');
  const [lx0, ly0, lx1, ly1] = LOT, [px0, py0, px1, py1] = POOL;
  const around = [[lx0, ly0, px0, ly1], [px1, ly0, lx1, ly1], [px0, ly0, px1, py0], [px0, py1, px1, ly1]];
  around.forEach(rect => batch.slab(rect, -0.1, 1.7, M.plinth, { topMaterial: grass }));
}

// Vaso revestido, escalones de entrada, borde de coronación y lámina de agua
export function buildPool(batch, M, surfaces) {
  const mosaic = surfaces.material('pool-lining', 'Piscina · Revestimiento', 'mosaic');
  const coping = surfaces.material('pool-coping', 'Piscina · Borde', 'paint', { color: '#e6e1d6', gloss: .4 });

  const [x0, y0, x1, y1] = POOL.map(v => v * S);
  const w = x1 - x0, d = y1 - y0, cx = (x0 + x1) / 2, cz = (y0 + y1) / 2;
  const D = POOL_DEPTH, wt = 0.06;

  batch.box(w, 0.1, d, cx, -D - 0.05, cz, mosaic);                 // fondo
  batch.box(wt, D, d, x0 + wt / 2, -D / 2, cz, mosaic);            // paredes
  batch.box(wt, D, d, x1 - wt / 2, -D / 2, cz, mosaic);
  batch.box(w, D, wt, cx, -D / 2, y0 + wt / 2, mosaic);
  batch.box(w, D, wt, cx, -D / 2, y1 - wt / 2, mosaic);

  for (let i = 0; i < 3; i++) {                                    // escalones
    const top = -0.4 - i * 0.3;
    batch.box(1.2, D + top, 0.32, x0 + wt + 0.6, (top - D) / 2, y0 + wt + 0.16 + i * 0.32, mosaic);
  }

  const cw = 0.3, lip = 0.04, ct = 0.07, cy = 0.01 - ct / 2;       // coronación
  batch.box(w + 2 * (cw - lip), ct, cw, cx, cy, y0 - cw / 2 + lip, coping);
  batch.box(w + 2 * (cw - lip), ct, cw, cx, cy, y1 + cw / 2 - lip, coping);
  batch.box(cw, ct, d - 2 * lip, x0 - cw / 2 + lip, cy, cz, coping);
  batch.box(cw, ct, d - 2 * lip, x1 + cw / 2 - lip, cy, cz, coping);

  batch.box(w, 0.02, d, cx, -0.15, cz, M.water, { cast: false, receive: false });
}
