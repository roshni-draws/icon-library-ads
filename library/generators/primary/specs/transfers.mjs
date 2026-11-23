// Transfers: animal, egg and carcass transfers between sites, drawn as a side-view transport truck
// (lib/truck.mjs, shared with move_animal). The library transfer arrow is the family reference for the module.
// Scene: a light cargo box in an ink outline with a green band (accent, on the fill), a light cab with an ink
// window, two solid ink wheels with light hub marks. Two ink speed lines appear behind it while it drives.
// Story: the truck backs up 4px, rolls in from the left (wheels turning: the hub "+" cross-fades with a "×"),
// two speed lines draw out behind it and fade, it brakes with a 2.5° forward tilt about its front wheel and settles;
// then rest. The truck never fades: it is fully visible in every frame. Static pose: the truck, no speed lines.
import { truck } from '../lib/truck.mjs';

const ARROWS = 'M3 8H15M12 5L15 8L12 11M9 16H21M18 13L21 16L18 19';
const T = truck(1);

// Spoke "turn": + → × → + … while the truck moves (back up, then roll in).
const SWAP = [0.1, 0.16, 0.22, 0.28, 0.34, 0.4];
const spin = (plus) => ({
  keys: [
    { t: 0, o: plus ? 1 : 0 },
    { t: 0.04, o: plus ? 1 : 0 },
    ...SWAP.map((t, i) => ({ t, o: (i % 2 === 0) === plus ? 0 : 1 })),
    { t: 1, o: plus ? 1 : 0 },
  ],
});

export default {
  name: 'transfers',
  order: 18,
  label: 'Transfers',
  module: 'Transfers: animal, egg, carcass',
  baseIcon: 'transfer',
  base: [ARROWS],
  motion: 'Hand-off: the truck backs up and rolls in from the left with its wheels turning and speed lines behind it, then brakes with a small tilt and settles, then rest.',
  loopMs: 3650,
  peaks: [0.16, 0.42], // backed up 4px · braking tilt with speed lines out
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'speed',
      // Behind the truck: drawn outward from under its tail, then faded. Invisible at rest.
      shapes: [{ path: 'M9.5 18.5H3.5' }, { path: 'M9.5 25H5' }],
      stroke: 'ink',
      strokeWidth: 2.5,
      on: ['tile'],
      anim: {
        keys: [
          { t: 0, o: 0, ts: 0, te: 0 },
          { t: 0.2, o: 0, te: 0 },
          { t: 0.23, o: 1, te: 0.2 },
          { t: 0.36, te: 1 },
          { t: 0.44, o: 1 },
          { t: 0.54, o: 0 },
          { t: 0.56, te: 0 },
          { t: 1 },
        ],
      },
    },
    {
      id: 'truck',
      anim: {
        origin: T.front,
        keys: [
          { t: 0 },
          { t: 0.04, x: 0, r: 0 },
          { t: 0.16, x: -4 },
          { t: 0.36, x: 1 },
          { t: 0.42, x: 1, r: 2.5 },
          { t: 0.5, x: 0, r: -0.8 },
          { t: 0.58, r: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'body', shapes: [{ path: T.box }, { path: T.cab }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'band', shapes: [{ path: T.band }], fill: 'accent', on: ['fill'] },
        { id: 'window', shapes: [{ path: T.window }], fill: 'ink', on: ['fill'] },
        { id: 'wheels', shapes: T.wheels.map((path) => ({ path })), fill: 'ink', on: ['tile', 'fill'] },
        { id: 'hubPlus', shapes: [{ path: T.hubPlus }], stroke: 'fill', strokeWidth: 1.5, on: ['ink'], anim: spin(true) },
        { id: 'hubX', animSibling: true, shapes: [{ path: T.hubX }], stroke: 'fill', strokeWidth: 1.5, on: ['ink'], anim: spin(false) },
      ],
    },
  ],
};
