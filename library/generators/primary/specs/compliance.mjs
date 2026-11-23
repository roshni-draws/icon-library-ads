// Compliance: a certified document: a light page with two ink text lines, stamped with the library verified
// rosette (library/line/verified.svg).
// Scene: a light page in a 3px ink outline (upper left) with two ink text lines; over its lower right corner the
// rosette seal (light fill, scalloped ink edge) with a green centre (accent on its fill) and a light check.
// Story: the check clears, the seal lifts off the page (−3px, 0.9) and stamps back down (1.08 → 1), then the check
// draws in (trim); then rest. Static pose: the page with the seal and its check.
import svgpath from 'svgpath';
import { rrect, disc } from '../lib/shapes.mjs';

const SEAL = 'M12 3L14 5H19V10L21 12L19 14V19H14L12 21L10 19H5V14L3 12L5 10V5H10Z';
const C = [32, 32];
// the rosette at ×1.0 (its inner fill reaches r ≈ 4.9 from the centre)
const SEAL48 = svgpath(SEAL).translate(-12, -12).translate(...C).round(3).toString();

export default {
  name: 'compliance',
  order: 28,
  label: 'Compliance',
  module: 'Compliance / audits',
  baseIcon: 'verified',
  base: [SEAL],
  motion: 'Certify: the seal lifts off the page and stamps back down, and its check draws in, then rest.',
  loopMs: 4350,
  peaks: [0.18, 0.4], // seal lifted, check gone · stamped, check drawing
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'page', shapes: [{ path: rrect(8.5, 6.5, 22, 30, 3.5) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'text', shapes: [{ path: 'M14 14H25M14 20.5H21' }], stroke: 'ink', strokeWidth: 2.5, on: ['fill'] },
    {
      id: 'seal',
      anim: {
        origin: C,
        keys: [
          { t: 0 }, { t: 0.08, y: 0, s: 1 }, { t: 0.18, y: -3, s: 0.9 }, { t: 0.24, y: -3, s: 0.9 },
          { t: 0.3, y: 0, s: 1.08 }, { t: 0.38, y: 0, s: 1 }, { t: 1 },
        ],
      },
      children: [
        { id: 'rosette', shapes: [{ path: SEAL48 }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'centre', shapes: [{ path: disc(...C, 4.4) }], fill: 'accent', on: ['fill'] },
        {
          id: 'check',
          animSibling: true,
          shapes: [{ path: `M${C[0] - 2.2} ${C[1] + 0.1}L${C[0] - 0.6} ${C[1] + 1.7}L${C[0] + 2.3} ${C[1] - 1.4}` }],
          stroke: 'fill',
          strokeWidth: 2,
          on: ['accent'],
          anim: {
            keys: [
              { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
              { t: 0.34, o: 0, te: 0 }, { t: 0.35, o: 1, te: 0.05 }, { t: 0.48, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
            ],
          },
        },
      ],
    },
  ],
};
