// Activity log: the library history clock (library/line/history.svg): a light clock face inside the rewind arc.
// Scene: light face in the 3px ink arc with its arrowhead, ink hands, and a green "elapsed" arc inside the face
// running round from the minute hand.
// Story: the arc and arrow rewind (−10°) and the green elapsed arc clears; then the hands sweep forward as the arc
// re-draws clockwise round the face; then rest. Static pose: the full clock with its elapsed arc.
import { L } from '../lib/geo.mjs';

const ARC = 'M4 12A8 8 0 1 0 12 4C9 4 7 5 6 6L4 8';
const ARROW = 'M4 4V8H8';
const HANDS = 'M12 8V12L14 14';
const pt = (deg, r) => [24 + r * Math.sin((deg * Math.PI) / 180), 24 - r * Math.cos((deg * Math.PI) / 180)].map((v) => +v.toFixed(3));
const R = 8; // face inner edge is r 10.5; the 2.5px arc keeps 1.25px clear of it
const [ax, ay] = pt(22, R), [bx, by] = pt(118, R);
const ELAPSED = `M${ax} ${ay}A${R} ${R} 0 0 1 ${bx} ${by}`;

export default {
  name: 'activity_log',
  order: 29,
  label: 'Activity log',
  module: 'Activity log',
  baseIcon: 'history',
  base: [ARC, ARROW, HANDS],
  motion: 'Log: the clock rewinds, then its hands sweep forward as the elapsed arc re-draws round the face, then rest.',
  loopMs: 4400,
  peaks: [0.14, 0.32], // rewound, arc cleared, hands back · hands sweeping, arc half drawn
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'face', shapes: [{ path: L(ARC + 'Z') }], fill: 'fill' },
    {
      id: 'elapsed',
      shapes: [{ path: ELAPSED }],
      stroke: 'accent',
      strokeWidth: 2.5,
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.11, o: 0, te: 1 }, { t: 0.12, o: 0, te: 0 },
          { t: 0.16, o: 0, te: 0 }, { t: 0.18, o: 1, te: 0.05 }, { t: 0.46, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
        ],
      },
    },
    {
      id: 'hands',
      shapes: [{ path: L(HANDS) }],
      stroke: 'ink',
      on: ['fill'],
      anim: { origin: [24, 24], keys: [{ t: 0 }, { t: 0.04, r: 0 }, { t: 0.14, r: -12 }, { t: 0.18, r: -12 }, { t: 0.46, r: 3 }, { t: 0.54, r: 0 }, { t: 1 }] },
    },
    {
      id: 'ring',
      anim: { origin: [24, 24], keys: [{ t: 0 }, { t: 0.04, r: 0 }, { t: 0.14, r: -10 }, { t: 0.3, r: 1.5 }, { t: 0.38, r: 0 }, { t: 1 }] },
      children: [
        { id: 'arc', shapes: [{ path: L(ARC) }], stroke: 'ink', on: ['tile', 'fill'] },
        { id: 'arrow', shapes: [{ path: L(ARROW) }], stroke: 'ink', on: ['tile'] },
      ],
    },
  ],
};
