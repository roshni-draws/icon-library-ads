// Notes: the library sticky note (library/line/note.svg) with a pencil adding a journal line.
// Scene: light note in an ink outline with its folded corner and one ink text line; the newest line is green
// (accent, on the note); a light pencil in an ink outline rests with its tip at the end of that line.
// Story: the green line clears, the pencil lifts back to the start and writes it again left → right (trim) with a
// small scribble, then lifts off; then rest. Static pose: two lines written, pencil at rest.
import { L } from '../lib/geo.mjs';

const NOTE = 'M20 15V6A2 2 0 0 0 18 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H15Z';
const FOLD = 'M15 20V17A2 2 0 0 1 17 15H20';
const TIP = [26.5, 25.5];
// Pencil along (1, −1)/√2 from the tip: a 4px cone and a 12px body, 5px wide.
const u = [Math.SQRT1_2, -Math.SQRT1_2], n = [Math.SQRT1_2, Math.SQRT1_2];
const pt = (a, b) => `${+(TIP[0] + a * u[0] + b * n[0]).toFixed(2)} ${+(TIP[1] + a * u[1] + b * n[1]).toFixed(2)}`;
const PENCIL = `M${pt(0, 0)}L${pt(4.5, 2.5)}L${pt(15.5, 2.5)}L${pt(15.5, -2.5)}L${pt(4.5, -2.5)}Z`;

export default {
  name: 'notes',
  order: 20,
  label: 'Notes',
  module: 'Notes and journal',
  baseIcon: 'note',
  base: [NOTE, FOLD],
  motion: 'Journal: the pencil writes the newest line across the note, then lifts off, then rest.',
  loopMs: 3750,
  peaks: [0.2, 0.36], // pencil lifted back, line cleared · pencil mid-line
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'note', shapes: [{ path: L(NOTE) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'fold', shapes: [{ path: L(FOLD) }], stroke: 'ink', on: ['fill', 'tile'] },
    { id: 'text', shapes: [{ path: 'M18 19.5H25.5' }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
    {
      id: 'entry',
      shapes: [{ path: 'M18 25.5H26.5' }],
      stroke: 'accent',
      strokeWidth: 2.5,
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
          { t: 0.25, o: 0, te: 0 }, { t: 0.26, o: 1, te: 0.05 }, { t: 0.48, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
        ],
      },
    },
    {
      id: 'pencil',
      shapes: [{ path: PENCIL }],
      fill: 'fill',
      stroke: 'ink',
      on: { stroke: ['tile', 'fill'] },
      anim: {
        origin: TIP,
        keys: [
          { t: 0 }, { t: 0.06, x: 0, y: 0, r: 0 },
          { t: 0.16, x: -2, y: -3.2, r: 6 },
          { t: 0.25, x: -4, y: 0, r: 0 },
          { t: 0.32, x: -2.5, y: -0.8 },
          { t: 0.4, x: -1.2, y: 0.3 },
          { t: 0.48, x: 0, y: 0 },
          { t: 0.58, x: 1.5, y: -2.5, r: -4 },
          { t: 0.7, x: 0, y: 0, r: 0 },
          { t: 1 },
        ],
      },
    },
  ],
};
