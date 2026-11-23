import { SCHEME_KEYS, type SchemeKey } from './library';
import { DEFAULT_BG, normBg } from './tile';

/**
 * UI state kept in the URL hash, as routes:
 *   #/library/line?module=Eggs&status=draft&q=egg&size=32&sel=egg_nest
 *   #/library/filled?…
 *   #/library/primary?q=egg&cols=4&fmt=lottie&pv=stroke&pgroup=1&wall=1&bg=teal&bgx=1&sel=eggs   (Primary icons: animated tile badges)
 *   #/builder?slot=egg_nest
 * App-wide display settings (scheme, colour, refs) ride along as params on any route.
 */
export type Page = 'library' | 'primary' | 'builder';
export type LibStyle = 'line' | 'filled';
export type SchemeSel = SchemeKey | 'all';
export const SIZES = [16, 20, 24, 32, 48] as const;
/** Primary icons page: how many icons per row (the old psize param is ignored). */
export const PCOLS = [3, 4, 5, 6] as const;

export interface UiState {
  page: Page; style: LibStyle; scheme: SchemeSel; size: number; colour: string;
  module: string; status: string; q: string; sel: string; refs: boolean; slot: string;
  /** Primary icons page: icons per row, format, group by module, and the label-free wall view. */
  cols: number; fmt: 'svg' | 'lottie'; pgroup: boolean; wall: boolean;
  /** Primary icons page: the Filled (default, left out of the URL) or Stroke variant, as `pv=stroke`. */
  pv: 'filled' | 'stroke';
  /** Primary icons page: tile colour, a preset id or #RRGGBB (`bg=teal`, `bg=%23AABBCC`; green is left out). */
  bg: string;
  /** Primary icons page: exports use the tile colour choice (`bgx=1`) instead of the theme default. */
  bgx: boolean;
}
export const DEFAULT_STATE: UiState = { page: 'library', style: 'line', scheme: 'light', size: 24, colour: 'teal', module: '', status: '', q: '', sel: '', refs: true, slot: '', cols: 4, fmt: 'svg', pgroup: false, wall: false, pv: 'filled', bg: DEFAULT_BG, bgx: false };

export function parseHash(hash: string): UiState {
  const raw = hash.replace(/^#/, '');
  const [path, query = ''] = raw.split('?');
  const p = new URLSearchParams(query);
  const s = { ...DEFAULT_STATE };
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'builder') s.page = 'builder';
  if (parts[0] === 'library' && parts[1] === 'filled') s.style = 'filled';
  if (parts[0] === 'library' && parts[1] === 'primary') s.page = 'primary';

  const sc = p.get('scheme');
  if (sc && (sc === 'all' || (SCHEME_KEYS as string[]).includes(sc))) s.scheme = sc as SchemeSel;
  const sz = Number(p.get('size'));
  if ((SIZES as readonly number[]).includes(sz)) s.size = sz;
  s.colour = p.get('colour') || DEFAULT_STATE.colour;
  s.refs = p.get('refs') !== '0';
  if (s.page === 'primary') {
    s.q = p.get('q') ?? '';
    s.sel = p.get('sel') ?? '';
    const cols = Number(p.get('cols'));
    if ((PCOLS as readonly number[]).includes(cols)) s.cols = cols;
    if (p.get('fmt') === 'lottie') s.fmt = 'lottie';
    if (p.get('pv') === 'stroke') s.pv = 'stroke';
    s.pgroup = p.get('pgroup') === '1';
    s.wall = p.get('wall') === '1';
    s.bg = normBg(p.get('bg'));
    s.bgx = p.get('bgx') === '1';
  } else if (s.page === 'library') {
    s.module = p.get('module') ?? '';
    const status = p.get('status') ?? '';
    s.status = ['to_design', 'draft', 'approved'].includes(status) ? status : '';
    s.q = p.get('q') ?? '';
    s.sel = p.get('sel') ?? '';
  } else {
    const slot = p.get('slot') ?? '';
    s.slot = /^[a-z0-9_]+$/.test(slot) ? slot : '';
  }
  return s;
}

export function toHash(s: UiState): string {
  const p = new URLSearchParams();
  const put = (k: keyof UiState) => {
    if (s[k] === DEFAULT_STATE[k]) return;
    p.set(k, typeof s[k] === 'boolean' ? (s[k] ? '1' : '0') : String(s[k]));
  };
  if (s.page === 'library') (['module', 'status', 'q', 'sel', 'size'] as const).forEach(put);
  else if (s.page === 'primary') (['q', 'sel', 'cols', 'pv', 'fmt', 'pgroup', 'wall', 'bg', 'bgx'] as const).forEach(put);
  else put('slot');
  (['scheme', 'colour', 'refs'] as const).forEach(put);
  const q = p.toString();
  return (s.page === 'library' ? `#/library/${s.style}` : s.page === 'primary' ? '#/library/primary' : '#/builder') + (q ? `?${q}` : '');
}

