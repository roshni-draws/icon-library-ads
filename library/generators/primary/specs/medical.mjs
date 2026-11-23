// Medical: the library first-aid bag (library/line/medical.svg) with a heartbeat line across its front.
// Scene: light bag in an ink outline with its handle, ink cross, soft shade down the right side, and an accent
// (green) ECG line drawn across the lower half of the bag face. v2.1: the line stays entirely inside the bag's
// fill area (accent only on fill); it no longer runs out over the tile.
// Story: the ECG line fades, then re-draws left → right (trim path) with one heartbeat spike; as the spike passes
// the cross beats once, lub-dub (1 → 1.1 → 1 → 1.06 → 1); then rest. Static pose: line fully drawn, cross at 1.
import { L, P, D } from '../lib/geo.mjs';

const BAG = [3, 7, 18, 14, 2]; // rect x y w h rx (24-grid) → 10.5 16.5 27 21 3 on the tile
const HANDLE = 'M9 7V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V7';
// Bag fill (inside the 3px outline): x 12–36, y 18–36; the shade covers x 32–36. The cross sits in the upper half
// and the ECG band (y ≈ 29.5–35, stroke edges 28.3–36.2) in the lower half, between the left wall and the shade.
const CROSS = 'M24 19.75V26.75M20.5 23.25H27.5';
const CROSS_C = [24, 23.25];
const ECG = 'M14 32.5H18.5L20.5 29.6L23.4 35L25.6 31L27 32.5H30.5';

export default {
  name: 'medical',
  order: 6,
  label: 'Medical',
  module: 'Medical',
  baseIcon: 'medical',
  base: [HANDLE],
  motion: 'Heartbeat: the ECG line re-draws across the bag; the cross beats once (lub-dub) as the spike passes, then rest.',
  loopMs: 3000,
  peaks: [0.2, 0.35], // ECG just starting to re-draw · lub (cross at 1.1 as the spike passes)
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'handle', shapes: [{ path: L(HANDLE) }], stroke: 'ink', on: ['tile'] },
    { id: 'bag', shapes: [{ rect: [...P(BAG[0], BAG[1]), D(BAG[2]), D(BAG[3]), D(BAG[4])] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'bagShade', shapes: [{ path: 'M32 18H34.5A1.5 1.5 0 0 1 36 19.5V34.5A1.5 1.5 0 0 1 34.5 36H32Z' }], fill: 'shade' },
    {
      id: 'cross',
      shapes: [{ path: CROSS }],
      stroke: 'ink',
      strokeWidth: 3.5,
      on: ['fill'],
      anim: {
        origin: CROSS_C,
        keys: [{ t: 0 }, { t: 0.3, s: 1 }, { t: 0.35, s: 1.1 }, { t: 0.4, s: 1 }, { t: 0.45, s: 1.06 }, { t: 0.52, s: 1 }, { t: 1 }],
      },
    },
    {
      id: 'ecg',
      shapes: [{ path: ECG }],
      stroke: 'accent',
      strokeWidth: 2.5,
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1, te: 1 },
          { t: 0.04, o: 1, te: 1 },
          { t: 0.12, o: 0, te: 1 },
          { t: 0.13, o: 0, te: 0 },
          { t: 0.15, o: 1, te: 0.03 },
          { t: 0.5, o: 1, te: 1 },
          { t: 1, o: 1, te: 1 },
        ],
      },
    },
  ],
};
