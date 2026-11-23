// Transfers: a transport crate riding the library transfer arrow (library/line/transfer.svg).
// Scene: light crate in an ink outline with an ink lid line and a green consignment tag (accent, on the crate),
// over an ink arrow pointing right. Covers animal, egg and carcass transfers alike.
// Story: the crate lifts and slides off to the right as the arrow nudges forward, then slides back in from the
// left and sets down; then rest. Static pose: crate on the arrow.
const ARROWS = 'M3 8H15M12 5L15 8L12 11M9 16H21M18 13L21 16L18 19';

export default {
  name: 'transfers',
  order: 18,
  label: 'Transfers',
  module: 'Transfers: animal, egg, carcass',
  baseIcon: 'transfer',
  base: [ARROWS],
  motion: 'Hand-off: the crate slides off to the right along the arrow and arrives back from the left, then rest.',
  loopMs: 3650,
  peaks: [0.2, 0.36], // crate leaving right, arrow pushed · crate arriving from the left
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'arrow',
      shapes: [{ path: 'M11.5 37.5H35.5M31.5 33.5L35.5 37.5L31.5 41.5' }],
      stroke: 'ink',
      on: ['tile'],
      anim: { keys: [{ t: 0 }, { t: 0.08, x: 0 }, { t: 0.22, x: 2.5 }, { t: 0.32, x: -1 }, { t: 0.42, x: 0 }, { t: 1 }] },
    },
    {
      id: 'crate',
      anim: {
        origin: [24, 30],
        keys: [
          { t: 0 }, { t: 0.06, x: 0, y: 0, r: 0, o: 1 },
          { t: 0.12, x: -1, y: -1.5, r: -3 },
          { t: 0.24, x: 3.8, y: -1, r: 3, o: 0 },
          { t: 0.28, x: -3.8, y: -1, r: 0, o: 0 },
          { t: 0.42, x: 0.5, y: -0.5, o: 1 },
          { t: 0.5, x: 0, y: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'box', shapes: [{ rect: [14, 12, 20, 17, 3] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'lid', shapes: [{ path: 'M14 18H34' }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
        { id: 'tag', shapes: [{ rect: [19.5, 21.5, 9, 4.5, 1.5] }], fill: 'accent', on: ['fill'] },
      ],
    },
  ],
};
