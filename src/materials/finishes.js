// Catálogo de acabados para superficies. Hay dos tipos:
//
//  · Procedurales: se dibujan en canvas al arrancar (textures.js).
//      map    textura de color, o null para color liso
//      bump   textura de relieve cuando no hay `map`
//
//  · PBR escaneados: mapas de color, normales y rugosidad de Poly Haven (CC0), en
//    public/textures/<pbr>/{diff,nor,rough}.jpg. Se descargan la primera vez que se usan.
//      pbr     carpeta del material
//      meters  tamaño real que cubre una repetición de la textura
//
//  gloss   brillo por defecto, 0 (mate) a 1 (pulido). En los PBR, 0.5 = rugosidad tal como se escaneó.
//  group   sección del editor donde aparece; sin grupo no se ofrece como opción
export const FINISH_CATALOG = {
  // ── Madera
  wood:           { label: 'Roble',          group: 'Madera', map: 'wood', gloss: .50, bumpScale: 0 },
  laminate:       { label: 'Laminado',       group: 'Madera', pbr: 'laminate_floor_02',   meters: 1.7, gloss: .5 },
  parquet:        { label: 'Parquet espiga', group: 'Madera', pbr: 'herringbone_parquet', meters: 3.4, gloss: .5 },
  darkPlanks:     { label: 'Nogal oscuro',   group: 'Madera', pbr: 'dark_wooden_planks',  meters: 2.0, gloss: .5 },
  deckPlanks:     { label: 'Deck',           group: 'Madera', pbr: 'wood_floor_deck',     meters: 1.8, gloss: .5 },

  // ── Piedra
  marble:         { label: 'Mármol blanco',  group: 'Piedra', map: 'marble', gloss: .88, bumpScale: 0 },
  marbleVeined:   { label: 'Mármol veteado', group: 'Piedra', pbr: 'marble_01',      meters: 1.5, gloss: .5 },
  granite:        { label: 'Granito',        group: 'Piedra', pbr: 'granite_tile',   meters: 2.3, gloss: .5 },
  terrazzo:       { label: 'Terrazo',        group: 'Piedra', pbr: 'terrazzo_tiles', meters: 2.0, gloss: .5 },

  // ── Cerámica
  ceramic:        { label: 'Cerámica',       group: 'Cerámica', map: 'ceramic', gloss: .68, bumpScale: .5 },
  floorTiles:     { label: 'Baldosa',        group: 'Cerámica', pbr: 'floor_tiles_06', meters: 3.0, gloss: .5 },

  // ── Concreto
  concrete:       { label: 'Concreto',        group: 'Concreto', map: 'concrete', gloss: .10, bumpScale: .8 },
  concreteWorn:   { label: 'Concreto pulido', group: 'Concreto', pbr: 'concrete_floor_worn_001', meters: 3.0, gloss: .5 },

  // ── Muro
  paint:          { label: 'Pintura',  group: 'Muro', map: null, bump: 'plaster', gloss: .08, bumpScale: .6, color: '#f4f0e8' },
  plaster:        { label: 'Estuco',   group: 'Muro', pbr: 'white_plaster_02', meters: 1.0, gloss: .5 },
  brick:          { label: 'Ladrillo', group: 'Muro', pbr: 'brick_wall_001',   meters: 3.0, gloss: .5 },

  // ── Acabados originales del modelo (no se ofrecen en el editor, pero se pueden restablecer)
  porcelain: { label: 'Porcelanato', map: 'porcelain', gloss: .72, bumpScale: .3 },
  deck:      { label: 'Deck',        map: 'deck',      gloss: .25, bumpScale: 1.2 },
  stone:     { label: 'Piedra',      map: 'stone',     gloss: .20, bumpScale: .8 },
  mosaic:    { label: 'Mosaico',     map: 'mosaic',    gloss: .75, bumpScale: 0 },
  grass:     { label: 'Césped',      map: 'grass',     gloss: 0,   bumpScale: 2 },
};

export const DEFAULT_COLOR = '#ffffff';   // tinte neutro: la textura se ve con su color propio

// Opciones del editor agrupadas: [{ group, items: [{ key, label }] }]
export const FINISH_GROUPS = Object.entries(FINISH_CATALOG).reduce((groups, [key, { group, label }]) => {
  if (!group) return groups;
  let entry = groups.find(g => g.group === group);
  if (!entry) groups.push(entry = { group, items: [] });
  entry.items.push({ key, label });
  return groups;
}, []);
