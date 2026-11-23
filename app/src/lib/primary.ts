import { useCallback, useEffect, useState } from 'react';
import SNAPSHOT from 'virtual:primary';
import type { SchemeKey } from './library';
import { recolourLottie } from './tile';

/**
 * Primary icons: animated "tile badge" icons for module navigation, in ../library/primary/:
 *   index.json                       { version: 1, icons: [{ name, label, module, status, baseIcon, loopMs, order, motion, svg, lottie }] }
 *   svg/<name>.svg                   self-contained animated SVG (CSS keyframes, --antz-<role> colours, reduced-motion rule)
 *   lottie/<name>.<scheme>.json      Lottie with baked colours, one per colour scheme (6 per icon)
 *   svg-stroke/<name>.svg            optional stroke variant of the SVG (same rules)
 *   lottie-stroke/<name>.<scheme>.json  optional stroke variant of the Lottie files
 * Dev reads /api/primary and reloads on "antz:library-changed"; a build shows the snapshot (virtual:primary).
 */
export type PrimaryStatus = 'draft' | 'approved';
export interface PrimaryEntry { name: string; label: string; module: string; status: string; baseIcon: string | null; loopMs: number; order: number; motion: string }
export interface PrimaryData {
  present: boolean;
  error: string;
  index: { version: number; icons: PrimaryEntry[] };
  svgs: Record<string, string>;
  /** Which of the 6 scheme files exist, per icon. */
  lottie: Record<string, Partial<Record<SchemeKey, boolean>>>;
  /** Stroke variant (svg-stroke/, lottie-stroke/); empty when the folders are missing. Optional for older snapshots. */
  svgsStroke?: Record<string, string>;
  lottieStroke?: Record<string, Partial<Record<SchemeKey, boolean>>>;
}
export type Motion = 'play' | 'pause' | 'reduced';
export type Format = 'svg' | 'lottie';
export type Variant = 'filled' | 'stroke';
export const VARIANTS: Variant[] = ['filled', 'stroke'];

/** The SVG of one variant, if present. */
export const variantSvg = (p: PrimaryData, name: string, v: Variant): string | undefined => (v === 'stroke' ? p.svgsStroke?.[name] : p.svgs[name]);
/** Which scheme files of one variant exist for an icon. */
export const variantLottie = (p: PrimaryData, name: string, v: Variant): Partial<Record<SchemeKey, boolean>> => (v === 'stroke' ? p.lottieStroke?.[name] : p.lottie[name]) ?? {};
/** Whether an icon has any file (SVG or Lottie) of the variant. */
export const hasVariant = (p: PrimaryData, name: string, v: Variant) => !!variantSvg(p, name, v) || Object.values(variantLottie(p, name, v)).some(Boolean);
/** Folder names per variant: svg/ + lottie/ or svg-stroke/ + lottie-stroke/. */
export const svgDir = (v: Variant) => (v === 'stroke' ? 'svg-stroke' : 'svg');
export const lottieDir = (v: Variant) => (v === 'stroke' ? 'lottie-stroke' : 'lottie');

export const PRIMARY_SIZES = [48, 64, 96] as const;
/** The 6 Lottie schemes, in the colour library's order. */
export const LOTTIE_SCHEMES: SchemeKey[] = ['light', 'light-medium-contrast', 'light-high-contrast', 'dark', 'dark-medium-contrast', 'dark-high-contrast'];
export const lottieUrl = (name: string, scheme: SchemeKey, v: Variant = 'filled') => `primary/${lottieDir(v)}/${name}.${scheme}.json`;
/**
 * The Lottie file to play for `scheme`: that scheme's own file, else the plain light or dark one of the same mode,
 * else the other mode. null when the icon has no Lottie at all.
 */
export function lottieScheme(p: PrimaryData, name: string, scheme: SchemeKey, v: Variant = 'filled'): SchemeKey | null {
  const has = variantLottie(p, name, v);
  const mode: SchemeKey = scheme.startsWith('dark') ? 'dark' : 'light';
  for (const k of [scheme, mode, mode === 'dark' ? 'light' : 'dark'] as SchemeKey[]) if (has[k]) return k;
  return null;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`api/primary${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) throw new Error('Saving needs the dev server: run npm run dev.');
  const j = (await r.json()) as T & { ok?: boolean; error?: string };
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
}

export const patchPrimary = (name: string, b: { status?: PrimaryStatus; label?: string; module?: string }) =>
  api<{ ok: true; entry: PrimaryEntry }>('PATCH', `/icon/${encodeURIComponent(name)}`, b);

export function usePrimary() {
  const [data, setData] = useState<PrimaryData>(SNAPSHOT as PrimaryData);
  const reload = useCallback(async () => {
    try { setData(await api<PrimaryData>('GET', '/')); } catch { /* snapshot stays */ }
  }, []);
  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    addEventListener('focus', onFocus);
    const hot = import.meta.hot;
    const onChange = (d?: { file?: string }) => { if (!d?.file || d.file.startsWith('primary')) void reload(); };
    hot?.on('antz:library-changed', onChange);
    return () => { removeEventListener('focus', onFocus); hot?.off?.('antz:library-changed', onChange); };
  }, [reload]);
  return { primary: data, reloadPrimary: reload };
}

/** Primary icon whose baseIcon is this library name, if any. */
export const primaryFor = (p: PrimaryData, base: string) => p.index.icons.find((i) => i.baseIcon === base);

/* ---------- Inlining an animated SVG ---------- */

let uid = 0;
/** Finds `@media (prefers-reduced-motion: reduce) { ... }` blocks (balanced braces). */
function reducedBlocks(css: string): { start: number; end: number; body: string }[] {
  const out: { start: number; end: number; body: string }[] = [];
  const re = /@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let depth = 1, i = m.index + m[0].length;
    for (; i < css.length && depth; i++) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; }
    out.push({ start: m.index, end: i, body: css.slice(m.index + m[0].length, i - 1) });
    re.lastIndex = i;
  }
  return out;
}
/** `.a, .b { … }` rules with every selector prefixed by `scope `. */
const scopeRules = (body: string, scope: string) =>
  body.replace(/([^{}]+)\{([^{}]*)\}/g, (_, sel: string, decl: string) => `${sel.split(',').map((x) => `${scope} ${x.trim()}`).join(', ')} {${decl}}`);

/**
 * Prepares a Primary SVG for inlining many times on one page:
 *  - ids are made unique per instance (gradients, masks, clip paths), with url(#), href="#" and #id selectors updated;
 *  - the icon's own prefers-reduced-motion rules are moved under `.prim-rm`, so the page's Motion toggle (not only the
 *    OS setting) decides when the static frame shows. Copy and download always use the original file.
 */
export function inlinePrimary(svg: string): string {
  const n = ++uid;
  const open = (/<svg\b[^>]*>/.exec(svg)?.[0] ?? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">').replace(/\s(on[a-z]+|width|height)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '');
  for (const id of new Set([...inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nid = `p${n}-${id}`;
    inner = inner.replace(new RegExp(`id="${esc}"`, 'g'), `id="${nid}"`)
      .replace(new RegExp(`url\\(\\s*['"]?#${esc}['"]?\\s*\\)`, 'g'), `url(#${nid})`)
      .replace(new RegExp(`href="#${esc}"`, 'g'), `href="#${nid}"`)
      .replace(new RegExp(`#${esc}(?![\\w-])`, 'g'), (m, off: number, all: string) => (all.lastIndexOf('<style', off) > all.lastIndexOf('</style>', off) ? `#${nid}` : m));
  }
  inner = inner.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, a: string, css: string, b: string) => {
    const blocks = reducedBlocks(css);
    if (!blocks.length) return a + css + b;
    let outCss = '', last = 0;
    for (const bl of blocks) { outCss += css.slice(last, bl.start) + scopeRules(bl.body, '.prim-rm'); last = bl.end; }
    return a + outCss + css.slice(last) + b;
  });
  return `${open}${inner}</svg>`;
}

/** Puts every CSS animation inside `el` at `ms` and holds it there (the scrubber). */
export function seekCss(el: Element, ms: number) {
  for (const a of el.getAnimations({ subtree: true })) { a.pause(); a.currentTime = ms; }
}

/* ---------- Lottie (lottie-web light build, loaded only when needed) ---------- */

type LottieModule = typeof import('lottie-web/build/player/lottie_light');
let lottieMod: Promise<LottieModule['default']> | null = null;
export const loadLottie = () => (lottieMod ??= import('lottie-web/build/player/lottie_light').then((m) => m.default));

const jsonCache = new Map<string, Promise<unknown>>();
/** Lottie JSON, fetched once per URL. lottie-web mutates animationData, so each caller gets a fresh copy. */
export async function lottieJson(url: string): Promise<unknown> {
  let p = jsonCache.get(url);
  if (!p) {
    p = fetch(url, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
    jsonCache.set(url, p);
    p.catch(() => jsonCache.delete(url));
  }
  return structuredClone(await p);
}
export const clearLottieCache = () => { jsonCache.clear(); tintCache.clear(); };

const tintCache = new Map<string, Promise<unknown>>();
/**
 * A Lottie scheme file recoloured with a tile/ink pair (see recolourLottie in tile.ts), cached per
 * icon + variant + scheme file + colours. The light file of the same variant is the role map when it exists.
 * Each caller gets a fresh copy.
 */
export async function tintedLottie(p: PrimaryData, name: string, scheme: SchemeKey, v: Variant, tile: string, ink: string): Promise<unknown> {
  const url = lottieUrl(name, scheme, v);
  const key = `${url}|${tile}|${ink}`;
  let pr = tintCache.get(key);
  if (!pr) {
    pr = (async () => {
      const [data, ref] = await Promise.all([
        lottieJson(url),
        scheme !== 'light' && variantLottie(p, name, v).light ? lottieJson(lottieUrl(name, 'light', v)).catch(() => undefined) : Promise.resolve(undefined),
      ]);
      return recolourLottie(data, scheme, tile, ink, ref);
    })();
    tintCache.set(key, pr);
    pr.catch(() => tintCache.delete(key));
  }
  return structuredClone(await pr);
}

/* ---------- Off-screen pause: one shared IntersectionObserver ---------- */

const watchers = new Map<Element, (v: boolean) => void>();
let io: IntersectionObserver | null = null;
export function observeVisible(el: Element, cb: (visible: boolean) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') { cb(true); return () => undefined; }
  io ??= new IntersectionObserver((entries) => { for (const e of entries) watchers.get(e.target)?.(e.isIntersecting); }, { rootMargin: '120px' });
  watchers.set(el, cb);
  io.observe(el);
  return () => { watchers.delete(el); io?.unobserve(el); };
}

export const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
