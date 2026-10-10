// Mobiliario del plano original. Coordenadas en píxeles de la imagen, igual que plan.js.
//
//   rect   [x0, y0, x1, y1] huella del mueble
//   side   lado contra el que se apoya: 'n' (arriba en el plano), 's', 'e', 'w'.
//          En camas es la cabecera; en sofás, el respaldo; en sanitarios, la pared.
//   at     [x, y] centro, para piezas redondas
//
// Cada `type` tiene su constructor en builders/furniture.js.
export const FURNITURE = [
  // ── Baño suite
  { type: 'bathtub',    rect: [35, 20, 125, 60] },
  { type: 'glass',      rect: [32, 94, 126, 96] },
  { type: 'toilet',     rect: [34, 102, 66, 124], side: 'w' },
  { type: 'vanity',     rect: [34, 138, 62, 178], side: 'w' },

  // ── Vestidor y suite
  { type: 'wardrobe',   rect: [200, 16, 268, 40] },
  { type: 'wardrobe',   rect: [185, 100, 245, 124] },
  { type: 'wardrobe',   rect: [292, 46, 308, 120] },
  { type: 'tv',         rect: [309, 60, 311, 106] },
  { type: 'bed',        rect: [350, 45, 464, 140], side: 'e' },
  { type: 'nightstand', rect: [440, 17, 464, 41] },
  { type: 'nightstand', rect: [440, 144, 464, 168] },

  // ── Depósito y baño de patio
  { type: 'shelf',      rect: [472, 16, 498, 96] },
  { type: 'toilet',     rect: [532, 106, 554, 138], side: 'n' },
  { type: 'vanity',     rect: [568, 106, 602, 132], side: 'n' },

  // ── Dormitorio 2
  { type: 'bed',        rect: [58, 192, 142, 300], side: 'n' },
  { type: 'nightstand', rect: [31, 192, 55, 216] },
  { type: 'nightstand', rect: [145, 192, 169, 216] },
  { type: 'console',    rect: [65, 322, 130, 336], tv: 's' },
  { type: 'wardrobe',   rect: [202, 190, 230, 290] },

  // ── Baño y lavatorio
  { type: 'toilet',     rect: [32, 348, 64, 370], side: 'w' },
  { type: 'vanity',     rect: [140, 400, 200, 426], side: 's' },

  // ── Dormitorio 1
  { type: 'console',    rect: [65, 432, 130, 446], tv: 'n' },
  { type: 'bed',        rect: [58, 470, 142, 578], side: 's' },
  { type: 'nightstand', rect: [31, 554, 55, 578] },
  { type: 'nightstand', rect: [145, 554, 169, 578] },
  { type: 'wardrobe',   rect: [202, 485, 230, 576] },

  // ── Sala de juegos
  { type: 'console',    rect: [85, 588, 150, 602], tv: 'n' },
  { type: 'plant',      at: [47, 603] },
  { type: 'shelf',      rect: [36, 626, 72, 660], height: 0.9 },
  { type: 'console',    rect: [32, 672, 72, 718] },
  { type: 'sofa',       rect: [80, 672, 220, 718], side: 's' },
  { type: 'poolTable',  rect: [84, 754, 218, 824] },

  // ── Sala · Comedor
  { type: 'bench',      rect: [84, 886, 236, 904] },
  { type: 'table',      rect: [84, 916, 236, 960] },
  { type: 'bench',      rect: [84, 970, 236, 988] },
  { type: 'rug',        rect: [92, 1022, 242, 1182] },
  { type: 'sofa',       rect: [100, 1006, 182, 1046], side: 'n' },
  { type: 'sofa',       rect: [196, 1036, 238, 1160], side: 'e' },
  { type: 'sofa',       rect: [100, 1150, 182, 1190], side: 's' },
  { type: 'table',      rect: [128, 1070, 164, 1122], height: 0.4 },
  { type: 'console',    rect: [31, 1040, 47, 1150], tv: 'w' },

  // ── Cocina
  { type: 'counter',    rect: [356, 916, 500, 944] },
  { type: 'counter',    rect: [330, 916, 358, 1046] },
  { type: 'sink',       rect: [392, 921, 434, 939] },
  { type: 'cooktop',    rect: [334, 966, 354, 1004] },
  { type: 'stool',      at: [462, 900] },
  { type: 'stool',      at: [487, 900] },
  { type: 'stool',      at: [310, 935] },
  { type: 'stool',      at: [310, 962] },
  { type: 'stool',      at: [310, 989] },
  { type: 'stool',      at: [310, 1016] },
  { type: 'stool',      at: [310, 1041] },
  { type: 'grill',      rect: [572, 870, 604, 906] },
  { type: 'fridge',     rect: [574, 940, 604, 972] },
  { type: 'fridge',     rect: [574, 976, 604, 1010] },

  // ── Aseo y lavandería
  { type: 'vanity',     rect: [338, 1060, 380, 1084], side: 'n' },
  { type: 'toilet',     rect: [398, 1060, 420, 1092], side: 'n' },
  { type: 'vanity',     rect: [498, 1024, 530, 1050], side: 'n' },
  { type: 'washer',     rect: [538, 1024, 566, 1052] },
  { type: 'washer',     rect: [570, 1024, 598, 1052] },
  { type: 'counter',    rect: [497, 1106, 604, 1132] },

  // ── Garaje
  { type: 'car',        rect: [365, 1168, 440, 1385], paint: 0xd9c9a0 },
  { type: 'car',        rect: [495, 1168, 570, 1385], paint: 0xb9a3a0 },

  // ── Patio y jardín
  { type: 'lounger',    rect: [512, 248, 566, 330], side: 'n' },
  { type: 'lounger',    rect: [588, 268, 642, 350], side: 'n' },
  { type: 'sideTable',  at: [577, 262] },
  { type: 'palm',       at: [320, 312] },
  { type: 'palm',       at: [318, 832] },
  ...[400, 445, 490, 535, 580, 625, 668].map(y => ({ type: 'shrub', at: [665, y] })),
  { type: 'plant',      at: [236, 1312] },
];
