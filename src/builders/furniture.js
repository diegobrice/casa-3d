import * as THREE from 'three';
import { S } from '../config/plan.js';
import { FURNITURE } from '../config/furniture.js';

const pbr = (color, roughness = .8, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, envMapIntensity: .3, ...extra });

function createFurnitureMaterials() {
  return {
    wood:     pbr(0x8a6240, .55),
    woodDark: pbr(0x4a3324, .5),
    lacquer:  pbr(0xf1efea, .35),                 // blanco de armarios y bajos de cocina
    linen:    pbr(0xf3f1ec, .95),
    duvet:    pbr(0xcfc6b6, .95),
    fabric:   pbr(0xa9a59c, .95),
    cushion:  pbr(0xc4c0b7, .95),
    rug:      pbr(0xd8cfbd, 1),
    stone:    pbr(0xe4e1da, .25),                 // encimeras
    ceramic:  pbr(0xffffff, .12, { envMapIntensity: .8 }),   // sanitarios
    steel:    pbr(0xbfc3c6, .3, { metalness: .9, envMapIntensity: 1 }),
    black:    pbr(0x151617, .35),
    felt:     pbr(0x2f7a55, 1),
    masonry:  pbr(0x8c5a44, .9),
    pot:      pbr(0xe9e6df, .6),
    leaf:     pbr(0x4d7f3c, .9),
    trunk:    pbr(0x7a6248, .9),
    carGlass: pbr(0x1d2429, .1, { envMapIntensity: 1.2 }),
    tyre:     pbr(0x1a1a1a, .9),
  };
}

const inset = ([x0, y0, x1, y1], d) => [x0 + d, y0 + d, x1 - d, y1 - d];

// Mapea coordenadas locales de un mueble apoyado en `side` a un rect del plano:
// u = 0..1 a lo ancho, v = píxeles desde la pared hacia el frente. `length` = fondo total.
function oriented([x0, y0, x1, y1], side) {
  const W = x1 - x0, D = y1 - y0;
  const map = {
    n: (u0, v0, u1, v1) => [x0 + u0 * W, y0 + v0, x0 + u1 * W, y0 + v1],
    s: (u0, v0, u1, v1) => [x0 + u0 * W, y1 - v1, x0 + u1 * W, y1 - v0],
    w: (u0, v0, u1, v1) => [x0 + v0, y0 + u0 * D, x0 + v1, y0 + u1 * D],
    e: (u0, v0, u1, v1) => [x1 - v1, y0 + u0 * D, x1 - v0, y0 + u1 * D],
  }[side];
  const vertical = side === 'n' || side === 's';
  return { map, length: vertical ? D : W, width: vertical ? W : D };
}

// Primitivas en coordenadas del plano (px) y alturas en metros
function createKit(batch) {
  const box = ([x0, y0, x1, y1], bottom, top, material, options) =>
    batch.box((x1 - x0) * S, top - bottom, (y1 - y0) * S,
              (x0 + x1) / 2 * S, (bottom + top) / 2, (y0 + y1) / 2 * S, material, options);

  const cylinder = ([x, y], radius, bottom, top, material, segments = 20) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, top - bottom, segments);
    geometry.translate(x * S, (bottom + top) / 2, y * S);
    batch.geometry(geometry, material);
  };

  const blob = ([x, y], radius, height, material, squash = 1) => {
    const geometry = new THREE.IcosahedronGeometry(radius, 1);
    geometry.scale(1, squash, 1);
    geometry.translate(x * S, height, y * S);
    batch.geometry(geometry, material);
  };

  // Rueda: cilindro con el eje a lo ancho del coche
  const wheel = ([x, y], radius, width, material) => {
    const geometry = new THREE.CylinderGeometry(radius, radius, width, 18);
    geometry.rotateZ(Math.PI / 2);
    geometry.translate(x * S, radius, y * S);
    batch.geometry(geometry, material);
  };

  // Cuatro patas cuadradas en las esquinas de un rect
  const legs = ([x0, y0, x1, y1], top, material, size = 3, margin = 2) => {
    for (const x of [x0 + margin, x1 - margin - size])
      for (const y of [y0 + margin, y1 - margin - size])
        box([x, y, x + size, y + size], 0, top, material);
  };

  return { box, cylinder, blob, wheel, legs };
}

const center = ([x0, y0, x1, y1]) => [(x0 + x1) / 2, (y0 + y1) / 2];

function createBuilders({ box, cylinder, blob, wheel, legs }, F, glass) {
  return {
    bed({ rect, side }) {
      const { map, length } = oriented(rect, side);
      box(map(0, 0, 1, 4), 0, 1.0, F.wood);                           // cabecera
      box(map(0, 4, 1, length), 0.08, 0.3, F.wood);                   // somier
      box(map(.02, 5, .98, length - 1), 0.3, 0.5, F.linen);           // colchón
      box(map(.0, 34, 1, length), 0.5, 0.55, F.duvet);                // edredón
      box(map(.08, 8, .46, 28), 0.5, 0.6, F.linen);                   // almohadas
      box(map(.54, 8, .92, 28), 0.5, 0.6, F.linen);
    },

    nightstand({ rect }) {
      box(rect, 0.06, 0.48, F.wood);
      box(inset(rect, -0.5), 0.48, 0.5, F.woodDark);
    },

    wardrobe({ rect }) {
      box(inset(rect, 1), 0, 0.08, F.woodDark);
      box(rect, 0.08, 2.2, F.lacquer);
    },

    shelf({ rect, height = 1.8 }) {
      box(rect, 0, height, F.wood);
    },

    console({ rect, tv }) {
      box(rect, 0.05, 0.5, F.wood);
      if (!tv) return;
      const { map } = oriented(rect, tv);
      box(map(.12, 2, .88, 4), 0.62, 1.2, F.black);                   // televisor
    },

    tv({ rect }) {
      box(rect, 0.9, 1.5, F.black);
    },

    sofa({ rect, side }) {
      const { map, length, width } = oriented(rect, side);
      const arm = 7 / width, seats = Math.max(1, Math.round(width / 45));
      box(map(0, 0, 1, length), 0.1, 0.4, F.fabric);                  // base
      box(map(0, 0, 1, 8), 0.4, 0.82, F.fabric);                      // respaldo
      box(map(0, 8, arm, length), 0.4, 0.62, F.fabric);               // brazos
      box(map(1 - arm, 8, 1, length), 0.4, 0.62, F.fabric);
      const span = (1 - 2 * arm) / seats;
      for (let i = 0; i < seats; i++)                                 // cojines de asiento
        box(map(arm + i * span + .01, 9, arm + (i + 1) * span - .01, length - 1), 0.4, 0.5, F.cushion);
    },

    table({ rect, height = 0.75 }) {
      box(rect, height - 0.05, height, F.wood);
      legs(rect, height - 0.05, F.woodDark);
    },

    bench({ rect }) {
      box(rect, 0.4, 0.45, F.wood);
      legs(rect, 0.4, F.woodDark);
    },

    stool({ at }) {
      cylinder(at, 0.13, 0, 0.02, F.steel);
      cylinder(at, 0.025, 0.02, 0.62, F.steel, 8);
      cylinder(at, 0.17, 0.62, 0.67, F.black);
    },

    rug({ rect }) {
      box(rect, 0, 0.012, F.rug, { cast: false });
    },

    poolTable({ rect }) {
      const [x0, y0, x1, y1] = rect, rail = 5;
      legs(rect, 0.45, F.woodDark, 5, 4);
      box(inset(rect, rail), 0.45, 0.8, F.felt);                      // tapete
      box([x0, y0, x1, y0 + rail], 0.45, 0.84, F.woodDark);           // bandas
      box([x0, y1 - rail, x1, y1], 0.45, 0.84, F.woodDark);
      box([x0, y0 + rail, x0 + rail, y1 - rail], 0.45, 0.84, F.woodDark);
      box([x1 - rail, y0 + rail, x1, y1 - rail], 0.45, 0.84, F.woodDark);
    },

    counter({ rect }) {
      box(inset(rect, 1.5), 0, 0.1, F.woodDark);                      // rodapié retranqueado
      box(rect, 0.1, 0.86, F.lacquer);
      box(inset(rect, -1), 0.86, 0.9, F.stone);                       // encimera
    },

    sink({ rect }) {
      box(rect, 0.9, 0.905, F.steel);
      cylinder([rect[0] + 4, (rect[1] + rect[3]) / 2], 0.015, 0.905, 1.1, F.steel, 8);
    },

    cooktop({ rect }) {
      box(rect, 0.9, 0.91, F.black);
      const [x0, y0, x1, y1] = rect;
      for (const x of [x0 + 5, x1 - 5]) for (const y of [y0 + 9, y1 - 9]) cylinder([x, y], 0.07, 0.91, 0.925, F.steel, 12);
    },

    grill({ rect }) {
      box(rect, 0, 0.85, F.masonry);
      box(inset(rect, 3), 0.85, 0.87, F.black);
    },

    fridge({ rect }) {
      box(rect, 0, 1.8, F.steel);
    },

    washer({ rect }) {
      box(rect, 0, 0.85, F.lacquer);
    },

    toilet({ rect, side }) {
      const { map, length } = oriented(rect, side);
      box(map(.08, 0, .92, 7), 0, 0.78, F.ceramic);                   // cisterna
      box(map(.25, 7, .75, 14), 0, 0.38, F.ceramic);
      cylinder(center(map(.1, 9, .9, length)), 0.19, 0, 0.4, F.ceramic);   // taza
      cylinder(center(map(.1, 9, .9, length)), 0.2, 0.4, 0.43, F.lacquer);
    },

    vanity({ rect, side }) {
      const { map, length } = oriented(rect, side);
      box(rect, 0.3, 0.8, F.wood);                                    // mueble suspendido
      box(inset(rect, -0.5), 0.8, 0.84, F.stone);
      const basin = center(map(.15, 3, .85, length));
      cylinder(basin, 0.17, 0.84, 0.93, F.ceramic);                   // lavabo de sobreponer
      cylinder(center(map(.4, 1, .6, 3)), 0.012, 0.84, 1.05, F.steel, 8);
    },

    bathtub({ rect }) {
      const [x0, y0, x1, y1] = rect, wall = 3, h = 0.55;
      box(rect, 0, 0.12, F.ceramic);
      box([x0, y0, x1, y0 + wall], 0.12, h, F.ceramic);
      box([x0, y1 - wall, x1, y1], 0.12, h, F.ceramic);
      box([x0, y0 + wall, x0 + wall, y1 - wall], 0.12, h, F.ceramic);
      box([x1 - wall, y0 + wall, x1, y1 - wall], 0.12, h, F.ceramic);
    },

    glass({ rect }) {
      box(rect, 0, 2.0, glass, { cast: false, receive: false });      // mampara
    },

    car({ rect, paint }) {
      const [x0, y0, x1, y1] = rect, L = y1 - y0;
      const body = pbr(paint, .3, { metalness: .5, envMapIntensity: 1 });
      box(inset(rect, 3), 0.22, 0.8, body);                           // carrocería
      box([x0 + 7, y0 + L * .28, x1 - 7, y1 - L * .2], 0.8, 1.3, F.carGlass);   // cabina
      box([x0 + 9, y0 + L * .32, x1 - 9, y1 - L * .24], 1.3, 1.33, body);       // techo
      for (const x of [x0 + 6, x1 - 6]) for (const y of [y0 + L * .18, y1 - L * .18]) wheel([x, y], 0.32, 0.22, F.tyre);
    },

    lounger({ rect, side }) {
      const { map, length } = oriented(rect, side);
      legs(rect, 0.25, F.wood, 3, 3);
      box(map(0, 0, 1, length), 0.25, 0.3, F.wood);
      box(map(.06, length * .36, .94, length - 2), 0.3, 0.38, F.linen);   // colchoneta
      box(map(.06, 2, .94, length * .36), 0.3, 0.5, F.linen);             // respaldo levantado
    },

    sideTable({ at }) {
      cylinder(at, 0.03, 0, 0.42, F.woodDark, 8);
      cylinder(at, 0.25, 0.42, 0.45, F.wood);
    },

    plant({ at }) {
      cylinder(at, 0.18, 0, 0.36, F.pot);
      blob(at, 0.34, 0.68, F.leaf, 1.15);
    },

    palm({ at }) {
      cylinder(at, 0.09, -0.02, 1.7, F.trunk, 10);
      blob(at, 0.85, 1.8, F.leaf, 0.4);
      blob(at, 0.5, 2.0, F.leaf, 0.5);
    },

    shrub({ at }) {
      blob(at, 0.34, 0.24, F.leaf, 0.95);
    },
  };
}

// Construye todo el mobiliario dentro del lote `batch`.
export function buildFurniture(batch, M) {
  const builders = createBuilders(createKit(batch), createFurnitureMaterials(), M.glass);
  for (const item of FURNITURE) builders[item.type](item);
}
