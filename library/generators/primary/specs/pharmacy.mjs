// Pharmacy: a tall prescription pill bottle with the library cross (library/line/medication.svg).
// Scene: a tall, narrow light bottle (14 × 22) in an ink outline; a ridged child-proof cap, a little narrower
// than the body, with two ink grip ridges; a green label band (accent on the bottle's fill) carrying the light
// library cross.
// Story: the cap flips up on its left hinge, a solid ink capsule pops out of the neck and tumbles away fading, and
// the cap snaps shut; then rest. Static pose: closed bottle with its label, no capsule.
import { L } from '../lib/geo.mjs';
import { rrect } from '../lib/shapes.mjs';

const CROSS = 'M12 12V16M10 14H14'; // → M24 24V30M21 27H27
const BODY = [17, 17, 14, 22, 3.5]; // x 17–31, y 17–39
const CAP = [18, 8.5, 12, 7.5, 2.5]; // x 18–30, y 8.5–16 (narrower than the body)

export default {
  name: 'pharmacy',
  order: 8,
  label: 'Pharmacy',
  module: 'Pharmacy',
  baseIcon: 'medication',
  base: [CROSS],
  motion: 'Dispense: the cap flips up, a capsule pops out of the bottle and the cap snaps shut, then rest.',
  loopMs: 3200,
  peaks: [0.22, 0.34], // cap open, capsule rising · capsule out, cap closing
  restAt: 0.85,
  // Stroke variant: the green label goes (an outlined box round the cross is too busy at 48px); the cross is
  // drawn straight on the bottle in ink (the automatic rule turns a light mark on green into ink).
  stroke: { drop: ['label'] },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'capsule',
      particle: true,
      shapes: [{ path: 'M21.2 12.6L25.4 10.2A1.9 1.9 0 0 1 27.3 13.5L23.1 15.9A1.9 1.9 0 0 1 21.2 12.6Z' }],
      fill: 'ink',
      on: ['tile'],
      anim: {
        origin: [24.2, 13],
        keys: [
          { t: 0, o: 0 }, { t: 0.12, o: 0, x: 0, y: 0, r: 0 }, { t: 0.18, o: 1, x: 1, y: -3, r: -6 },
          { t: 0.3, o: 1, x: 5, y: -5.5, r: 10 }, { t: 0.4, o: 0, x: 7, y: -3.5, r: 12 },
          { t: 0.41, o: 0, x: 0, y: 0, r: 0 }, { t: 1, o: 0, x: 0, y: 0, r: 0 },
        ],
      },
    },
    { id: 'bottle', shapes: [{ path: rrect(...BODY) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    // label band, 1px clear of the body outline's inner edge (fill x 18.5–29.5)
    { id: 'label', shapes: [{ path: rrect(19.5, 22, 9, 10, 2) }], fill: 'accent', on: ['fill'] },
    { id: 'cross', shapes: [{ path: L(CROSS) }], stroke: 'fill', strokeWidth: 2.5, on: ['accent'] },
    {
      id: 'cap',
      anim: {
        origin: [18, 16],
        keys: [
          { t: 0 }, { t: 0.06, y: 0, r: 0 }, { t: 0.16, y: -3, r: -12 }, { t: 0.28, y: -3, r: -12 },
          { t: 0.36, y: 0.4, r: 1 }, { t: 0.42, y: 0, r: 0 }, { t: 1 },
        ],
      },
      children: [
        { id: 'capShell', shapes: [{ path: rrect(...CAP) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        // grip ridges, outline to outline
        { id: 'ridges', shapes: [{ path: 'M22 9.5V15M26 9.5V15' }], stroke: 'ink', strokeWidth: 2, on: ['fill'] },
      ],
    },
  ],
};
