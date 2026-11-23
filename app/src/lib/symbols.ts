import { useEffect, useState } from 'react';
import INDEX from 'virtual:symbol-index';
import PACK from 'virtual:symbol-pack';

/**
 * Material Symbols Rounded (wght 400, opsz 24, GRAD 0) as real vectors from @material-symbols/svg-400:
 * rounded/<name>.svg is the line style (FILL 0) and rounded/<name>-fill.svg the filled style (FILL 1).
 * Names the data uses are bundled; any other name (an override) is fetched once from symbols/<name>.svg.
 */
export const MATERIAL_VIEWBOX = '0 -960 960 960';
export const SYMBOL_NAMES: readonly string[] = INDEX;
const NAME_SET = new Set(INDEX);
export const isSymbol = (name: string) => NAME_SET.has(name);

export type Style = 'line' | 'filled';
export interface Glyph { viewBox: string; body: string }
type Entry = { state: 'ready'; line: string; fill: string } | { state: 'loading' } | { state: 'missing' };

const cache = new Map<string, Entry>(Object.entries(PACK).map(([n, [line, fill]]) => [n, { state: 'ready', line, fill }]));
const waiting = new Map<string, Promise<Entry>>();
const listeners = new Set<() => void>();

const inner = (svg: string) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

async function fetchText(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  const t = await r.text();
  if (!t.includes('<svg')) throw new Error('not an svg');
  return t;
}

/** Loads a symbol (from the bundle, or the network for names outside it). Resolves to the entry, never throws. */
export function loadSymbol(name: string): Promise<Entry> {
  const hit = cache.get(name);
  if (hit && hit.state !== 'loading') return Promise.resolve(hit);
  if (!isSymbol(name)) {
    cache.set(name, { state: 'missing' });
    return Promise.resolve({ state: 'missing' });
  }
  let p = waiting.get(name);
  if (!p) {
    cache.set(name, { state: 'loading' });
    p = Promise.all([fetchText(`symbols/${name}.svg`), fetchText(`symbols/${name}-fill.svg`)])
      .then(([l, f]): Entry => ({ state: 'ready', line: inner(l), fill: inner(f) }))
      .catch((): Entry => ({ state: 'missing' }))
      .then((e) => {
        cache.set(name, e);
        waiting.delete(name);
        listeners.forEach((fn) => fn());
        return e;
      });
    waiting.set(name, p);
  }
  return p;
}

/** The symbol for a name, loading it if needed. */
export function useSymbol(name: string): Entry {
  const [, tick] = useState(0);
  const entry = cache.get(name) ?? (isSymbol(name) ? { state: 'loading' as const } : { state: 'missing' as const });
  useEffect(() => {
    if (entry.state !== 'loading') return;
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    void loadSymbol(name);
    return () => { listeners.delete(fn); };
  }, [name, entry.state]);
  return entry;
}

/** A standalone 24 x 24 svg file for a Material symbol, coloured with currentColor. */
export const materialSvg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${MATERIAL_VIEWBOX}" fill="currentColor">${body}</svg>\n`;

/** Search the symbol names: prefix matches first, then substring matches. */
export function searchSymbols(q: string, limit = 60): string[] {
  const s = q.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!s) return SYMBOL_NAMES.slice(0, limit);
  const pre: string[] = [], sub: string[] = [];
  for (const n of SYMBOL_NAMES) {
    if (n.startsWith(s)) pre.push(n);
    else if (n.includes(s)) sub.push(n);
    if (pre.length >= limit) break;
  }
  return [...pre, ...sub].slice(0, limit);
}
