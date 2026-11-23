// Department: the library org chart (library/line/account_tree.svg) scaled ×1.75 about the centre (instead of
// ×1.5) so the unit boxes hold a visible fill: a head unit with two teams branching off.
// Scene: three light unit boxes in ink outlines joined by the ink connector; the head unit is marked in green.
// Story: the two teams fold back into the head unit, the head unit pulses (1.1), then the teams branch back out
// one after the other with a small overshoot; then rest. Static pose: the full chart.
import svgpath from 'svgpath';
const r3 = (v) => +v.toFixed(3);
const K = 0.5523; // cubic quarter-circle constant: explicit beziers render the same in the SVG and in Lottie
/** Rounded rect as a cubic path. */
const rrect = (x, y, w, h, r) => {
  const k = r * (1 - K), X = x + w, Y = y + h, n = (v) => r3(v);
  return `M${n(x + r)} ${n(y)}H${n(X - r)}C${n(X - k)} ${n(y)} ${n(X)} ${n(y + k)} ${n(X)} ${n(y + r)}V${n(Y - r)}C${n(X)} ${n(Y - k)} ${n(X - k)} ${n(Y)} ${n(X - r)} ${n(Y)}H${n(x + r)}C${n(x + k)} ${n(Y)} ${n(x)} ${n(Y - k)} ${n(x)} ${n(Y - r)}V${n(y + r)}C${n(x)} ${n(y + k)} ${n(x + k)} ${n(y)} ${n(x + r)} ${n(y)}Z`;
};
/** Circle as a cubic path. */
const disc = (cx, cy, r) => {
  const c = r * K, n = (v) => r3(v);
  return `M${n(cx)} ${n(cy - r)}C${n(cx + c)} ${n(cy - r)} ${n(cx + r)} ${n(cy - c)} ${n(cx + r)} ${n(cy)}C${n(cx + r)} ${n(cy + c)} ${n(cx + c)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}C${n(cx - c)} ${n(cy + r)} ${n(cx - r)} ${n(cy + c)} ${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - c)} ${n(cx - c)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}Z`;
};
const LINK = 'M9 12H13M15 6A2 2 0 0 0 13 8V16A2 2 0 0 0 15 18';
const k = 1.75, c = 24 - 12 * k; // x48 = 1.75·x24 + 3
const box = (x, y) => rrect(x * k + c, y * k + c, 6 * k, 6 * k, 2 * k);
const HEAD = box(3, 9), TOP = box(15, 3), BOT = box(15, 15);
const LINK48 = svgpath(LINK).scale(k).translate(c, c).round(3).toString();

const branch = (t0) => ({
  keys: [
    { t: 0, o: 1, x: 0 }, { t: 0.04, o: 1, x: 0 }, { t: 0.13, o: 0, x: -4 }, { t: t0, o: 0, x: -4 },
    { t: t0 + 0.09, o: 1, x: 1 }, { t: t0 + 0.15, o: 1, x: 0 }, { t: 1, o: 1, x: 0 },
  ],
});

export default {
  name: 'department',
  order: 26,
  label: 'Department',
  module: 'Department',
  baseIcon: 'account_tree',
  base: [LINK],
  motion: 'Org chart: the teams fold into the head unit, it pulses, and the teams branch back out one after the other, then rest.',
  loopMs: 4250,
  peaks: [0.18, 0.34], // teams folded in, head pulsing · top team out, bottom team branching
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'link', shapes: [{ path: LINK48 }], stroke: 'ink', on: ['tile'] },
    { id: 'top', shapes: [{ path: TOP }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] }, anim: branch(0.22) },
    { id: 'bottom', shapes: [{ path: BOT }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] }, anim: branch(0.3) },
    {
      id: 'head',
      anim: { origin: [13.5, 24], keys: [{ t: 0 }, { t: 0.12, s: 1 }, { t: 0.18, s: 1.1 }, { t: 0.24, s: 1 }, { t: 1 }] },
      children: [
        { id: 'headBox', shapes: [{ path: HEAD }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        // inner fill 9.75–17.25 × 20.25–27.75; the mark leaves a 2px ring of fill
        { id: 'headMark', shapes: [{ path: rrect(11.75, 22.25, 3.5, 3.5, 1) }], fill: 'accent', on: ['fill'] },
      ],
    },
  ],
};
