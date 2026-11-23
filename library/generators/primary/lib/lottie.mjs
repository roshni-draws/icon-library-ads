// Minimal Lottie (Bodymovin 5.x) emitter: shape layers, null layers with parenting, groups, paths (SVG d →
// bezier v/i/o), rect, ellipse, solid fill and stroke, trim paths (tm), group/layer transforms with
// bezier-eased keyframes, static or moving layer masks.
import svgpath from 'svgpath';
import { ROLES, EASE, normKeys, varies, hasTrim, hexToRgb } from './model.mjs';

const r4 = (v) => +v.toFixed(4);
const st = (k) => ({ a: 0, k });

/** SVG path data → array of Lottie shape data objects ({c, v, i, o}), one per subpath. */
export function pathToBeziers(d) {
  const segs = svgpath(d).abs().unarc().unshort().segments;
  const subs = [];
  let cur = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  const push = (px, py, ix = 0, iy = 0) => { cur.v.push([px, py]); cur.i.push([ix, iy]); cur.o.push([0, 0]); };
  for (const s of segs) {
    const c = s[0];
    if (c === 'M') { cur = { c: false, v: [], i: [], o: [] }; subs.push(cur); x = sx = s[1]; y = sy = s[2]; push(x, y); continue; }
    if (c === 'L' || c === 'H' || c === 'V') {
      const nx = c === 'V' ? x : s[1];
      const ny = c === 'H' ? y : c === 'V' ? s[1] : s[2];
      push(nx, ny); x = nx; y = ny; continue;
    }
    if (c === 'C' || c === 'Q') {
      let c1x, c1y, c2x, c2y, nx, ny;
      if (c === 'C') [, c1x, c1y, c2x, c2y, nx, ny] = s;
      else {
        const [, qx, qy, ex, ey] = s;
        c1x = x + (2 / 3) * (qx - x); c1y = y + (2 / 3) * (qy - y);
        c2x = ex + (2 / 3) * (qx - ex); c2y = ey + (2 / 3) * (qy - ey);
        nx = ex; ny = ey;
      }
      cur.o[cur.o.length - 1] = [c1x - x, c1y - y];
      push(nx, ny, c2x - nx, c2y - ny); x = nx; y = ny; continue;
    }
    if (c === 'Z' || c === 'z') {
      cur.c = true;
      const n = cur.v.length;
      if (n > 1 && Math.abs(cur.v[n - 1][0] - cur.v[0][0]) < 1e-6 && Math.abs(cur.v[n - 1][1] - cur.v[0][1]) < 1e-6) {
        cur.i[0] = cur.i[n - 1];
        cur.v.pop(); cur.i.pop(); cur.o.pop();
      }
      x = sx; y = sy; continue;
    }
    throw new Error('unsupported path command ' + c);
  }
  const round = (a) => a.map((p) => [r4(p[0]), r4(p[1])]);
  return subs.map((s) => ({ c: s.c, v: round(s.v), i: round(s.i), o: round(s.o) }));
}

function shapeItems(s, nm) {
  if (s.path) return pathToBeziers(s.path).map((k, j) => ({ ty: 'sh', nm: `${nm}-p${j}`, ind: j, ks: st(k) }));
  if (s.rect) { const [x, y, w, h, rx = 0] = s.rect; return [{ ty: 'rc', nm: `${nm}-rect`, d: 1, p: st([x + w / 2, y + h / 2]), s: st([w, h]), r: st(rx) }]; }
  if (s.circle) { const [cx, cy, r] = s.circle; return [{ ty: 'el', nm: `${nm}-circle`, d: 1, p: st([cx, cy]), s: st([2 * r, 2 * r]) }]; }
  if (s.ellipse) { const [cx, cy, rx, ry] = s.ellipse; return [{ ty: 'el', nm: `${nm}-ellipse`, d: 1, p: st([cx, cy]), s: st([2 * rx, 2 * ry]) }]; }
  throw new Error('unknown shape');
}

const colour = (scheme, role) => [...hexToRgb(scheme[ROLES[role].scheme]).map(r4), 1];

/** Animated property from normalized keys. map(key) → value array. */
function animProp(keys, frames, map, dims) {
  const ex = Array(dims).fill(EASE[0]), ey = Array(dims).fill(EASE[1]);
  const ix = Array(dims).fill(EASE[2]), iy = Array(dims).fill(EASE[3]);
  return {
    a: 1,
    k: keys.map((q, j) => {
      const kf = { t: r4(q.t * frames), s: map(q) };
      if (j < keys.length - 1) { kf.o = { x: ex, y: ey }; kf.i = { x: ix, y: iy }; }
      return kf;
    }),
  };
}

/** Transform from anim keys. dim3: layer ks (3-component p/a/s) instead of a group `tr`. */
function transform(anim, frames, dim3 = false) {
  const z = dim3 ? [0] : [];
  const id = dim3
    ? { o: st(100), r: st(0), p: st([0, 0, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]) }
    : { ty: 'tr', nm: 'Transform', p: st([0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) };
  if (!anim) return id;
  const k = normKeys(anim.keys);
  const [ox, oy] = anim.origin || [24, 24];
  id.a = st([ox, oy, ...z]);
  id.p = varies(k, 'x') || varies(k, 'y')
    ? (() => {
        const p = animProp(k, frames, (q) => [r4(ox + q.x), r4(oy + q.y), ...z], 1);
        p.k.forEach((kf, j) => { if (j < p.k.length - 1) { kf.to = [0, 0, 0]; kf.ti = [0, 0, 0]; } });
        return p;
      })()
    : st([r4(ox + k[0].x), r4(oy + k[0].y), ...z]);
  id.r = varies(k, 'r') ? animProp(k, frames, (q) => [r4(q.r)], 1) : st(k[0].r);
  const sc = (q) => [r4(q.s * 100), r4(q.s * 100), ...(dim3 ? [100] : [])];
  id.s = varies(k, 's') ? animProp(k, frames, sc, dim3 ? 3 : 2) : st(sc(k[0]));
  id.o = varies(k, 'o') ? animProp(k, frames, (q) => [r4(q.o * 100)], 1) : st(k[0].o * 100);
  return id;
}

function trimItem(anim, frames) {
  const k = normKeys(anim.keys);
  const prop = (p) => (varies(k, p) ? animProp(k, frames, (q) => [r4(q[p] * 100)], 1) : st(r4(k[0][p] * 100)));
  return { ty: 'tm', nm: 'Trim', s: prop('ts'), e: prop('te'), o: st(0), m: 1 };
}

/** Shape group for a layer. ownTransform=false leaves the transform to the layer ks (clipMoves). */
function group(l, scheme, frames, ownTransform = true) {
  const it = [];
  if (l.children) {
    for (const ch of [...l.children].reverse()) it.push(group(ch, scheme, frames)); // first item = top
  } else {
    l.shapes.forEach((s, j) => it.push(...shapeItems(s, `${l.id}${j}`)));
    if (l.anim && hasTrim(normKeys(l.anim.keys))) it.push(trimItem(l.anim, frames));
    if (l.stroke) it.push({ ty: 'st', nm: 'Stroke', c: st(colour(scheme, l.stroke)), o: st(ROLES[l.stroke].opacity * 100), w: st(l.strokeWidth ?? 3), lc: 2, lj: 2, ml: 4 });
    if (l.fill) it.push({ ty: 'fl', nm: 'Fill', c: st(colour(scheme, l.fill)), o: st(ROLES[l.fill].opacity * 100), r: 1 });
  }
  it.push(transform(ownTransform ? l.anim : null, frames));
  return { ty: 'gr', nm: l.id, it, np: it.length - 1 };
}

export function toLottie(spec, scheme, schemeName) {
  const frames = Math.round((spec.loopMs / 1000) * 60);
  const base = { ddd: 0, sr: 1, ao: 0, ip: 0, op: frames, st: 0, bm: 0 };
  const idKs = transform(null, frames, true);

  // Build bottom → top, then reverse (Lottie lists the top layer first).
  const list = [];
  const shapeLayer = (l, parentId) => {
    const moves = !!(l.clipMoves && l.anim);
    const layer = { ...base, ty: 4, nm: l.id, ks: moves ? transform(l.anim, frames, true) : idKs, shapes: [group(l, scheme, frames, !moves)] };
    if (parentId) layer.parentId = parentId;
    if (l.clip) {
      const [pt] = pathToBeziers(l.clip);
      layer.hasMask = true;
      layer.masksProperties = [{ inv: false, mode: 'a', pt: st(pt), o: st(100), x: st(0), nm: `${l.id}-clip` }];
    }
    list.push(layer);
  };
  const nulls = [];
  for (const l of spec.layers) {
    if (l.layerize) {
      nulls.push({ ...base, ty: 3, nm: `${l.id}-null`, id: l.id, ks: transform(l.anim, frames, true) });
      for (const ch of l.children) shapeLayer(ch, l.id);
    } else shapeLayer(l, null);
  }
  const ordered = [...list].reverse().concat(nulls);
  const indOf = {};
  ordered.forEach((L, j) => { L.ind = j + 1; if (L.id) indOf[L.id] = L.ind; });
  const layers = ordered.map(({ id, parentId, ...L }) => (parentId ? { ...L, parent: indOf[parentId] } : L));
  return {
    v: '5.12.2', fr: 60, ip: 0, op: frames, w: 48, h: 48, nm: `antz-primary-${spec.name}-${schemeName}`, ddd: 0,
    assets: [], layers, markers: [{ tm: 0, cm: 'static', dr: 0 }],
    meta: { g: 'ANTZ Primary build.mjs', staticFrame: 0, loopMs: spec.loopMs, scheme: schemeName },
  };
}
