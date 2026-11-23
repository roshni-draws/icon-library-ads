// Security: the library shield (library/line/encrypted.svg, shield outline) with a green check across its face.
// Scene: light shield in a 3px ink outline, a soft shade down its right side, a green checkmark.
// Story: the check fades, re-draws stroke by stroke (trim), and the shield seals with one pulse (1.06); then rest.
// Static pose: shield with the check drawn.
import { L } from '../lib/geo.mjs';

const SHIELD = 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V11C19 16 15.5 19.5 12 21C8.5 19.5 5 16 5 11Z';
const CHECK = 'M18.5 23.5L22.25 27.25L29.5 20';

export default {
  name: 'security',
  order: 27,
  label: 'Security',
  module: 'Security / client ID',
  baseIcon: 'encrypted',
  base: [SHIELD],
  motion: 'Verified: the shield’s check re-draws and the shield seals with one pulse, then rest.',
  loopMs: 4300,
  peaks: [0.13, 0.42], // check gone · check drawn, shield at 1.06
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'shield',
      anim: { origin: [24, 24], keys: [{ t: 0 }, { t: 0.36, s: 1 }, { t: 0.42, s: 1.06 }, { t: 0.5, s: 0.98 }, { t: 0.56, s: 1 }, { t: 1 }] },
      children: [
        { id: 'body', shapes: [{ path: L(SHIELD) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'bodyShade', shapes: [{ path: 'M29.5 12H31.5A1.5 1.5 0 0 1 33 13.5V22.5C33 28 30 32.5 25.5 35.4C29 31 29.5 26.5 29.5 22.5Z' }], fill: 'shade' },
        {
          id: 'check',
          shapes: [{ path: CHECK }],
          stroke: 'accent',
          strokeWidth: 3,
          on: ['fill'],
          anim: {
            keys: [
              { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
              { t: 0.15, o: 0, te: 0 }, { t: 0.17, o: 1, te: 0.04 }, { t: 0.36, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
            ],
          },
        },
      ],
    },
  ],
};
