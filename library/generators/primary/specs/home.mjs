// Home: the library house (library/line/home_health.svg, house outline only) with a lit doorway and a chimney.
// Scene: light house in a 3px ink outline, a solid ink chimney, an ink door frame with the green door light inside.
// Story: the door light switches off, then glows back on with a flicker, and a puff of chimney smoke rises; then
// rest. Static pose: house with the door lit, no smoke.
import { L } from '../lib/geo.mjs';

const HOUSE = 'M12 3L4 11V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V11Z';
// Door: frame x 19.5–28.5 (2.5px ink), sitting on the house floor (inner edge y 36).
const FRAME = 'M19.75 37.5V28.75A4.25 4.25 0 0 1 28.25 28.75V37.5';
const LIGHT = 'M20.5 36.5V28.75A3.5 3.5 0 0 1 27.5 28.75V36.5Z';

const puff = (i, cx, cy, dx, dy, t0) => ({
  id: `smoke${i}`,
  animSibling: i > 1,
  particle: true,
  shapes: [{ circle: [cx, cy, i > 1 ? 1.5 : 1.8] }],
  fill: 'ink',
  on: ['tile'],
  anim: {
    origin: [cx, cy],
    keys: [
      { t: 0, o: 0 },
      { t: t0, o: 0, x: 0, y: 0 },
      { t: t0 + 0.05, o: 1, x: dx * 0.3, y: dy * 0.3 },
      { t: t0 + 0.14, o: 1, x: dx * 0.8, y: dy * 0.8 },
      { t: t0 + 0.2, o: 0, x: dx, y: dy },
      { t: t0 + 0.21, o: 0, x: 0, y: 0 },
      { t: 1, o: 0, x: 0, y: 0 },
    ],
  },
});

export default {
  name: 'home',
  order: 1,
  label: 'Home',
  module: 'Home',
  baseIcon: 'home_health',
  base: [HOUSE],
  motion: 'Welcome home: the door light switches off and glows back on with a flicker, then a puff of smoke rises from the chimney, then rest.',
  loopMs: 4050,
  peaks: [0.14, 0.46], // door dark · light back on, smoke rising
  restAt: 0.85,
  // Stroke variant: the lit door light stays solid ink (as an outline its flicker moves < 1% of the pixels).
  stroke: { patch: { light: { fill: 'ink', stroke: null, strokeWidth: null } } },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'chimney', shapes: [{ rect: [29.5, 10.5, 4.5, 8, 1.2] }], fill: 'ink', on: ['tile'] },
    { id: 'house', shapes: [{ path: L(HOUSE) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    {
      id: 'light',
      shapes: [{ path: LIGHT }],
      fill: 'accent',
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1 }, { t: 0.04, o: 1 }, { t: 0.11, o: 0 }, { t: 0.2, o: 0 },
          { t: 0.25, o: 1 }, { t: 0.28, o: 0.35 }, { t: 0.33, o: 1 }, { t: 1, o: 1 },
        ],
      },
    },
    { id: 'door', shapes: [{ path: FRAME }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
    puff(1, 31.75, 7.5, 1.5, -3.5, 0.34),
    puff(2, 33, 7, 3, -2.5, 0.42),
  ],
};
