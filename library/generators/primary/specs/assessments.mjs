// Assessments: the library clipboard (library/line/assessment.svg) as a two-row checklist.
// Scene: light board in an ink outline with a solid ink clip; two rows, each a green check (accent, on the board)
// and an ink text line.
// Story: the checks clear as the board is picked up (tilt −4°), then tick in one after another and the board
// settles with a small nod (scale 1.04); then rest. Static pose: board with both rows checked.
const BOARD = 'M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15';

const check = (i, y, t0) => ({
  id: `check${i}`,
  animSibling: i > 1,
  shapes: [{ path: `M17 ${y}L19.5 ${y + 2.5}L23.5 ${y - 2}` }],
  stroke: 'accent',
  strokeWidth: 2.5,
  on: ['fill'],
  anim: {
    keys: [
      { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
      { t: t0, o: 0, te: 0 }, { t: t0 + 0.01, o: 1, te: 0.05 }, { t: t0 + 0.12, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
    ],
  },
});

export default {
  name: 'assessments',
  order: 17,
  label: 'Assessments',
  module: 'Assessments',
  baseIcon: 'assessment',
  base: [BOARD],
  motion: 'Checklist: the board is picked up, its two checks tick in one after another, then it settles, then rest.',
  loopMs: 3600,
  peaks: [0.14, 0.36], // picked up, checks cleared · first ticked, second drawing
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'clipboard',
      anim: {
        origin: [24, 37.5],
        keys: [
          { t: 0 }, { t: 0.04, r: 0, y: 0, s: 1 }, { t: 0.14, r: -4, y: -2 }, { t: 0.26, r: 0, y: 0 },
          { t: 0.5, s: 1 }, { t: 0.56, s: 1.04 }, { t: 0.63, s: 1 }, { t: 1 },
        ],
      },
      children: [
        { id: 'board', shapes: [{ rect: [13.5, 13.5, 21, 24, 3] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'clip', shapes: [{ rect: [19.5, 10, 9, 6.5, 2.5] }], fill: 'ink', on: ['tile', 'fill'] },
        { id: 'lines', shapes: [{ path: 'M27 22.5H30.5M27 30.5H30.5' }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
        check(1, 22.5, 0.18),
        check(2, 30.5, 0.32),
      ],
    },
  ],
};
