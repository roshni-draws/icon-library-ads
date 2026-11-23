// Mortality: the library skull (library/line/mortality.svg), kept still and calm, with a falling leaf.
// Scene: the light skull in an ink outline (solid ink eye sockets, ink tooth line, soft shade on its right side),
// set a little left of centre; a single leaf (light, thin ink outline, green midrib on its fill) drifts beside it.
// Story: a leaf drifts slowly down past the skull, swaying gently, and fades before it reaches the ground; then
// rest. Nothing bounces: the skull never moves. Static pose: the skull alone.
import { disc } from '../lib/shapes.mjs';
import svgpath from 'svgpath';

const SKULL = 'M4 11A8 8 0 0 1 20 11V14A2 2 0 0 1 18 16V19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19V16A2 2 0 0 1 4 14Z';
const TOOTH = 'M12 17V21';
const T = (d) => svgpath(d).scale(1.5).translate(3, 6).round(3).toString(); // skull x 9–33
const LX = 37.5, LY = 11; // leaf centre at rest (invisible), it falls down and right
const LEAF = svgpath('M-6 0Q0 -6 6 0Q0 6 -6 0Z').rotate(-30).translate(LX, LY).round(3).toString();
const RIB = svgpath('M-2.8 0H2.8').rotate(-30).translate(LX, LY).round(3).toString();

const leafAnim = {
  origin: [LX, LY],
  keys: [
    { t: 0, o: 0 }, { t: 0.06, o: 0, x: 0, y: 0, r: 0 }, { t: 0.16, o: 1, x: -1.2, y: 1.6, r: -10 },
    { t: 0.32, o: 1, x: 1, y: 4, r: 10 }, { t: 0.48, o: 1, x: -0.8, y: 6.2, r: -8 },
    { t: 0.64, o: 0, x: 0.8, y: 7.8, r: 4 }, { t: 0.65, o: 0, x: 0, y: 0, r: 0 }, { t: 1, o: 0, x: 0, y: 0, r: 0 },
  ],
};

export default {
  name: 'mortality',
  order: 15,
  label: 'Mortality',
  module: 'Mortality',
  baseIcon: 'mortality',
  base: [SKULL, TOOTH],
  motion: 'Remembrance: a single leaf drifts slowly down beside the still skull, swaying, and fades, then rest.',
  loopMs: 3500,
  peaks: [0.24, 0.42], // leaf high, swaying · leaf low beside the jaw
  restAt: 0.85,
  // Stroke variant: the eyes as cubic discs (SVG and Lottie anti-alias native circles differently, and with no
  // fill around them that edge decides the SVG/Lottie match).
  stroke: { patch: { eyes: { shapes: [{ path: disc(16.5, 24, 2.6) }, { path: disc(25.5, 24, 2.6) }] } } },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'skull', shapes: [{ path: T(SKULL) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'skullShade', shapes: [{ path: 'M28.4 13.6C30 15.5 31 18 31 20.5V27' }], stroke: 'shade', strokeWidth: 2.5 },
    { id: 'eyes', shapes: [{ circle: [16.5, 24, 2.6] }, { circle: [25.5, 24, 2.6] }], fill: 'ink', on: ['fill'] },
    { id: 'tooth', shapes: [{ path: T(TOOTH) }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
    {
      id: 'fallingLeaf',
      particle: true,
      anim: leafAnim,
      children: [
        { id: 'leaf', shapes: [{ path: LEAF }], fill: 'fill', stroke: 'ink', strokeWidth: 2, on: { stroke: ['tile', 'fill'] } },
        { id: 'rib', shapes: [{ path: RIB }], stroke: 'accent', strokeWidth: 2, on: ['fill'] },
      ],
    },
  ],
};
