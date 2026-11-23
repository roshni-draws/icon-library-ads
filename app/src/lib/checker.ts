/**
 * ANTZ Rounded guard-rail checker. One implementation for the builder, the library drawer and
 * scripts/check-library.mjs (which bundles this file with esbuild). All numbers come from guardrails.ts.
 *
 * Methods (approximations, documented in library/STYLE.md):
 *  - Extent and keylines: every shape outline is sampled every `sampleStep` px (curves and arcs included);
 *    stroked shapes are grown by half the stroke width. This is exact for round caps and joins and very close
 *    for everything else.
 *  - Minimum gap (line icons): each subpath is one "stroke". For every pair of strokes, the clear space is the
 *    smallest distance between their sampled centre lines minus both half widths. Clear <= 0 means the strokes
 *    touch or cross (they are treated as joined); 0 < clear < minGap warns. Masked points within a mask cut-out
 *    circle (radius + half the stroke width) are ignored, since the mask clips their ink. Gaps inside one stroke (a U whose arms come close) are not measured.
 */
import { GUARDRAILS as G, RULE_SOURCE } from './guardrails';
import { IDENTITY, isShape, num, parsePath, sampleShape, svgRoot, type El, type Outline } from './svg';

export type Level = 'pass' | 'info' | 'warn' | 'fail';
export type IconStyle = 'line' | 'filled';
export interface CheckResult { id: string; title: string; level: Level; message: string; source: 'M3' | 'ANTZ' }
export interface Report { style: IconStyle; level: Level; results: CheckResult[]; keyline: string | null; ink: { x0: number; y0: number; x1: number; y1: number } | null }
export interface CheckOptions { materialBase?: boolean }

const RANK: Record<Level, number> = { pass: 0, info: 0, warn: 1, fail: 2 };
const worst = (ls: Level[]): Level => ls.reduce<Level>((a, b) => (RANK[b] > RANK[a] ? b : a), 'pass');

const LINE_TAGS = ['path', 'circle', 'rect', 'line', 'polyline', 'ellipse'];
const FILLED_TAGS = ['path', 'circle', 'rect', 'ellipse', 'polygon', 'line', 'polyline'];
const MASK_COLOURS = /^(white|black|#fff|#ffffff|#000|#000000|none|currentColor)$/i;
const OK_COLOURS = /^(none|currentColor)$/;
const INHERIT = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule'];

interface Drawn { el: El; eff: Record<string, string>; masked: boolean }

export function checkSvg(svg: string, style: IconStyle, opts: CheckOptions = {}): Report {
  const results: CheckResult[] = [];
  const add = (id: string, title: string, level: Level, message: string) => {
    const s = RULE_SOURCE[id] ?? { source: 'ANTZ' as const };
    results.push({ id, title, level, message: s.note && level !== 'pass' ? `${message} (${s.note})` : message, source: s.source });
  };
  const done = (keyline: string | null = null, ink: Report['ink'] = null): Report => ({ style, level: worst(results.map((r) => r.level)), results, keyline, ink });

  let root: El | null;
  try { root = svgRoot(svg); } catch (e) { root = null; add('format', 'Valid SVG', 'fail', `Could not parse the SVG: ${(e as Error).message}`); return done(); }
  if (!root) { add('format', 'Valid SVG', 'fail', 'No <svg> element found.'); return done(); }
  const ra = root.attrs;

  /* viewBox and size */
  const vb = (ra.viewBox ?? '').trim().split(/[\s,]+/).map(Number);
  const vbOk = vb.length === 4 && vb[0] === 0 && vb[1] === 0 && vb[2] === G.canvas && vb[3] === G.canvas;
  const sizeOk = num(ra.width, G.canvas) === G.canvas && num(ra.height, G.canvas) === G.canvas && ra.width !== undefined && ra.height !== undefined;
  add('viewBox', 'viewBox 24', vbOk ? (sizeOk ? 'pass' : 'warn') : 'fail',
    vbOk ? (sizeOk ? 'viewBox="0 0 24 24", width and height 24.' : 'viewBox is right; set width="24" height="24" on the <svg>.') : `viewBox is "${ra.viewBox ?? 'missing'}"; it must be "0 0 24 24".`);

  /* walk */
  const drawn: Drawn[] = [];
  const structural: string[] = [], forbiddenAttr: string[] = [], badColour: string[] = [];
  const masks: El[] = [];
  const cuts: { cx: number; cy: number; r: number }[] = [];
  const maskStrokes: Record<string, string>[] = [];
  const allowed = style === 'line' ? LINE_TAGS : FILLED_TAGS;

  const checkAttrs = (el: El, inMask: boolean) => {
    for (const k of Object.keys(el.attrs)) {
      if (k === 'transform') forbiddenAttr.push(`transform on <${el.tag}>`);
      else if (k === 'style') forbiddenAttr.push(`style on <${el.tag}>`);
      else if (k === 'class') forbiddenAttr.push(`class on <${el.tag}>`);
      else if (k === 'id' && !(el.tag === 'mask' && !inMask)) forbiddenAttr.push(`id="${el.attrs.id}" on <${el.tag}>`);
    }
    for (const k of ['fill', 'stroke', 'color', 'stop-color']) {
      const v = el.attrs[k];
      if (v === undefined) continue;
      if (inMask ? !MASK_COLOURS.test(v) : !OK_COLOURS.test(v)) badColour.push(`${k}="${v}" on <${el.tag}>`);
    }
  };

  const walk = (el: El, eff: Record<string, string>, masked: boolean) => {
    for (const c of el.children) {
      checkAttrs(c, false);
      const next = { ...eff };
      for (const k of INHERIT) if (c.attrs[k] !== undefined) next[k] = c.attrs[k];
      if (c.tag === 'mask') {
        masks.push(c);
        const mEff: Record<string, string> = { ...eff };
        for (const m of c.children) {
          checkAttrs(m, true);
          const e2 = { ...mEff };
          for (const k of INHERIT) if (m.attrs[k] !== undefined) e2[k] = m.attrs[k];
          if (m.tag === 'circle' && /^(black|#000|#000000)$/i.test(m.attrs.fill ?? '')) cuts.push({ cx: num(m.attrs.cx), cy: num(m.attrs.cy), r: num(m.attrs.r) });
          if (e2.stroke && e2.stroke !== 'none') maskStrokes.push(e2);
          if (!isShape(m.tag)) structural.push(`<${m.tag}> inside <mask>`);
        }
        continue;
      }
      if (c.tag === 'g') {
        if (!c.attrs.mask) structural.push('<g> without a mask (flatten groups)');
        walk(c, next, masked || !!c.attrs.mask);
        continue;
      }
      if (c.tag === 'title' || c.tag === 'desc') { structural.push(`<${c.tag}> (remove metadata)`); continue; }
      if (!allowed.includes(c.tag)) { structural.push(`<${c.tag}>`); continue; }
      drawn.push({ el: c, eff: next, masked: masked || !!c.attrs.mask });
    }
  };
  const rootEff: Record<string, string> = { fill: 'black', stroke: 'none', 'stroke-width': '1', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' };
  for (const k of INHERIT) if (ra[k] !== undefined) rootEff[k] = ra[k];
  for (const k of ['transform', 'style', 'class', 'id']) if (ra[k] !== undefined) forbiddenAttr.push(`${k} on <svg>`);
  for (const k of ['fill', 'stroke', 'color']) if (ra[k] !== undefined && !OK_COLOURS.test(ra[k])) badColour.push(`${k}="${ra[k]}" on <svg>`);
  walk(root, rootEff, false);

  /* format: root attributes for the style */
  if (style === 'line') {
    const miss: string[] = [];
    if (ra.fill !== 'none') miss.push('fill="none"');
    if (ra.stroke !== 'currentColor') miss.push('stroke="currentColor"');
    if (ra['stroke-width'] === undefined) miss.push('stroke-width="2"');
    if (ra['stroke-linecap'] === undefined) miss.push('stroke-linecap="round"');
    if (ra['stroke-linejoin'] === undefined) miss.push('stroke-linejoin="round"');
    const filledEls = drawn.filter((d) => d.eff.fill && d.eff.fill !== 'none').length;
    const level: Level = miss.length ? 'fail' : filledEls ? 'warn' : 'pass';
    add('format', 'Line format', level, miss.length ? `The <svg> needs ${miss.join(', ')}.`
      : filledEls ? `${filledEls} shape${filledEls > 1 ? 's are' : ' is'} filled. Line icons are drawn with 2px strokes only (filled outlines usually mean a Material or traced base: redraw).`
        : 'Stroked, fill="none" on the <svg>.');
  } else {
    add('format', 'Filled format', ra.fill === 'currentColor' ? 'pass' : 'fail', ra.fill === 'currentColor' ? 'fill="currentColor" on the <svg>.' : 'The <svg> needs fill="currentColor".');
  }

  /* elements */
  const elLevel: Level = structural.length || forbiddenAttr.length ? 'fail' : masks.length > 1 ? 'warn' : 'pass';
  const maskNote = masks.length === 1 ? ' One <mask> cut-out.' : masks.length > 1 ? ` ${masks.length} masks: use one.` : '';
  add('elements', 'Allowed elements', elLevel,
    structural.length || forbiddenAttr.length
      ? [structural.length ? `Not allowed: ${[...new Set(structural)].join(', ')}.` : '', forbiddenAttr.length ? `Remove ${[...new Set(forbiddenAttr)].slice(0, 4).join(', ')}.` : ''].filter(Boolean).join(' ')
      : `${drawn.length} shape${drawn.length === 1 ? '' : 's'}: ${[...new Set(drawn.map((d) => d.el.tag))].join(', ') || 'none'}.${maskNote}`);
  for (const m of masks) {
    const id = m.attrs.id;
    if (!id) add('elements', 'Mask', 'fail', '<mask> has no id, so nothing can use it.');
  }

  /* colours */
  add('colours', 'No hard-coded colours', badColour.length ? 'fail' : 'pass',
    badColour.length ? `Use currentColor: ${[...new Set(badColour)].slice(0, 4).join(', ')}.` : 'Only currentColor (mask uses white/black).');

  if (!drawn.length) { add('extent', 'Inside the live area', 'warn', 'Nothing drawn yet.'); return done(); }

  /* stroke width, caps and joins */
  const stroked = drawn.filter((d) => d.eff.stroke && d.eff.stroke !== 'none');
  if (style === 'line') {
    const widths = [...new Set(stroked.map((d) => num(d.eff['stroke-width'], 1)))];
    const bad = widths.filter((w) => w !== G.strokeWidth && !(G.strokeWidthAllowed as readonly number[]).includes(w));
    const reduced = widths.filter((w) => (G.strokeWidthAllowed as readonly number[]).includes(w));
    add('strokeWidth', 'Stroke width 2', bad.length ? 'fail' : reduced.length ? 'info' : stroked.length ? 'pass' : 'warn',
      bad.length ? `Stroke width ${bad.join(', ')}: use ${G.strokeWidth} (or ${G.strokeWidthAllowed.join(', ')} for complex detail).`
        : reduced.length ? `Uses ${reduced.join(', ')} as an optical correction for complex detail (allowed by M3); the rest is ${G.strokeWidth}.`
          : stroked.length ? `All strokes are ${G.strokeWidth}px.` : 'No strokes found.');
    const notRound = stroked.filter((d) => d.eff['stroke-linecap'] !== G.linecap || d.eff['stroke-linejoin'] !== G.linejoin);
    add('capsJoins', 'Round caps and joins', notRound.length ? 'fail' : 'pass',
      notRound.length ? `${notRound.length} shape${notRound.length > 1 ? 's' : ''} without round caps/joins.` : 'Round caps and round joins (ANTZ rule).');
  } else {
    const outer = stroked;
    add('outerStroke', 'No visible outer stroke', outer.length ? 'fail' : 'pass',
      outer.length ? `${outer.length} shape${outer.length > 1 ? 's have' : ' has'} a visible stroke. Filled icons are solid shapes; draw details as cut-outs (evenodd or a mask).` : 'Solid shapes only; details are cut-outs.');
    const badMask = maskStrokes.filter((e) => ![G.strokeWidth, ...G.strokeWidthAllowed].includes(num(e['stroke-width'], 1) as 2) || e['stroke-linecap'] !== 'round' || e['stroke-linejoin'] !== 'round');
    if (maskStrokes.length) add('strokeWidth', 'Cut-out width 2', badMask.length ? 'warn' : 'pass', badMask.length ? 'Mask cut-out strokes should be 2px with round caps and joins.' : 'Mask cut-outs are 2px round strokes.');
  }

  /* corner radius (rects) */
  const sharp = drawn.filter((d) => d.el.tag === 'rect' && num(d.el.attrs.width) > G.cornerExemptSize && num(d.el.attrs.height) > G.cornerExemptSize
    && Math.max(num(d.el.attrs.rx, -1), num(d.el.attrs.ry, -1), 0) < G.minCornerRadius);
  add('corners', 'Corner radius ≥ 2', sharp.length ? 'warn' : 'pass',
    sharp.length ? `${sharp.length} rect${sharp.length > 1 ? 's have' : ' has'} rx below ${G.minCornerRadius}. Round outer corners to ${G.minCornerRadius} (shapes ${G.cornerExemptSize}px wide or less are exempt).`
      : drawn.some((d) => d.el.tag === 'path') ? 'Rects are rounded. Path corners are not measured: check them on the canvas.' : 'Rect corners are rounded.');

  /* pixel grid: endpoints, centres, radii, sizes (curve control points excluded) */
  const off: number[] = [];
  for (const d of drawn) {
    const a = d.el.attrs;
    let ns: number[] = [];
    if (d.el.tag === 'path') {
      try { ns = parsePath(a.d ?? '').flatMap((s) => (s.c === 'Z' ? [] : s.c === 'A' ? [s.v[0], s.v[1], s.v[5], s.v[6]] : s.v.slice(-2))); } catch { /* reported below */ }
    } else if (d.el.tag === 'circle') ns = [num(a.cx), num(a.cy), num(a.r)];
    else if (d.el.tag === 'ellipse') ns = [num(a.cx), num(a.cy), num(a.rx), num(a.ry)];
    else if (d.el.tag === 'rect') ns = [num(a.x), num(a.y), num(a.width), num(a.height)];
    else if (d.el.tag === 'line') ns = [num(a.x1), num(a.y1), num(a.x2), num(a.y2)];
    else ns = (a.points ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
    for (const v of ns) if (Math.abs(v / G.grid - Math.round(v / G.grid)) > 1e-3) off.push(v);
  }
  add('grid', 'On the pixel grid', off.length ? 'warn' : 'pass',
    off.length ? `${off.length} value${off.length > 1 ? 's' : ''} off the ${G.grid}px grid (e.g. ${[...new Set(off)].slice(0, 4).map((v) => +v.toFixed(3)).join(', ')}). With a centred 2px stroke, whole pixels are crisp.`
      : 'Endpoints, centres and sizes sit on whole pixels.');

  /* sample outlines */
  type Shape = { o: Outline; hw: number; filled: boolean; masked: boolean };
  const shapes: Shape[] = [];
  let parseErr = '';
  for (const d of drawn) {
    const hw = d.eff.stroke && d.eff.stroke !== 'none' ? num(d.eff['stroke-width'], 1) / 2 : 0;
    try {
      for (const o of sampleShape(d.el, IDENTITY, G.sampleStep)) shapes.push({ o, hw, filled: !!d.eff.fill && d.eff.fill !== 'none', masked: d.masked });
    } catch (e) { parseErr = (e as Error).message; }
  }
  if (parseErr) add('format', 'Path data', 'fail', `A path could not be read: ${parseErr}`);

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, rMax = 0;
  for (const s of shapes) for (const [x, y] of s.o.pts) {
    x0 = Math.min(x0, x - s.hw); y0 = Math.min(y0, y - s.hw); x1 = Math.max(x1, x + s.hw); y1 = Math.max(y1, y + s.hw);
    rMax = Math.max(rMax, Math.hypot(x - 12, y - 12) + s.hw);
  }
  if (!Number.isFinite(x0)) { add('extent', 'Inside the live area', 'warn', 'No measurable shapes.'); return done(); }
  const e = G.epsilon;
  const ink = { x0, y0, x1, y1 };
  const r1 = (v: number) => +v.toFixed(2);
  if (x0 < -e || y0 < -e || x1 > G.canvas + e || y1 > G.canvas + e) {
    add('extent', 'Inside the live area', 'fail', `Content goes outside the 24 × 24 canvas (ink ${r1(x0)}–${r1(x1)} × ${r1(y0)}–${r1(y1)}).`);
  } else if (x0 < G.live.min - e || y0 < G.live.min - e || x1 > G.live.max + e || y1 > G.live.max + e) {
    add('extent', 'Inside the live area', 'warn', `Content reaches into the 2px padding (ink ${r1(x0)}–${r1(x1)} × ${r1(y0)}–${r1(y1)}). M3 allows this only for extra visual weight ("Caution").`);
  } else add('extent', 'Inside the live area', 'pass', `Ink ${r1(x1 - x0)} × ${r1(y1 - y0)}, inside 2–22.`);

  /* keylines */
  const fits = G.keylines.filter((k) => {
    if (k.kind === 'circle') return rMax <= k.w / 2 + e;
    const kx0 = 12 - k.w / 2, kx1 = 12 + k.w / 2, ky0 = 12 - k.h / 2, ky1 = 12 + k.h / 2;
    return x0 >= kx0 - e && x1 <= kx1 + e && y0 >= ky0 - e && y1 <= ky1 + e;
  });
  // The keyline the icon "uses": the fitting one that the ink fills best.
  const fill = (k: (typeof G.keylines)[number]) => (k.kind === 'circle' ? rMax / (k.w / 2) : Math.min((x1 - x0) / k.w, (y1 - y0) / k.h) + Math.max((x1 - x0) / k.w, (y1 - y0) / k.h));
  const best = [...fits].sort((a, b) => fill(b) - fill(a))[0];
  add('keyline', 'Fits a keyline', 'info', best ? `${best.label}${fits.length > 1 ? ` (also fits ${fits.filter((f) => f !== best).map((f) => f.label.split(' ')[0].toLowerCase()).join(', ')})` : ''}.`
    : 'Fits no keyline exactly; uses the full live area.');

  /* minimum gap between separate strokes (line) */
  if (style === 'line') {
    // The mask clips ink at the cut radius, so a masked centre-line point within r + half width has no ink outside the cut.
    const inCut = ([x, y]: [number, number], hw: number) => cuts.some((c) => Math.hypot(x - c.cx, y - c.cy) < c.r + hw);
    const parts = shapes.filter((s) => s.hw > 0).map((s) => ({ hw: s.hw, pts: s.masked ? s.o.pts.filter((p) => !inCut(p, s.hw)) : s.o.pts })).filter((s) => s.pts.length);
    const bbox = parts.map((p) => p.pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]));
    let worstGap = Infinity, pairs = 0;
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const need = G.minGap + parts[i].hw + parts[j].hw;
      const a = bbox[i], b = bbox[j];
      if (a[0] - b[2] > need || b[0] - a[2] > need || a[1] - b[3] > need || b[1] - a[3] > need) continue;
      let dmin = Infinity;
      for (const p of parts[i].pts) for (const q of parts[j].pts) { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < dmin) dmin = d; }
      const clear = Math.sqrt(dmin) - parts[i].hw - parts[j].hw;
      if (clear > 0.05 && clear < G.minGap - 0.1) { pairs++; worstGap = Math.min(worstGap, clear); }
    }
    add('gap', 'Gap ≥ 2 between strokes', pairs ? 'warn' : 'pass',
      pairs ? `${pairs} pair${pairs > 1 ? 's' : ''} of separate strokes are closer than ${G.minGap}px (tightest ${r1(worstGap)}px). Join them or open the gap.`
        : `Separate strokes keep ${G.minGap}px of clear space (sampled every ${G.sampleStep}px).`);
  }

  /* complexity */
  let cmds = 0, maxCmds = 0;
  for (const d of drawn) if (d.el.tag === 'path') { try { const n = parsePath(d.el.attrs.d ?? '').length; cmds += n; maxCmds = Math.max(maxCmds, n); } catch { /* */ } }
  const tooMany = drawn.length > G.maxElements, tooLong = maxCmds > G.maxPathCommands || cmds > G.maxPathsTotalCommands;
  add('complexity', 'Complexity', tooMany || tooLong ? 'warn' : 'pass',
    `${drawn.length} shape${drawn.length === 1 ? '' : 's'}, ${cmds} path commands${tooMany ? `; more than ${G.maxElements} shapes` : ''}${tooLong ? `; over ${G.maxPathCommands} commands in one path or ${G.maxPathsTotalCommands} in all` : ''}${tooMany || tooLong ? '. Simplify: small icons read better with fewer parts.' : '.'}`);

  if (opts.materialBase) add('format', 'Material base', 'warn', 'Material base, redraw recommended: Material outlines are filled shapes, not ANTZ 2px strokes.');

  return done(best ? best.label : null, ink);
}

/** Short label for a level. */
export const LEVEL_LABEL: Record<Level, string> = { pass: 'Pass', info: 'Info', warn: 'Warn', fail: 'Fail' };
