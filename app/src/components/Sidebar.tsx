import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { download, exportCss, exportIndex, exportPrimaryZip, exportSprite, exportZip, type ExportFile } from '../lib/exporters';
import { toHash, type SchemeSel, type UiState } from '../lib/hash';
import type { LibData } from '../lib/iconLibrary';
import type { PrimaryData } from '../lib/primary';
import { COLOUR_OPTIONS, SCHEME_KEYS, schemeLong, schemeShort } from '../lib/library';
import { Ms } from './Segmented';

export interface DraftInfo { hasWork: boolean; name: string; label: string }

const EXPORTS: { id: string; title: string; hint: string; icon: string; make: (d: LibData, say: (m: string) => void, p: PrimaryData) => ExportFile | Promise<ExportFile> }[] = [
  { id: 'zip', title: 'Library (.zip)', hint: 'line/, filled/, index.json, both sprites, CSS', icon: 'folder_zip', make: (d, say) => exportZip(d, say) },
  { id: 'prim', title: 'Primary icons (ZIP)', hint: 'svg/, lottie/<scheme>/ (6 schemes), index.json, README', icon: 'animation', make: (_d, say, p) => exportPrimaryZip(p, say) },
  { id: 'sl', title: 'antz-icons-line.svg', hint: 'Sprite: <symbol id="antz-<name>">', icon: 'stack', make: (d) => exportSprite(d, 'line') },
  { id: 'sf', title: 'antz-icons-filled.svg', hint: 'Sprite: <symbol id="antz-<name>">', icon: 'stack', make: (d) => exportSprite(d, 'filled') },
  { id: 'json', title: 'index.json', hint: 'The library index', icon: 'data_object', make: (d) => exportIndex(d) },
  { id: 'css', title: 'antz-icons.css', hint: 'Size and colour classes for the SVGs', icon: 'css', make: () => exportCss() },
];

/** Closes a popover on a pointer down outside `wrap`. */
function useOutside(open: boolean, wrap: React.RefObject<HTMLElement>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    addEventListener('pointerdown', away);
    return () => removeEventListener('pointerdown', away);
  }, [open, wrap, close]);
}

/** Export menu (menu button pattern): one item per file, built from the library. */
function ExportMenu({ data, primary }: { data: LibData; primary: PrimaryData }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (open) wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(); }, [open]);
  useOutside(open, wrap, () => setOpen(false));
  const say = (m: string, keep = false) => {
    setStatus(m);
    window.clearTimeout(timer.current);
    if (!keep) timer.current = window.setTimeout(() => setStatus(''), 5000);
  };
  const run = async (x: (typeof EXPORTS)[number]) => {
    setOpen(false);
    btn.current?.focus();
    setBusy(true);
    say(`Making ${x.title}…`, true);
    try {
      const f = await x.make(data, (m) => say(m, true), primary);
      download(f);
      say(`Downloaded ${f.name}.`);
    } catch (err) {
      say(`Could not make ${x.title}: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const onKey = (e: React.KeyboardEvent) => {
    const items = [...(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };
  return (
    <div className="pop-wrap" ref={wrap} onKeyDown={open ? onKey : undefined}>
      <button ref={btn} type="button" className="side-i" aria-haspopup="menu" aria-expanded={open} aria-controls={`${id}-m`} disabled={busy} onClick={() => setOpen((o) => !o)} title="Export the library">
        <Ms n="download" size={20} /><span className="lbl">Export</span>
      </button>
      {open && (
        <div id={`${id}-m`} className="menu menu-up" role="menu" aria-label="Export">
          {EXPORTS.map((x) => (
            <button key={x.id} type="button" role="menuitem" tabIndex={-1} onClick={() => void run(x)}>
              <Ms n={x.icon} size={20} />
              <span className="menu-t"><span>{x.title}</span><small>{x.hint}</small></span>
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {status && <p className="pop-note" aria-hidden="true">{status}</p>}
    </div>
  );
}

/** Display settings: scheme (light, dark, contrast levels), icon colour, references on empty slots. */
function Settings({ state, set }: { state: UiState; set: (p: Partial<UiState>) => void }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useOutside(open, wrap, () => setOpen(false));
  useEffect(() => { if (open) wrap.current?.querySelector<HTMLElement>('.pop select')?.focus(); }, [open]);
  return (
    <div className="pop-wrap" ref={wrap} onKeyDown={(e) => { if (open && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" className="side-i" aria-expanded={open} aria-controls={`${id}-p`} onClick={() => setOpen((o) => !o)} title="Display settings">
        <Ms n="tune" size={20} /><span className="lbl">Display</span>
      </button>
      {open && (
        <div id={`${id}-p`} className="pop pop-up" role="dialog" aria-label="Display settings">
          <label className="fld">
            <span>Scheme</span>
            <select value={state.scheme} onChange={(e) => set({ scheme: e.target.value as SchemeSel })}>
              {SCHEME_KEYS.map((k) => <option key={k} value={k} title={schemeLong(k)}>{schemeShort(k)}</option>)}
              <option value="all">Compare all 6 (library)</option>
            </select>
          </label>
          <label className="fld">
            <span>Icon colour</span>
            <select value={state.colour} onChange={(e) => set({ colour: e.target.value })}>
              {COLOUR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={state.refs} onChange={(e) => set({ refs: e.target.checked })} />Show old SVG and reference on empty slots</label>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, current, icon, children, count, title }: { href: string; current: boolean; icon: string; children: ReactNode; count?: ReactNode; title?: string }) {
  return (
    <li>
      <a className="side-i" href={href} aria-current={current ? 'page' : undefined} title={title}>
        <Ms n={icon} size={20} fill={current} /><span className="lbl">{children}</span>{count !== undefined && <span className="side-n">{count}</span>}
      </a>
    </li>
  );
}

export function Sidebar({ state, set, data, primary, live, draft, onNew, open, onClose }: {
  state: UiState; set: (p: Partial<UiState>) => void; data: LibData; primary: PrimaryData; live: boolean; draft: DraftInfo;
  onNew: () => void; open: boolean; onClose: () => void;
}) {
  const total = data.index.icons.length;
  const drawn = (s: 'line' | 'filled') => data.index.icons.filter((i) => data.svgs[s][i.name]).length;
  // Coming from the Primary page, its search and selection do not carry over (they name other icons).
  const fromPrim = state.page === 'primary' ? { q: '', sel: '' } : {};
  const lib = (style: 'line' | 'filled') => toHash({ ...state, ...fromPrim, page: 'library', style, slot: '' });
  const prim = toHash({ ...state, page: 'primary', slot: '', ...(state.page === 'primary' ? {} : { q: '', sel: '' }) });
  const nPrim = primary.index.icons.length;
  const onLib = state.page === 'library';
  return (
    <nav id="side" className={`side${open ? ' open' : ''}`} aria-label="Main" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) onClose(); }}>
      <a className="brand" href={lib('line')} title="ANTZ Icons">
        <svg className="mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M8 12h8M12 8v8" /></svg>
        <span className="lbl">ANTZ Icons</span>
      </a>

      <section className="side-g" aria-labelledby="side-lib">
        <h2 id="side-lib" className="side-h"><span className="lbl">Library</span></h2>
        <ul>
          <NavLink href={lib('line')} current={onLib && state.style === 'line'} icon="pen_size_2" count={drawn('line')} title={`Line icons: ${drawn('line')} drawn of ${total}`}>Line icons</NavLink>
          <NavLink href={lib('filled')} current={onLib && state.style === 'filled'} icon="format_color_fill" count={drawn('filled')} title={`Filled icons: ${drawn('filled')} drawn of ${total}`}>Filled icons</NavLink>
          <NavLink href={prim} current={state.page === 'primary'} icon="animation" count={nPrim} title={nPrim ? `Primary icons: ${nPrim} animated tile badges` : 'Primary icons: none yet'}>Primary icons</NavLink>
        </ul>
      </section>

      <section className="side-g" aria-labelledby="side-build">
        <h2 id="side-build" className="side-h"><span className="lbl">Icon builder</span></h2>
        <ul>
          <li>
            <button type="button" className="side-i" aria-current={state.page === 'builder' && !draft.hasWork ? 'page' : undefined} onClick={() => { onNew(); onClose(); }} title="Start a new icon">
              <Ms n="add_circle" size={20} /><span className="lbl">New icon</span>
            </button>
          </li>
          {draft.hasWork ? (
            <NavLink href={toHash({ ...state, page: 'builder', slot: '' })} current={state.page === 'builder'} icon="edit_document"
              title={`Drafts: unsaved work in this browser (${draft.label || draft.name || 'untitled icon'})`}>
              <span className="side-2">Drafts<small>{draft.label || draft.name || 'Untitled icon'}</small></span>
            </NavLink>
          ) : (
            <li className="side-empty"><Ms n="edit_document" size={20} /><span className="lbl">Drafts<small>No unsaved work</small></span></li>
          )}
        </ul>
      </section>

      <div className="side-foot">
        <span className={`live-dot${live ? ' on' : ''}`} title={live ? 'Live: reading and writing ../library through the dev server' : 'Snapshot: read only (run npm run dev to save)'}>
          <span className="lbl">{live ? 'Live library' : 'Read-only snapshot'}</span>
        </span>
        <Settings state={state} set={set} />
        <ExportMenu data={data} primary={primary} />
      </div>
    </nav>
  );
}
