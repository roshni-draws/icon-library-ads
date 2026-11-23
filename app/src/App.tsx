import { useCallback, useEffect, useRef, useState } from 'react';
import { Builder, peekDraft, type BuilderRequest } from './builder/Builder';
import { LibraryPage } from './components/Library';
import { PrimaryPage } from './components/Primary';
import { Ms } from './components/Segmented';
import { Sidebar, type DraftInfo } from './components/Sidebar';
import { parseHash, toHash, type UiState } from './lib/hash';
import { useLibrary } from './lib/iconLibrary';
import { colourValue } from './lib/library';
import { usePrimary } from './lib/primary';

/**
 * Shell: a persistent sidebar (Library: Line icons, Filled icons. Icon builder: New icon, Drafts) and one page.
 * Routes live in the hash (see lib/hash.ts). Page changes push a history entry; filters replace it.
 */
export default function App() {
  const [state, setState] = useState<UiState>(() => parseHash(location.hash));
  const set = useCallback((p: Partial<UiState>) => setState((s) => ({ ...s, ...p })), []);
  const [request, setRequest] = useState<BuilderRequest | null>(() => (state.page === 'builder' && state.slot ? { kind: 'slot', name: state.slot, nonce: Date.now() } : null));
  const slotRef = useRef(state.slot);
  slotRef.current = state.slot;

  useEffect(() => {
    const next = toHash(state);
    if (location.hash !== next) history.replaceState(null, '', next);
  }, [state]);
  useEffect(() => {
    const on = () => {
      const n = parseHash(location.hash);
      if (n.page === 'builder' && n.slot && n.slot !== slotRef.current) setRequest({ kind: 'slot', name: n.slot, nonce: Date.now() });
      setState(n);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  /** Navigate (adds a history entry). */
  const go = useCallback((p: Partial<UiState>) => { location.hash = toHash({ ...state, ...p }); }, [state]);

  const { data, live, error } = useLibrary();
  const { primary } = usePrimary();
  const [navOpen, setNavOpen] = useState(false);
  const [draft, setDraft] = useState<DraftInfo>(peekDraft);

  const build = useCallback((name: string) => go({ page: 'builder', slot: name, sel: '' }), [go]);
  const newIcon = useCallback(() => { setRequest({ kind: 'new', nonce: Date.now() }); go({ page: 'builder', slot: '' }); }, [go]);
  const view = useCallback((name: string, module: string) => go({ page: 'library', style: 'line', module, status: '', q: '', sel: name, slot: '' }), [go]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [navOpen]);

  const scheme = state.scheme === 'all' ? 'light' : state.scheme;
  // Icon previews follow the 6 M3 schemes (--antz-* on data-scheme). The chrome follows the ANTZ Design System theme:
  // dark* schemes -> data-theme="dark", *-high-contrast -> data-contrast="high" (the DS has no medium contrast, so MC stays standard).
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.scheme = scheme;
    el.dataset.theme = scheme.startsWith('dark') ? 'dark' : 'light';
    el.dataset.contrast = scheme.endsWith('high-contrast') ? 'high' : 'standard';
  }, [scheme]);

  return (
    <div className="shell" style={{ ['--icon' as string]: colourValue(state.colour) }}>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Sidebar state={state} set={set} data={data} primary={primary} live={live} draft={draft} onNew={newIcon} open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && <button type="button" className="scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
      <header className="mobile-bar">
        <button type="button" className="icon-btn" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} aria-controls="side" onClick={() => setNavOpen((o) => !o)}><Ms n="menu" size={22} /></button>
        <span className="mobile-t">ANTZ Icons</span>
      </header>
      <main id="main" className={`main main-${state.page === 'primary' ? 'library' : state.page}`} tabIndex={-1}>
        {state.page === 'library'
          ? <LibraryPage data={data} primary={primary} state={state} set={set} live={live} error={error} onBuild={build} />
          : state.page === 'primary'
          ? <PrimaryPage primary={primary} lib={data} state={state} set={set} live={live} scheme={scheme} />
          : <Builder data={data} live={live} scheme={scheme} request={request} onRequestDone={() => setRequest(null)} onLink={(slot) => set({ slot })} onDraft={setDraft} onView={view} />}
      </main>
    </div>
  );
}
