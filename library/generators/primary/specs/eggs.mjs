// Eggs: the ANTZ egg (library/line/egg.svg, shared base "Egg" = egg(12, 14, 7)) sitting in a nest.
// Scene: light egg in an ink outline with a soft shade crescent, in a light nest (ink outline, three accent straw
// strokes). Inside the egg, hidden at rest: a chick's head (eyes in ink, beak in accent). v2.1: the nest body is the
// light fill (the accent may not sit on the tile); the green is only in the straws and the beak, both on fill.
// Story: the egg wobbles in the nest; a crack draws across it (trim path); the top shell lifts (−4px, −12° about
// its left hinge) and the chick peeks out; the shell settles back closed, the crack fades. End frame = start.
import { egg } from '../lib/geo.mjs';

const BASE_EGG = egg(12, 14, 7, 0);
const EGG = egg(24, 26, 9.5); // apex 11, base 35.5 (sits in the nest)
// The crack: a zigzag from contour to contour with a notch in the middle so the beak shows when it opens.
const ZIG = [[14.9, 22.5], [17.8, 20.5], [20.8, 23], [24, 25], [27.2, 23], [30.2, 20.5], [33.1, 22.5]];
const zig = (dy = 0) => ZIG.map(([x, y]) => `${x} ${+(y + dy).toFixed(2)}`).join('L');
const CRACK = `M${zig()}`;
// Above the crack (cap, chick) and below it (bottom shell). The bottom clip overlaps the cap by 1px so the
// closed egg has no anti-aliasing seam; the crack stroke covers that overlap when the cap is open.
const capClip = `M2 2H46V22.5L${[...ZIG].reverse().map(([x, y]) => `${x} ${y}`).join('L')}L2 22.5Z`;
const botClip = `M2 21.5L${zig(-1)}L46 21.5V46H2Z`;
const HINGE = [14.9, 22.5];

const PEEK = { open: 0.4, up: 0.48, hold: 0.56, shut: 0.62 };

export default {
  name: 'eggs',
  order: 10,
  label: 'Eggs',
  module: 'Eggs',
  baseIcon: 'egg',
  base: [BASE_EGG],
  motion: 'Hatching: the egg wobbles in its nest, a crack draws across, the top lifts and a chick peeks out, then it settles closed.',
  loopMs: 4200,
  peaks: [0.16, 0.52], // wobble right · chick peeking
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'egg',
      layerize: true,
      anim: {
        origin: [24, 35.5],
        keys: [
          { t: 0, r: 0 }, { t: 0.04, r: 0 }, { t: 0.1, r: -7 }, { t: 0.16, r: 6 }, { t: 0.22, r: -3.5 }, { t: 0.27, r: 0 },
          { t: 0.62, r: 0 }, { t: 0.65, r: 2 }, { t: 0.69, r: 0 }, { t: 1, r: 0 },
        ],
      },
      children: [
        { id: 'shell', clip: botClip, shapes: [{ path: EGG }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'eggShade', shapes: [{ path: 'M30.6 27.2C31.2 30.3 29.8 33 27.2 34.2' }], stroke: 'shade', strokeWidth: 2.5 },
        {
          id: 'chick',
          clip: capClip,
          anim: { keys: [{ t: 0 }, { t: PEEK.open, y: 0 }, { t: PEEK.up, y: -3.5 }, { t: PEEK.hold, y: -3.5 }, { t: PEEK.shut, y: 0 }, { t: 1 }] },
          children: [
            { id: 'head', shapes: [{ circle: [24, 25.5, 6] }], fill: 'fill', stroke: 'ink', strokeWidth: 2.5, on: { stroke: ['fill'] } },
            { id: 'eyes', shapes: [{ circle: [21.6, 23.8, 1.1] }, { circle: [26.4, 23.8, 1.1] }], fill: 'ink', on: ['fill'] },
            { id: 'beak', shapes: [{ path: 'M22.8 24.7H25.2L24 26.7Z' }], fill: 'accent', on: ['fill'] },
          ],
        },
        {
          id: 'crack',
          shapes: [{ path: CRACK }],
          stroke: 'ink',
          strokeWidth: 2.5,
          on: ['fill'],
          anim: {
            keys: [
              { t: 0, o: 0, te: 0 }, { t: 0.27, o: 0, te: 0 }, { t: 0.29, o: 1, te: 0.1 }, { t: 0.38, o: 1, te: 1 },
              { t: 0.62, o: 1, te: 1 }, { t: 0.68, o: 0, te: 1 }, { t: 0.69, o: 0, te: 0 }, { t: 1, o: 0, te: 0 },
            ],
          },
        },
        {
          id: 'cap',
          clip: capClip,
          clipMoves: true,
          shapes: [{ path: EGG }],
          fill: 'fill',
          stroke: 'ink',
          on: { stroke: ['tile', 'fill'] },
          anim: {
            origin: HINGE,
            keys: [
              { t: 0 }, { t: PEEK.open, x: 0, y: 0, r: 0 }, { t: PEEK.up, y: -4, r: -12 }, { t: PEEK.hold, y: -4, r: -12 },
              { t: PEEK.shut, y: 0.3, r: 1 }, { t: 0.66, y: 0, r: 0 }, { t: 1 },
            ],
          },
        },
      ],
    },
    {
      id: 'nest',
      shapes: [{ path: 'M9 30.5C10 37.5 16 41 24 41C32 41 38 37.5 39 30.5C32 33.5 16 33.5 9 30.5Z' }],
      fill: 'fill',
      stroke: 'ink',
      on: { stroke: ['tile', 'fill'] },
    },
    {
      id: 'straw',
      shapes: [{ path: 'M14 35C19 37.6 29 37.6 34 35' }, { path: 'M19.5 39.3L22.5 36.9' }, { path: 'M25.5 39.5L28.5 37.1' }],
      stroke: 'accent',
      strokeWidth: 2,
      on: ['fill'],
    },
  ],
};
