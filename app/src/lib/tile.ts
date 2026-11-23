import type { CSSProperties } from 'react';
import { ALL_ROLES, COLORS, varName, type SchemeKey } from './library';

/**
 * Tile colour for Primary icons. The Primary art paints four roles (library/primary/STYLE-PRIMARY.md §2):
 *   tile   primaryContainer       --antz-primary-container
 *   ink    onPrimaryContainer     --antz-on-primary-container   (outline, small solid parts, the 20% shade)
 *   fill   tertiaryFixed          --antz-tertiary-fixed         (light fill of the main objects, Filled only)
 *   accent onPrimaryFixedVariant  --antz-on-primary-fixed-variant (brand green, on the fill only)
 * A tile choice swaps the tile and ink pair; the fill and the accent keep the scheme's roles.
 * Presets are container / on-container role pairs, read from the current scheme, so they work in all 6 schemes.
 */
export const ROLE = { tile: 'primaryContainer', ink: 'onPrimaryContainer', fill: 'tertiaryFixed', accent: 'onPrimaryFixedVariant' } as const;

export interface TilePreset { id: string; label: string; tile: string; ink: string; hint: string }
const ALL_PRESETS: TilePreset[] = [
  { id: 'green', label: 'Green', tile: 'primaryContainer', ink: 'onPrimaryContainer', hint: 'The module colour (default)' },
  { id: 'teal', label: 'Teal', tile: 'secondaryContainer', ink: 'onSecondaryContainer', hint: 'Secondary container' },
  { id: 'navy', label: 'Navy', tile: 'tertiaryContainer', ink: 'onTertiaryContainer', hint: 'Tertiary container' },
  { id: 'amber', label: 'Amber', tile: 'cautionContainer', ink: 'onCautionContainer', hint: 'Caution container' },
  { id: 'coral', label: 'Coral', tile: 'warningContainer', ink: 'onWarningContainer', hint: 'Warning container' },
  { id: 'sky', label: 'Sky', tile: 'infoContainer', ink: 'onInfoContainer', hint: 'Info container' },
  { id: 'neutral', label: 'Neutral', tile: 'surfaceContainerHighest', ink: 'onSurface', hint: 'Highest surface container' },
  { id: 'white', label: 'White', tile: 'surface', ink: 'onSurface', hint: 'Surface' },
  { id: 'brand', label: 'Brand solid', tile: 'primary', ink: 'onPrimary', hint: 'Primary: an inverted, high-impact tile' },
];
/** Presets whose two roles exist in the colour library (all 9 today). */
export const TILE_PRESETS = ALL_PRESETS.filter((p) => ALL_ROLES.includes(p.tile) && ALL_ROLES.includes(p.ink));
export const DEFAULT_BG = 'green';

/** DS text colour (--ink-900) and white: the two inks a custom tile can get. */
export const DS_DARK = '#0E1512';
export const DS_LIGHT = '#FFFFFF';

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
/** A valid `bg` hash value: a preset id or #RRGGBB. */
export const normBg = (s: string | null | undefined): string => {
  if (!s) return DEFAULT_BG;
  if (/^[0-9a-f]{6}$/i.test(s)) s = `#${s}`;
  if (isHex(s)) return s.toUpperCase();
  return TILE_PRESETS.some((p) => p.id === s) ? s : DEFAULT_BG;
};

/* ---------- Contrast (WCAG 2) ---------- */
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin(((n >> 16) & 255) / 255) + 0.7152 * lin(((n >> 8) & 255) / 255) + 0.0722 * lin((n & 255) / 255);
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const fmtRatio = (r: number) => `${(Math.floor(r * 100) / 100).toFixed(2)}:1`;
/** Ink for a custom tile: DS near-black or white, whichever contrasts more. */
export const autoInk = (tile: string) => (contrast(tile, DS_DARK) >= contrast(tile, DS_LIGHT) ? DS_DARK : DS_LIGHT);

/* ---------- Resolving a choice in a scheme ---------- */
export interface TileChoice {
  /** The hash value: preset id or #RRGGBB. */
  bg: string;
  label: string;
  /** Roles of a preset; null for a custom colour. */
  tileRole: string | null;
  inkRole: string | null;
  tile: string;
  ink: string;
  isDefault: boolean;
}
export function resolveBg(bg: string, scheme: SchemeKey): TileChoice {
  const b = normBg(bg);
  const p = TILE_PRESETS.find((x) => x.id === b);
  if (p) return { bg: b, label: p.label, tileRole: p.tile, inkRole: p.ink, tile: COLORS[scheme][p.tile].toUpperCase(), ink: COLORS[scheme][p.ink].toUpperCase(), isDefault: b === DEFAULT_BG };
  return { bg: b, label: `Custom ${b}`, tileRole: null, inkRole: null, tile: b, ink: autoInk(b), isDefault: false };
}

export interface TileContrast { inkTile: number; fillTile: number; inkFill: number; accentFill: number; low: boolean; lowFill: boolean }
/** Ink vs tile (≥ 3:1 required: `low`); fill vs tile, and ink vs fill (`lowFill`, Filled only: details drawn on the fill). */
export function tileContrast(c: TileChoice, scheme: SchemeKey): TileContrast {
  const fill = COLORS[scheme][ROLE.fill];
  const accent = COLORS[scheme][ROLE.accent];
  const inkTile = contrast(c.ink, c.tile);
  return { inkTile, fillTile: contrast(fill, c.tile), inkFill: contrast(c.ink, fill), accentFill: contrast(accent, fill), low: inkTile < 3, lowFill: contrast(c.ink, fill) < 3 };
}

/** CSS variables for a preview container: the tile and ink roles, recoloured. Empty for the default. */
export function tileVars(c: TileChoice): CSSProperties | undefined {
  if (c.isDefault) return undefined;
  return { [varName(ROLE.tile)]: c.tile, [varName(ROLE.ink)]: c.ink } as CSSProperties;
}

/* ---------- SVG export: bake the choice in ---------- */
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * Bakes a tile choice into a Primary SVG, so it shows right as an <img> and when inlined:
 *  - tile/ink class rules: a preset points at its own roles (`var(--antz-secondary-container, #hex)`), so a themed page
 *    still follows the scheme; a custom colour becomes a plain hex;
 *  - fill/accent class rules keep their roles, with the current scheme's hex as the fallback;
 *  - fill/stroke attributes (the light-scheme fallbacks) get the hex values of `scheme`.
 */
export function bakeSvg(svg: string, c: TileChoice, scheme: SchemeKey): string {
  const L = COLORS.light, S = COLORS[scheme];
  const to: Record<string, { rule: string; hex: string }> = {
    [ROLE.tile]: { rule: c.tileRole ? `var(${varName(c.tileRole)},${c.tile})` : c.tile, hex: c.tile },
    [ROLE.ink]: { rule: c.inkRole ? `var(${varName(c.inkRole)},${c.ink})` : c.ink, hex: c.ink },
    [ROLE.fill]: { rule: `var(${varName(ROLE.fill)},${S[ROLE.fill]})`, hex: S[ROLE.fill] },
    [ROLE.accent]: { rule: `var(${varName(ROLE.accent)},${S[ROLE.accent]})`, hex: S[ROLE.accent] },
  };
  let out = svg;
  const byHex: Record<string, string> = {};
  for (const [role, t] of Object.entries(to)) {
    out = out.replace(new RegExp(`var\\(\\s*${reEsc(varName(role))}\\s*,\\s*#[0-9a-fA-F]{3,8}\\s*\\)`, 'g'), t.rule);
    byHex[L[role].toUpperCase()] = t.hex;
  }
  out = out.replace(/\b(fill|stroke|stop-color|color)="(#[0-9a-fA-F]{6})"/g, (m, a: string, h: string) => (byHex[h.toUpperCase()] ? `${a}="${byHex[h.toUpperCase()]}"` : m));
  const note = `<!-- Tile colour: ${c.label}${c.tileRole ? ` (${c.tileRole} / ${c.inkRole})` : ''}, tile ${c.tile}, ink ${c.ink}, values from the ${scheme} scheme. Generated by ANTZ Icon Builder. -->`;
  return out.replace(/(<svg\b[^>]*>)/, `$1\n${note}`);
}

/* ---------- Lottie recolouring ---------- */
type Paint = { c: { a?: number; k: unknown } };
/** Every colour array of every fill/stroke paint, in document order (static `k` or each keyframe's `s`/`e`). */
function paintColours(root: unknown): number[][] {
  const out: number[][] = [];
  const walk = (o: unknown) => {
    if (Array.isArray(o)) { for (const v of o) walk(v); return; }
    if (!o || typeof o !== 'object') return;
    const r = o as Record<string, unknown>;
    if ((r.ty === 'fl' || r.ty === 'st') && r.c && typeof r.c === 'object') {
      const c = (r as unknown as Paint).c;
      if (c.a && Array.isArray(c.k)) {
        for (const kf of c.k as Record<string, unknown>[]) { if (Array.isArray(kf.s)) out.push(kf.s as number[]); if (Array.isArray(kf.e)) out.push(kf.e as number[]); }
      } else if (Array.isArray(c.k) && typeof c.k[0] === 'number') out.push(c.k as number[]);
    }
    for (const v of Object.values(r)) if (v && typeof v === 'object') walk(v);
  };
  walk(root);
  return out;
}
const toHex = (c: number[]) => '#' + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const toRgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => Math.round(v * 10000) / 10000); };

/**
 * Recolours a Primary Lottie (in place): the tile paints get `tile`, the ink paints `ink`; fill and accent stay.
 * Shape names are generic ("Fill", "Stroke"), so roles are found by exact colour. In light MC/HC the accent and the ink
 * are both white, so when `ref` (the light file of the same icon and variant, same structure) is given, each paint's
 * role is read from the light file's colour at the same position instead. Without it, the scheme's own colours decide
 * (tile first, then ink).
 */
export function recolourLottie(data: unknown, fileScheme: SchemeKey, tile: string, ink: string, ref?: unknown): unknown {
  const target = paintColours(data);
  const refCols = ref ? paintColours(ref) : null;
  const useRef = !!refCols && refCols.length === target.length;
  const roles = useRef ? COLORS.light : COLORS[fileScheme];
  const tileHex = roles[ROLE.tile].toUpperCase(), inkHex = roles[ROLE.ink].toUpperCase();
  const nt = toRgb(tile), ni = toRgb(ink);
  target.forEach((c, i) => {
    const h = toHex(useRef ? refCols![i] : c);
    const to = h === tileHex ? nt : h === inkHex ? ni : null;
    if (to) { c[0] = to[0]; c[1] = to[1]; c[2] = to[2]; }
  });
  return data;
}

/** The tile and ink of a choice in one Lottie scheme file: a preset reads that scheme's roles, a custom colour stays. */
export const pairFor = (bg: string, scheme: SchemeKey) => { const c = resolveBg(bg, scheme); return { tile: c.tile, ink: c.ink }; };
