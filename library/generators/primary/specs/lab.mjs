// Lab: the library flask (library/line/lab_request.svg, shared base "Flask") with liquid and bubbles.
// Scene: light glass in an ink outline, accent (green) liquid with a light shine stroke, three bubbles. v2.1: the
// bubbles are light discs in a thin ink ring, so they read on the liquid (light disc) and on the glass (ink ring).
// Story: the liquid surges up and sloshes (rotate ±12° + shift ≤ 4px inside the flask clip) and settles; three bubbles rise from the surface
// in a stagger (up to 8px, fading in and out); then rest. Static pose: level liquid, no bubbles.
import { L } from '../lib/geo.mjs';

const FLASK = 'M10 3V9L5 19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19L14 9V3';
const RIM = 'M8 3H16';
const INSIDE = L(FLASK + 'Z'); // closed flask: the glass fill and the liquid clip
const SURFACE = 30; // below the library's liquid line (28.5) to leave the bubbles room to rise in the body
const LIQUID = `M2 ${SURFACE}Q7 ${SURFACE - 2.4} 12 ${SURFACE}T22 ${SURFACE}T32 ${SURFACE}T42 ${SURFACE}T52 ${SURFACE}V46H2Z`;

const bubble = (i, cx, cy, dx, t0) => ({
  id: `bubble${i}`,
  animSibling: i > 1,
  particle: true,
  shapes: [{ circle: [cx, cy, 2.3] }],
  fill: 'fill',
  stroke: 'ink',
  strokeWidth: 1.5,
  on: { fill: ['accent'], stroke: ['fill'] },
  anim: {
    origin: [cx, cy],
    keys: [
      { t: 0, o: 0 },
      { t: t0, o: 0, x: 0, y: 0 },
      { t: t0 + 0.05, o: 1, x: dx * 0.2, y: -2 },
      { t: t0 + 0.17, o: 1, x: dx * 0.7, y: -6 },
      { t: t0 + 0.24, o: 0, x: dx, y: -7.5 },
      { t: t0 + 0.25, o: 0, x: 0, y: 0 },
      { t: 1, o: 0, x: 0, y: 0 },
    ],
  },
});

export default {
  name: 'lab',
  order: 9,
  label: 'Lab',
  module: 'Lab',
  baseIcon: 'lab_request',
  base: [FLASK, 'M8 3H16M7 15H17'],
  motion: 'Experiment: the liquid sloshes and settles while three bubbles rise from it one after another, then rest.',
  loopMs: 3800,
  peaks: [0.14, 0.32], // liquid surges up-left · bubbles in the neck, slosh back
  restAt: 0.85,
  // Stroke variant: the shine only meant something on the green liquid; the liquid keeps its surface line.
  // The bubbles stay rings (a tile knockout in their ink ring), not solid ink blobs.
  stroke: { drop: ['shine'], patch: { bubble1: { fill: 'tile' }, bubble2: { fill: 'tile' }, bubble3: { fill: 'tile' } } },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'glass', shapes: [{ path: INSIDE }], fill: 'fill' },
    {
      id: 'liquid',
      clip: INSIDE,
      shapes: [{ path: LIQUID }],
      fill: 'accent',
      on: ['fill'],
      anim: {
        origin: [24, SURFACE + 1],
        keys: [
          { t: 0 }, { t: 0.04 },
          { t: 0.14, r: -12, x: -2, y: -3.4 },
          { t: 0.25, r: 10, x: 2.2, y: -2.4 },
          { t: 0.35, r: -6, x: -1.5, y: -0.8 },
          { t: 0.44, r: 3, x: 0.8, y: 0 },
          { t: 0.52, r: 0, x: 0, y: 0 },
          { t: 1 },
        ],
      },
    },
    { id: 'shine', shapes: [{ path: 'M19.2 32.6L17.9 35.2' }], stroke: 'fill', strokeWidth: 2, on: ['accent'] },
    // Born just under the surface, they rise out of the liquid into the glass.
    bubble(1, 21.5, 31.5, 1.2, 0.12),
    bubble(2, 24.5, 32.5, 0, 0.2),
    bubble(3, 27, 31.5, -1.2, 0.28),
    { id: 'flask', shapes: [{ path: L(FLASK) }, { path: L(RIM) }], stroke: 'ink', on: ['tile', 'fill'] },
  ],
};
