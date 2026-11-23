/**
 * Build from parts: a base icon (library icon or Material Symbol) plus a badge in the bottom-right corner
 * with a 2px cut-out gap (GUARDRAILS.badgeGap). One <mask id="badge"> per style does the cut-out.
 */
import { GUARDRAILS as G } from './guardrails';
import { childrenOf, wrapSvg, type IconStyle } from './normalize';
import type { Part } from '../parts/parts';
import { parseXml, type El } from './svg';

/** Renames mask ids in a set of elements (so the base's own mask does not clash with the badge mask). */
export function prefixIds(els: El[], prefix: string): El[] {
  const map = new Map<string, string>();
  const collect = (e: El) => { if (e.attrs.id) map.set(e.attrs.id, prefix + e.attrs.id); e.children.forEach(collect); };
  els.forEach(collect);
  const fix = (e: El): El => {
    const a: Record<string, string> = {};
    for (const [k, v] of Object.entries(e.attrs)) {
      if (k === 'id' && map.has(v)) a[k] = map.get(v)!;
      else a[k] = v.replace(/url\(#([^)]+)\)/g, (m, id: string) => (map.has(id) ? `url(#${map.get(id)})` : m));
    }
    return { ...e, attrs: a, children: e.children.map(fix) };
  };
  return els.map(fix);
}

const frag = (markup: string) => parseXml(markup).children;

export function compose(baseSvg: string | null, part: Part | null, style: IconStyle): string {
  const base = baseSvg ? prefixIds(childrenOf(baseSvg), 'b-') : [];
  if (!part) return wrapSvg(style, base);
  const cut = part.ink + G.badgeGap;
  const c = { cx: String(part.cx), cy: String(part.cy) };
  if (style === 'line') {
    const mask: El = {
      tag: 'mask', attrs: { id: 'badge' }, children: [
        { tag: 'rect', attrs: { width: '24', height: '24', fill: 'white', stroke: 'none' }, children: [] },
        { tag: 'circle', attrs: { ...c, r: String(cut), fill: 'black', stroke: 'none' }, children: [] },
      ],
    };
    const g: El = { tag: 'g', attrs: { mask: 'url(#badge)' }, children: base };
    return wrapSvg('line', [mask, ...(base.length ? [g] : []), ...frag(part.line)]);
  }
  const knock = frag(part.filled.knock).map((e) => ({ ...e, attrs: { ...e.attrs, fill: 'none', stroke: 'black', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }));
  const mask: El = {
    tag: 'mask', attrs: { id: 'badge' }, children: [
      { tag: 'rect', attrs: { width: '24', height: '24', fill: 'white' }, children: [] },
      { tag: 'circle', attrs: { ...c, r: String(cut), fill: 'black' }, children: [] },
      { tag: 'circle', attrs: { ...c, r: String(part.filled.disc), fill: 'white' }, children: [] },
      ...knock,
    ],
  };
  const disc: El = { tag: 'circle', attrs: { ...c, r: String(part.filled.disc) }, children: [] };
  return wrapSvg('filled', [mask, { tag: 'g', attrs: { mask: 'url(#badge)' }, children: [...base, disc] }]);
}
