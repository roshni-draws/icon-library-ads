// Species: taxonomy levels as three stacked index cards (kingdom → genus → species), the front card carrying the
// library paw (library/line/animal.svg).
// Scene: three light rounded cards in 3px ink outlines, offset diagonally (back card at the upper left). The front
// card holds a solid ink paw print and a green index tab (accent on its fill) at its top left.
// Story: the cards fan out (the middle card, then the back card, slide up and left), the paw pops, then the cards
// settle back into the stack; then rest. Static pose: the stack, paw and tab on the front card.
import svgpath from 'svgpath';
import { rrect, disc } from '../lib/shapes.mjs';

const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
const r3 = (v) => +v.toFixed(3);
const W = 19, H = 21, R = 4, STEP = 5;
const card = (i) => rrect(9 + STEP * i, 8 + STEP * i, W, H, R); // back (0) → front (2)
const FRONT = [9 + STEP * 2, 8 + STEP * 2]; // card spans 19–38 × 18–39; its fill 20.5–36.5 × 19.5–37.5

// The library paw at k = 0.62, centred on (28.5, 32) (24-grid paw centre (12, 15)); solid ink at this size.
const K = 0.62, PC = [28.5, 32];
const PAW_PAD = svgpath(PAD).translate(-12, -15).scale(K).translate(...PC).round(3).toString();
const toe = ([x, y]) => [r3(PC[0] + K * (x - 12)), r3(PC[1] + K * (y - 15))];

const fan = (dx, t0) => ({
  keys: [
    { t: 0 }, { t: t0, x: 0, y: 0 }, { t: t0 + 0.1, x: -dx, y: -dx }, { t: 0.46, x: -dx, y: -dx },
    { t: 0.58, x: 0.3, y: 0.3 }, { t: 0.64, x: 0, y: 0 }, { t: 1 },
  ],
});

export default {
  name: 'species',
  order: 4,
  label: 'Species',
  module: 'Species / taxonomy',
  baseIcon: 'animal',
  base: [PAD],
  motion: 'Taxonomy: the stacked level cards fan out, the paw on the front card pops, and the cards settle back, then rest.',
  loopMs: 3050,
  peaks: [0.22, 0.36], // cards fanned out · paw popped
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'back', shapes: [{ path: card(0) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] }, anim: fan(2.8, 0.1) },
    { id: 'middle', shapes: [{ path: card(1) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] }, anim: fan(2, 0.04) },
    { id: 'front', shapes: [{ path: card(2) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    // index tab, 1px clear of the outline's inner edge
    { id: 'tab', shapes: [{ path: rrect(FRONT[0] + 2.5, FRONT[1] + 2.5, 7, 3, 1.5) }], fill: 'accent', on: ['fill'] },
    {
      id: 'paw',
      anim: { origin: PC, keys: [{ t: 0 }, { t: 0.24, s: 1 }, { t: 0.3, s: 0.9 }, { t: 0.36, s: 1.1 }, { t: 0.44, s: 1 }, { t: 1 }] },
      children: [
        { id: 'pad', shapes: [{ path: PAW_PAD }], fill: 'ink', stroke: 'ink', strokeWidth: 1, on: ['fill'] },
        ...TOES.map((t, i) => ({ id: `toe${i + 1}`, shapes: [{ path: disc(...toe(t), 1.45) }], fill: 'ink', on: ['fill'] })),
      ],
    },
  ],
};
