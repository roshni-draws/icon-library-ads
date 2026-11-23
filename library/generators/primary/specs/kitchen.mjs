// Kitchen: the library cooking pot (library/line/cooking_pot.svg) on the boil.
// Scene: the library pot at ×1.5 (moved down 2px to leave room for steam): a light pot body in a 3px ink outline
// with two ink side handles and a green band round it (accent on its fill), and the ink lid with its knob.
// Story: the lid lifts and tilts (−3px, −8°), two ink steam wisps draw in and rise, fading, from under it, then the
// lid settles with a small bump; then rest. Static pose: the pot, lid on, no steam.
import svgpath from 'svgpath';
import { L } from '../lib/geo.mjs';
import { rrect } from '../lib/shapes.mjs';

const BODY = 'M5 10H19V17A3 3 0 0 1 16 20H8A3 3 0 0 1 5 17Z';
const HANDLES = 'M3 13H5M19 13H21';
const LID = 'M4 6H20M12 4V6';
const DY = 2;
const place = (d) => svgpath(L(d)).translate(0, DY).round(3).toString();
// body: x 13.5–34.5, y 23–38 (fill 15–33 × 24.5–36.5); lid line y 17, knob 14–17

const wisp = (id, x, t0, sib) => ({
  id,
  animSibling: sib,
  particle: true,
  shapes: [{ path: `M${x} 14C${x - 2} 12 ${x + 2} 10 ${x} 7.5` }],
  stroke: 'ink',
  strokeWidth: 2.5,
  on: ['tile'],
  anim: {
    keys: [
      { t: 0, o: 0, y: 0, te: 1 }, { t: t0, o: 0, y: 0, te: 1 }, { t: t0 + 0.01, o: 0, y: 0, te: 0.05 },
      { t: t0 + 0.04, o: 1, y: -0.5, te: 0.25 }, { t: t0 + 0.16, o: 1, y: -2.5, te: 1 },
      { t: t0 + 0.28, o: 0, y: -5, te: 1 }, { t: t0 + 0.29, o: 0, y: 0, te: 1 }, { t: 1, o: 0, y: 0, te: 1 },
    ],
  },
});

export default {
  name: 'kitchen',
  order: 14,
  label: 'Kitchen',
  module: 'Kitchen / food prep',
  baseIcon: 'cooking_pot',
  base: [BODY, HANDLES, LID],
  motion: 'Cooking: the pot lid lifts and tilts as steam rises from under it, then the lid settles, then rest.',
  loopMs: 3450,
  peaks: [0.2, 0.32], // lid up, steam drawing · steam risen, lid tilted
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    wisp('steam1', 18.5, 0.12, false),
    wisp('steam2', 29.5, 0.18, true),
    { id: 'handles', shapes: [{ path: place(HANDLES) }], stroke: 'ink', on: ['tile'] },
    { id: 'pot', shapes: [{ path: place(BODY) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    // band, 1px clear of the body outline's inner edge
    { id: 'band', shapes: [{ path: rrect(16, 28, 16, 4, 2) }], fill: 'accent', on: ['fill'] },
    {
      id: 'lid',
      shapes: [{ path: place(LID) }],
      stroke: 'ink',
      on: ['tile'],
      anim: {
        origin: [24, 17],
        keys: [
          { t: 0 }, { t: 0.06, y: 0, r: 0 }, { t: 0.18, y: -3, r: -8 }, { t: 0.32, y: -3, r: -6 },
          { t: 0.44, y: -3, r: -8 }, { t: 0.54, y: 0.4, r: 1 }, { t: 0.6, y: 0, r: 0 }, { t: 1 },
        ],
      },
    },
  ],
};
