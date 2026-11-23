// Necropsy: a scalpel (the library's necropsy tool, library/line/necropsy.svg) over a light dissection tray.
// Scene: a wide #10-style blade (straight back edge, deep curved belly, light fill in an ink outline) on a slim ink
// handle set 2px off the blade (the grip-line gap), its tip resting on a light tray (ink outline) that holds one green marking line.
// Story: the marking line fades; the scalpel lifts, lowers and glides right as the line re-draws left → right
// (trim), then eases back; then rest. Static pose: scalpel resting, line drawn.
import svgpath from 'svgpath';

const ANGLE = -46; // the tool's axis, tip at the lower left
const TIP = [13.5, 32];
// Local frame: tip at (0, 0), axis along +x towards the handle, back edge at y = 0 (up), belly below (y > 0).
const BLADE_L = 'M0 0L16 0L16 7C10 10 3 7.5 0 0Z';
const place = (d) => svgpath(d).rotate(ANGLE).translate(...TIP).round(3).toString();
// handle: 2px clear of the blade's base outline (the grip line), then the slim handle
const HANDLE_L = 'M21 3.5H31';

export default {
  name: 'necropsy',
  order: 16,
  label: 'Necropsy',
  module: 'Necropsy',
  baseIcon: 'necropsy',
  base: [],
  motion: 'Examination: the scalpel lifts and glides along the tray as its marking line re-draws, then rest.',
  loopMs: 3550,
  peaks: [0.2, 0.36], // scalpel lifted, line gone · gliding, line half drawn
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'tray', shapes: [{ rect: [9, 34, 30, 7.5, 3] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    {
      id: 'mark',
      shapes: [{ path: 'M14.5 37.75H33.5' }],
      stroke: 'accent',
      strokeWidth: 2.5,
      on: ['fill'],
      anim: {
        keys: [
          { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.11, o: 0, te: 1 }, { t: 0.12, o: 0, te: 0 },
          { t: 0.26, o: 0, te: 0 }, { t: 0.27, o: 1, te: 0.03 }, { t: 0.5, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
        ],
      },
    },
    {
      id: 'scalpel',
      anim: {
        origin: TIP,
        keys: [
          { t: 0 }, { t: 0.06, x: 0, y: 0, r: 0 },
          { t: 0.18, x: -2.5, y: -3, r: -6 },
          { t: 0.27, x: -3, y: 0, r: 0 },
          { t: 0.5, x: 3.5, y: 0, r: 0 },
          { t: 0.62, x: 0, y: -1, r: 0 },
          { t: 0.7, x: 0, y: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'handle', shapes: [{ path: place(HANDLE_L) }], stroke: 'ink', strokeWidth: 3.5, on: ['tile'] },
        { id: 'blade', shapes: [{ path: place(BLADE_L) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
      ],
    },
  ],
};
