/**
 * Small, dependency-free SVG toolkit shared by the browser and node (scripts/check-library.mjs bundles it):
 * a tolerant XML parser and serializer, path parsing to absolute commands, affine transforms, shape-to-path
 * conversion and outline sampling. Enough for 24 x 24 icons; not a general SVG engine.
 */

export interface El { tag: string; attrs: Record<string, string>; children: El[]; text?: string }

/* ---------------- XML ---------------- */
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const encode = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Parses markup into a tree. Returns the root element (the first <svg>, or a synthetic root for fragments). Throws on broken markup. */
export function parseXml(src: string): El {
  const root: El = { tag: '#root', attrs: {}, children: [] };
  const stack: El[] = [root];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    if (lt > i) {
      const t = src.slice(i, lt);
      if (t.trim()) { const top = stack[stack.length - 1]; top.text = (top.text ?? '') + decode(t); }
    }
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt); i = e < 0 ? n : e + 3; continue; }
    if (src.startsWith('<![CDATA[', lt)) {
      const e = src.indexOf(']]>', lt);
      const top = stack[stack.length - 1];
      top.text = (top.text ?? '') + src.slice(lt + 9, e < 0 ? n : e);
      i = e < 0 ? n : e + 3; continue;
    }
    if (src.startsWith('<?', lt) || src.startsWith('<!', lt)) { const e = src.indexOf('>', lt); i = e < 0 ? n : e + 1; continue; }
    if (src[lt + 1] === '/') {
      const e = src.indexOf('>', lt);
      const tag = src.slice(lt + 2, e).trim();
      // pop to the matching tag (tolerant of stray closers)
      for (let k = stack.length - 1; k > 0; k--) if (stack[k].tag === tag) { stack.length = k; break; }
      i = e + 1; continue;
    }
    // start tag
    let j = lt + 1;
    while (j < n && !/[\s/>]/.test(src[j])) j++;
    const tag = src.slice(lt + 1, j);
    if (!tag) throw new Error(`Bad markup at ${lt}`);
    const attrs: Record<string, string> = {};
    for (;;) {
      while (j < n && /\s/.test(src[j])) j++;
      if (j >= n) throw new Error(`Unclosed <${tag}>`);
      if (src[j] === '>') { j++; break; }
      if (src[j] === '/' && src[j + 1] === '>') { j += 2; break; }
      let k = j;
      while (k < n && !/[\s=/>]/.test(src[k])) k++;
      const name = src.slice(j, k);
      j = k;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === '=') {
        j++;
        while (j < n && /\s/.test(src[j])) j++;
        const q = src[j];
        if (q === '"' || q === "'") {
          const e = src.indexOf(q, j + 1);
          if (e < 0) throw new Error(`Unclosed attribute ${name}`);
          attrs[name] = decode(src.slice(j + 1, e));
          j = e + 1;
        } else {
          let e = j;
          while (e < n && !/[\s>]/.test(src[e])) e++;
          attrs[name] = decode(src.slice(j, e));
          j = e;
        }
      } else if (name) attrs[name] = '';
      if (!name) j++;
    }
    const el: El = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(el);
    const selfClosing = src[j - 2] === '/';
    if (!selfClosing) stack.push(el);
    i = j;
  }
  return root;
}

/** The <svg> element of a document, or null. */
export function svgRoot(src: string): El | null {
  const doc = parseXml(src);
  const find = (e: El): El | null => {
    if (e.tag === 'svg') return e;
    for (const c of e.children) { const f = find(c); if (f) return f; }
    return null;
  };
  return find(doc);
}

export function serialize(el: El, indent = ''): string {
  const a = Object.entries(el.attrs).map(([k, v]) => ` ${k}="${encode(v)}"`).join('');
  if (!el.children.length && !el.text) return `${indent}<${el.tag}${a}/>`;
  if (!el.children.length) return `${indent}<${el.tag}${a}>${encode(el.text ?? '')}</${el.tag}>`;
  const inner = el.children.map((c) => serialize(c, indent + '  ')).join('\n');
  return `${indent}<${el.tag}${a}>\n${inner}\n${indent}</${el.tag}>`;
}

/** Inner markup (children) of an svg document. */
export const innerOf = (svg: string) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();

/* ---------------- numbers ---------------- */
export const fmt = (v: number) => {
  const r = Math.round(v * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toString();
};
export const num = (s: string | undefined, d = 0) => {
  if (s === undefined || s === '') return d;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : d;
};

/* ---------------- paths ---------------- */
export type Seg = { c: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z'; v: number[] };

const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

function tokenize(d: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) out.push(m[1] ?? parseFloat(m[2]));
  return out;
}

/** Arc flags may be written without separators ("a1 1 0 011 1"); re-split them. */
function arcTokens(d: string): (string | number)[] {
  const raw = tokenize(d);
  if (!/[aA]/.test(d)) return raw;
  // Re-tokenize char by char around arcs for flag packing.
  const out: (string | number)[] = [];
  let i = 0;
  const s = d;
  let cmd = '';
  let argIdx = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(ch)) { out.push(ch); cmd = ch; argIdx = 0; i++; continue; }
    if (/[\s,]/.test(ch)) { i++; continue; }
    if ((cmd === 'a' || cmd === 'A') && (argIdx % 7 === 3 || argIdx % 7 === 4) && (ch === '0' || ch === '1')) {
      out.push(ch === '1' ? 1 : 0); argIdx++; i++; continue;
    }
    const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(s.slice(i));
    if (!m) { i++; continue; }
    out.push(parseFloat(m[0])); argIdx++; i += m[0].length;
  }
  return out;
}

/** Parses path data to absolute M/L/C/Q/A/Z commands. */
export function parsePath(d: string): Seg[] {
  const t = arcTokens(d);
  const segs: Seg[] = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  let lastC: [number, number] | null = null, lastQ: [number, number] | null = null;
  while (i < t.length) {
    if (typeof t[i] === 'string') { cmd = t[i] as string; i++; }
    else if (!cmd) throw new Error('Path must start with a command');
    const lc = cmd.toLowerCase();
    const rel = cmd !== cmd.toUpperCase();
    const k = ARGS[lc];
    if (lc === 'z') { segs.push({ c: 'Z', v: [] }); x = sx; y = sy; lastC = lastQ = null; if (typeof t[i] !== 'string') cmd = ''; continue; }
    const a: number[] = [];
    for (let j = 0; j < k; j++) {
      if (typeof t[i] !== 'number') throw new Error(`Path command ${cmd} is missing numbers`);
      a.push(t[i++] as number);
    }
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (lc) {
      case 'm':
        x = a[0] + ox; y = a[1] + oy; sx = x; sy = y;
        segs.push({ c: 'M', v: [x, y] });
        cmd = rel ? 'l' : 'L';
        lastC = lastQ = null;
        break;
      case 'l': x = a[0] + ox; y = a[1] + oy; segs.push({ c: 'L', v: [x, y] }); lastC = lastQ = null; break;
      case 'h': x = a[0] + (rel ? x : 0); segs.push({ c: 'L', v: [x, y] }); lastC = lastQ = null; break;
      case 'v': y = a[0] + (rel ? y : 0); segs.push({ c: 'L', v: [x, y] }); lastC = lastQ = null; break;
      case 'c': {
        const v = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
        segs.push({ c: 'C', v }); lastC = [v[2], v[3]]; lastQ = null; x = v[4]; y = v[5]; break;
      }
      case 's': {
        const c1: number[] = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const v: number[] = [c1[0], c1[1], a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        segs.push({ c: 'C', v }); lastC = [v[2], v[3]]; lastQ = null; x = v[4]; y = v[5]; break;
      }
      case 'q': {
        const v = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        segs.push({ c: 'Q', v }); lastQ = [v[0], v[1]]; lastC = null; x = v[2]; y = v[3]; break;
      }
      case 't': {
        const c1: number[] = lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y];
        const v: number[] = [c1[0], c1[1], a[0] + ox, a[1] + oy];
        segs.push({ c: 'Q', v }); lastQ = [v[0], v[1]]; lastC = null; x = v[2]; y = v[3]; break;
      }
      case 'a': {
        const v = [a[0], a[1], a[2], a[3] ? 1 : 0, a[4] ? 1 : 0, a[5] + ox, a[6] + oy];
        segs.push({ c: 'A', v }); x = v[5]; y = v[6]; lastC = lastQ = null; break;
      }
    }
  }
  return segs;
}

export function pathToString(segs: Seg[]): string {
  return segs.map((s) => {
    if (s.c === 'Z') return 'Z';
    if (s.c === 'A') { const v = s.v; return `A${fmt(v[0])} ${fmt(v[1])} ${fmt(v[2])} ${v[3]} ${v[4]} ${fmt(v[5])} ${fmt(v[6])}`; }
    return s.c + s.v.map(fmt).join(' ');
  }).join('');
}

/* ---------------- transforms ---------------- */
export type Mat = [number, number, number, number, number, number];
export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];
export const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export const apply = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
export const isIdentity = (m: Mat) => m.every((v, i) => Math.abs(v - IDENTITY[i]) < 1e-9);

export function parseTransform(s: string | undefined): Mat {
  let m: Mat = IDENTITY;
  if (!s) return m;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let r: RegExpExecArray | null;
  while ((r = re.exec(s))) {
    const a = r[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let t: Mat = IDENTITY;
    switch (r[1]) {
      case 'matrix': t = [a[0], a[1], a[2], a[3], a[4], a[5]]; break;
      case 'translate': t = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0]; break;
      case 'scale': t = [a[0], 0, 0, a[1] ?? a[0], 0, 0]; break;
      case 'rotate': {
        const rad = ((a[0] ?? 0) * Math.PI) / 180, c = Math.cos(rad), si = Math.sin(rad);
        t = [c, si, -si, c, 0, 0];
        if (a.length >= 3) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]);
        break;
      }
      case 'skewX': t = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0]; break;
      case 'skewY': t = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]; break;
    }
    m = mul(m, t);
  }
  return m;
}

/** True when the transform keeps circles circular (uniform scale, rotation, translation, mirror). */
export const isSimilarity = (m: Mat) => Math.abs(m[0] * m[0] + m[1] * m[1] - (m[2] * m[2] + m[3] * m[3])) < 1e-6 && Math.abs(m[0] * m[2] + m[1] * m[3]) < 1e-6;
export const scaleOf = (m: Mat) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

/** Applies an affine transform to absolute path segments. Arcs are exact for similarity transforms, approximate otherwise. */
export function transformPath(segs: Seg[], m: Mat): Seg[] {
  const s = scaleOf(m);
  const rot = (Math.atan2(m[1], m[0]) * 180) / Math.PI;
  const mirror = m[0] * m[3] - m[1] * m[2] < 0;
  return segs.map((g) => {
    if (g.c === 'Z') return g;
    if (g.c === 'A') {
      const [x, y] = apply(m, g.v[5], g.v[6]);
      return { c: 'A', v: [g.v[0] * s, g.v[1] * s, g.v[2] + rot, g.v[3], mirror ? 1 - g.v[4] : g.v[4], x, y] };
    }
    const v: number[] = [];
    for (let i = 0; i < g.v.length; i += 2) v.push(...apply(m, g.v[i], g.v[i + 1]));
    return { c: g.c, v };
  });
}

/* ---------------- shapes ---------------- */
export const SHAPES = ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'] as const;
export const isShape = (tag: string) => (SHAPES as readonly string[]).includes(tag);

const pts = (s: string | undefined) => (s ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);

/** Path data for any basic shape. Rect corners use arcs. */
export function shapeToPath(el: El): string {
  const a = el.attrs;
  switch (el.tag) {
    case 'path': return a.d ?? '';
    case 'line': return `M${fmt(num(a.x1))} ${fmt(num(a.y1))}L${fmt(num(a.x2))} ${fmt(num(a.y2))}`;
    case 'polyline':
    case 'polygon': {
      const p = pts(a.points);
      let d = '';
      for (let i = 0; i + 1 < p.length; i += 2) d += `${i ? 'L' : 'M'}${fmt(p[i])} ${fmt(p[i + 1])}`;
      return el.tag === 'polygon' ? d + 'Z' : d;
    }
    case 'circle':
    case 'ellipse': {
      const cx = num(a.cx), cy = num(a.cy);
      const rx = el.tag === 'circle' ? num(a.r) : num(a.rx), ry = el.tag === 'circle' ? num(a.r) : num(a.ry);
      return `M${fmt(cx - rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)}Z`;
    }
    case 'rect': {
      const x = num(a.x), y = num(a.y), w = num(a.width), h = num(a.height);
      let rx = a.rx !== undefined ? num(a.rx) : num(a.ry), ry = a.ry !== undefined ? num(a.ry) : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;
      return `M${fmt(x + rx)} ${fmt(y)}H${fmt(x + w - rx)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + w)} ${fmt(y + ry)}V${fmt(y + h - ry)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + w - rx)} ${fmt(y + h)}H${fmt(x + rx)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x)} ${fmt(y + h - ry)}V${fmt(y + ry)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + rx)} ${fmt(y)}Z`;
    }
  }
  return '';
}

/* ---------------- sampling ---------------- */
export type Pt = [number, number];
export interface Outline { pts: Pt[]; closed: boolean }

function arcCenter(x1: number, y1: number, rx: number, ry: number, phiDeg: number, fa: number, fs: number, x2: number, y2: number) {
  const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  rx = Math.abs(rx); ry = Math.abs(ry);
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num_ = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num_ / den));
  if (fa === fs) co = -co;
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  return { cx, cy, rx, ry, cos, sin, t1, dt };
}

/** Samples absolute path segments into outlines (one per subpath), about `step` px apart. */
export function sampleSegs(segs: Seg[], step = 0.25): Outline[] {
  const out: Outline[] = [];
  let cur: Outline | null = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  const push = (p: Pt) => cur!.pts.push(p);
  for (const g of segs) {
    if (g.c === 'M') {
      cur = { pts: [[g.v[0], g.v[1]]], closed: false };
      out.push(cur);
      x = sx = g.v[0]; y = sy = g.v[1];
      continue;
    }
    if (!cur) { cur = { pts: [[x, y]], closed: false }; out.push(cur); }
    if (g.c === 'Z') {
      const len = Math.hypot(sx - x, sy - y), n = Math.max(1, Math.ceil(len / step));
      for (let i = 1; i <= n; i++) push([x + ((sx - x) * i) / n, y + ((sy - y) * i) / n]);
      cur.closed = true; x = sx; y = sy;
      // a following command without M starts at the subpath start
      cur = { pts: [[x, y]], closed: false }; out.push(cur);
      continue;
    }
    if (g.c === 'L') {
      const len = Math.hypot(g.v[0] - x, g.v[1] - y), n = Math.max(1, Math.ceil(len / step));
      for (let i = 1; i <= n; i++) push([x + ((g.v[0] - x) * i) / n, y + ((g.v[1] - y) * i) / n]);
      x = g.v[0]; y = g.v[1];
    } else if (g.c === 'C' || g.c === 'Q') {
      const P = g.c === 'C' ? [x, y, ...g.v] : [x, y, ...g.v];
      const approxLen = (() => { let l = 0; for (let i = 2; i < P.length; i += 2) l += Math.hypot(P[i] - P[i - 2], P[i + 1] - P[i - 1]); return l; })();
      const n = Math.max(2, Math.ceil(approxLen / step));
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        if (g.c === 'C') push([u * u * u * P[0] + 3 * u * u * t * P[2] + 3 * u * t * t * P[4] + t * t * t * P[6], u * u * u * P[1] + 3 * u * u * t * P[3] + 3 * u * t * t * P[5] + t * t * t * P[7]]);
        else push([u * u * P[0] + 2 * u * t * P[2] + t * t * P[4], u * u * P[1] + 2 * u * t * P[3] + t * t * P[5]]);
      }
      x = P[P.length - 2]; y = P[P.length - 1];
    } else if (g.c === 'A') {
      const [rx, ry, phi, fa, fs, x2, y2] = g.v;
      if (!rx || !ry) { push([x2, y2]); x = x2; y = y2; continue; }
      const a = arcCenter(x, y, rx, ry, phi, fa, fs, x2, y2);
      const n = Math.max(2, Math.ceil((Math.abs(a.dt) * Math.max(a.rx, a.ry)) / step));
      for (let i = 1; i <= n; i++) {
        const t = a.t1 + (a.dt * i) / n;
        const ex = a.rx * Math.cos(t), ey = a.ry * Math.sin(t);
        push([a.cx + a.cos * ex - a.sin * ey, a.cy + a.sin * ex + a.cos * ey]);
      }
      x = x2; y = y2;
    }
  }
  return out.filter((o) => o.pts.length > 1);
}

export function sampleShape(el: El, m: Mat = IDENTITY, step = 0.25): Outline[] {
  const d = shapeToPath(el);
  if (!d) return [];
  let segs = parsePath(d);
  if (!isIdentity(m)) segs = transformPath(segs, m);
  return sampleSegs(segs, step);
}

/** Numbers that define a shape's geometry (for the pixel-grid check). */
export function geometryNumbers(el: El): number[] {
  const a = el.attrs;
  switch (el.tag) {
    case 'path': {
      try {
        return parsePath(a.d ?? '').flatMap((s) => (s.c === 'A' ? [s.v[5], s.v[6]] : s.v));
      } catch { return []; }
    }
    case 'circle': return [num(a.cx), num(a.cy), num(a.r)];
    case 'ellipse': return [num(a.cx), num(a.cy), num(a.rx), num(a.ry)];
    case 'rect': return [num(a.x), num(a.y), num(a.width), num(a.height)];
    case 'line': return [num(a.x1), num(a.y1), num(a.x2), num(a.y2)];
    case 'polyline': case 'polygon': return pts(a.points);
  }
  return [];
}

/** Moves a shape by dx, dy (used by the builder's move tool). */
export function translateEl(el: El, dx: number, dy: number): El {
  const a = { ...el.attrs };
  const f = (k: string, d: number) => { a[k] = fmt(num(a[k]) + d); };
  switch (el.tag) {
    case 'path': a.d = pathToString(transformPath(parsePath(a.d ?? ''), [1, 0, 0, 1, dx, dy])); break;
    case 'circle': case 'ellipse': f('cx', dx); f('cy', dy); break;
    case 'rect': f('x', dx); f('y', dy); break;
    case 'line': f('x1', dx); f('y1', dy); f('x2', dx); f('y2', dy); break;
    case 'polyline': case 'polygon': {
      const p = pts(a.points);
      a.points = p.map((v, i) => fmt(v + (i % 2 ? dy : dx))).join(' ');
      break;
    }
  }
  return { ...el, attrs: a };
}
