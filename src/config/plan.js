// Datos del plano. Coordenadas en píxeles de la imagen original (700 × 1425), escala 50 px = 1 m.
// Para corregir una medida, una puerta o un acabado basta con editar este archivo.

export const S = 1 / 50;        // metros por píxel
export const WALL_HEIGHT = 2.6;
export const EXT = 0.20;        // espesor de muro exterior
export const INT = 0.12;        // espesor de tabique

// Tipos de abertura: [antepecho, dintel] en metros
export const OPENING = {
  door:  [0.0, 2.1],  // puerta con hoja
  glass: [0.0, 2.1],  // puerta corredera de vidrio
  win:   [0.9, 2.1],  // ventana
  hi:    [1.5, 2.1],  // ventana alta (baños)
  open:  [0.0, 2.2],  // vano libre (garaje)
};

// [eje, posición fija, desde, hasta, espesor, aberturas[desde, hasta, tipo, sentido de giro]]
// eje 'h' = pared paralela a X (posición fija = y del plano); 'v' = paralela a Z (posición fija = x del plano)
export const WALLS = [
  // ── Envolvente
  ['h',   12,   27,  608, EXT, [[145, 195, 'hi'], [325, 430, 'win']]],
  ['v',   27,   12, 1215, EXT, [[105, 145, 'hi'], [230, 300, 'win'], [365, 405, 'hi'], [470, 540, 'win'],
                                [640, 700, 'win'], [740, 840, 'win'], [885, 995, 'win'], [1120, 1195, 'win']]],
  ['v',  608,   12,  185, EXT, [[55, 95, 'door', -1], [125, 160, 'hi']]],
  ['h',  185,  287,  608, EXT, [[325, 440, 'glass'], [476, 512, 'door', -1]]],
  ['v',  468,   12,  238, EXT],
  ['v',  520,  185,  238, EXT],
  ['h',  238,  468,  520, EXT, [[476, 512, 'door', 1]]],
  ['v',  287,  185,  862, EXT, [[290, 360, 'win'], [650, 800, 'glass']]],
  ['h',  862,  287,  608, EXT, [[335, 560, 'win']]],
  ['v',  608,  862, 1405, EXT, [[1045, 1085, 'door', 1]]],
  ['h', 1405,  332,  608, EXT, [[352, 588, 'open']]],
  ['v',  332, 1055, 1405, EXT, [[1085, 1125, 'door', 1]]],
  ['h', 1288,  250,  332, EXT, [[266, 316, 'door', 1]]],
  ['v',  250, 1215, 1288, EXT],
  ['h', 1215,   27,  250, EXT, [[70, 205, 'win']]],

  // ── Zona de noche
  ['v',  132,   12,  185, INT, [[140, 180, 'door', 1]]],
  ['h',  185,   27,  232, INT],
  ['v',  232,  185,  582, INT, [[295, 335, 'door', 1], [364, 404, 'door', 1], [436, 476, 'door', 1]]],
  ['h',  340,   27,  232, INT],
  ['h',  428,   27,  232, INT],
  ['v',  132,  340,  428, INT, [[350, 386, 'door', 1]]],
  ['h',  582,   27,  287, INT, [[240, 280, 'door', -1]]],
  ['h',  100,  468,  608, INT],

  // ── Zona social y servicio
  ['h',  862,   27,  287, INT, [[85, 230, 'glass']]],
  ['h', 1055,  332,  437, INT],
  ['v',  437, 1055, 1138, INT],
  ['h', 1138,  332,  608, INT, [[447, 487, 'door', -1]]],
  ['v',  492, 1018, 1138, INT, [[1055, 1095, 'door', -1]]],
  ['h', 1018,  492,  608, INT],
];

// Losa base de la casa [x0, y0, x1, y1]
export const FLOORS = [
  [27, 12, 608, 185], [27, 185, 287, 862], [468, 185, 520, 238],
  [27, 862, 608, 1215], [250, 1215, 608, 1288], [332, 1288, 608, 1405],
];

// Acabado de suelo por ambiente (de eje a eje de pared) [material, rect, id, nombre]
// Los rectángulos con el mismo id forman una sola superficie editable.
export const FINISHES = [
  ['wood',      [132, 12, 468, 185],    'suite',      'Suite y vestidor'],
  ['wood',      [27, 185, 232, 340],    'dorm2',      'Dormitorio 2'],
  ['wood',      [232, 185, 287, 582],   'pasillo',    'Pasillo'],
  ['wood',      [27, 428, 232, 582],    'dorm1',      'Dormitorio 1'],
  ['ceramic',   [27, 12, 132, 185],     'bano-suite', 'Baño suite'],
  ['ceramic',   [27, 340, 232, 428],    'bano',       'Baño y lavatorio'],
  ['ceramic',   [468, 12, 608, 185],    'patio-serv', 'Depósito y baño de patio'],
  ['ceramic',   [468, 185, 520, 238],   'patio-serv', 'Depósito y baño de patio'],
  ['ceramic',   [332, 1055, 437, 1138], 'aseo',       'Aseo'],
  ['ceramic',   [492, 1018, 608, 1138], 'lavanderia', 'Lavandería'],
  ['porcelain', [27, 582, 287, 862],    'juegos',     'Sala de juegos'],
  ['porcelain', [27, 862, 332, 1215],   'sala',       'Sala · Comedor'],
  ['porcelain', [250, 1215, 332, 1288], 'sala',       'Sala · Comedor'],
  ['porcelain', [332, 862, 608, 1018],  'cocina',     'Cocina'],
  ['porcelain', [332, 1018, 492, 1055], 'cocina',     'Cocina'],
  ['porcelain', [437, 1055, 492, 1138], 'cocina',     'Cocina'],
  ['concrete',  [332, 1138, 608, 1405], 'garaje',     'Garaje'],
];

// Exteriores [material, rect, cota superior, id, nombre]
export const OUTDOOR = [
  ['stone',    [287, 185, 468, 238], -0.02,   'terraza',  'Terraza'],
  ['deck',     [287, 238, 365, 862], -0.02,   'deck',     'Deck'],
  ['deck',     [365, 770, 690, 862], -0.02,   'deck',     'Deck'],
  ['stone',    [365, 238, 440, 770], -0.02,   'solarium', 'Solárium'],
  ['stone',    [592, 238, 690, 770], -0.02,   'solarium', 'Solárium'],
  ['stone',    [440, 238, 592, 386], -0.02,   'solarium', 'Solárium'],
  ['stone',    [440, 690, 592, 770], -0.02,   'solarium', 'Solárium'],
  ['stone',    [213, 1288, 332, 1400], -0.02, 'porche',   'Porche'],
  ['stone',    [213, 1400, 332, 1414], -0.06, 'porche',   'Porche'],      // escalón
  ['concrete', [608, 1015, 690, 1110], -0.07, 'sendero',  'Sendero de servicio'],
  ['concrete', [332, 1405, 608, 1425], -0.07, 'acceso',   'Acceso al garaje'],
];

export const POOL = [440, 386, 592, 690];  // lámina de agua
export const POOL_DEPTH = 1.5;
export const LOT = [15, 0, 700, 1425];     // terreno

// [nombre, x, y] de cada etiqueta
export const ROOMS = [
  ['Baño', 80, 100], ['Vestidor', 215, 90], ['Suite', 390, 95], ['Depósito', 538, 55], ['Baño', 550, 145],
  ['Dormitorio 2', 130, 262], ['Baño', 80, 385], ['Lavatorio', 182, 385], ['Pasillo', 260, 215],
  ['Dormitorio 1', 130, 505], ['Sala de juegos', 155, 720], ['Terraza', 378, 212], ['Piscina', 516, 538],
  ['Cocina', 450, 960], ['Sala · Comedor', 170, 1040], ['Aseo', 385, 1097], ['Lavandería', 550, 1078],
  ['Garaje', 470, 1270], ['Porche', 272, 1345],
];
