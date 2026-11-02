// Size of one seat
export const SEAT_SIZE = 24;

// Top-left corner of each seat, by its label (top part of the reference plan)
export const SEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  // top row
  T1: { x: 60, y: 22 },
  T2: { x: 103, y: 22 },
  T3: { x: 146, y: 22 },
  T4: { x: 189, y: 22 },
  T5: { x: 232, y: 22 },
  T6: { x: 275, y: 22 },
  // second row: single seat on the left and two seats under the top row
  L1: { x: 20, y: 54 },
  U1: { x: 146, y: 54 },
  U2: { x: 275, y: 54 },
  // bottom row
  V1: { x: 60, y: 86 },
  V2: { x: 103, y: 86 },
  V3: { x: 146, y: 86 },
  V4: { x: 189, y: 86 },
  V5: { x: 232, y: 86 },
    // bottom part: first row
  B1: { x: 60, y: 268 },
  B2: { x: 103, y: 268 },
  B3: { x: 146, y: 268 },
  B4: { x: 189, y: 268 },
  // right column, close to the top wall
  R1: { x: 275, y: 268 },
  R2: { x: 275, y: 300 },
  // middle row: single seat on the left and one seat between B2 and B3
  L2: { x: 20, y: 300 },
  M1: { x: 116, y: 300 },
  // last row: closer seats, ends before the right column
  C1: { x: 50, y: 332 },
  C2: { x: 83, y: 332 },
  C3: { x: 116, y: 332 },
  C4: { x: 154, y: 332 },
  C5: { x: 191, y: 332 },
  C6: { x: 228, y: 332 },

  N1: { x: -46, y: 37 },
  N2: { x: -46, y: 62 },
  N3: { x: -46, y: 87 },
  N4: { x: -71, y: 37 },
  N5: { x: -71, y: 62 },
  N6: { x: -71, y: 87 },

  N7: { x: -155, y: 87 },
  N8: { x: -155, y: 62 },
  N9: { x: -155, y: 37 },
  N10: { x: -180, y: 37 },
  N11: { x: -180, y: 62 },
  N12: { x: -180, y: 87 },

  K1: { x: -252, y: 87 },
  K2: { x: -252, y: 62 },
  K3: { x: -252, y: 37 },
  K4: { x: -277, y: 87 },
  K5: { x: -277, y: 37 },
  K6: { x: -277, y: 62 },

  K7: { x: -349, y: 62 },
  K8: { x: -349, y: 87 },
  K9: { x: -349, y: 37 },
  K10: { x: -374, y: 87 },
  K11: { x: -374, y: 62 },
  K12: { x: -374, y: 37 },

  P1: { x: -446, y: 37 },
  P2: { x: -446, y: 87 },
  P3: { x: -446, y: 62 },
  P4: { x: -471, y: 37 },
  P5: { x: -471, y: 62 },
  P6: { x: -471, y: 87 },

  Z1: { x: -499, y: 153 },
  Z2: { x: -499, y: 178 },
  Z3: { x: -499, y: 203 },
  Z4: { x: -524, y: 153 },
  Z5: { x: -524, y: 178 },
  Z6: { x: -524, y: 203 },

  J1: { x: -524, y: 87 },
  J2: { x: -524, y: 62 },
  J3: { x: -524, y: 37 },
  J4: { x: -549, y: 87 },
  J5: { x: -549, y: 62 },
  J6: { x: -549, y: 37 },

  X1: { x: -602, y: 87 },
  X2: { x: -602, y: 62 },
  X3: { x: -602, y: 37 },
  X4: { x: -627, y: 87 },
  X5: { x: -627, y: 62 },
  X6: { x: -627, y: 37 },

  G1: { x: -602, y: 161 },
  G2: { x: -602, y: 195 },
  G3: { x: -568, y: 161 },
  G4: { x: -568, y: 195 },

  I1: { x: -602, y: 309 },
  I2: { x: -602, y: 284 },
  I3: { x: -602, y: 259 },
  I4: { x: -577, y: 309 },
  I5: { x: -577, y: 284 },
  I6: { x: -577, y: 259 },

  O1: { x: -46, y: 309 },
  O2: { x: -46, y: 284 },
  O3: { x: -46, y: 259 },
  O4: { x: -71, y: 309 },
  O5: { x: -71, y: 284 },
  O6: { x: -71, y: 259 },

  Y1: { x: -501, y: 309 },
  Y2: { x: -501, y: 284 },
  Y3: { x: -501, y: 259 },
  Y4: { x: -476, y: 309 },
  Y5: { x: -476, y: 284 },
  Y6: { x: -476, y: 259 },

  E1: { x: -349, y: 309 },
  E2: { x: -349, y: 284 },
  E3: { x: -349, y: 259 },
  E4: { x: -324, y: 309 },
  E5: { x: -324, y: 284 },
  E6: { x: -324, y: 259 },

  H1: { x: -275, y: 309 },
  H2: { x: -275, y: 284 },
  H3: { x: -275, y: 259 },
  H4: { x: -250, y: 309 },
  H5: { x: -250, y: 284 },
  H6: { x: -250, y: 259 },

  S1: { x: -160, y: 309 },
  S2: { x: -160, y: 284 },
  S3: { x: -160, y: 259 },
  S4: { x: -185, y: 309 },
  S5: { x: -185, y: 284 },
  S6: { x: -185, y: 259 },

  Q1: { x: -675, y: 309 },
  Q2: { x: -675, y: 284 },
  Q3: { x: -675, y: 259 },
  Q4: { x: -700, y: 309 },
  Q5: { x: -700, y: 284 },
  Q6: { x: -700, y: 259 },

  W1: { x: -728, y: 37 },
  W2: { x: -728, y: 62 },
  W3: { x: -728, y: 87 },
  W4: { x: -703, y: 37 },
  W5: { x: -703, y: 62 },
  W6: { x: -703, y: 87 },
};

// Size of the drawing
export const MAP_WIDTH = 1360;
export const MAP_HEIGHT = 380;

// Inner walls: dashed lines from (x1, y1) to (x2, y2)
export const WALLS = [
  { x1: -950, y1: 15, x2: 310, y2: 15 }, // top
  { x1: -950, y1: 363, x2: 310, y2: 363 }, // bottom
  { x1: 310, y1: 363, x2: 310, y2: 15 }, // right
  { x1: -805, y1: 363, x2: -805, y2: 15 }, // left1
  { x1: -950, y1: 363, x2: -950, y2: 15 }, // left2
  { x1: -950, y1: 234, x2: -805, y2: 234 }, 
  { x1: -860, y1: 15, x2: -860, y2: 90 }, 
  { x1: -860, y1: 90, x2: -805, y2: 90 }, 
  { x1: 10, y1: 15, x2: 10, y2: 115 }, 
  { x1: 10, y1: 263, x2: 10, y2: 363 }, 
  { x1: 10, y1: 115, x2: 310, y2: 115 }, // above the rooms
  { x1: 10, y1: 263, x2: 310, y2: 263 },  // below the rooms
  { x1: 146, y1: 115, x2: 146, y2: 223 }, // linia de la V3
  { x1: 90, y1: 155, x2: 310, y2: 155 }, // linia de dupa linia anterioara
  { x1: 90, y1: 223, x2: 310, y2: 223 },
  { x1: 167, y1: 223, x2: 167, y2: 263 },
  { x1: -606, y1: 190, x2: -540, y2: 190 },
  { x1: -573, y1: 156, x2: -573, y2: 225 }, 
];

// Doors: short thick black lines
export const DOORS = [
  { x1: 13, y1: 115, x2: 32, y2: 115 },
  { x1: 146, y1: 115, x2: 146, y2: 135 }, //usa de la V3
  { x1: 146, y1: 155, x2: 146, y2: 175 },
  { x1: 146, y1: 223, x2: 146, y2: 203 },
  { x1: 167, y1: 263, x2: 167, y2: 243 },
  { x1: 13, y1: 263, x2: 32, y2: 263 },
  { x1: -129, y1: 233, x2: -110, y2: 233 }, // usa de la primul patrat (mare,gol) dupa vestiarul din dreapta (paralel)
  { x1: -620, y1: 152, x2: -620, y2: 172 }, // usa dreptunghiul1 middle (mic) cu oameni
  { x1: -645, y1: 207, x2: -645, y2: 227 }, // usa dreptunghiul2 middle (mic) cu oameni
  { x1: -663, y1: 52, x2: -643, y2: 52 }, // usa drept. top cu oameni
  { x1: -765, y1: 363, x2: -745, y2: 363 }, // usa de la linia bottom stanga
  { x1: -860, y1: 65, x2: -860, y2: 85 },
  { x1: -805, y1: 65, x2: -805, y2: 85 },
  { x1: -855, y1: 15, x2: -835, y2: 15 },
  { x1: -805, y1: 142, x2: -805, y2: 162 },
  { x1: -805, y1: 245, x2: -805, y2: 265 },
  { x1: -805, y1: 320, x2: -805, y2: 340 },
];

// Dreptunghiuri (cabinets, furniture, small rooms)
export const RECTS = [
  { x: 60, y: 237, width: 65, height: 25 }, //dreptunghiul mic (culcat) bottom dreapta
  { x: 60, y: 116, width: 65, height: 25 }, //dreptunghiul mic (culcat) top dreapta
  { x: -16, y: 17, width: 25, height: 98 }, // primul drept. top
  { x: 12, y: 145, width: 25, height: 88 }, // primul dr. middle (vestiar)
  { x: -130, y: 145, width: 100, height: 88 }, //primul patrat (mare,gol) dupa vestiarul din dreapta (paralel)
  { x: -240, y: 145, width: 100, height: 88 }, //al 2 patrat (mare, gol) dupa vestiarul din dreapta (paralel)
  { x: -268, y: 145, width: 25, height: 88 }, //dreptunghiul (mic, gol) dupa al 2 patrat din dreapta (paralel) (creat anterior,sus)
  { x: -471, y: 145, width: 200, height: 88 }, // dreptunghiul (mare)
  { x: -645, y: 145, width: 25, height: 33 }, // dreptunghiul1 middle (mic) cu oameni
  { x: -645, y: 200, width: 25, height: 33 }, // dreptunghiul2 middle (mic) cu oameni
  { x: -745, y: 145, width: 70, height: 25 }, // dreptunghiul lung middle cu usi
  { x: -771, y: 145, width: 25, height: 88 }, // dreptunghiul lung middle cuier
  { x: -771, y: 25, width: 25, height: 98 }, // dreptunghiul lung top usi
  { x: -638, y: 331, width: 22, height: 22 }, // patratul (mic) telefon bottom
  { x: -743, y: 256, width: 25, height: 98 }, // dreptunghiul lung bottom usi
  { x: -674, y: 17, width: 42, height: 35 }, // drept. top cu oameni
  { x: -312, y: 27, width: 22, height: 22 }, // patratul (mic) telefon top
];

// Dreptunghiuri (patrate) cu linie intrerupta
export const DASHED_RECTS = [
  { x: -745, y: 171, width: 70, height: 62 }, // drept. cu sofa
];

// Cerc cu linie intrerupta
export const DASHED_CIRCLES = [
  { cx: -392, cy: 320, r: 30 }, // example
];

