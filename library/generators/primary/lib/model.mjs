// Spec model shared by the SVG and Lottie emitters (Primary v2.1: illustrative tiles with a story beat).
//
// A spec is { name, label, module, baseIcon, base: [24-grid path strings that must exist in
// library/line/<baseIcon>.svg], loopMs, peaks: [t, t], restAt: t, motion, layers }.
//
// A layer (drawn bottom → top) is either a leaf or a group:
//   leaf:  { id, shapes: [shape], fill?: role, stroke?: role, strokeWidth?: 3, anim?, clip?, clipMoves?,
//            on?: [role] | { fill?: [role], stroke?: [role] }, decorative?, particle?, animSibling? }
//   group: { id, children: [layer], anim?, clip?, layerize?, animSibling? }
// shape: { path: d } | { rect: [x, y, w, h, rx] } | { circle: [cx, cy, r] } | { ellipse: [cx, cy, rx, ry] }
// role:  see ROLES.
// anim:  { origin: [x, y], keys: [{ t: 0..1, x?, y?, r?, s?, o?, ts?, te? }] }
//        x/y translate (px), r rotate (deg), s uniform scale, o opacity, ts/te trim start/end (0..1, stroke
//        leaves only: SVG stroke-dasharray/dashoffset with pathLength=1, Lottie `tm`). Unset values carry over
//        from the previous key (identity at t=0). First key = last key (seamless) = static pose.
// clip:  a path d (static). By default the clip stays put while the layer's anim moves the content (Lab liquid
//        sloshes inside the flask). clipMoves: true moves the clip with the anim (Eggs cap lifts with its clip).
// layerize: (top-level group) Lottie emits the group's anim as a null layer and each child as its own layer
//        parented to it, so children can carry their own masks inside a moving parent (Eggs wobble).
// on:    roles this leaf's paint sits on; the build checks contrast ≥ 3:1 against each in all 6 schemes.
//        A main object's light fill is NOT linted against the tile (≈1.9:1 by design): its 3px ink outline
//        carries the silhouette, and the outline is linted against both the tile and the fill.
// particle: a short-lived bit (dust, bubbles): invisible (o = 0) at rest, may travel up to 8px.
// Accent rule (v2.1): a paint in the accent role may only sit on the light fill (inside an object), never on the
//        tile. Every accent paint must declare `on` and its list must be exactly ['fill']; it can't be decorative.
//        validate.mjs also checks it in pixels (no accent pixel within 1px of a tile pixel at any story time).

export const STYLE = 'primary-v2.1';

export const EASE = [0.45, 0, 0.55, 1];
export const EASE_CSS = 'cubic-bezier(.45,0,.55,1)';

export const SCHEME_KEYS = ['light', 'light-medium-contrast', 'light-high-contrast', 'dark', 'dark-medium-contrast', 'dark-high-contrast'];

/**
 * Colour roles. `scheme` is the flattened role key: library schemes + extendedSchemes flattened the way the app
 * does it (caution.onColorContainer → onCautionContainer). cssVar is the app's --antz-<kebab(role)>.
 */
export const ROLES = {
  tile: { scheme: 'primaryContainer', cssVar: '--antz-primary-container', opacity: 1 },
  ink: { scheme: 'onPrimaryContainer', cssVar: '--antz-on-primary-container', opacity: 1 },
  fill: { scheme: 'tertiaryFixed', cssVar: '--antz-tertiary-fixed', opacity: 1 },
  shade: { scheme: 'onPrimaryContainer', cssVar: '--antz-on-primary-container', opacity: 0.2 },
  // Brand green, on the fill only (see the accent rule above). In light MC/HC it is white, like the ink.
  accent: { scheme: 'onPrimaryFixedVariant', cssVar: '--antz-on-primary-fixed-variant', opacity: 1 },
};

export const LIMITS = {
  loopMin: 3000, loopMax: 4500, loopStep: 50,
  translate: 4, particleTranslate: 8, rotate: 12, scaleMin: 0.9, scaleMax: 1.1,
  animated: 4, storyEnd: 0.72, contrast: 3,
};

const ID = { x: 0, y: 0, r: 0, s: 1, o: 1, ts: 0, te: 1 };
export const PROPS = ['x', 'y', 'r', 's', 'o', 'ts', 'te'];

/** Fill in carried values so every key has every prop. */
export function normKeys(keys) {
  let prev = { ...ID };
  return keys.map((k) => (prev = { ...prev, ...k }));
}

export const varies = (keys, p) => keys.some((k) => k[p] !== keys[0][p]);
export const hasTrim = (k) => varies(k, 'ts') || varies(k, 'te') || k[0].ts !== 0 || k[0].te !== 1;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Library scheme flattened like the app (icon buildefr /app/src/lib/library.ts): base + extended roles. */
export function flatScheme(lib, key) {
  const out = { ...lib.schemes[key] };
  for (const [n, e] of Object.entries(lib.extendedSchemes?.[key] || {})) {
    out[n] = e.color; out[`on${cap(n)}`] = e.onColor; out[`${n}Container`] = e.colorContainer; out[`on${cap(n)}Container`] = e.onColorContainer;
  }
  return out;
}

export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) => {
  const [r, g, b] = hexToRgb(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG 2 contrast ratio of two hex colours. */
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Validate a spec against the motion rules. Returns a list of problems (empty = ok). */
export function lint(spec) {
  const errs = [];
  const L = LIMITS;
  if (spec.loopMs < L.loopMin || spec.loopMs > L.loopMax) errs.push(`loop ${spec.loopMs}ms outside ${L.loopMin}–${L.loopMax}`);
  if (spec.loopMs % L.loopStep) errs.push(`loop ${spec.loopMs}ms is not a multiple of ${L.loopStep}ms`);
  if (!Array.isArray(spec.peaks) || spec.peaks.length !== 2 || spec.peaks.some((t) => !(t > 0 && t <= L.storyEnd))) errs.push(`peaks: need two story peak times in (0, ${L.storyEnd}]`);
  if (!(spec.restAt > L.storyEnd && spec.restAt < 1)) errs.push(`restAt must fall in the rest phase (${L.storyEnd}–1)`);
  let animated = 0;
  const walk = (l, path) => {
    const tag = `${path}${l.id}`;
    if (l.anim) {
      const k = normKeys(l.anim.keys);
      if (k[0].t !== 0 || k[k.length - 1].t !== 1) errs.push(`${tag}: keys must start at t=0 and end at t=1`);
      for (const p of PROPS) if (k[0][p] !== k[k.length - 1][p]) errs.push(`${tag}: ${p} first ≠ last (not seamless)`);
      for (let i = 1; i < k.length; i++) if (k[i].t <= k[i - 1].t) errs.push(`${tag}: key times not increasing`);
      // Story beat: every change happens by storyEnd; after that the icon rests (static pose = frame 0 = end).
      for (let i = 1; i < k.length; i++) {
        const changed = PROPS.some((p) => k[i][p] !== k[i - 1][p]);
        if (changed && k[i].t > L.storyEnd + 1e-9) errs.push(`${tag}: motion until t=${k[i].t} (the story must end by ${L.storyEnd})`);
      }
      const maxT = l.particle ? L.particleTranslate : L.translate;
      if (l.particle && k[0].o !== 0) errs.push(`${tag}: a particle must be invisible (o=0) at rest`);
      for (const q of k) {
        const d = Math.hypot(q.x, q.y);
        if (d > maxT + 1e-9) errs.push(`${tag}: translate ${d.toFixed(2)}px > ${maxT}px`);
        if (Math.abs(q.r) > L.rotate) errs.push(`${tag}: rotate ${q.r}° > ${L.rotate}°`);
        if (q.s < L.scaleMin || q.s > L.scaleMax) errs.push(`${tag}: scale ${q.s} outside ${L.scaleMin}–${L.scaleMax}`);
        if (q.o < 0 || q.o > 1) errs.push(`${tag}: opacity ${q.o}`);
        if (q.ts < 0 || q.te > 1 || q.ts > q.te) errs.push(`${tag}: trim ${q.ts}–${q.te}`);
      }
      if (hasTrim(k) && (l.children || !l.stroke)) errs.push(`${tag}: trim needs a stroke leaf`);
      if (!l.animSibling) animated++;
    }
    if (l.clipMoves && !l.clip) errs.push(`${tag}: clipMoves without clip`);
    if (l.layerize && path) errs.push(`${tag}: layerize only on top-level groups`);
    (l.children || []).forEach((c) => walk(c, `${tag}/`));
  };
  spec.layers.forEach((l) => walk(l, ''));
  if (animated > L.animated) errs.push(`${animated} animated elements (max ${L.animated}; mark parts of one element with animSibling)`);
  if (spec.layers.some((l) => l.id === 'tile' && l.anim)) errs.push('the tile must not move');
  return errs;
}

/** Contrast lint: each leaf's paint against the roles it sits on (`on`), in all 6 schemes; ≥ 3:1 required. */
export function contrastLint(spec, schemes) {
  const errs = [], rows = [];
  const walk = (l) => {
    if (l.children) return l.children.forEach(walk);
    // Accent rule: accent paints sit on the fill only.
    for (const [kind, paint] of [['fill', l.fill], ['stroke', l.stroke]]) {
      if (paint !== 'accent') continue;
      const on = Array.isArray(l.on) ? l.on : l.on?.[kind];
      if (l.decorative || !on || on.length !== 1 || on[0] !== 'fill') errs.push(`${l.id}: accent ${kind} must sit on the fill only (on: ['fill']), got ${JSON.stringify(l.decorative ? 'decorative' : on ?? null)}`);
    }
    if (l.decorative || !l.on) return;
    // on: [roles] applies to every paint of the leaf; { fill: [...], stroke: [...] } targets one paint.
    const targets = Array.isArray(l.on) ? [[l.fill, l.on], [l.stroke, l.on]] : [[l.fill, l.on.fill || []], [l.stroke, l.on.stroke || []]];
    for (const [paint, unders] of targets) {
      if (!paint || ROLES[paint].opacity !== 1) continue;
      for (const under of unders) {
        const v = SCHEME_KEYS.map((s) => contrast(schemes[s][ROLES[paint].scheme], schemes[s][ROLES[under].scheme]));
        const min = Math.min(...v);
        rows.push({ icon: spec.name, layer: l.id, paint, on: under, min: +min.toFixed(2), values: v.map((x) => +x.toFixed(2)) });
        if (min < LIMITS.contrast) errs.push(`${l.id}: ${paint} on ${under} is ${min.toFixed(2)}:1 (< ${LIMITS.contrast}:1)`);
      }
    }
  };
  spec.layers.forEach(walk);
  return { errs, rows };
}
