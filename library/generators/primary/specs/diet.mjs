// Diet: the library apple (library/line/dietitian.svg, stem and leaf included) served in a feeding bowl.
// Scene: a light bowl seen from above the rim, with green food inside (accent on the rim's fill) and the library
// apple sitting in it, its lower part behind the bowl's front wall.
// Story: the apple lifts out of the bowl and drops back in with a small squash, and the food bounces as it lands;
// then rest. Static pose: the apple sitting in the bowl of food.
import svgpath from 'svgpath';

const APPLE = 'M12 11C10 9 5 9 5 15C5 19 8 21 12 21C16 21 19 19 19 15C19 9 14 9 12 11Z';
const STEM = 'M12 11V6';
const LEAF = 'M12 6Q12 3 15 3Q15 6 12 6Z';
const K = 1.15;
const T = (d) => svgpath(d).translate(-12, -21).scale(K).translate(24, 32).round(3).toString(); // apple base at (24, 32)

const RIM = { cx: 24, cy: 28, rx: 15, ry: 4.5 };
const FRONT = 'M9 28A15 4.5 0 0 0 39 28C39 35.5 32.5 40.5 24 40.5C15.5 40.5 9 35.5 9 28Z';

export default {
  name: 'diet',
  order: 13,
  label: 'Diet',
  module: 'Diet plans / feeding',
  baseIcon: 'dietitian',
  base: [APPLE, STEM, LEAF],
  motion: 'Feeding: the apple lifts out of the bowl and drops back in, and the food bounces as it lands, then rest.',
  loopMs: 3350,
  peaks: [0.2, 0.34], // apple lifted · apple landing (squash), food bounced
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'rim', shapes: [{ ellipse: [RIM.cx, RIM.cy, RIM.rx, RIM.ry] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    {
      id: 'food',
      shapes: [{ ellipse: [24, 28.4, 11, 2.2] }],
      fill: 'accent',
      on: ['fill'],
      anim: { origin: [24, 30], keys: [{ t: 0 }, { t: 0.28, y: 0, s: 1 }, { t: 0.33, y: -0.8, s: 1.06 }, { t: 0.4, y: 0, s: 1 }, { t: 1 }] },
    },
    {
      id: 'apple',
      anim: {
        origin: [24, 32],
        keys: [
          { t: 0 }, { t: 0.04, y: 0, s: 1 }, { t: 0.1, y: 0.6, s: 0.97 }, { t: 0.2, y: -4, s: 1.02 },
          { t: 0.3, y: 0.6, s: 0.95 }, { t: 0.38, y: -0.6, s: 1.02 }, { t: 0.46, y: 0, s: 1 }, { t: 1 },
        ],
      },
      children: [
        { id: 'stem', shapes: [{ path: T(STEM) }], stroke: 'ink', strokeWidth: 2.5, on: ['tile'] },
        { id: 'leaf', shapes: [{ path: T(LEAF) }], fill: 'ink', stroke: 'ink', strokeWidth: 2, on: ['tile'] },
        { id: 'fruit', shapes: [{ path: T(APPLE) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'fruitShade', shapes: [{ path: T('M16.2 13.6C16.8 15.8 16 18 14.2 19') }], stroke: 'shade', strokeWidth: 2.25 },
      ],
    },
    { id: 'bowl', shapes: [{ path: FRONT }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'bowlShade', shapes: [{ path: 'M31.5 35.5C30 37 27.5 38 24.5 38.2' }], stroke: 'shade', strokeWidth: 2.25 },
  ],
};
