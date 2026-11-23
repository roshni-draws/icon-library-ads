// Animals: a trail of two paw prints (the library paw, library/line/animal.svg, shared base "Paw").
// Scene: a big front print at the upper right (light pad in an ink outline, solid ink toes, soft shade under the
// pad) and a trail print at the lower left: ~60% of the front print, solid ink, turned 20° clockwise (−20° in
// y-up terms) so its toes point at the front print and the two read as one animal walking up and to the right.
// Story: the trail print fades in; the front paw lifts and presses down (scale 0.92 → 1.04 → 1) and kicks up two
// ink dust dots that drift out and fade; then rest. Static pose: both prints down, no dust.
import svgpath from 'svgpath';

const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
const r3 = (v) => +v.toFixed(3);

/** The library paw (24 grid, centred on (12, 15)) placed at (cx, cy), scaled by k and turned by deg (SVG, cw). */
function paw(cx, cy, k, deg = 0) {
  const pad = svgpath(PAD).translate(-12, -15).scale(k).rotate(deg).translate(cx, cy).round(3).toString();
  const a = (deg * Math.PI) / 180;
  const toes = TOES.map(([x, y]) => {
    const [dx, dy] = [k * (x - 12), k * (y - 15)];
    return [r3(cx + dx * Math.cos(a) - dy * Math.sin(a)), r3(cy + dx * Math.sin(a) + dy * Math.cos(a))];
  });
  return { pad, toes };
}

const K = 1.15;
const FRONT = paw(30.5, 25, K);
const TRAIL = paw(12.5, 34, K * 0.6, 20);
const GROUND = 31.9; // bottom of the front pad's fill (its ink edge is at 33.4)

const dust = (id, cx, dx, dy) => ({
  id,
  animSibling: id !== 'dust1',
  particle: true,
  shapes: [{ circle: [cx, GROUND + 1, 1.9] }],
  fill: 'ink',
  on: ['tile'],
  anim: {
    origin: [cx, GROUND],
    keys: [
      { t: 0, o: 0 },
      { t: 0.4, o: 0, x: 0, y: 0 },
      { t: 0.45, o: 1, x: dx * 0.4, y: dy * 0.3 },
      { t: 0.54, o: 1, x: dx * 0.8, y: dy * 0.75 },
      { t: 0.62, o: 0, x: dx, y: dy },
      { t: 0.63, o: 0, x: 0, y: 0 },
      { t: 1, o: 0, x: 0, y: 0 },
    ],
  },
});

export default {
  name: 'animals',
  order: 3,
  label: 'Animals',
  module: 'Animals and species',
  baseIcon: 'animal',
  base: [PAD],
  motion: 'Paw trail: the trail print fades in, then the front paw lifts and presses down with a puff of dust, then rest.',
  loopMs: 3400,
  peaks: [0.32, 0.47], // paw lifted (trail print back in) · pressed with dust out
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'trail',
      // Solid ink: at ~60% size an outlined pad would leave almost no fill, so the trail print is a silhouette.
      shapes: [{ path: TRAIL.pad }, ...TRAIL.toes.map(([x, y], i) => ({ circle: [x, y, i === 1 || i === 2 ? 1.95 : 1.8] }))],
      fill: 'ink',
      on: ['tile'],
      anim: { keys: [{ t: 0, o: 1 }, { t: 0.03, o: 1 }, { t: 0.1, o: 0 }, { t: 0.24, o: 1 }, { t: 1, o: 1 }] },
    },
    {
      id: 'front',
      anim: {
        origin: [30.5, GROUND],
        keys: [
          { t: 0 },
          { t: 0.2, s: 1, y: 0 },
          { t: 0.32, s: 0.92, y: -3.5 },
          { t: 0.42, s: 1.04, y: 0.5 },
          { t: 0.5, s: 1, y: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'pad', shapes: [{ path: FRONT.pad }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'padShade', shapes: [{ path: 'M26.6 29.3H34.4' }], stroke: 'shade', strokeWidth: 2.25 },
        {
          id: 'toes',
          // Solid ink beans: an outlined toe this small leaves a 1.5px fill and reads as an eye, not a toe.
          shapes: FRONT.toes.map(([x, y], i) => ({ ellipse: [x, y, 2.9, i === 1 || i === 2 ? 3.5 : 3.25] })),
          fill: 'ink',
          on: ['tile'],
        },
      ],
    },
    // The dust puffs out sideways and down from under the pad, away from the trail print.
    dust('dust1', 24, -2.5, 3),
    dust('dust2', 37, 3.5, 2.5),
  ],
};
