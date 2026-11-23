// Stroke variant: derived automatically from each (filled) spec, so one spec per icon stays the source of truth.
// See STYLE-PRIMARY.md "Stroke variant". Same tile, composition, motion and loopMs; every object is outline only,
// monochrome ink on the tile.
//
// Paint rules (per leaf):
//   shade (fill or stroke)            → removed; a leaf left with no paint is dropped
//   fill: 'fill'  (light body)        → 'tile'  : a knockout, invisible on the tile, so the outline reads as
//                                        "fill none" while objects in front still hide what is behind them
//   fill: 'fill' on accent            → 'ink'   : a light detail on a green area (bubble, axle) becomes solid ink
//   fill: 'accent' (green area)       → 'tile' knockout + a 2px ink outline (if it had no stroke)
//   stroke: 'accent'                  → 'ink', same width
//   stroke: 'fill' on accent          → 'ink'   (a light mark on green: pharmacy cross)
//   stroke: 'fill' elsewhere          → 'tile'  (a light mark on ink, e.g. a hub mark, stays a cut-out)
//   ink and tile paints               → unchanged (small solid ink parts stay solid)
//   on                                → ['tile'] for every ink paint (everything now sits on the tile)
//
// Per-spec overrides: spec.stroke = {
//   drop:  [layer ids]                remove these layers (e.g. a shine stroke that has no meaning without the fill)
//   patch: { <id>: { ...props } }     merged into that layer after the automatic rules (shapes, strokeWidth, anim…);
//                                     a null value deletes that prop (e.g. fill: null)
//   add:   [{ after: <id>, layer }]   insert an extra layer (e.g. hatch lines for an area that was fill only)
//   peaks, restAt                     if the stroke variant's most-changed frames differ
// }
const clone = (o) => JSON.parse(JSON.stringify(o));
const onList = (l, kind) => (Array.isArray(l.on) ? l.on : l.on?.[kind]) || [];

function leaf(l) {
  const out = { ...l };
  const fillOn = onList(l, 'fill'), strokeOn = onList(l, 'stroke');
  if (out.fill === 'shade') delete out.fill;
  if (out.stroke === 'shade') delete out.stroke;
  if (!out.fill && !out.stroke) return null;
  if (out.fill === 'fill') out.fill = fillOn.includes('accent') ? 'ink' : 'tile';
  else if (out.fill === 'accent') {
    out.fill = 'tile';
    if (!out.stroke) { out.stroke = 'ink'; out.strokeWidth = 2; }
  }
  if (out.stroke === 'accent') out.stroke = 'ink';
  else if (out.stroke === 'fill') out.stroke = strokeOn.includes('accent') ? 'ink' : 'tile';
  delete out.decorative;
  return setOn(out);
}

/** Every ink paint sits on the tile now (that is what the contrast lint checks). */
function setOn(out) {
  delete out.on;
  const on = {};
  if (out.fill === 'ink') on.fill = ['tile'];
  if (out.stroke === 'ink') on.stroke = ['tile'];
  if (on.fill || on.stroke) out.on = on;
  return out;
}

/** The stroke-variant spec for a filled spec. */
export function toStrokeSpec(spec) {
  const o = spec.stroke || {};
  const drop = new Set(o.drop || []);
  const walk = (l) => {
    if (drop.has(l.id)) return null;
    let n;
    if (l.children) {
      const children = l.children.map(walk).filter(Boolean);
      for (const a of o.add || []) {
        const i = children.findIndex((c) => c.id === a.after);
        if (i >= 0) children.splice(i + 1, 0, clone(a.layer));
      }
      if (!children.length) return null;
      n = { ...l, children };
    } else n = l.id === 'tile' ? { ...l } : leaf(l);
    if (n && o.patch?.[l.id]) {
      Object.assign(n, clone(o.patch[l.id]));
      for (const [k, v] of Object.entries(o.patch[l.id])) if (v === null) delete n[k]; // null deletes a prop
      if (!n.children && !('on' in o.patch[l.id])) setOn(n);
    }
    return n;
  };
  const layers = spec.layers.map(walk).filter(Boolean);
  for (const a of o.add || []) {
    const i = layers.findIndex((c) => c.id === a.after);
    if (i >= 0 && !layers.some((c) => c.id === a.layer.id)) layers.splice(i + 1, 0, clone(a.layer));
  }
  const { stroke: _s, ...rest } = spec;
  return { ...rest, variant: 'stroke', peaks: o.peaks || spec.peaks, restAt: o.restAt || spec.restAt, layers };
}

/** Paint roles used by a spec (for the "no accent, no light fill" check). */
export function rolesUsed(spec) {
  const used = new Set();
  const walk = (l) => { if (l.children) return l.children.forEach(walk); if (l.fill) used.add(l.fill); if (l.stroke) used.add(l.stroke); };
  spec.layers.forEach(walk);
  return used;
}
