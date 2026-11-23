// Move animal: an animal on its way across a map. The library move-in glyph (library/line/move_in.svg) is the
// family reference for the module; the truck is lib/truck.mjs (the transfers truck, scaled down).
// Scene: a light 3-panel folded map in an ink outline with ink fold lines (the left panel shaded), a dashed green
// route (accent, on the map) from the truck to a location pin (light, ink outline, ink dot) at the upper right; a
// small light truck at the lower left with a solid ink paw on its cargo box (the animal inside).
// Story: the route fades and the truck backs up; the route re-draws toward the pin (trim) as the truck drives
// forward, tilting up with the route; the pin pops (1 → 1.1 → 1) as the route reaches it; the truck settles;
// then rest. Static pose: map, full route, pin, truck.
import svgpath from 'svgpath';
import { truck } from '../lib/truck.mjs';
import { disc } from '../lib/shapes.mjs';

const ARROW = 'M3 12H15M11 8L15 12L11 16';
const K = 0.55;
const T = truck(K, 14.5, 40.5);

// The map: three panels, folded (alternating top and bottom edges).
const MAP = 'M7.5 10.5L19 8.5L30.5 10.5L42 8.5V35L30.5 37L19 35L7.5 37Z';
const FOLDS = 'M19 8.5V35M30.5 10.5V37';
const SIDE_SHADE = 'M9 11.75L18 10.2V34.3L9 35.85Z'; // left panel (the route never crosses it)

// The pin (teardrop, tip down) at the upper right.
const PIN_TIP = [36, 23.5];
const PIN = 'M36 23.5C33.6 20.6 31.6 18.3 31.6 15.6C31.6 13.1 33.6 11.1 36 11.1C38.4 11.1 40.4 13.1 40.4 15.6C40.4 18.3 38.4 20.6 36 23.5Z';

// Route: an S from the truck's nose up through the middle panel to the pin tip (two cubic segments).
const SEGS = [
  [[23.5, 32.5], [28.5, 31.5], [24.5, 23], [28.5, 20.5]],
  [[28.5, 20.5], [31, 19], [33.4, 21], [35.4, 23.2]],
];
const ROUTE = SEGS.map((c, i) => `${i ? '' : `M${c[0].join(' ')}`}C${c[1].join(' ')} ${c[2].join(' ')} ${c[3].join(' ')}`).join('');
const bez = (c, t) => [0, 1].map((i) => +((1 - t) ** 3 * c[0][i] + 3 * (1 - t) ** 2 * t * c[1][i] + 3 * (1 - t) * t ** 2 * c[2][i] + t ** 3 * c[3][i]).toFixed(3));
// Dashes: light discs punched along the green line (static; they only show where the route is drawn).
const GAPS = [[0, 0.3], [0, 0.72], [1, 0.25], [1, 0.68]].map(([i, t]) => disc(...bez(SEGS[i], t), 1.55));

// The animal inside: the library paw, small and solid ink, on the cargo box.
const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
const BOX_C = T.map([20.5, 22.25]);
const PK = 0.34;
const PAW_PAD = svgpath(PAD).translate(-12, -15).scale(PK).translate(BOX_C[0], BOX_C[1] + 0.4).round(3).toString();
const PAW_TOES = TOES.map(([x, y], i) => disc(+(BOX_C[0] + PK * (x - 12)).toFixed(3), +(BOX_C[1] + 0.4 + PK * (y - 15)).toFixed(3), i === 1 || i === 2 ? 1.05 : 0.95));

export default {
  name: 'move_animal',
  order: 12,
  label: 'Move animal',
  module: 'Move animal between enclosures',
  baseIcon: 'move_in',
  base: [ARROW],
  motion: 'Move: the route re-draws across the map as the truck drives along it, and the pin pops as the route arrives, then rest.',
  loopMs: 3300,
  peaks: [0.14, 0.46], // route gone, truck backed up · route arriving, truck forward and tilted, pin at 1.1
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'map', shapes: [{ path: MAP }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'mapShade', shapes: [{ path: SIDE_SHADE }], fill: 'shade' },
    { id: 'folds', shapes: [{ path: FOLDS }], stroke: 'ink', strokeWidth: 2, on: ['fill'] },
    {
      id: 'route',
      shapes: [{ path: ROUTE }],
      stroke: 'accent',
      strokeWidth: 3,
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1, ts: 0, te: 1 },
          { t: 0.04, o: 1 },
          { t: 0.12, o: 0 },
          { t: 0.14, te: 0.04 },
          { t: 0.18, o: 1 },
          { t: 0.46, te: 1 },
          { t: 1 },
        ],
      },
    },
    { id: 'dashes', shapes: GAPS.map((path) => ({ path })), fill: 'fill', on: ['accent'] },
    {
      id: 'pin',
      anim: {
        origin: PIN_TIP,
        keys: [{ t: 0 }, { t: 0.44, s: 1 }, { t: 0.5, s: 1.1 }, { t: 0.58, s: 0.97 }, { t: 0.64, s: 1 }, { t: 1 }],
      },
      children: [
        { id: 'pinBody', shapes: [{ path: PIN }], fill: 'fill', stroke: 'ink', strokeWidth: 2.5, on: { stroke: ['tile', 'fill'] } },
        { id: 'pinDot', shapes: [{ path: disc(36, 15.6, 1.7) }], fill: 'ink', on: ['fill'] },
      ],
    },
    {
      id: 'truck',
      anim: {
        origin: T.front,
        keys: [
          { t: 0 },
          { t: 0.04, x: 0, y: 0, r: 0 },
          { t: 0.14, x: -2.5, y: 0 },
          { t: 0.34, x: 1.5, y: -0.5, r: -3 },
          { t: 0.46, x: 2.5, y: -1.5, r: -6 },
          { t: 0.6, x: 0, y: 0, r: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'body', shapes: [{ path: T.box }, { path: T.cab }], fill: 'fill', stroke: 'ink', strokeWidth: 2.5, on: { stroke: ['tile', 'fill'] } },
        { id: 'window', shapes: [{ path: T.window }], fill: 'ink', on: ['fill'] },
        { id: 'paw', shapes: [{ path: PAW_PAD }, ...PAW_TOES.map((path) => ({ path }))], fill: 'ink', on: ['fill'] },
        { id: 'wheels', shapes: T.wheels.map((path) => ({ path })), fill: 'ink', on: ['tile', 'fill'] },
        { id: 'hubs', shapes: T.wheelCentres.map(([x, y]) => ({ path: disc(x, y, 0.9) })), fill: 'fill', on: ['ink'] },
      ],
    },
  ],
};
