import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { download, exportPrimaryLottieZip } from '../lib/exporters';
import { PCOLS, type UiState } from '../lib/hash';
import type { LibData } from '../lib/iconLibrary';
import { schemeLong, schemeShort, type SchemeKey } from '../lib/library';
import {
  inlinePrimary, loadLottie, LOTTIE_SCHEMES, lottieJson, lottieScheme, lottieUrl, observeVisible, patchPrimary, prefersReducedMotion, seekCss,
  type Format, type Motion, type PrimaryData, type PrimaryEntry, type PrimaryStatus,
} from '../lib/primary';
import { LibSvg } from './Icon';
import { Ms, Segmented } from './Segmented';

type LottieAnim = { totalFrames: number; frameRate: number; play(): void; pause(): void; goToAndStop(v: number, isFrame?: boolean): void; resize(): void; destroy(): void; addEventListener(n: string, f: () => void): void };

/**
 * Whether the element is on screen, or within 120px of it (one shared IntersectionObserver).
 * `initial` is the value before the first observation: true for SVG (pause only), false for Lottie (create lazily).
 */
function useVisible(ref: React.RefObject<Element>, initial = true) {
  const [visible, setVisible] = useState(initial);
  useEffect(() => (ref.current ? observeVisible(ref.current, setVisible) : undefined), [ref]);
  return visible;
}

/**
 * Animated SVG, inlined so the --antz-* roles of the current scheme apply.
 * motion: play, pause (animation-play-state) or reduced (the icon's own reduced-motion rules, under .prim-rm).
 * seek (0–1): holds every animation at that point of the loop (Web Animations API), for the scrubber.
 */
export const SvgArt = memo(function SvgArt({ svg, size, motion, seek = null, loopMs, title }: {
  svg: string; size: number | string; motion: Motion; seek?: number | null; loopMs: number; title?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useVisible(ref);
  const html = useMemo(() => inlinePrimary(svg), [svg]);
  // Leaving the scrubber remounts the markup so the CSS animations start fresh (pause() via WAAPI sticks otherwise).
  const [nonce, setNonce] = useState(0);
  const wasSeeking = useRef(false);
  useLayoutEffect(() => {
    if (seek !== null && ref.current) { seekCss(ref.current, seek * (loopMs || 1000)); wasSeeking.current = true; }
    else if (wasSeeking.current) { wasSeeking.current = false; setNonce((n) => n + 1); }
  }, [seek, loopMs, html]);
  const cls = ['prim-art', motion === 'reduced' && seek === null ? 'prim-rm' : '', (motion === 'pause' || !visible) && seek === null ? 'is-paused' : ''].filter(Boolean).join(' ');
  return (
    <span ref={ref} className={cls} style={{ width: size, height: size }} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <span key={nonce} className="prim-svg" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  );
});

/**
 * Lottie (lottie-web light build, lazy-loaded): the file for `scheme` (lottie/<name>.<scheme>.json).
 * The player is created only while the element is on screen (or within 120px) and destroyed when it leaves, so a
 * page of 30 icons keeps only the visible players alive. Reduced shows frame 0; seek (0–1) holds a frame for the scrubber.
 */
export function LottieArt({ name, scheme, size, motion, seek = null, title, onInfo }: {
  name: string; scheme: SchemeKey; size: number | string; motion: Motion; seek?: number | null; title?: string;
  onInfo?: (i: { frames: number; fps: number }) => void;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const anim = useRef<LottieAnim | null>(null);
  const [ready, setReady] = useState(0);
  const [err, setErr] = useState('');
  const visible = useVisible(wrap, false);
  const info = useRef(onInfo);
  info.current = onInfo;
  const url = lottieUrl(name, scheme);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    setErr('');
    void (async () => {
      try {
        const [lottie, data] = await Promise.all([loadLottie(), lottieJson(url)]);
        if (dead || !box.current) return;
        const a = lottie.loadAnimation({ container: box.current, renderer: 'svg', loop: true, autoplay: false, animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } }) as unknown as LottieAnim;
        anim.current = a;
        a.addEventListener('DOMLoaded', () => { if (!dead) { setReady((r) => r + 1); info.current?.({ frames: a.totalFrames, fps: a.frameRate }); } });
      } catch (e) { if (!dead) setErr((e as Error).message); }
    })();
    return () => { dead = true; anim.current?.destroy(); anim.current = null; setReady(0); };
  }, [url, visible]);

  useEffect(() => {
    const a = anim.current;
    if (!a || !ready) return;
    if (seek !== null) a.goToAndStop(Math.round(seek * Math.max(0, a.totalFrames - 1)), true);
    else if (motion === 'reduced') a.goToAndStop(0, true);
    else if (motion === 'pause') a.pause();
    else a.play();
  }, [ready, seek, motion]);

  // Keep the player sized to its cell when the grid reflows (per-row change, panel, window resize).
  useEffect(() => {
    const el = wrap.current;
    if (!el || !ready || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => anim.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  return (
    <span ref={wrap} className="prim-art prim-lottie" data-src={url} data-live={ready ? '1' : undefined} style={{ width: size, height: size }} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <span ref={box} className="prim-lottie-box" />
      {err && <span className="prim-miss" title={`Could not load ${url}: ${err}`}><Ms n="error" size={18} /></span>}
    </span>
  );
}

/** Dashed placeholder when a format is missing for an icon. */
const Missing = ({ size, what }: { size: number | string; what: string }) => (
  <span className="prim-art prim-none" style={{ width: size, height: size }} title={`No ${what} yet`}><span>No {what}</span></span>
);

const secs = (ms: number) => (ms ? `${(ms / 1000).toFixed(ms % 1000 ? 1 : 0)} s` : '');

interface ArtView { fmt: Format; motion: Motion; scheme: SchemeKey }

/** One icon in the chosen format, or a placeholder. Lottie plays the current scheme's file (falling back to light or dark). */
function Art({ e, p, view, size, seek, title, onInfo }: { e: PrimaryEntry; p: PrimaryData; view: Omit<ArtView, 'size'>; size: number | string; seek?: number | null; title?: string; onInfo?: (i: { frames: number; fps: number }) => void }) {
  if (view.fmt === 'svg') return p.svgs[e.name] ? <SvgArt svg={p.svgs[e.name]} size={size} motion={view.motion} seek={seek} loopMs={e.loopMs} title={title} /> : <Missing size={size} what="SVG" />;
  const file = lottieScheme(p, e.name, view.scheme);
  return file ? <LottieArt name={e.name} scheme={file} size={size} motion={view.motion} seek={seek} title={title} onInfo={onInfo} /> : <Missing size={size} what="Lottie" />;
}

/** Wall view: the icon alone, filling its cell, no labels (tooltip on hover), to judge the set together. */
const WTile = memo(function WTile({ e, p, view, selected, onOpen }: { e: PrimaryEntry; p: PrimaryData; view: ArtView; selected: boolean; onOpen: (n: string) => void }) {
  return (
    <li>
      <button type="button" className={`tile-b prim-wall-b${selected ? ' is-sel' : ''}`} data-key={e.name} aria-pressed={selected} onClick={() => onOpen(e.name)} aria-label={`${e.label}, ${e.status}. Show details`} title={`${e.order < 10_000 ? `${e.order}. ` : ''}${e.label}`}>
        <Art e={e} p={p} view={view} size="100%" />
      </button>
    </li>
  );
});

const PTile = memo(function PTile({ e, p, view, selected, onOpen }: { e: PrimaryEntry; p: PrimaryData; view: ArtView; selected: boolean; onOpen: (n: string) => void }) {
  return (
    <li className={`tile${selected ? ' is-sel' : ''}`}>
      <button type="button" className="tile-b prim-tile" data-key={e.name} aria-pressed={selected} onClick={() => onOpen(e.name)} aria-label={`${e.label}, ${e.status}. Show details`}>
        <span className="tile-art prim-tile-art"><Art e={e} p={p} view={view} size="100%" /></span>
        <span className="tile-name">{e.label}</span>
        <code className="tile-code">{e.name}</code>
        <span className="prim-meta">
          <span className={`tile-st st-${e.status === 'approved' ? 'approved' : 'draft'}`}>{e.status === 'approved' && <Ms n="verified" size={14} fill />}{e.status === 'approved' ? 'Approved' : 'Draft'}</span>
          {e.loopMs > 0 && <span className="prim-loop" title="Loop duration"><Ms n="autorenew" size={14} />{secs(e.loopMs)}</span>}
        </span>
      </button>
    </li>
  );
});

export function PrimaryPage({ primary, lib, state, set, live, scheme }: {
  primary: PrimaryData; lib: LibData; state: UiState; set: (p: Partial<UiState>) => void; live: boolean; scheme: SchemeKey;
}) {
  const id = useId();
  const [motion, setMotion] = useState<Motion>(() => (prefersReducedMotion() ? 'reduced' : 'play'));
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setMotion(mq.matches ? 'reduced' : 'play');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => { if (state.fmt === 'lottie') void loadLottie(); }, [state.fmt]);

  const [q, setQ] = useState(state.q);
  useEffect(() => setQ(state.q), [state.q]);
  useEffect(() => {
    if (q === state.q) return;
    const t = window.setTimeout(() => set({ q }), 180);
    return () => window.clearTimeout(t);
  }, [q, state.q, set]);

  // Tiles follow `order` from index.json (1–30); an entry without one keeps its place in the file, after the rest.
  const icons = useMemo(() => primary.index.icons.map((e, i) => ({ ...e, order: typeof e.order === 'number' ? e.order : 10_000 + i }))
    .sort((a, b) => a.order - b.order), [primary.index.icons]);
  const shown = useMemo(() => {
    const k = state.q.trim().toLowerCase();
    return icons.filter((e) => !k || [e.name, e.label, e.module, e.baseIcon ?? ''].some((f) => f.toLowerCase().includes(k)));
  }, [icons, state.q]);
  // Flat ordered grid by default; "Group by module" splits it into sections in the order each module first appears.
  const groups = useMemo(() => {
    if (!state.pgroup || state.wall) return [{ name: '', list: shown }];
    const m = new Map<string, PrimaryEntry[]>();
    for (const e of shown) m.set(e.module, [...(m.get(e.module) ?? []), e]);
    return [...m].map(([name, list]) => ({ name, list }));
  }, [shown, state.pgroup, state.wall]);
  const modules = new Set(icons.map((e) => e.module)).size;
  const view: ArtView = useMemo(() => ({ fmt: state.fmt, motion, scheme }), [state.fmt, motion, scheme]);
  const sampleFile = icons[0] ? lottieScheme(primary, icons[0].name, scheme) : null;

  const last = useRef('');
  const open = useCallback((name: string) => { last.current = name; set({ sel: name }); }, [set]);
  const close = useCallback(() => {
    set({ sel: '' });
    const k = last.current;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`.tile-b[data-key="${CSS.escape(k)}"]`)?.focus());
  }, [set]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented && state.sel) close(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [state.sel, close]);

  const sel = state.sel ? icons.find((e) => e.name === state.sel) : undefined;
  return (
    <div className={`lib prim${state.sel ? ' with-panel' : ''}`}>
      <div className="lib-main">
        <header className="page-h">
          <div className="page-t">
            <h1 id="page-h">Primary icons <span className="dim">{icons.length}</span></h1>
            <p className="page-sub">Animated tile badges for module navigation{icons.length ? `: ${icons.length} ${icons.length === 1 ? 'icon' : 'icons'} in ${modules} ${modules === 1 ? 'module' : 'modules'}` : ''}. SVG follows the current scheme's roles; Lottie plays the file made for the current scheme ({schemeShort(scheme)}).</p>
          </div>
          <div className="lib-tools" role="search" aria-label="Filter primary icons">
            <div className="search">
              <label htmlFor={`${id}-q`} className="sr-only">Search primary icons</label>
              <Ms n="search" size={20} />
              <input id={`${id}-q`} type="search" placeholder="Search name, label, module, base icon" value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape' && q) { e.preventDefault(); e.stopPropagation(); setQ(''); set({ q: '' }); } }} />
            </div>
            <Segmented<Format> label="Format" value={state.fmt} onChange={(fmt) => set({ fmt })}
              options={[{ value: 'svg', label: 'SVG', title: 'Inline animated SVG (CSS keyframes, theme roles)' }, { value: 'lottie', label: 'Lottie', title: `Lottie, the ${schemeLong(sampleFile ?? scheme)} file` }]} />
            <Segmented<Motion> label="Motion" value={motion} onChange={setMotion}
              options={[
                { value: 'play', label: <><Ms n="play_arrow" size={16} /> Play</>, title: 'Play the loops' },
                { value: 'pause', label: <><Ms n="pause" size={16} /> Pause</>, title: 'Pause where they are' },
                { value: 'reduced', label: <><Ms n="motion_photos_off" size={16} /> Reduced</>, title: 'The static frame shown with reduced motion' },
              ]} />
            <Segmented<'grid' | 'wall'> label="Layout" value={state.wall ? 'wall' : 'grid'} onChange={(v) => set({ wall: v === 'wall' })}
              options={[
                { value: 'grid', label: <><Ms n="grid_view" size={16} /> Tiles</>, title: 'Tiles with names, status and loop length' },
                { value: 'wall', label: <><Ms n="apps" size={16} /> Wall</>, title: 'Every icon large, no labels: judge them as a set' },
              ]} />
            <label className="fld fld-inline prim-check" title={state.wall ? 'The wall is always one flat grid' : 'Split the ordered grid into one section per module'}>
              <input type="checkbox" checked={state.pgroup} disabled={state.wall} onChange={(e) => set({ pgroup: e.target.checked })} />
              <span>Group by module</span>
            </label>
            <div className="fld fld-inline">
              <span aria-hidden="true">Per row</span>
              <Segmented<string> label="Icons per row" value={String(state.cols)} onChange={(v) => set({ cols: Number(v) })}
                options={PCOLS.map((n) => ({ value: String(n), label: String(n), title: `${n} icons per row` }))} />
            </div>
          </div>
          {primary.error && <p className="note warn-note"><Ms n="warning" size={16} /> {primary.error}</p>}
          {state.scheme === 'all' && <p className="note">Compare all 6 applies to line and filled icons; Primary icons show the light scheme.</p>}
        </header>

        <div className="stage prim-stage" data-scheme={scheme} aria-label="Primary icons" style={{ ['--prim-cols' as string]: state.cols }}>
          {!icons.length ? (
            <div className="empty">
              <Ms n="animation" size={24} />
              {primary.present
                ? <p>The Primary folder has no icons listed yet. They show here as soon as <code>library/primary/index.json</code> lists them{live ? '; the page reloads on its own' : ''}.</p>
                : <p>No Primary icons yet: <code>library/primary/</code> does not exist. They show here as soon as the folder appears{live ? '; the page reloads on its own' : ''}.</p>}
            </div>
          ) : !shown.length ? (
            <div className="empty">
              <Ms n="search_off" size={24} />
              <p>No Primary icons match “{state.q}”.</p>
              <button type="button" className="btn" onClick={() => { setQ(''); set({ q: '' }); }}>Clear search</button>
            </div>
          ) : state.wall ? (
            <ul className="prim-grid prim-wall" aria-label={`All ${shown.length} Primary icons, ${state.cols} per row`}>
              {shown.map((e) => <WTile key={e.name} e={e} p={primary} view={view} selected={state.sel === e.name} onOpen={open} />)}
            </ul>
          ) : groups.map((g, gi) => (
            <section className="block" key={g.name || gi} aria-labelledby={g.name ? `${id}-g${gi}` : undefined} aria-label={g.name ? undefined : 'All Primary icons, in order'}>
              {g.name && <h2 className="block-h" id={`${id}-g${gi}`}>{g.name} <span className="dim">{g.list.length}</span></h2>}
              <ul className="tiles prim-grid prim-tiles">
                {g.list.map((e) => <PTile key={e.name} e={e} p={primary} view={view} selected={state.sel === e.name} onOpen={open} />)}
              </ul>
            </section>
          ))}
        </div>
      </div>
      {state.sel && <PrimaryDrawer key={state.sel} e={sel} name={state.sel} p={primary} lib={lib} state={state} motion={motion} scheme={scheme} live={live} onClose={close} />}
    </div>
  );
}

function PrimaryDrawer({ e, name, p, lib, state, motion, scheme, live, onClose }: {
  e?: PrimaryEntry; name: string; p: PrimaryData; lib: LibData; state: UiState; motion: Motion; scheme: SchemeKey; live: boolean; onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [seek, setSeek] = useState<number | null>(null);
  const [info, setInfo] = useState<{ frames: number; fps: number } | null>(null);
  const timer = useRef<number>();
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const say = (m: string) => { setStatus(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setStatus(''), 5000); };
  const svg = e ? p.svgs[e.name] : undefined;
  const lot = e ? p.lottie[e.name] ?? {} : {};
  const file = e ? lottieScheme(p, e.name, scheme) : null;
  const lotCount = LOTTIE_SCHEMES.filter((k) => lot[k]).length;

  const copy = async () => {
    if (!svg) return;
    try { await navigator.clipboard.writeText(svg); say('Copied the SVG.'); } catch { say('Could not copy: the browser blocked the clipboard.'); }
  };
  const getLottie = async (sc: SchemeKey) => {
    if (!e) return;
    try {
      const r = await fetch(lottieUrl(e.name, sc), { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      download({ name: `${e.name}.${sc}.json`, mime: 'application/json', body: await r.blob() });
      say(`Downloaded ${e.name}.${sc}.json.`);
    } catch (err) { say(`Could not download the ${schemeShort(sc)} Lottie: ${(err as Error).message}`); }
  };
  const getLottieZip = async () => {
    if (!e) return;
    setBusy(true);
    try { const f = await exportPrimaryLottieZip(p, e.name); download(f); say(`Downloaded ${f.name}.`); }
    catch (err) { say(`Could not build the Lottie ZIP: ${(err as Error).message}`); } finally { setBusy(false); }
  };
  const setSt = async (s: PrimaryStatus) => {
    if (!e) return;
    setBusy(true);
    try { await patchPrimary(e.name, { status: s }); say(`Status set to ${s === 'approved' ? 'Approved' : 'Draft'}.`); } catch (err) { say((err as Error).message); } finally { setBusy(false); }
  };

  const base = e?.baseIcon ? lib.index.icons.find((i) => i.name === e.baseIcon) : undefined;
  const baseHref = (style: 'line' | 'filled') => `#/library/${style}?sel=${encodeURIComponent(e?.baseIcon ?? '')}${state.scheme !== 'light' ? `&scheme=${state.scheme}` : ''}`;
  const pct = seek === null ? null : Math.round(seek * 100);
  const lottieMs = info && info.fps ? Math.round((info.frames / info.fps) * 1000) : 0;
  const view = { motion, scheme };

  return (
    <aside className="panel-d prim-panel" aria-labelledby="detail-h">
      <div className="pd-h">
        <div className="grow">
          <h2 id="detail-h" ref={heading} tabIndex={-1}>{e?.label ?? 'Not found'}</h2>
          {e && <p className="pd-sub"><code>{e.name}</code> in {e.module}</p>}
        </div>
        <button type="button" className="icon-btn" aria-label="Close details" title="Close (Esc)" onClick={onClose}><Ms n="close" size={20} /></button>
      </div>
      {!e ? <div className="pd-body"><p className="muted">There is no Primary icon called <code>{name}</code>.</p></div> : (
        <div className="pd-body">
          <figure className="pd-preview" data-scheme={scheme}>
            <div className="prim-pair">
              <div className="prim-cell">
                <Art e={e} p={p} view={{ ...view, fmt: 'svg' }} size="100%" seek={seek} title={`${e.label}, SVG`} />
                <span className="prim-cap">SVG</span>
              </div>
              <div className="prim-cell">
                <Art e={e} p={p} view={{ ...view, fmt: 'lottie' }} size="100%" seek={seek} title={`${e.label}, Lottie ${file ? schemeShort(file) : ''}`} onInfo={setInfo} />
                <span className="prim-cap" title={file && file !== scheme ? `No ${scheme} file yet: playing ${file}` : undefined}>
                  Lottie · {file ? schemeShort(file) : 'none'}{file && file !== scheme ? ' (fallback)' : ''}
                </span>
              </div>
            </div>
            <figcaption className="prim-scrub">
              <button type="button" className="icon-btn" onClick={() => setSeek(seek === null ? 0 : null)} aria-label={seek === null ? 'Hold a frame' : 'Back to the motion setting'} title={seek === null ? 'Hold a frame to scrub' : `Back to ${motion}`}>
                <Ms n={seek === null ? 'pause' : 'play_arrow'} size={20} />
              </button>
              <label className="grow prim-range">
                <span className="sr-only">Animation position</span>
                <input type="range" min={0} max={100} step={1} value={pct ?? 0} onChange={(ev) => setSeek(Number(ev.target.value) / 100)} aria-valuetext={`${pct ?? 0}% of the loop`} />
              </label>
              <output className="prim-pct">{pct === null ? motion === 'play' ? 'Playing' : motion === 'pause' ? 'Paused' : 'Reduced' : `${pct}%`}</output>
            </figcaption>
          </figure>

          <div className="pd-actions">
            <button type="button" className="btn" onClick={() => void copy()} disabled={!svg}><Ms n="code" size={18} />Copy SVG</button>
            <button type="button" className="btn" disabled={!svg} onClick={() => { if (svg) { download({ name: `${e.name}.svg`, mime: 'image/svg+xml', body: svg }); say(`Downloaded ${e.name}.svg.`); } }}><Ms n="download" size={18} />SVG</button>
            <button type="button" className="btn" disabled={!lotCount || busy} onClick={() => void getLottieZip()} title={`lottie/<scheme>/${e.name}.json for the ${lotCount} scheme files present`}>
              <Ms n="folder_zip" size={18} />Lottie (all schemes, ZIP)
            </button>
          </div>
          <div className="prim-lot-dl" role="group" aria-label="Download one Lottie scheme file">
            <span className="prim-lot-dl-h">One scheme:</span>
            {LOTTIE_SCHEMES.map((k) => (
              <button key={k} type="button" className={`btn btn-sm${k === scheme ? ' is-cur' : ''}`} disabled={!lot[k]} onClick={() => void getLottie(k)}
                title={lot[k] ? `Download ${e.name}.${k}.json (${schemeLong(k)})` : `${e.name}.${k}.json is missing`} aria-label={`Download Lottie, ${schemeLong(k)}`}>
                {schemeShort(k)}
              </button>
            ))}
          </div>
          <p className="status" role="status" aria-live="polite">{status}</p>

          <section className="pd-sec" aria-labelledby="pp-st">
            <h3 id="pp-st">Status</h3>
            <div className="st-row" role="group" aria-label="Set status">
              <span className={`badge st-${e.status === 'approved' ? 'approved' : 'draft'}`}>{e.status === 'approved' ? 'Approved' : 'Draft'}</span>
              <span className="grow" />
              {(['draft', 'approved'] as PrimaryStatus[]).map((s) => (
                <button key={s} type="button" className="btn btn-sm" aria-pressed={e.status === s} disabled={busy || !live || e.status === s} onClick={() => void setSt(s)}>
                  {s === 'approved' ? 'Approve' : 'Mark draft'}
                </button>
              ))}
            </div>
            {!live && <p className="muted">Read-only snapshot: run <code>npm run dev</code> to change status.</p>}
          </section>

          <dl className="dl">
            {e.motion && <div><dt>Motion</dt><dd>{e.motion}</dd></div>}
            <div><dt>Order</dt><dd>{e.order < 10_000 ? e.order : 'Not set in index.json'}</dd></div>
            <div><dt>Loop</dt><dd>{e.loopMs ? `${e.loopMs} ms (${secs(e.loopMs)})` : 'Not set in index.json'}{info ? ` · Lottie ${info.frames} frames at ${info.fps} fps${lottieMs ? ` (${lottieMs} ms)` : ''}` : ''}</dd></div>
          </dl>

          <section className="pd-sec" aria-labelledby="pp-base">
            <h3 id="pp-base">Base icon</h3>
            {!e.baseIcon ? <p className="muted">No base icon linked (<code>baseIcon</code> is empty).</p>
              : !base ? <p className="muted"><code>{e.baseIcon}</code> is not in the line and filled library.</p> : (
                <div className="prim-base" data-scheme={scheme}>
                  {(['line', 'filled'] as const).map((s) => (
                    <a key={s} href={baseHref(s)} className="prim-base-i" title={`Open ${base.label} in ${s} icons`}>
                      {lib.svgs[s][base.name] ? <LibSvg svg={lib.svgs[s][base.name]} size={28} /> : <Ms n="check_box_outline_blank" size={28} />}
                      <span><strong>{base.label}</strong><small>{s === 'line' ? 'Line' : 'Filled'} · <code>{base.name}</code></small></span>
                      <Ms n="arrow_forward" size={18} />
                    </a>
                  ))}
                </div>
              )}
          </section>

          <dl className="dl">
            <div><dt>Files</dt><dd>
              <code>library/primary/svg/{e.name}.svg</code>{!svg && ' (missing)'}<br />
              {LOTTIE_SCHEMES.map((k) => <span key={k}><code>library/primary/lottie/{e.name}.{k}.json</code>{!lot[k] && ' (missing)'}{k === file && ' (playing)'}<br /></span>)}
            </dd></div>
          </dl>
        </div>
      )}
    </aside>
  );
}

/** Small preview for the line and filled detail panels, linking to the Primary version. */
export function PrimaryPeek({ e, svg, href, scheme }: { e: PrimaryEntry; svg?: string; href: string; scheme: SchemeKey }) {
  const motion: Motion = prefersReducedMotion() ? 'reduced' : 'play';
  return (
    <a className="prim-peek" href={href} data-scheme={scheme} title={`Open ${e.label} in Primary icons`}>
      {svg ? <SvgArt svg={svg} size={48} motion={motion} loopMs={e.loopMs} /> : <span className="prim-art prim-none" style={{ width: 48, height: 48 }} />}
      <span className="grow"><strong>{e.label}</strong><small><code>{e.name}</code> · {e.module}</small></span>
      <Ms n="arrow_forward" size={18} />
    </a>
  );
}
