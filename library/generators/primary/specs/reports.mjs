// Reports: the library bar chart (library/line/bar_chart.svg) as a light report card.
// Scene: light card in an ink outline, three green bars (accent, on the card) standing on an ink baseline.
// Story: the bars clear, then grow from the baseline one after another (trim paths), the tallest last to land;
// then rest. Static pose: card with all three bars at full height.
import { L } from '../lib/geo.mjs';

const BARS = ['M8 17V12', 'M12 17V7', 'M16 17V14'];

const bar = (i, t0, t1) => ({
  id: `bar${i}`,
  animSibling: i > 0,
  shapes: [{ path: L(BARS[i]) }],
  stroke: 'accent',
  strokeWidth: 4,
  on: ['fill'],
  anim: {
    keys: [
      { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
      { t: t0, o: 0, te: 0 }, { t: t0 + 0.01, o: 1, te: 0.04 }, { t: t1, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
    ],
  },
});

export default {
  name: 'reports',
  order: 24,
  label: 'Reports',
  module: 'Reports and insights',
  baseIcon: 'bar_chart',
  base: ['M8 17V12M12 17V7M16 17V14'],
  motion: 'Insight: the bars grow up from the baseline one after another, then rest.',
  loopMs: 4000,
  peaks: [0.14, 0.34], // bars cleared · first two growing
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'card', shapes: [{ rect: [10.5, 10.5, 27, 27, 3] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'baseline', shapes: [{ path: 'M15 33H33' }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
    bar(0, 0.16, 0.32),
    bar(2, 0.24, 0.38),
    bar(1, 0.3, 0.52),
  ],
};
