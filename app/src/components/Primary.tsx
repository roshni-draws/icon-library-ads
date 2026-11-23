import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { download, exportPrimaryLottieZip, primaryLottieOut, primarySvgOut, type ExportTint } from '../lib/exporters';
import { PCOLS, type UiState } from '../lib/hash';
import type { LibData } from '../lib/iconLibrary';
import { schemeLong, schemeShort, type SchemeKey } from '../lib/library';
import {
  hasVariant, inlinePrimary, loadLottie, lottieDir, LOTTIE_SCHEMES, lottieJson, lottieScheme, lottieUrl, observeVisible, patchPrimary, prefersReducedMotion, seekCss,
  svgDir, tintedLottie, variantLottie, variantSvg, type Format, type Motion, type PrimaryData, type PrimaryEntry, type PrimaryStatus, type Variant,
} from '../lib/primary';
import { LibSvg } from './Icon';
import { Ms, Segmented } from './Segmented';
import { DEFAULT_BG, fmtRatio, isHex, resolveBg, TILE_PRESETS, tileContrast, tileVars, type TileChoice, type TileContrast } from '../lib/tile';

/** Tile and ink of a non-default tile colour, for recolouring Lottie at load time. */
type Tint = { tile: string; ink: string } | null;

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
 * Lottie (lottie-web light build, lazy-loaded): the file for `scheme` (lottie/<name>.<scheme>.json, or lottie-stroke/ for
 * the stroke variant).
 * The player is created only while the element is on screen (or within 120px) and destroyed when it leaves, so a
 * page of 30 icons keeps only the visible players alive. Reduced shows frame 0; seek (0–1) holds a frame for the scrubber.
 */
export function LottieArt({ name, scheme, variant = 'filled', size, motion, seek = null, title, onInfo, p, tint = null }: {
  name: string; scheme: SchemeKey; variant?: Variant; size: number | string; motion: Motion; seek?: number | null; title?: string;
  onInfo?: (i: { frames: number; fps: number }) => void;
  /** With a tint, the file is cloned and its tile and ink paints recoloured (cached per icon + scheme + colours). */
  p?: PrimaryData; tint?: Tint;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const anim = useRef<LottieAnim | null>(null);
  const [ready, setReady] = useState(0);
  const [err, setErr] = useState('');
  const visible = useVisible(wrap, false);
  const info = useRef(onInfo);
  info.current = onInfo;
  const url = lottieUrl(name, scheme, variant);
  const tTile = tint?.tile ?? '', tInk = tint?.ink ?? '';
  const pRef = useRef(p);
  pRef.current = p;

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    setErr('');
    void (async () => {
      try {
        const [lottie, data] = await Promise.all([loadLottie(), tTile && pRef.current ? tintedLottie(pRef.current, name, scheme, variant, tTile, tInk) : lottieJson(url)]);
        if (dead || !box.current) return;
        const a = lottie.loadAnimation({ container: box.current, renderer: 'svg', loop: true, autoplay: false, animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } }) as unknown as LottieAnim;
        anim.current = a;
        a.addEventListener('DOMLoaded', () => { if (!dead) { setReady((r) => r + 1); info.current?.({ frames: a.totalFrames, fps: a.frameRate }); } });
      } catch (e) { if (!dead) setErr((e as Error).message); }
    })();
    return () => { dead = true; anim.current?.destroy(); anim.current = null; setReady(0); };
  }, [url, visible, name, scheme, variant, tTile, tInk]);

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
    <span ref={wrap} className="prim-art prim-lottie" data-src={url} data-tint={tTile ? `${tTile}/${tInk}` : undefined} data-live={ready ? '1' : undefined} style={{ width: size, height: size }} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
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

interface ArtView { fmt: Format; motion: Motion; scheme: SchemeKey; variant: Variant; tint: Tint }

/**
 * One icon in the chosen format and variant, or a placeholder. Lottie plays the current scheme's file of that variant
 * (falling back to light or dark). An icon with no stroke files at all shows "No stroke version".
 */
function Art({ e, p, view, size, seek, title, onInfo }: { e: PrimaryEntry; p: PrimaryData; view: ArtView; size: number | string; seek?: number | null; title?: string; onInfo?: (i: { frames: number; fps: number }) => void }) {
  const stroke = view.variant === 'stroke';
  if (stroke && !hasVariant(p, e.name, 'stroke')) return <Missing size={size} what="stroke version" />;
  if (view.fmt === 'svg') {
    const svg = variantSvg(p, e.name, view.variant);
    return svg ? <SvgArt svg={svg} size={size} motion={view.motion} seek={seek} loopMs={e.loopMs} title={title} /> : <Missing size={size} what={stroke ? 'stroke SVG' : 'SVG'} />;
  }
  const file = lottieScheme(p, e.name, view.scheme, view.variant);
  return file ? <LottieArt name={e.name} scheme={file} variant={view.variant} size={size} motion={view.motion} seek={seek} title={title} onInfo={onInfo} p={p} tint={view.tint} /> : <Missing size={size} what={stroke ? 'stroke Lottie' : 'Lottie'} />;
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
  const choice = useMemo(() => resolveBg(state.bg, scheme), [state.bg, scheme]);
  const tint: Tint = useMemo(() => (choice.isDefault ? null : { tile: choice.tile, ink: choice.ink }), [choice]);
  const view: ArtView = useMemo(() => ({ fmt: state.fmt, motion, scheme, variant: state.pv, tint }), [state.fmt, motion, scheme, state.pv, tint]);
  const sampleFile = icons[0] ? lottieScheme(primary, icons[0].name, scheme, state.pv) : null;
  const strokeCount = useMemo(() => icons.filter((e) => hasVariant(primary, e.name, 'stroke')).length, [icons, primary]);

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
            <p className="page-sub">Animated tile badges for module navigation{icons.length ? `: ${icons.length} ${icons.length === 1 ? 'icon' : 'icons'} in ${modules} ${modules === 1 ? 'module' : 'modules'}` : ''}. SVG follows the current scheme's roles; Lottie plays the file made for the current scheme ({schemeShort(scheme)}).{state.pv === 'stroke' ? ` Showing the stroke variant (${strokeCount} of ${icons.length} drawn).` : ''}</p>
          </div>
          <div className="lib-tools" role="search" aria-label="Filter primary icons">
            <div className="search">
              <label htmlFor={`${id}-q`} className="sr-only">Search primary icons</label>
              <Ms n="search" size={20} />
              <input id={`${id}-q`} type="search" placeholder="Search name, label, module, base icon" value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape' && q) { e.preventDefault(); e.stopPropagation(); setQ(''); set({ q: '' }); } }} />
            </div>
            <Segmented<Variant> label="Variant" value={state.pv} onChange={(pv) => set({ pv })}
              options={[
                { value: 'filled', label: 'Filled', title: 'Filled glyphs: svg/ and lottie/' },
                { value: 'stroke', label: 'Stroke', title: `Stroke glyphs: svg-stroke/ and lottie-stroke/ (${strokeCount} of ${icons.length} icons have one)` },
              ]} />
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
          <TileColour bg={state.bg} scheme={scheme} variant={state.pv} bgx={state.bgx} set={set} />
          {primary.error && <p className="note warn-note"><Ms n="warning" size={16} /> {primary.error}</p>}
          {state.scheme === 'all' && <p className="note">Compare all 6 applies to line and filled icons; Primary icons show the light scheme.</p>}
        </header>

        <div className="stage prim-stage" data-scheme={scheme} aria-label="Primary icons" style={{ ['--prim-cols' as string]: state.cols, ...tileVars(choice) }}>
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
      {state.sel && <PrimaryDrawer key={state.sel} e={sel} name={state.sel} p={primary} lib={lib} state={state} set={set} motion={motion} scheme={scheme} live={live} onClose={close} choice={choice} tint={tint} />}
    </div>
  );
}

function PrimaryDrawer({ e, name, p, lib, state, set, motion, scheme, live, onClose, choice, tint }: {
  e?: PrimaryEntry; name: string; p: PrimaryData; lib: LibData; state: UiState; set: (p: Partial<UiState>) => void; motion: Motion; scheme: SchemeKey; live: boolean; onClose: () => void;
  choice: TileChoice; tint: Tint;
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
  const pv = state.pv;
  const svg = e ? p.svgs[e.name] : undefined;
  const lot = e ? p.lottie[e.name] ?? {} : {};
  const lotCount = LOTTIE_SCHEMES.filter((k) => lot[k]).length;
  const sSvg = e ? variantSvg(p, e.name, 'stroke') : undefined;
  const sLot = e ? variantLottie(p, e.name, 'stroke') : {};
  const sLotCount = LOTTIE_SCHEMES.filter((k) => sLot[k]).length;
  const hasStroke = !!sSvg || sLotCount > 0;
  // The large previews follow the page's Variant; `file` is the Lottie they play.
  const file = e ? lottieScheme(p, e.name, scheme, pv) : null;
  const vName = pv === 'stroke' ? 'Stroke' : 'Filled';
  // "Export with tile colour: current choice" (bgx) bakes the choice into every download below; otherwise files as-is.
  const xt: ExportTint | null = state.bgx && !choice.isDefault ? { bg: choice.bg, scheme } : null;
  const sfx = xt ? `-${xt.bg.replace('#', '').toLowerCase()}` : '';

  const copy = async () => {
    if (!svg) return;
    try { await navigator.clipboard.writeText(primarySvgOut(svg, xt)); say(xt ? `Copied the SVG with the ${choice.label} tile.` : 'Copied the SVG.'); } catch { say('Could not copy: the browser blocked the clipboard.'); }
  };
  const getLottie = async (sc: SchemeKey, v: Variant = 'filled') => {
    if (!e) return;
    const fname = v === 'stroke' ? `${e.name}-stroke${sfx}.${sc}.json` : `${e.name}${sfx}.${sc}.json`;
    try {
      download({ name: fname, mime: 'application/json', body: await primaryLottieOut(p, e.name, sc, v, xt) });
      say(`Downloaded ${fname}.`);
    } catch (err) { say(`Could not download the ${v === 'stroke' ? 'stroke ' : ''}${schemeShort(sc)} Lottie: ${(err as Error).message}`); }
  };
  const getLottieZip = async (v: Variant = 'filled') => {
    if (!e) return;
    setBusy(true);
    try { const f = await exportPrimaryLottieZip(p, e.name, v, xt); download(f); say(`Downloaded ${f.name}.`); }
    catch (err) { say(`Could not build the ${v === 'stroke' ? 'stroke ' : ''}Lottie ZIP: ${(err as Error).message}`); } finally { setBusy(false); }
  };
  const sScheme = e ? lottieScheme(p, e.name, scheme, 'stroke') : null;
  const setSt = async (s: PrimaryStatus) => {
    if (!e) return;
    setBusy(true);
    try { await patchPrimary(e.name, { status: s }); say(`Status set to ${s === 'approved' ? 'Approved' : 'Draft'}.`); } catch (err) { say((err as Error).message); } finally { setBusy(false); }
  };

  const base = e?.baseIcon ? lib.index.icons.find((i) => i.name === e.baseIcon) : undefined;
  const baseHref = (style: 'line' | 'filled') => `#/library/${style}?sel=${encodeURIComponent(e?.baseIcon ?? '')}${state.scheme !== 'light' ? `&scheme=${state.scheme}` : ''}`;
  const pct = seek === null ? null : Math.round(seek * 100);
  const lottieMs = info && info.fps ? Math.round((info.frames / info.fps) * 1000) : 0;
  const view = { motion, scheme, variant: pv, tint };
  const tv = tileVars(choice);

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
          <figure className="pd-preview" data-scheme={scheme} style={tv}>
            <div className="prim-pair">
              <div className="prim-cell">
                <Art e={e} p={p} view={{ ...view, fmt: 'svg' }} size="100%" seek={seek} title={`${e.label}, ${vName} SVG`} />
                <span className="prim-cap">{vName} · SVG</span>
              </div>
              <div className="prim-cell">
                <Art e={e} p={p} view={{ ...view, fmt: 'lottie' }} size="100%" seek={seek} title={`${e.label}, ${vName} Lottie ${file ? schemeShort(file) : ''}`} onInfo={setInfo} />
                <span className="prim-cap" title={file && file !== scheme ? `No ${scheme} file yet: playing ${file}` : undefined}>
                  {vName} · Lottie · {file ? schemeShort(file) : 'none'}{file && file !== scheme ? ' (fallback)' : ''}
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

          <div className="prim-compare" role="group" aria-label={`Compare variants, ${state.fmt === 'lottie' ? 'Lottie' : 'SVG'}. Choose one to show it everywhere`} data-scheme={scheme} style={tv}>
            {(['filled', 'stroke'] as Variant[]).map((v) => (
              <button key={v} type="button" className="prim-cmp" aria-pressed={pv === v} onClick={() => set({ pv: v })}
                title={v === pv ? `Showing ${v}` : `Show the ${v} variant on the page and in the large previews`}>
                <Art e={e} p={p} view={{ ...view, variant: v, fmt: state.fmt }} size={96} seek={seek} />
                <span className="prim-cap">{v === 'filled' ? 'Filled' : hasStroke ? 'Stroke' : 'Stroke (none yet)'}</span>
              </button>
            ))}
          </div>

          <TileDetail choice={choice} scheme={scheme} variant={pv} bgx={state.bgx} set={set} />

          <div className="pd-actions">
            <button type="button" className="btn" onClick={() => void copy()} disabled={!svg}><Ms n="code" size={18} />Copy SVG</button>
            <button type="button" className="btn" disabled={!svg} onClick={() => { if (svg) { download({ name: `${e.name}${sfx}.svg`, mime: 'image/svg+xml', body: primarySvgOut(svg, xt) }); say(`Downloaded ${e.name}${sfx}.svg.`); } }}><Ms n="download" size={18} />SVG</button>
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
          <div className="pd-actions prim-stroke-dl" role="group" aria-label="Stroke variant downloads">
            <span className="prim-lot-dl-h">Stroke:</span>
            <button type="button" className="btn btn-sm" disabled={!sSvg} title={sSvg ? `Download svg-stroke/${e.name}.svg` : 'No stroke SVG yet'}
              onClick={() => { if (sSvg) { download({ name: `${e.name}-stroke${sfx}.svg`, mime: 'image/svg+xml', body: primarySvgOut(sSvg, xt) }); say(`Downloaded ${e.name}-stroke${sfx}.svg.`); } }}>
              <Ms n="download" size={16} />SVG
            </button>
            <button type="button" className="btn btn-sm" disabled={!sScheme} onClick={() => { if (sScheme) void getLottie(sScheme, 'stroke'); }}
              title={sScheme ? `Download lottie-stroke/${e.name}.${sScheme}.json${sScheme !== scheme ? ' (fallback for this scheme)' : ''}` : 'No stroke Lottie yet'}>
              <Ms n="download" size={16} />Lottie · {schemeShort(sScheme ?? scheme)}
            </button>
            <button type="button" className="btn btn-sm" disabled={!sLotCount || busy} onClick={() => void getLottieZip('stroke')} title={`lottie-stroke/<scheme>/${e.name}.json for the ${sLotCount} stroke scheme files present`}>
              <Ms n="folder_zip" size={16} />Lottie (all schemes, ZIP)
            </button>
            {!hasStroke && <span className="muted prim-stroke-none">No stroke version yet</span>}
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
              {LOTTIE_SCHEMES.map((k) => <span key={k}><code>library/primary/lottie/{e.name}.{k}.json</code>{!lot[k] && ' (missing)'}{pv === 'filled' && k === file && ' (playing)'}<br /></span>)}
            </dd></div>
            <div><dt>Stroke</dt><dd>
              {!hasStroke ? <span className="muted">No stroke files yet (<code>library/primary/{svgDir('stroke')}/</code>, <code>{lottieDir('stroke')}/</code>).</span> : <>
                <code>library/primary/{svgDir('stroke')}/{e.name}.svg</code>{!sSvg && ' (missing)'}<br />
                {LOTTIE_SCHEMES.map((k) => <span key={k}><code>library/primary/{lottieDir('stroke')}/{e.name}.{k}.json</code>{!sLot[k] && ' (missing)'}{pv === 'stroke' && k === file && ' (playing)'}<br /></span>)}
              </>}
            </dd></div>
          </dl>
        </div>
      )}
    </aside>
  );
}

/** Mini tile for a swatch: the tile colour with an ink ring, as the icons paint it. */
const Swatch = ({ tile, ink }: { tile: string; ink: string }) => (
  <svg className="prim-sw-art" viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="6" fill={tile} /><circle cx="10" cy="10" r="4.5" fill="none" stroke={ink} strokeWidth="2" /></svg>
);
/**
 * "Low contrast" chip: ink on tile under 3:1 (required), or, in Filled, ink on the light fill under 3:1 (the details
 * drawn on the fill would vanish). null when neither.
 */
const LowChip = ({ k, variant }: { k: TileContrast; variant: Variant }) => {
  const fill = variant === 'filled' && k.lowFill;
  if (!k.low && !fill) return null;
  const why = [k.low && `ink on tile ${fmtRatio(k.inkTile)}`, fill && `ink on the light fill ${fmtRatio(k.inkFill)}`].filter(Boolean).join(' and ');
  return <span className="prim-low" title={`Low contrast: ${why}, under the 3:1 minimum`}><Ms n="warning" size={14} fill />Low contrast{!k.low && fill ? ' (fill)' : ''}</span>;
};

/** "Export with tile colour": the current choice or the theme default (bgx in the hash). */
function ExportTileSeg({ choice, bgx, set }: { choice: TileChoice; bgx: boolean; set: (p: Partial<UiState>) => void }) {
  return (
    <div className="fld fld-inline prim-bgx" title={choice.isDefault ? 'The tile is the theme default (Green), so both give the same files' : undefined}>
      <span aria-hidden="true">Export with tile colour</span>
      <Segmented<'cur' | 'def'> label="Export with tile colour" value={bgx && !choice.isDefault ? 'cur' : 'def'} onChange={(v) => set({ bgx: v === 'cur' })}
        options={[
          { value: 'cur', label: 'Current choice', title: choice.isDefault ? 'Choose a tile colour first' : `Downloads and the Primary ZIP use ${choice.label}: hex baked into the SVGs, Lottie recoloured` },
          { value: 'def', label: 'Theme default', title: 'Downloads and the Primary ZIP are the library files as they are (green tile)' },
        ]} />
    </div>
  );
}

/**
 * Tile colour control (Primary page only): the 9 preset role pairs of the current scheme, plus a custom colour whose
 * ink is DS near-black or white, whichever contrasts more. Persisted as bg=<preset>|#RRGGBB (green left out).
 */
function TileColour({ bg, scheme, variant, bgx, set }: { bg: string; scheme: SchemeKey; variant: Variant; bgx: boolean; set: (p: Partial<UiState>) => void }) {
  const id = useId();
  const cur = resolveBg(bg, scheme);
  const k = tileContrast(cur, scheme);
  const custom = isHex(bg);
  const [text, setText] = useState(custom ? bg : '');
  useEffect(() => { if (isHex(bg)) setText(bg); }, [bg]);
  const pickHex = (v: string) => { const h = v.trim().replace(/^#?/, '#').toUpperCase(); if (isHex(h)) set({ bg: h }); };
  const customInk = custom ? cur.ink : resolveBg(text && isHex(text) ? text : '#808080', scheme).ink;
  return (
    <div className="prim-bg" role="group" aria-labelledby={`${id}-h`}>
      <span className="prim-bg-h" id={`${id}-h`}>Tile colour</span>
      <div className="prim-sw-row">
        {TILE_PRESETS.map((p) => {
          const c = resolveBg(p.id, scheme);
          const r = tileContrast(c, scheme);
          return (
            <button key={p.id} type="button" className="prim-sw" aria-pressed={bg === p.id} onClick={() => set({ bg: p.id })}
              title={`${p.label}${p.id === DEFAULT_BG ? ' (default)' : ''}: ${p.tile} ${c.tile} with ${p.ink} ${c.ink}. Ink on tile ${fmtRatio(r.inkTile)}${r.low ? ', under 3:1' : ''}. Ink on fill ${fmtRatio(r.inkFill)}`}>
              <Swatch tile={c.tile} ink={c.ink} />
              <span>{p.label}</span>
              <LowChip k={r} variant={variant} />
            </button>
          );
        })}
        <span className={`prim-sw prim-sw-custom${custom ? ' is-on' : ''}`}>
          <label className="prim-sw-pick" title="Pick a custom tile colour">
            <span className="sr-only">Custom tile colour</span>
            <input type="color" value={custom ? bg.toLowerCase() : (isHex(text) ? text.toLowerCase() : '#808080')} onChange={(ev) => pickHex(ev.target.value)} />
            <Swatch tile={custom ? bg : (isHex(text) ? text : '#808080')} ink={customInk} />
          </label>
          <label className="prim-sw-hex">
            <span>Custom</span>
            <input type="text" inputMode="text" spellCheck={false} maxLength={7} placeholder="#RRGGBB" aria-label="Custom tile colour, hex" value={text}
              onChange={(ev) => { setText(ev.target.value); pickHex(ev.target.value); }} />
          </label>
          {custom && <LowChip k={k} variant={variant} />}
        </span>
      </div>
      <p className="prim-bg-read" aria-live="polite">
        <strong>{cur.label}</strong>
        {cur.tileRole ? <> · <code>{cur.tileRole}</code> / <code>{cur.inkRole}</code></> : <> · ink {cur.ink === '#FFFFFF' ? 'white' : 'DS near-black'} (auto)</>}
        {' '}· tile {cur.tile}, ink {cur.ink} · ink on tile <span className={k.low ? 'prim-bad' : ''}>{fmtRatio(k.inkTile)}</span>
        {variant === 'filled' && <> · ink on fill <span className={k.lowFill ? 'prim-bad' : ''}>{fmtRatio(k.inkFill)}</span> · fill on tile {fmtRatio(k.fillTile)}</>}
        {' '}<LowChip k={k} variant={variant} />
      </p>
      <ExportTileSeg choice={cur} bgx={bgx} set={set} />
    </div>
  );
}

/** Detail panel: the tile colour in use, its contrast, and the export choice. */
function TileDetail({ choice, scheme, variant, bgx, set }: { choice: TileChoice; scheme: SchemeKey; variant: Variant; bgx: boolean; set: (p: Partial<UiState>) => void }) {
  const k = tileContrast(choice, scheme);
  const row = (label: string, r: number, min: number | null, note: string) => (
    <div><dt>{label}</dt><dd><span className={min !== null && r < min ? 'prim-bad' : ''}>{fmtRatio(r)}</span> <span className="muted">{note}</span></dd></div>
  );
  return (
    <section className="pd-sec prim-tile-sec" aria-labelledby="pp-tile">
      <h3 id="pp-tile">Tile colour</h3>
      <div className="prim-tile-sum">
        <Swatch tile={choice.tile} ink={choice.ink} />
        <span className="grow"><strong>{choice.label}</strong>{choice.isDefault && <span className="muted"> (theme default)</span>}<br />
          <small className="muted">{choice.tileRole ? `${choice.tileRole} ${choice.tile} / ${choice.inkRole} ${choice.ink}` : `tile ${choice.tile} / ink ${choice.ink} (auto)`}</small></span>
        <LowChip k={k} variant={variant} />
      </div>
      <dl className="dl prim-tile-dl">
        {row('Ink / tile', k.inkTile, 3, '3:1 minimum')}
        {variant === 'filled' && row('Fill / tile', k.fillTile, null, 'for information: the ink outline carries the shape')}
        {variant === 'filled' && row('Ink / fill', k.inkFill, 3, 'details drawn on the light fill')}
        {variant === 'filled' && row('Accent / fill', k.accentFill, 3, 'unchanged by the tile')}
      </dl>
      <ExportTileSeg choice={choice} bgx={bgx} set={set} />
    </section>
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
