// Announcements: the library megaphone (library/line/announcement.svg) with its three sound rays.
// Scene: light megaphone in an ink outline with an ink handle and a green band across the cone (accent, on the
// fill); three ink rays on the tile.
// Story: the rays fade, the megaphone draws back and then pushes forward (scale 1.05), and the rays burst out
// from the mouth and settle back into place; then rest. Static pose: megaphone with all three rays.
import { L } from '../lib/geo.mjs';

const BODY = 'M8 8H5A2 2 0 0 0 3 10V14A2 2 0 0 0 5 16H8L13 21V3Z';
const HANDLE = 'M6 16V20';
const RAYS = 'M17 12H21M17 8L19 6M17 16L19 18';

export default {
  name: 'announcements',
  order: 21,
  label: 'Announcements',
  module: 'Announcements',
  baseIcon: 'announcement',
  base: [BODY, HANDLE, RAYS],
  motion: 'Broadcast: the megaphone draws back and pushes forward as its rays burst out, then rest.',
  loopMs: 3850,
  peaks: [0.18, 0.32], // drawn back, rays gone · pushed forward, rays out
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'megaphone',
      anim: {
        origin: [15, 33],
        keys: [
          { t: 0 }, { t: 0.06, x: 0, r: 0, s: 1 },
          { t: 0.18, x: -2, r: 5, s: 0.96 },
          { t: 0.3, x: 1.5, r: -4, s: 1.05 },
          { t: 0.4, x: 0, r: 1, s: 1 },
          { t: 0.48, r: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'handle', shapes: [{ path: L(HANDLE) }], stroke: 'ink', on: ['tile'] },
        { id: 'body', shapes: [{ path: L(BODY) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'band', shapes: [{ rect: [20.5, 19, 2.5, 10, 1.25] }], fill: 'accent', on: ['fill'] },
      ],
    },
    {
      id: 'rays',
      shapes: [{ path: L(RAYS) }],
      stroke: 'ink',
      on: ['tile'],
      anim: {
        origin: [31.5, 24],
        keys: [
          { t: 0, o: 1, x: 0 }, { t: 0.04, o: 1, x: 0 }, { t: 0.12, o: 0, x: -2 }, { t: 0.26, o: 0, x: -2 },
          { t: 0.32, o: 1, x: 2.5 }, { t: 0.44, x: 0 }, { t: 1, o: 1, x: 0 },
        ],
      },
    },
  ],
};
