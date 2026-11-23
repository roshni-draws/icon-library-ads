// Notifications: the library bell (library/line/bell.svg) at ×1.5.
// Scene: light bell in an ink outline with the ink knob stub and clapper bar and a green band round its waist
// (accent, on the bell); two ink ring arcs that only appear while it rings.
// Story: the bell swings −10° / +9° / −5° / +2° about its knob, the clapper lagging behind, and two ring arcs
// flash out at its sides; then rest. Static pose: bell hanging still, no arcs.
import { L } from '../lib/geo.mjs';

const BODY = 'M12 5A6 6 0 0 0 6 11V14L4 17H20L18 14V11A6 6 0 0 0 12 5Z'; // → dome top 13.5, lip 31.5
const KNOB = 'M12 3V5';
const CLAPPER = 'M10 21H14'; // → y 37.5
const PIVOT = [24, 10.5];

const ring = (id, d, dx, sib) => ({
  id,
  animSibling: sib,
  particle: true,
  shapes: [{ path: d }],
  stroke: 'ink',
  strokeWidth: 2.5,
  on: ['tile'],
  anim: {
    keys: [
      { t: 0, o: 0, x: 0 }, { t: 0.1, o: 0, x: 0 }, { t: 0.16, o: 1, x: dx * 0.5 }, { t: 0.3, o: 1, x: dx },
      { t: 0.4, o: 0, x: dx * 1.5 }, { t: 0.41, o: 0, x: 0 }, { t: 1, o: 0, x: 0 },
    ],
  },
});

export default {
  name: 'notifications',
  order: 22,
  label: 'Notifications',
  module: 'Notifications',
  baseIcon: 'bell',
  base: [BODY, KNOB, CLAPPER],
  motion: 'Alert: the bell swings and rings, its clapper lagging, with two ring arcs flashing out, then rest.',
  loopMs: 3900,
  peaks: [0.14, 0.26], // swung left, arcs out · swung right
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    ring('ringL', 'M9 15.5Q6.8 20 9 24.5', -1.5, false),
    ring('ringR', 'M39 15.5Q41.2 20 39 24.5', 1.5, true),
    {
      id: 'bell',
      anim: {
        origin: PIVOT,
        keys: [
          { t: 0 }, { t: 0.04, r: 0 }, { t: 0.14, r: -10 }, { t: 0.26, r: 9 }, { t: 0.37, r: -5 },
          { t: 0.46, r: 2 }, { t: 0.54, r: 0 }, { t: 1 },
        ],
      },
      children: [
        { id: 'knob', shapes: [{ path: L(KNOB) }], stroke: 'ink', on: ['tile'] },
        {
          id: 'clapper',
          shapes: [{ path: L(CLAPPER) }],
          stroke: 'ink',
          on: ['tile'],
          anim: {
            origin: [24, 37.5],
            keys: [
              { t: 0 }, { t: 0.06, x: 0 }, { t: 0.17, x: 2 }, { t: 0.29, x: -2 }, { t: 0.4, x: 1.2 },
              { t: 0.5, x: -0.4 }, { t: 0.58, x: 0 }, { t: 1 },
            ],
          },
        },
        { id: 'body', shapes: [{ path: L(BODY) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'band', shapes: [{ rect: [18, 23.5, 12, 3.5, 1.75] }], fill: 'accent', on: ['fill'] },
      ],
    },
  ],
};
