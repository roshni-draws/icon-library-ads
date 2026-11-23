/**
 * Builder document model: each style is a list of top-level SVG elements (the children of the canonical <svg>).
 * Shapes ("leaves") are addressed by their index path through <g>/<mask> children, so uploaded masks, badge
 * composites and drawn shapes all stay editable.
 */
import { GUARDRAILS as G } from '../lib/guardrails';
import { childrenOf, wrapSvg, type IconStyle } from '../lib/normalize';
import { fmt, isShape, type El } from '../lib/svg';

export type Path = number[];
export interface Leaf { path: Path; el: El; inMask: boolean }

export function leaves(els: El[], base: Path = [], inMask = false): Leaf[] {
  const out: Leaf[] = [];
  els.forEach((e, i) => {
    const p = [...base, i];
    if (e.tag === 'mask' || e.tag === 'g') out.push(...leaves(e.children, p, inMask || e.tag === 'mask'));
    else if (isShape(e.tag)) out.push({ path: p, el: e, inMask });
  });
  return out;
}

const samePath = (a: Path | null, b: Path | null) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
export { samePath };

export function getAt(els: El[], p: Path): El | null {
  let list = els, el: El | null = null;
  for (const i of p) { el = list[i] ?? null; if (!el) return null; list = el.children; }
  return el;
}
export function updateAt(els: El[], p: Path, fn: (e: El) => El | null): El[] {
  const [i, ...rest] = p;
  const out: El[] = [];
  els.forEach((e, k) => {
    if (k !== i) { out.push(e); return; }
    if (!rest.length) { const n = fn(e); if (n) out.push(n); return; }
    out.push({ ...e, children: updateAt(e.children, rest, fn) });
  });
  return out;
}

/** Ensures the filled doc has <mask id="cut"> (white canvas) and a <g mask="url(#cut)"> holding the solid shapes. */
export function ensureCut(els: El[]): El[] {
  if (els.some((e) => e.tag === 'mask' && e.attrs.id === 'cut') && els.some((e) => e.tag === 'g' && e.attrs.mask === 'url(#cut)')) return els;
  const mask: El = { tag: 'mask', attrs: { id: 'cut' }, children: [{ tag: 'rect', attrs: { width: '24', height: '24', fill: 'white' }, children: [] }] };
  const g: El = { tag: 'g', attrs: { mask: 'url(#cut)' }, children: els.filter((e) => e.tag !== 'mask') };
  return [mask, ...els.filter((e) => e.tag === 'mask'), g];
}

/** Adds a drawn shape to a style's doc. In filled + cut-out mode it becomes a 2px black stroke in the cut mask. */
export function addShape(els: El[], style: IconStyle, shape: El, cut: boolean): El[] {
  if (style === 'filled' && cut) {
    const withCut = ensureCut(els);
    const sh: El = { ...shape, attrs: { ...shape.attrs, fill: 'none', stroke: 'black', 'stroke-width': String(G.strokeWidth), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } };
    return withCut.map((e) => (e.tag === 'mask' && e.attrs.id === 'cut' ? { ...e, children: [...e.children, sh] } : e));
  }
  let sh = shape;
  if (style === 'filled' && (shape.tag === 'line' || shape.tag === 'polyline' || (shape.tag === 'path' && !/Z\s*$/i.test(shape.attrs.d ?? '')))) {
    // Open strokes in a filled icon: drawn as strokes so they are visible; the guard rails flag them.
    sh = { ...shape, attrs: { ...shape.attrs, fill: 'none', stroke: 'currentColor', 'stroke-width': String(G.strokeWidth), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } };
  }
  const gi = els.findIndex((e) => e.tag === 'g' && e.attrs.mask === 'url(#cut)');
  if (gi >= 0) return els.map((e, i) => (i === gi ? { ...e, children: [...e.children, sh] } : e));
  return [...els, sh];
}

export const toSvg = (style: IconStyle, els: El[]) => wrapSvg(style, els);
export const fromSvg = (svg: string) => childrenOf(svg);

/** Path data for a pen polyline with quadratic (rounded) corners of radius r. */
export function penPath(pts: [number, number][], closed: boolean, r: number): string {
  if (pts.length < 2) return '';
  const n = pts.length;
  const P = (i: number) => pts[(i + n) % n];
  const corner = (i: number) => {
    const p = P(i), a = P(i - 1), b = P(i + 1);
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la / 2, lb / 2);
    if (rr <= 0 || !la || !lb) return { a: p, b: p, p, round: false };
    return { a: [p[0] - ((p[0] - a[0]) / la) * rr, p[1] - ((p[1] - a[1]) / la) * rr] as [number, number], b: [p[0] + ((b[0] - p[0]) / lb) * rr, p[1] + ((b[1] - p[1]) / lb) * rr] as [number, number], p, round: true };
  };
  const pt = (q: [number, number]) => `${fmt(q[0])} ${fmt(q[1])}`;
  let d = '';
  if (!closed) {
    d = `M${pt(pts[0])}`;
    for (let i = 1; i < n - 1; i++) { const c = corner(i); d += c.round ? `L${pt(c.a)}Q${pt(c.p)} ${pt(c.b)}` : `L${pt(c.p)}`; }
    d += `L${pt(pts[n - 1])}`;
    return d;
  }
  const c0 = corner(0);
  d = `M${pt(c0.b)}`;
  for (let i = 1; i <= n; i++) { const c = corner(i % n); d += c.round ? `L${pt(c.a)}Q${pt(c.p)} ${pt(c.b)}` : `L${pt(c.p)}`; }
  return d + 'Z';
}

/** Snaps the end point so the segment from a is a multiple of `deg` degrees. */
export function snapAngle(a: [number, number], b: [number, number], deg: number, snap: number): [number, number] {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (!len) return b;
  const step = (deg * Math.PI) / 180;
  const ang = Math.round(Math.atan2(dy, dx) / step) * step;
  const ux = Math.cos(ang), uy = Math.sin(ang);
  // Snap the length along the axis so diagonal ends land on the grid where possible.
  const diag = Math.abs(ux) > 1e-6 && Math.abs(uy) > 1e-6;
  const L = diag ? Math.round((len * Math.abs(ux)) / snap) * snap / Math.abs(ux) : Math.round(len / snap) * snap;
  const x = a[0] + ux * L, y = a[1] + uy * L;
  return [Math.round(x / snap) * snap, Math.round(y / snap) * snap];
}
