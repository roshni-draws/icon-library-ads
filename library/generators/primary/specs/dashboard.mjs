// Dashboard: the library grid view (library/line/grid_view.svg), four light widgets in ink outlines, enlarged to
// fill the tile (cells 11.5px, 2px gutter) so the grid reads at 48px.
// Scene: a 2×2 grid of widget tiles; the top-left one is the active widget, its face marked in green.
// Story: the widgets refresh one after another: each pulses (1 → 1.1 → 1) with its green mark flashing in, and
// the first widget's mark stays; every widget stays visible throughout; then rest. Static pose: all four widgets,
// the first one marked.
import { rrect } from '../lib/shapes.mjs';

const S = 11.5, A = 10, B = 26.5; // outlines span 8.5–23 and 25–39.5
const CELLS = [[A, A], [B, A], [A, B], [B, B]];
const T0 = 0.06, STEP = 0.1, UP = 0.07, DOWN = 0.15;

const pulse = (i) => {
  const t = T0 + STEP * i;
  return {
    origin: [CELLS[i][0] + S / 2, CELLS[i][1] + S / 2],
    keys: [{ t: 0, s: 1 }, { t, s: 1 }, { t: t + UP, s: 1.1 }, { t: t + DOWN, s: 1 }, { t: 1, s: 1 }],
  };
};
// The mark flashes in with the pulse (w2–w4 are unmarked at rest; w1 keeps its mark and dips, then flashes back).
const flash = (i) => {
  const t = T0 + STEP * i, o0 = i === 0 ? 1 : 0;
  return {
    keys: [{ t: 0, o: o0 }, { t: Math.max(0.02, t - 0.04), o: i === 0 ? 0 : 0 }, { t: t + UP, o: 1 }, { t: t + DOWN + 0.04, o: 1 }, { t: t + DOWN + 0.1, o: o0 }, { t: 1, o: o0 }],
  };
};
// inner fill is 1.5px inside the outline centre line; the mark keeps 1px clear of the outline
const mark = (i) => rrect(CELLS[i][0] + 2.75, CELLS[i][1] + 2.75, 6, 6, 1.5);

const widget = (i) => ({
  id: `g${i + 1}`,
  anim: pulse(i),
  children: [
    { id: `w${i + 1}`, shapes: [{ path: rrect(...CELLS[i], S, S, 3) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: `w${i + 1}Mark`, animSibling: true, shapes: [{ path: mark(i) }], fill: 'accent', on: ['fill'], anim: flash(i) },
  ],
});

export default {
  name: 'dashboard',
  order: 2,
  label: 'Dashboard',
  module: 'Dashboard (web home)',
  baseIcon: 'grid_view',
  base: [],
  motion: 'Dashboard: the widgets refresh one after another, each pulsing as its green mark flashes in, then rest.',
  loopMs: 4100,
  peaks: [0.23, 0.33], // w2 at 1.1, w1 settling, two marks lit · w3 at 1.1, three marks lit
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    widget(0), widget(1), widget(2), widget(3),
  ],
};
