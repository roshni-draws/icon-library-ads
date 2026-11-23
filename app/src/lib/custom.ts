import META from '../data/custom.json';

/**
 * Custom draft icons (zoo concepts with no Material Symbol). The SVG files in src/custom/line and src/custom/filled
 * are the source: edit them directly, or change scripts/draw-custom.mjs and run `npm run draw-custom`.
 */
const LINE = import.meta.glob('../custom/line/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const FILLED = import.meta.glob('../custom/filled/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface CustomIcon { id: string; label: string; module: string; desc: string; line: string; filled: string }

const file = (map: Record<string, string>, style: string, id: string) => map[`../custom/${style}/${id}.svg`] ?? '';

export const CUSTOM: CustomIcon[] = META.map((m) => ({ ...m, line: file(LINE, 'line', m.id), filled: file(FILLED, 'filled', m.id) }));
export const CUSTOM_BY_ID = new Map(CUSTOM.map((c) => [c.id, c]));

/** viewBox and inner markup of an svg file. */
export function parseSvg(svg: string): { viewBox: string; body: string } {
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 24 24';
  return { viewBox: vb, body: svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim() };
}
