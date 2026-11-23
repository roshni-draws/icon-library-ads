/**
 * Turns an uploaded or pasted SVG into the canonical ANTZ Rounded format (see library/STYLE.md):
 *  - viewBox scaled to 0 0 24 24 (any viewBox, Material's 0 -960 960 960 included), width/height 24
 *  - transforms (on shapes, groups and the viewBox) baked into the geometry; groups flattened
 *  - colours replaced with currentColor (masks keep white/black), opacity dropped
 *  - ids, classes, style attributes, metadata, <title>, <desc>, editor namespaces stripped (mask ids are renamed and kept)
 *  - numbers rounded to 3 decimals
 *  - the <svg> gets the root attributes for the style (line: stroke 2, round caps/joins; filled: fill currentColor)
 */
import { GUARDRAILS as G } from './guardrails';
import {
  fmt, isIdentity, isShape, mul, num, parsePath, parseTransform, pathToString, scaleOf, serialize, shapeToPath, svgRoot, transformPath, type El, type Mat,
} from './svg';

export type IconStyle = 'line' | 'filled';

export const ROOT_ATTRS: Record<IconStyle, Record<string, string>> = {
  line: { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': String(G.strokeWidth), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  filled: { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'currentColor' },
};

/** Full SVG document for a style from its children. */
export function wrapSvg(style: IconStyle, children: El[]): string {
  return serialize({ tag: 'svg', attrs: { ...ROOT_ATTRS[style] }, children }) + '\n';
}

/** Children of an svg document (throws on markup that cannot be parsed). */
export function childrenOf(svg: string): El[] {
  const r = svgRoot(svg);
  if (!r) throw new Error('No <svg> element found');
  return r.children;
}

const PRESENT = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'mask'];
const DROP_TAGS = new Set(['title', 'desc', 'metadata', 'style', 'script', 'sodipodi:namedview', 'clipPath', 'linearGradient', 'radialGradient', 'pattern', 'filter', 'symbol', 'marker', 'text', 'image', 'foreignObject']);

function styleAttrs(el: El): Record<string, string> {
  const a = { ...el.attrs };
  if (a.style) {
    for (const decl of a.style.split(';')) {
      const [k, ...v] = decl.split(':');
      if (k && v.length) a[k.trim()] = v.join(':').trim();
    }
    delete a.style;
  }
  return a;
}

const isLight = (c: string) => {
  const s = c.trim().toLowerCase();
  if (s === 'white') return true;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((x) => x + x).join('') : hex[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b > 127;
  }
  return false;
};

export interface Normalized { svg: string; children: El[]; notes: string[] }

export function normalizeSvg(src: string, style: IconStyle): Normalized {
  const root = svgRoot(src);
  if (!root) throw new Error('No <svg> element found');
  const notes = new Set<string>();
  const ra = styleAttrs(root);

  // viewBox -> 24
  let vb = (ra.viewBox ?? '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((v) => !Number.isFinite(v)) || !vb[2] || !vb[3]) {
    const w = num(ra.width, 24), h = num(ra.height, 24);
    vb = [0, 0, w, h];
    if (!ra.viewBox) notes.add('No viewBox: used width and height.');
  }
  const s = G.canvas / Math.max(vb[2], vb[3]);
  const base: Mat = [s, 0, 0, s, -vb[0] * s + (G.canvas - vb[2] * s) / 2, -vb[1] * s + (G.canvas - vb[3] * s) / 2];
  if (!isIdentity(base)) notes.add(`Scaled viewBox ${vb.map(fmt).join(' ')} to 0 0 24 24.`);
  const rootMat = mul(base, parseTransform(ra.transform));

  // Mask ids: renamed to cut, cut2, ...
  const maskIds = new Map<string, string>();
  const findMasks = (e: El) => { for (const c of e.children) { if (c.tag === 'mask' && c.attrs.id) maskIds.set(c.attrs.id, maskIds.size ? `cut${maskIds.size + 1}` : 'cut'); findMasks(c); } };
  findMasks(root);
  const maskRef = (v: string | undefined) => {
    const m = v && /url\(\s*#([^)]+)\)/.exec(v);
    return m && maskIds.has(m[1]) ? `url(#${maskIds.get(m[1])})` : undefined;
  };

  let colours = 0, transforms = 0, groups = 0, dropped = 0;
  const colour = (v: string | undefined, inMask: boolean): string | undefined => {
    if (v === undefined) return undefined;
    const t = v.trim();
    if (t === 'none' || t === 'currentColor' || t === 'inherit') return t === 'inherit' ? undefined : t;
    if (inMask) return isLight(t) ? 'white' : 'black';
    if (/^url\(/.test(t)) { notes.add('Gradient/pattern paint replaced with currentColor.'); }
    colours++;
    return 'currentColor';
  };

  const geom = (el: El, a: Record<string, string>, m: Mat): El | null => {
    const sim = Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9 && Math.abs(m[0] - m[3]) < 1e-9 && m[0] > 0;
    const out: Record<string, string> = {};
    if (isIdentity(m) || (sim && el.tag !== 'path')) {
      const k = m[0], tx = m[4], ty = m[5];
      const X = (v: string | undefined) => fmt(num(v) * k + tx), Y = (v: string | undefined) => fmt(num(v) * k + ty), S = (v: string | undefined) => fmt(num(v) * k);
      switch (el.tag) {
        case 'circle': out.cx = X(a.cx); out.cy = Y(a.cy); out.r = S(a.r); break;
        case 'ellipse': out.cx = X(a.cx); out.cy = Y(a.cy); out.rx = S(a.rx); out.ry = S(a.ry); break;
        case 'rect': out.x = X(a.x); out.y = Y(a.y); out.width = S(a.width); out.height = S(a.height); if (a.rx) out.rx = S(a.rx); if (a.ry && a.ry !== a.rx) out.ry = S(a.ry); break;
        case 'line': out.x1 = X(a.x1); out.y1 = Y(a.y1); out.x2 = X(a.x2); out.y2 = Y(a.y2); break;
        case 'polyline': case 'polygon': out.points = (a.points ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number).map((v, i) => (i % 2 ? Y(String(v)) : X(String(v)))).join(' '); break;
        case 'path': out.d = pathToString(parsePath(a.d ?? '')); break;
      }
      return { tag: el.tag, attrs: out, children: [] };
    }
    try {
      const d = pathToString(transformPath(parsePath(shapeToPath({ ...el, attrs: a })), m));
      return { tag: 'path', attrs: { d }, children: [] };
    } catch {
      dropped++;
      return null;
    }
  };

  const walk = (el: El, m: Mat, inherited: Record<string, string>, inMask: boolean): El[] => {
    const out: El[] = [];
    for (const c of el.children) {
      if (DROP_TAGS.has(c.tag) || c.tag.includes(':')) { if (!['title', 'desc', 'metadata', 'style'].includes(c.tag) && !c.tag.includes(':')) dropped++; continue; }
      const a = styleAttrs(c);
      if (a.transform) transforms++;
      const cm = mul(m, parseTransform(a.transform));
      const inh = { ...inherited };
      for (const k of PRESENT) if (a[k] !== undefined) inh[k] = a[k];
      if (a.opacity !== undefined || a['fill-opacity'] !== undefined || a['stroke-opacity'] !== undefined) notes.add('Opacity dropped (icons are one solid colour).');
      if (c.tag === 'defs') { out.push(...walk(c, cm, inherited, inMask)); continue; }
      if (c.tag === 'mask') {
        const id = maskIds.get(a.id ?? '');
        if (!id) continue;
        out.push({ tag: 'mask', attrs: { id }, children: walk(c, cm, {}, true) });
        continue;
      }
      if (c.tag === 'g' || c.tag === 'a' || c.tag === 'svg') { groups++; out.push(...walk(c, cm, inh, inMask)); continue; }
      if (c.tag === 'use') { dropped++; continue; }
      if (!isShape(c.tag)) { dropped++; continue; }
      const g = geom(c, a, cm);
      if (!g) continue;
      const k = scaleOf(cm);
      const fill = colour(inh.fill, inMask), stroke = colour(inh.stroke, inMask);
      if (inMask) {
        g.attrs.fill = fill ?? 'black';
        g.attrs.stroke = stroke ?? 'none';
      } else {
        if (fill !== undefined) g.attrs.fill = fill;
        if (stroke !== undefined) g.attrs.stroke = stroke;
      }
      if (inh['stroke-width'] !== undefined) g.attrs['stroke-width'] = fmt(num(inh['stroke-width'], 1) * k);
      else if (stroke && stroke !== 'none' && !isIdentity(cm) && Math.abs(k - 1) > 1e-6) g.attrs['stroke-width'] = fmt(1 * k);
      for (const p of ['stroke-linecap', 'stroke-linejoin', 'fill-rule']) if (inh[p] !== undefined) g.attrs[p] = inh[p];
      if (inh['clip-rule'] !== undefined && !inh['fill-rule']) g.attrs['fill-rule'] = inh['clip-rule'];
      const mr = maskRef(inh.mask);
      if (mr && !inMask) g.attrs.mask = mr;
      out.push(g);
    }
    return out;
  };

  // The root's own presentation attributes are inherited by everything.
  const rootInh: Record<string, string> = {};
  for (const k of PRESENT) if (ra[k] !== undefined) rootInh[k] = ra[k];
  let kids = walk(root, rootMat, rootInh, false);

  // Simplify against the canonical root attributes for this style.
  const defaults = ROOT_ATTRS[style];
  kids = kids.map((e) => {
    if (e.tag === 'mask') return e;
    const a = { ...e.attrs };
    if (style === 'line') {
      // Shapes with no stroke but a fill are filled outlines (Material, traced art): keep them visible.
      if ((a.stroke === undefined || a.stroke === 'none') && a.fill !== 'none') { a.fill = 'currentColor'; a.stroke = 'none'; }
    }
    for (const k of Object.keys(defaults)) if (a[k] === defaults[k] && !['width', 'height', 'viewBox', 'xmlns'].includes(k)) delete a[k];
    if (style === 'filled' && a.stroke === 'none') delete a.stroke;
    return { ...e, attrs: a };
  });
  if (colours) notes.add(`${colours} colour${colours > 1 ? 's' : ''} replaced with currentColor.`);
  if (transforms) notes.add(`${transforms} transform${transforms > 1 ? 's' : ''} baked into the shapes.`);
  if (groups) notes.add(`${groups} group${groups > 1 ? 's' : ''} flattened.`);
  if (dropped) notes.add(`${dropped} unsupported element${dropped > 1 ? 's' : ''} removed (text, images, <use>, gradients…).`);
  return { svg: wrapSvg(style, kids), children: kids, notes: [...notes] };
}

