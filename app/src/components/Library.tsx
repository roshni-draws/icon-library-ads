import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { INV_BY_FILE, currentSrc } from '../lib/data';
import { SIZES, toHash, type LibStyle, type UiState } from '../lib/hash';
import { STATUS_LABEL, STATUSES, type LibData, type LibEntry } from '../lib/iconLibrary';
import type { PrimaryData } from '../lib/primary';
import { SCHEME_KEYS, schemeLong, schemeShort } from '../lib/library';
import { DraftGlyph, EmptySlot, LibSvg, SymbolIcon } from './Icon';
import { IconDrawer } from './IconDrawer';
import { Ms, Segmented } from './Segmented';

/** Earlier custom draft id for an entry (from the inventory mapping of its sources), if any. */
export const draftIdOf = (e: LibEntry) => {
  for (const s of e.sources) { const n = INV_BY_FILE.get(s)?.name; if (n?.startsWith('custom:')) return n.slice(7); }
  return null;
};

/** Ghost references for an undrawn icon: the old mobile SVG and the Material (or earlier draft) reference. */
export function Ghosts({ e, size }: { e: LibEntry; size: number }) {
  const d = draftIdOf(e);
  const s = Math.max(14, Math.round(size * 0.6));
  return (
    <span className="ghosts" aria-hidden="true">
      {e.sources[0] && <img src={currentSrc(e.sources[0])} alt="" width={s} height={s} loading="lazy" title={`Old SVG: ${e.sources[0]}`} />}
      {e.reference ? <span title={`Material reference: ${e.reference}`}><SymbolIcon name={e.reference} style="line" size={s} className="glyph ghost" /></span>
        : d ? <span title={`Earlier draft: ${d}`}><DraftGlyph id={d} style="line" size={s} className="glyph ghost" /></span> : null}
    </span>
  );
}

interface TileView { style: LibStyle; size: number; refs: boolean; all6: boolean }

const Tile = memo(function Tile({ e, svg, view, selected, onOpen, onBuild }: {
  e: LibEntry; svg?: string; view: TileView; selected: boolean; onOpen: (n: string) => void; onBuild: (n: string) => void;
}) {
  const art = view.all6
    ? <span className="six" aria-hidden="true">{SCHEME_KEYS.map((k) => <span key={k} className="six-tile" data-scheme={k} title={schemeShort(k)}>{svg ? <LibSvg svg={svg} size={20} /> : <EmptySlot size={20} />}</span>)}</span>
    : svg ? <LibSvg svg={svg} size={view.size} /> : <span className="todo"><EmptySlot size={view.size} />{view.refs && <Ghosts e={e} size={view.size} />}</span>;
  const state = svg ? STATUS_LABEL[e.status] : e.status === 'to_design' ? 'To design' : `No ${view.style} version yet`;
  return (
    <li className={`tile${svg ? '' : ' tile-empty'}${selected ? ' is-sel' : ''}`}>
      <button type="button" className="tile-b" data-key={e.name} aria-pressed={selected} onClick={() => onOpen(e.name)} aria-label={`${e.label}, ${state}. Show details`}>
        <span className={`tile-art${view.all6 ? ' tile-art-6' : ''}`}>{art}</span>
        <span className="tile-name">{e.label}</span>
        <code className="tile-code">{e.name}</code>
        {svg && e.status !== 'to_design' && <span className={`tile-st st-${e.status}`}>{e.status === 'approved' && <Ms n="verified" size={14} fill />}{STATUS_LABEL[e.status]}</span>}
        {!svg && e.status !== 'to_design' && <span className="tile-st st-missing">No {view.style} yet</span>}
      </button>
      {!svg && <button type="button" className="tile-build" onClick={() => onBuild(e.name)} aria-label={`Build ${e.label} in the icon builder`}><Ms n="draw" size={16} />Build</button>}
    </li>
  );
});

const norm = (s: string) => s.toLowerCase();
export function filterIcons(icons: LibEntry[], st: Pick<UiState, 'module' | 'status' | 'q'>) {
  const q = norm(st.q.trim());
  return icons.filter((e) => (!st.module || e.module === st.module) && (!st.status || e.status === st.status)
    && (!q || [e.name, e.label, e.module, e.reference ?? '', e.notes, ...e.sources, ...e.tags].some((f) => norm(f).includes(q))));
}

export function modulesOf(icons: LibEntry[]) {
  const m = new Map<string, number>();
  for (const e of icons) m.set(e.module, (m.get(e.module) ?? 0) + 1);
  return [...m].map(([name, count]) => ({ name, count }));
}

/** Arrow-key movement between tiles: left/right in reading order, up/down to the nearest tile in the next row. */
function gridKeys(e: KeyboardEvent<HTMLElement>) {
  const t = e.target as HTMLElement;
  if (!t.matches('.tile-b') || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  const all = [...e.currentTarget.querySelectorAll<HTMLElement>('.tile-b')];
  const i = all.indexOf(t);
  let next: HTMLElement | undefined;
  if (e.key === 'ArrowLeft') next = all[i - 1];
  else if (e.key === 'ArrowRight') next = all[i + 1];
  else if (e.key === 'Home') next = all[0];
  else if (e.key === 'End') next = all[all.length - 1];
  else {
    const r = t.getBoundingClientRect(), cx = r.left + r.width / 2;
    const down = e.key === 'ArrowDown';
    const rows = all.filter((x) => { const b = x.getBoundingClientRect(); return down ? b.top > r.bottom - 4 : b.bottom < r.top + 4; });
    if (rows.length) {
      const edge = down ? Math.min(...rows.map((x) => x.getBoundingClientRect().top)) : Math.max(...rows.map((x) => x.getBoundingClientRect().top));
      const row = rows.filter((x) => Math.abs(x.getBoundingClientRect().top - edge) < 4);
      next = row.reduce((a, b) => { const d = (x: HTMLElement) => { const q = x.getBoundingClientRect(); return Math.abs(q.left + q.width / 2 - cx); }; return d(b) < d(a) ? b : a; });
    }
  }
  if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest' }); }
}

export function LibraryPage({ data, primary, state, set, live, error, onBuild }: {
  data: LibData; primary: PrimaryData; state: UiState; set: (p: Partial<UiState>) => void; live: boolean; error: string; onBuild: (name: string) => void;
}) {
  const id = useId();
  const style = state.style;
  const title = style === 'line' ? 'Line icons' : 'Filled icons';

  // Search: local text, debounced into the hash.
  const [q, setQ] = useState(state.q);
  useEffect(() => setQ(state.q), [state.q]);
  useEffect(() => {
    if (q === state.q) return;
    const t = window.setTimeout(() => set({ q }), 180);
    return () => window.clearTimeout(t);
  }, [q, state.q, set]);

  const icons = data.index.icons;
  const drawn = icons.filter((e) => data.svgs[style][e.name]).length;
  const shown = useMemo(() => filterIcons(icons, state), [icons, state.module, state.status, state.q]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => modulesOf(shown).map((m) => ({ ...m, icons: shown.filter((e) => e.module === m.name) })), [shown]);
  const mods = useMemo(() => modulesOf(icons), [icons]);
  const inModule = state.module ? icons.filter((e) => e.module === state.module) : icons;
  const count = (s: string) => inModule.filter((e) => e.status === s).length;
  const view: TileView = useMemo(() => ({ style, size: state.size, refs: state.refs, all6: state.scheme === 'all' }), [style, state.size, state.refs, state.scheme]);

  const lastTile = useRef('');
  const open = useCallback((name: string) => { lastTile.current = name; set({ sel: name }); }, [set]);
  const close = useCallback(() => {
    set({ sel: '' });
    const k = lastTile.current;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`.tile-b[data-key="${CSS.escape(k)}"]`)?.focus());
  }, [set]);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented && state.sel) close(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [state.sel, close]);

  const filtered = !!(state.module || state.status || state.q);
  const stageScheme = state.scheme === 'all' ? 'light' : state.scheme;
  return (
    <div className={`lib${state.sel ? ' with-panel' : ''}`}>
      <div className="lib-main">
        <header className="page-h">
          <div className="page-t">
            <h1 id="page-h">{title}</h1>
            <p className="page-sub">{drawn} drawn, {icons.length - drawn} to design. Dashed cells are slots waiting for a {style} icon.</p>
          </div>
          <div className="lib-tools" role="search" aria-label={`Filter ${title.toLowerCase()}`}>
            <div className="search">
              <label htmlFor={`${id}-q`} className="sr-only">Search icons</label>
              <Ms n="search" size={20} />
              <input id={`${id}-q`} type="search" placeholder="Search name, label, old file" value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape' && q) { e.preventDefault(); e.stopPropagation(); setQ(''); set({ q: '' }); } }} />
            </div>
            <label className="fld fld-inline">
              <span>Module</span>
              <select value={state.module} onChange={(e) => set({ module: e.target.value, sel: '' })}>
                <option value="">All modules ({icons.length})</option>
                {mods.map((m) => <option key={m.name} value={m.name}>{m.name} ({m.count})</option>)}
              </select>
            </label>
            <Segmented<string> label="Status" value={state.status} onChange={(status) => set({ status })}
              options={[{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: <>{STATUS_LABEL[s]} <span className="seg-n">{count(s)}</span></> }))]} />
            <label className="fld fld-inline">
              <span>Size</span>
              <select value={state.size} onChange={(e) => set({ size: Number(e.target.value) })}>
                {SIZES.map((s) => <option key={s} value={s}>{s} px</option>)}
              </select>
            </label>
          </div>
          {!live && error && <p className="note">Showing the snapshot bundled at build time ({error}). Run <code>npm run dev</code> to save.</p>}
          {state.scheme === 'all' && <p className="note">Comparing all six schemes: light, light MC, light HC, dark, dark MC, dark HC.</p>}
        </header>

        <div className="stage" data-scheme={stageScheme} aria-label={`Icons, ${schemeLong(stageScheme)}`} onKeyDown={gridKeys}>
          {!shown.length ? (
            <div className="empty">
              <Ms n="search_off" size={24} />
              <p>No icons match these filters. Try a name (egg_nest), an old file (eggnest) or another module.</p>
              {filtered && <button type="button" className="btn" onClick={() => { setQ(''); set({ module: '', status: '', q: '' }); }}>Clear filters</button>}
            </div>
          ) : groups.map((g) => (
            <section className="block" key={g.name} aria-labelledby={`${id}-${g.name}`}>
              <h2 className="block-h" id={`${id}-${g.name}`}>{g.name} <span className="dim">{g.icons.filter((e) => data.svgs[style][e.name]).length} of {g.count}</span></h2>
              <ul className="tiles">{g.icons.map((e) => <Tile key={e.name} e={e} svg={data.svgs[style][e.name]} view={view} selected={state.sel === e.name} onOpen={open} onBuild={onBuild} />)}</ul>
            </section>
          ))}
        </div>
      </div>
      {state.sel && <IconDrawer name={state.sel} style={style} data={data} scheme={stageScheme} live={live} onClose={close} onBuild={onBuild}
        primary={primary} primaryHref={(n) => toHash({ ...state, page: 'primary', q: '', sel: n })} />}
    </div>
  );
}
