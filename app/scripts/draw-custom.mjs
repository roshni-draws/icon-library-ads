#!/usr/bin/env node
/**
 * Draws the first-pass custom ANTZ icons (zoo concepts with no Material Symbol) in the Material Rounded language:
 * 24 x 24 viewBox, 2px visual stroke built as outlined (filled) shapes, round caps and corners, 2px safe area,
 * fill="currentColor". Writes src/custom/line/<id>.svg and src/custom/filled/<id>.svg.
 *
 * Run: npm run draw-custom   (or: node scripts/draw-custom.mjs)
 *
 * Each icon is described with a few primitives:
 *   stroke(pts)      open centre line, 2px wide, round caps (one closed outline)
 *   ring(pts)        closed centre line, 2px wide (outer + inner outline, even-odd)
 *   solid(pts, g)    closed shape grown by g (use 1 to cover the outer edge of a ring with the same centre line)
 * A filled variant is one even-odd path: the solid shape plus knock-out shapes fully inside it.
 * You can also hand-edit the SVG files; re-running this script overwrites them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/custom/', import.meta.url));
const SW = 2; // visual stroke weight
const D = Math.PI / 180;

/* ---------- geometry ---------- */
const r2 = (n) => (Math.abs(n) < 0.005 ? 0 : Math.round(n * 100) / 100);
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const left = (a) => [a[1], -a[0]]; // left normal in SVG (y down) coordinates

function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return s / 2;
}
/** Drop points closer than eps to the previous one (keeps offsets stable). */
function clean(pts, closed) {
  const out = [];
  for (const p of pts) if (!out.length || len(sub(p, out[out.length - 1])) > 0.01) out.push(p);
  if (closed && out.length > 2 && len(sub(out[0], out[out.length - 1])) < 0.01) out.pop();
  return out;
}

function arc(cx, cy, r, a0, a1, n = 0) {
  const steps = n || Math.max(6, Math.ceil(Math.abs(a1 - a0) / 6));
  return Array.from({ length: steps + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / steps) * D; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
}
function ellipse(cx, cy, rx, ry = rx, n = 72) {
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
}
/** Egg (narrow end up), centre line w x h, centred on cx, cy. */
function egg(cx, cy, w, h, n = 96) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    return [cx + (w / 2) * Math.sin(t) * (1 - 0.16 * Math.cos(t)) / 1.012, cy - (h / 2) * Math.cos(t)];
  });
}
/** Ear: rounded tip at the top, widest low down. Open at the base (where it joins the head) unless closed. */
const earHalf = (w, s) => w * Math.pow(Math.sin((Math.PI / 2) * s), 0.7) * (1 - 0.25 * s * s);
function ear(cx, top, h, w, closed, n = 40) {
  const right = [], lft = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, hw = earHalf(w, s);
    right.push([cx + hw, top + s * h]);
    lft.push([cx - hw, top + s * h]);
  }
  const pts = [...lft.reverse(), ...right.slice(1)];
  return closed ? round(clean(pts, true), 1.2) : clean(pts, false);
}
const rot = (pts, deg, c) => pts.map((p) => { const a = deg * D, d = sub(p, c); return [c[0] + d[0] * Math.cos(a) - d[1] * Math.sin(a), c[1] + d[0] * Math.sin(a) + d[1] * Math.cos(a)]; });
const move = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);

/** Round the corners of a polyline or polygon (quadratic corner, cut back by r). */
function round(pts, r, closed = true, k = 6) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const v = pts[i];
    if (!closed && (i === 0 || i === n - 1)) { out.push(v); continue; }
    const p = pts[(i - 1 + n) % n], q = pts[(i + 1) % n];
    const c = Math.min(r, len(sub(p, v)) / 2, len(sub(q, v)) / 2);
    const a = add(v, mul(norm(sub(p, v)), c)), b = add(v, mul(norm(sub(q, v)), c));
    for (let j = 0; j <= k; j++) {
      const t = j / k;
      out.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * v[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * v[1] + t * t * b[1]]);
    }
  }
  return clean(out, closed);
}

/** Offset a polyline/polygon by d along its left normal, miter joins (bevelled past a limit). */
function offset(pts, d, closed) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
    const p = pts[(i - 1 + n) % n], v = pts[i], q = pts[(i + 1) % n];
    const n1 = hasPrev ? left(norm(sub(v, p))) : null;
    const n2 = hasNext ? left(norm(sub(q, v))) : null;
    if (!n1 || !n2) { out.push(add(v, mul(n1 || n2, d))); continue; }
    const m = norm(add(n1, n2));
    const c = m[0] * n1[0] + m[1] * n1[1];
    if (c < 0.35) { out.push(add(v, mul(n1, d)), add(v, mul(n2, d))); continue; }
    out.push(add(v, mul(m, d / c)));
  }
  return out;
}
const toD = (pts) => 'M' + pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join('L') + 'Z';

/** Open stroke with round caps, as one outline. */
function strokeD(pts, w = SW) {
  pts = clean(pts, false);
  const h = w / 2, n = pts.length;
  const L = offset(pts, h, false), R = offset(pts, -h, false);
  const dirEnd = norm(sub(pts[n - 1], pts[n - 2])), dirStart = norm(sub(pts[0], pts[1]));
  const cap = (c, dir) => {
    const a0 = Math.atan2(left(dir)[1], left(dir)[0]) / D; // from left side, sweep through dir to right side
    return arc(c[0], c[1], h, a0, a0 + 180, 12).slice(1, -1);
  };
  // left side forward, end cap, right side back, start cap
  const capEnd = cap(pts[n - 1], dirEnd);
  const capStart = cap(pts[0], dirStart);
  return toD([...L, ...orient(capEnd, L[n - 1], R[n - 1]), ...[...R].reverse(), ...orient(capStart, R[0], L[0])]);
}
/** Make sure an arc of cap points runs from a toward b (flip if needed). */
function orient(capPts, a, b) {
  if (!capPts.length) return capPts;
  return len(sub(capPts[0], a)) <= len(sub(capPts[0], b)) ? capPts : capPts.slice().reverse();
}
/** Closed stroke: outer + inner outline (use fill-rule evenodd). */
function ringD(pts, w = SW) {
  pts = clean(pts, true);
  const s = area(pts) > 0 ? 1 : -1; // in y-down coords positive area = clockwise; left normal then points outward
  return toD(offset(pts, (s * w) / 2, true)) + toD(offset(pts, (-s * w) / 2, true));
}
/** Closed shape grown outward by g. */
function solidD(pts, g = 0) {
  pts = clean(pts, true);
  const s = area(pts) > 0 ? 1 : -1;
  return toD(g ? offset(pts, s * g, true) : pts);
}
const circle = (cx, cy, r) => ellipse(cx, cy, r, r, Math.max(32, Math.round(r * 16)));

/** Thick X (two crossing round-capped bars) as one outline, so it can be knocked out cleanly. */
function crossD(cx, cy, L, w = SW) {
  const t = w / 2, pts = [];
  // a plus sign with round arm ends, rotated 45 degrees
  for (const a of [0, 270, 180, 90]) {
    const dir = [Math.cos(a * D), Math.sin(a * D)], nrm = left(dir);
    const tip = add([0, 0], mul(dir, L));
    const base1 = add(mul(dir, t), mul(nrm, -t)); // inner corner before arm (right side)
    pts.push(base1);
    const capPts = arc(tip[0], tip[1], t, Math.atan2(-nrm[1], -nrm[0]) / D, Math.atan2(-nrm[1], -nrm[0]) / D - 180, 12);
    pts.push(...capPts);
  }
  return toD(rot(pts, 45, [0, 0]).map((p) => [p[0] + cx, p[1] + cy]));
}
/** Thick plus as one outline. */
function plusD(cx, cy, L, w = SW) {
  const t = w / 2, pts = [];
  for (const a of [0, 270, 180, 90]) {
    const dir = [Math.cos(a * D), Math.sin(a * D)], nrm = left(dir);
    pts.push(add(mul(dir, t), mul(nrm, -t)));
    const tip = mul(dir, L);
    pts.push(...arc(tip[0], tip[1], t, Math.atan2(-nrm[1], -nrm[0]) / D, Math.atan2(-nrm[1], -nrm[0]) / D - 180, 12));
  }
  return toD(pts.map((p) => [p[0] + cx, p[1] + cy]));
}
/** Four-point sparkle. */
function sparkle(cx, cy, R, k = 0.12) {
  const tips = [[0, -R], [R, 0], [0, R], [-R, 0]];
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const a = tips[i], b = tips[(i + 1) % 4];
    const ctl = mul(norm(add(a, b)), R * k);
    for (let j = 0; j < 10; j++) { const t = j / 10; pts.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctl[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctl[1] + t * t * b[1]]); }
  }
  return round(pts.map((p) => [p[0] + cx, p[1] + cy]), 0.6);
}
/** Rounded rectangle polygon. */
const rrect = (x, y, w, h, r) => round([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r, true, 8);

/* ---------- SVG output ---------- */
const svg = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\n` +
  paths.map((p) => (typeof p === 'string' ? `  <path d="${p}"/>` : `  <path fill-rule="evenodd" d="${p.eo}"/>`)).join('\n') +
  `\n</svg>\n`;
const eo = (...ds) => ({ eo: ds.join('') });

const ICONS = {};
const def = (id, line, filled) => { ICONS[id] = { line, filled }; };

/* ---------- ear tags ---------- */
// An ear tilted out to its side, with a round button tag high, in the middle or low on the ear.
const EAR = { cx: 12, top: 3.4, h: 16.4, w: 7.4 };
for (const [lvl, s] of [['high', 0.3], ['moderate', 0.56], ['low', 0.8]]) {
  for (const side of ['left', 'right']) {
    const sign = side === 'left' ? -1 : 1;
    const pivot = [12, 20], tilt = sign * 15;
    const off = Math.max(0, earHalf(EAR.w, s) - 1 - 1.8 - 0.7);
    const tag = rot([[EAR.cx + sign * off, EAR.top + s * EAR.h]], tilt, pivot)[0];
    const open = rot(ear(EAR.cx, EAR.top, EAR.h, EAR.w, false), tilt, pivot);
    const closed = rot(ear(EAR.cx, EAR.top, EAR.h, EAR.w, true), tilt, pivot);
    def(`ear_tag_${lvl}_${side}`,
      svg([strokeD(open), solidD(circle(tag[0], tag[1], 1.8))]),
      svg([eo(solidD(closed, 1), solidD(circle(tag[0], tag[1], 2.3)), solidD(circle(tag[0], tag[1], 1.1)))]));
  }
}

/* ---------- eggs ---------- */
const E = egg(12, 12, 12, 16); // centre line: outer edge 5..19 x 3..21
const eggLine = (...inner) => svg([eo(ringD(E)), ...inner]);
const eggFill = (...knocks) => svg([eo(solidD(E, 1), ...knocks)]);

def('egg_clutch',
  svg([eo(ringD(egg(12, 7.4, 5.6, 7.6))), eo(ringD(egg(7.2, 16.2, 5.6, 7.6))), eo(ringD(egg(16.8, 16.2, 5.6, 7.6)))]),
  svg([solidD(egg(12, 7.4, 5.6, 7.6), 1), solidD(egg(7.2, 16.2, 5.6, 7.6), 1), solidD(egg(16.8, 16.2, 5.6, 7.6), 1)]));

const CHECK = round([[9, 13], [11.1, 15.1], [15, 11.1]], 0.8, false);
def('egg_collected', eggLine(strokeD(CHECK)), eggFill(strokeD(CHECK)));

def('egg_discarded', eggLine(crossD(12, 13.2, 2.7)), eggFill(crossD(12, 13.2, 2.7)));

const SLASH = [[9.6, 10.6], [14.4, 15.8]];
def('egg_infertile', eggLine(strokeD(SLASH)), eggFill(strokeD(SLASH)));

def('egg_golden', eggLine(solidD(sparkle(12, 13.4, 4))), eggFill(solidD(sparkle(12, 13.4, 3.6))));

const EGG_ADD = plusD(12, 13.2, 3);
def('egg_add', eggLine(EGG_ADD), eggFill(EGG_ADD));

// egg in a nest: small egg above a bowl
const NEST_EGG = egg(12, 8, 7, 9);
const BOWL = round([[3.5, 14], [20.5, 14], ...arc(12, 14, 8.5, 0, 180, 30).slice(1, -1).map(([x, y]) => [x, 14 + (y - 14) * 0.72])], 1);
def('egg_nest',
  svg([eo(ringD(NEST_EGG)), eo(ringD(BOWL))]),
  svg([solidD(NEST_EGG, 1), eo(solidD(BOWL, 1), strokeD([[8, 17.3], [16, 17.3]], 1.6))]));

// nursery: house with an egg inside
const HOUSE = round([[4, 20.5], [4, 10], [12, 3.8], [20, 10], [20, 20.5]], 1.2);
const N_EGG = egg(12, 15.2, 4.6, 6);
def('egg_nursery',
  svg([eo(ringD(HOUSE)), solidD(N_EGG, 0.3)]),
  svg([eo(solidD(HOUSE, 1), solidD(N_EGG, 0.6))]));

// hatched egg: cracked lower shell + lifted cap
const HE = egg(12, 13.4, 11, 14.2, 120);
const zig = (y0, y1, x0, x1, n) => Array.from({ length: n * 2 + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / (n * 2), i % 2 ? y1 : y0]);
const shell = (cut, up) => {
  const bottom = HE.filter((p) => p[1] > cut).sort((a, b) => Math.atan2(a[1] - 13.4, a[0] - 12) - Math.atan2(b[1] - 13.4, b[0] - 12));
  const xs = bottom.map((p) => p[0]);
  const xl = Math.min(...xs), xr = Math.max(...xs);
  return round([...bottom, ...zig(cut, up, xl, xr, 3)], 0.9);
};
const SHELL = shell(14, 11.6);
const capPts = (() => {
  const top = HE.filter((p) => p[1] < 9.2).sort((a, b) => Math.atan2(a[1] - 13.4, a[0] - 12) - Math.atan2(b[1] - 13.4, b[0] - 12));
  const xs = top.map((p) => p[0]);
  const xl = Math.min(...xs), xr = Math.max(...xs);
  return round([...top, ...zig(9.2, 10.8, xr, xl, 2)], 0.8);
})();
const CAP = move(rot(capPts, -18, [8, 9]), 0.2, -1.4);
def('egg_hatched', svg([eo(ringD(SHELL)), eo(ringD(CAP))]), svg([solidD(SHELL, 1), solidD(CAP, 1)]));

// hatched chick: head peeking out of a lower shell
const CHICK_SHELL = shell(15, 12.8);
const HEAD = circle(11.2, 8, 3.4);
const BEAK = round([[14.9, 7.2], [18.2, 8.4], [14.9, 9.6]], 0.6);
def('chick_hatched',
  svg([eo(ringD(CHICK_SHELL)), eo(ringD(HEAD), solidD(circle(12.1, 7.4, 0.9))), solidD(BEAK)]),
  svg([solidD(CHICK_SHELL, 1), eo(solidD(HEAD, 1), solidD(circle(12.1, 7.4, 1))), solidD(BEAK, 0.3)]));

/* ---------- reproduction modes ---------- */
const BODY = circle(12, 12, 8.6);
def('repro_viviparous',
  svg([eo(ringD(BODY)), solidD(circle(12, 12, 3.2))]),
  svg([eo(solidD(BODY, 1), solidD(circle(12, 12, 4.4)), solidD(circle(12, 12, 3)))]));
const IN_EGG = egg(12, 12.2, 5, 6.8);
def('repro_ovoviviparous',
  svg([eo(ringD(BODY)), eo(ringD(IN_EGG))]),
  svg([eo(solidD(BODY, 1), solidD(IN_EGG, 1), solidD(IN_EGG, -1))]));
const MOTHER = circle(9.3, 9.3, 5.2);
const LAID = egg(16.6, 16.9, 5.2, 6.8);
def('repro_oviparous',
  svg([eo(ringD(MOTHER)), eo(ringD(LAID))]),
  svg([solidD(MOTHER, 1), solidD(LAID, 1)]));
const QUESTION = [...arc(12, 9.6, 2.7, 190, 360 + 35, 30), [12, 13.1]];
def('repro_unknown',
  svg([eo(ringD(BODY)), strokeD(round(QUESTION, 1, false)), solidD(circle(12, 16.6, 1.2))]),
  svg([eo(solidD(BODY, 1), strokeD(round(QUESTION, 1, false)), solidD(circle(12, 16.6, 1.25)))]));

/* ---------- mortality ---------- */
// carcass: animal lying on its back, legs up, on the ground
const CBODY = ellipse(13.2, 12.6, 5.8, 3.2, 72);
const CHEAD = circle(5.3, 11.4, 2.3);
const LEGS = [[[10, 9.8], [7.9, 4.6]], [[16.4, 9.8], [18.5, 4.6]]];
const TAIL = [[19, 13.6], [20.8, 15.4]];
const GROUND = [[3, 19.6], [21, 19.6]];
def('carcass',
  svg([eo(ringD(CBODY)), eo(ringD(CHEAD)), ...LEGS.map((l) => strokeD(l)), strokeD(TAIL), strokeD(GROUND)]),
  svg([solidD(CBODY, 1), solidD(CHEAD, 1), ...LEGS.map((l) => strokeD(l)), strokeD(TAIL), strokeD(GROUND)]));

// fish bones: spine, three rib pairs, head and tail
const SPINE = [[5.5, 12], [16, 12]];
const RIBS = [7.6, 10.6, 13.6].flatMap((x) => [[[x, 12], [x + 1.4, 8]], [[x, 12], [x + 1.4, 16]]]);
const FHEAD = round([[16.6, 8.2], [21, 12], [16.6, 15.8]], 1.4);
const FTAIL = round([[2.8, 8.6], [5.6, 12], [2.8, 15.4]], 0.9, false);
def('fish_bones',
  svg([strokeD(SPINE), ...RIBS.map((r) => strokeD(r)), eo(ringD(FHEAD)), strokeD(FTAIL)]),
  svg([strokeD(SPINE), ...RIBS.map((r) => strokeD(r)), eo(solidD(FHEAD, 1), solidD(circle(18.1, 12, 0.85))), solidD(round([[2.6, 8], [6.4, 12], [2.6, 16]], 0.9), 0.4)]));

/* ---------- breeding pair (female + male) ---------- */
const FEM = circle(8, 7.8, 3.4);
const MAL = circle(16, 14.6, 3.4);
const FCROSS = [[[8, 11.2], [8, 20.6]], [[5.4, 17.2], [10.6, 17.2]]];
const MARROW = [[[18.5, 12.1], [20.6, 9.4]], round([[17.8, 9], [21, 9], [21, 12.2]], 0.8, false)];
def('breeding_pair',
  svg([eo(ringD(FEM)), eo(ringD(MAL)), ...FCROSS.map((s) => strokeD(s)), ...MARROW.map((s) => strokeD(s))]),
  svg([solidD(FEM, 1), solidD(MAL, 1), ...FCROSS.map((s) => strokeD(s)), ...MARROW.map((s) => strokeD(s))]));

/* ---------- tags ---------- */
const TAG = round([[3.6, 12], [8.6, 5.2], [20.4, 5.2], [20.4, 18.8], [8.6, 18.8]], 1.4);
const HOLE = circle(8.4, 12, 1.15);
const GLOBE = { cx: 15, cy: 12 };
def('tag_public',
  svg([eo(ringD(TAG), solidD(HOLE)), eo(ringD(circle(GLOBE.cx, GLOBE.cy, 3.2), 1.6)), eo(ringD(ellipse(GLOBE.cx, GLOBE.cy, 1.2, 3.2), 1.4)), strokeD([[11.9, 12], [18.1, 12]], 1.4)]),
  svg([eo(solidD(TAG, 1), solidD(HOLE), solidD(circle(GLOBE.cx, GLOBE.cy, 3.9)), solidD(ellipse(GLOBE.cx, GLOBE.cy, 1.25, 2.9)))]));
const LOCK_BODY = rrect(12.2, 11.4, 6, 5, 1);
const SHACKLE = [[13.6, 10.5], [13.6, 9.8], ...arc(15.2, 9.8, 1.6, 180, 360, 16).slice(1, -1), [16.8, 9.8], [16.8, 10.5]];
def('tag_private',
  svg([eo(ringD(TAG), solidD(HOLE)), solidD(LOCK_BODY), strokeD(round(SHACKLE, 0.5, false), 1.5)]),
  svg([eo(solidD(TAG, 1), solidD(HOLE), solidD(LOCK_BODY), strokeD(round(SHACKLE, 0.5, false), 1.5))]));

/* ---------- other ANTZ concepts ---------- */
// deworming: worm + capsule
const WORM = Array.from({ length: 41 }, (_, i) => { const x = 3.4 + (i / 40) * 10.6; return [x, 7.2 + 2.2 * Math.sin(((x - 3.4) / 10.6) * 2.5 * Math.PI)]; });
const PILL = (() => {
  // capsule centre line along 45 degrees
  const a = [14.6, 14.6], b = [18.2, 18.2], r = 2.6, d = norm(sub(b, a)), n = left(d);
  const ang = Math.atan2(n[1], n[0]) / D;
  return clean([...arc(b[0], b[1], r, ang, ang + 180, 24), ...arc(a[0], a[1], r, ang + 180, ang + 360, 24)], true);
})();
def('deworming',
  svg([strokeD(WORM), eo(ringD(PILL)), strokeD([[15.1, 18.5], [18.5, 15.1]], 1.6)]),
  svg([strokeD(WORM), eo(solidD(PILL, 1), strokeD([[15.4, 18.2], [18.2, 15.4]], 1.4))]));

// controlled substance: medicine bottle with a C mark
const CAP_R = rrect(6.5, 2.8, 11, 3.6, 1.2);
const BOTTLE = rrect(6.2, 8.6, 11.6, 12.4, 2);
const CMARK = arc(12, 14.8, 2.7, 40, 320, 36);
def('controlled_substance',
  svg([solidD(CAP_R), eo(ringD(BOTTLE)), strokeD(CMARK, 1.8)]),
  svg([solidD(CAP_R), eo(solidD(BOTTLE, 1), strokeD(CMARK, 1.8))]));

// batch of animals: two paws
function paw(cx, cy, s) {
  const pad = egg(cx, cy + 1.4 * s, 4.4 * s, 3.8 * s);
  const toes = [[-3.2, -1.8, 1.1], [-1.1, -3.6, 1.1], [1.1, -3.6, 1.1], [3.2, -1.8, 1.1]].map(([dx, dy, r]) => ellipse(cx + dx * s, cy + dy * s, r * s, r * 1.25 * s, 32));
  return { pad, toes };
}
const P1 = paw(8, 15.2, 1.05), P2 = paw(16.2, 7.8, 1.05);
def('animal_batch',
  svg([...[P1, P2].flatMap((p) => [eo(ringD(p.pad, 1.7)), ...p.toes.map((t) => solidD(t))])]),
  svg([...[P1, P2].flatMap((p) => [solidD(p.pad, 0.85), ...p.toes.map((t) => solidD(t, 0.2))])]));

/* ---------- write ---------- */
for (const style of ['line', 'filled']) mkdirSync(OUT + style, { recursive: true });
for (const [id, v] of Object.entries(ICONS)) {
  writeFileSync(`${OUT}line/${id}.svg`, v.line);
  writeFileSync(`${OUT}filled/${id}.svg`, v.filled);
}
console.log(`Wrote ${Object.keys(ICONS).length} custom icons (line + filled) to src/custom/.`);
