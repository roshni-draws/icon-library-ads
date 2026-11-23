// Requests: the library approval stamp (library/line/request.svg) over a request slip.
// Scene: light stamp (handle and head in an ink outline) above a light slip (ink outline) carrying a green check
// (accent, on the slip).
// Story: the check clears, the stamp lifts, presses down onto the slip and springs back as the check pops in
// (scale 1.1 → 1); then rest. Static pose: stamp up, slip approved.
const HANDLE = 'M10 13V7A2 2 0 0 1 14 7V13';
// The knob is L(HANDLE) closed, moved up 8px and shortened 1px onto the head: M21 17.5V10.5A3 3 0 0 1 27 10.5V17.5Z.

export default {
  name: 'requests',
  order: 19,
  label: 'Requests',
  module: 'Requests and approvals',
  baseIcon: 'request',
  base: [HANDLE],
  motion: 'Approval: the stamp lifts and presses down on the slip, and the check pops in as it springs back, then rest.',
  loopMs: 3700,
  peaks: [0.2, 0.34], // stamp lifted, slip blank · stamp pressed down
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'slip', shapes: [{ rect: [9, 28.5, 30, 13, 3] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    {
      id: 'check',
      shapes: [{ path: 'M18 35.2L21.8 38.2L30 31.8' }],
      stroke: 'accent',
      strokeWidth: 3,
      on: ['fill'],
      anim: {
        origin: [24, 35],
        keys: [
          { t: 0, o: 1, s: 1 }, { t: 0.04, o: 1 }, { t: 0.1, o: 0, s: 0.9 },
          { t: 0.36, o: 0, s: 0.9 }, { t: 0.42, o: 1, s: 1.1 }, { t: 0.5, s: 1 }, { t: 1, o: 1, s: 1 },
        ],
      },
    },
    {
      id: 'stamp',
      anim: {
        origin: [24, 23],
        keys: [
          { t: 0 }, { t: 0.08, y: 0, s: 1 }, { t: 0.2, y: -3 }, { t: 0.3, y: 4, s: 1 }, { t: 0.34, y: 4, s: 1.04 },
          { t: 0.44, y: -1, s: 1 }, { t: 0.52, y: 0 }, { t: 1 },
        ],
      },
      children: [
        { id: 'knob', shapes: [{ path: 'M21 17.5V10.5A3 3 0 0 1 27 10.5V17.5Z' }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'head', shapes: [{ rect: [13.5, 17.5, 21, 6, 2.5] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'headShade', shapes: [{ path: 'M16 21.5H32' }], stroke: 'shade', strokeWidth: 1.5 },
      ],
    },
  ],
};
