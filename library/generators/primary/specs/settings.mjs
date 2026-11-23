// Settings: a pair of meshing gears; the big one is the library gear (library/line/settings_gear.svg) at ×1.3.
// Scene: a big light gear (light rim in a 3px ink outline, solid ink block teeth) with a green hub and a light
// axle, meshing with a small solid ink gear at the upper right.
// Story: the big gear winds back a touch, turns forward 12° (driving the small gear the other way) with a small
// overshoot, and eases home; then rest. Static pose: both gears at rest.
import svgpath from 'svgpath';
const r3 = (v) => +v.toFixed(3);
const K = 0.5523;
const disc = (cx, cy, r) => { const c = r * K, n = r3; return `M${n(cx)} ${n(cy - r)}C${n(cx + c)} ${n(cy - r)} ${n(cx + r)} ${n(cy - c)} ${n(cx + r)} ${n(cy)}C${n(cx + r)} ${n(cy + c)} ${n(cx + c)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}C${n(cx - c)} ${n(cy + r)} ${n(cx - r)} ${n(cy + c)} ${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - c)} ${n(cx - c)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}Z`; };
/** Gear outline: n teeth, outer radius ro, root radius rr, tooth half-angles (deg) at the tip and the root. */
function gear(cx, cy, n, ro, rr, tipHalf, rootHalf, phase = 0) {
  const p = (deg, r) => `${r3(cx + r * Math.sin((deg * Math.PI) / 180))} ${r3(cy - r * Math.cos((deg * Math.PI) / 180))}`;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = phase + (360 / n) * i;
    d += `${i ? 'L' : 'M'}${p(a - rootHalf, rr)}L${p(a - tipHalf, ro)}L${p(a + tipHalf, ro)}L${p(a + rootHalf, rr)}`;
    d += `A${rr} ${rr} 0 0 1 ${p(a + 360 / n - rootHalf, rr)}`;
  }
  return d + 'Z';
}

const BIG = [21, 27.5], SMALL = [36, 12];
const TEETH = 'M11 4H13V5H11ZM11 19H13V20H11ZM4 11H5V13H4ZM19 11H20V13H19Z';
const TEETH_D = 'M17 6H18V7H17ZM6 6H7V7H6ZM6 17H7V18H6ZM17 17H18V18H17Z';
const KB = 1.3; // library gear scale: rim r 6 → 7.8, teeth reach ~11.9 with the 3px stroke
const big = (d) => svgpath(d).translate(-12, -12).scale(KB).translate(...BIG).round(3).toString();
const SMALL_GEAR = gear(...SMALL, 6, 6, 4.5, 13, 22, 30);

export default {
  name: 'settings',
  order: 30,
  label: 'Settings',
  module: 'Settings / profile',
  baseIcon: 'settings_gear',
  base: [TEETH, TEETH_D],
  motion: 'Tuning: the big gear winds back and turns forward, driving the small gear the other way, then settles, then rest.',
  loopMs: 4450,
  peaks: [0.12, 0.34], // wound back · turned forward 12°
  restAt: 0.85,
  // Stroke variant: no hub ring (rings within rings at 48px); the axle stays as a solid ink dot.
  stroke: { drop: ['hub'] },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'small',
      shapes: [{ path: SMALL_GEAR }],
      fill: 'ink',
      stroke: 'ink',
      strokeWidth: 1.5,
      on: ['tile'],
      anim: { origin: SMALL, keys: [{ t: 0 }, { t: 0.04, r: 0 }, { t: 0.12, r: 6 }, { t: 0.34, r: -12 }, { t: 0.42, r: -9 }, { t: 0.62, r: 0 }, { t: 1 }] },
    },
    {
      id: 'big',
      anim: { origin: BIG, keys: [{ t: 0 }, { t: 0.04, r: 0 }, { t: 0.12, r: -5 }, { t: 0.34, r: 12 }, { t: 0.42, r: 9 }, { t: 0.62, r: 0 }, { t: 1 }] },
      children: [
        { id: 'teeth', shapes: [{ path: big(TEETH + TEETH_D) }], fill: 'ink', stroke: 'ink', on: ['tile'] },
        { id: 'bigGear', shapes: [{ path: disc(...BIG, 6 * KB) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        // rim inner edge r 6.3; the hub (r 4) keeps clear of the outline
        { id: 'hub', shapes: [{ path: disc(...BIG, 4) }], fill: 'accent', on: ['fill'] },
        { id: 'axle', shapes: [{ path: disc(...BIG, 1.5) }], fill: 'fill', on: ['accent'] },
      ],
    },
  ],
};
