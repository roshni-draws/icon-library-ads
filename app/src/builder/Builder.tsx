import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent as RKE, type ReactNode } from 'react';
import { LibSvg, SymbolIcon } from '../components/Icon';
import { LevelChip, RuleList } from '../components/Report';
import { Ms, Segmented } from '../components/Segmented';
import type { DraftInfo } from '../components/Sidebar';
import { checkSvg, type CheckResult, type Level, type Report } from '../lib/checker';
import { compose } from '../lib/compose';
import { GUARDRAILS as G } from '../lib/guardrails';
import { NAME_RE, STATUS_LABEL, saveIcon, type LibData } from '../lib/iconLibrary';
import type { SchemeKey } from '../lib/library';
import { normalizeSvg, type IconStyle } from '../lib/normalize';
import { loadSymbol, materialSvg, searchSymbols } from '../lib/symbols';
import { translateEl, type El } from '../lib/svg';
import { PARTS, PART_BY_ID } from '../parts/parts';
import { Canvas, DocSvg, type DrawOpts, type Tool } from './Canvas';
import { fromSvg, getAt, toSvg, updateAt, type Path } from './doc';

export const M3_ICONS_URL = 'https://m3.material.io/styles/icons/designing-icons';

/** Builder work in progress (autosaved to localStorage as a draft). */
interface Meta { name: string; label: string; module: string; tags: string; link: string }
interface Docs { line: El[]; filled: El[] }
interface Saved { line: string; filled: string; meta: Meta; materialBase: boolean }
const KEY = 'antz-icon-builder:builder-draft:v1';
const EMPTY_META: Meta = { name: '', label: '', module: '', tags: '', link: '' };

function loadDraft(): { docs: Docs; meta: Meta; materialBase: boolean } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    return { docs: { line: v.line ? fromSvg(v.line) : [], filled: v.filled ? fromSvg(v.filled) : [] }, meta: { ...EMPTY_META, ...v.meta }, materialBase: !!v.materialBase };
  } catch { return null; }
}
function saveDraft(d: Docs, meta: Meta, materialBase: boolean) {
  try { localStorage.setItem(KEY, JSON.stringify({ line: toSvg('line', d.line), filled: toSvg('filled', d.filled), meta, materialBase } satisfies Saved)); } catch { /* storage blocked: no autosave */ }
}
/** What the sidebar shows under Drafts, read without mounting the builder. */
export function peekDraft(): DraftInfo {
  const d = loadDraft();
  return { hasWork: !!d && d.docs.line.length + d.docs.filled.length > 0, name: d?.meta.name ?? '', label: d?.meta.label ?? '' };
}

export type BuilderRequest = { kind: 'slot'; name: string; nonce: number } | { kind: 'new'; nonce: number };
type Mode = 'upload' | 'parts' | 'draw';
const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'upload', label: 'Upload or paste', icon: 'upload_file' },
  { id: 'parts', label: 'From parts', icon: 'extension' },
  { id: 'draw', label: 'Draw', icon: 'stylus' },
];
const cap = (s: IconStyle) => (s === 'line' ? 'Line' : 'Filled');
const RANK: Record<Level, number> = { pass: 0, info: 0, warn: 1, fail: 2 };

/** Rules that can be shown on the canvas: extent (ink box vs live area), keyline, grid, gap, viewBox. */
const PICKABLE = new Set(['extent', 'keyline', 'grid', 'gap', 'viewBox']);
function Highlight({ rule, report }: { rule: CheckResult; report: Report }) {
  const ink = report.ink;
  const tone = rule.level === 'fail' ? 'hl-fail' : rule.level === 'warn' ? 'hl-warn' : 'hl-ok';
  const box = ink && <rect className={`hl-ink ${tone}`} x={ink.x0} y={ink.y0} width={ink.x1 - ink.x0} height={ink.y1 - ink.y0} />;
  if (rule.id === 'extent') return <>{<rect className="hl-live" x={G.live.min} y={G.live.min} width={G.live.max - G.live.min} height={G.live.max - G.live.min} />}{box}</>;
  if (rule.id === 'keyline') {
    const k = G.keylines.find((x) => x.label === report.keyline);
    return <>{k && (k.kind === 'circle' ? <circle className="hl-key" cx={12} cy={12} r={k.w / 2} /> : <rect className="hl-key" x={(24 - k.w) / 2} y={(24 - k.h) / 2} width={k.w} height={k.h} rx={2} />)}{box}</>;
  }
  if (rule.id === 'viewBox') return <rect className={`hl-ink ${tone}`} x={0.1} y={0.1} width={23.8} height={23.8} />;
  return null;
}

/** ARIA tabs with arrow-key movement. */
function Tabs<T extends string>({ label, value, items, onChange, idBase }: { label: string; value: T; items: { id: T; label: ReactNode; icon?: string }[]; onChange: (v: T) => void; idBase: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: RKE) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = items.findIndex((x) => x.id === value);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    onChange(items[n].id);
    ref.current?.querySelectorAll<HTMLElement>('[role="tab"]')[n]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={label} ref={ref} onKeyDown={onKey}>
      {items.map((x) => (
        <button key={x.id} type="button" role="tab" id={`${idBase}-t-${x.id}`} aria-controls={`${idBase}-p-${x.id}`} aria-selected={x.id === value} tabIndex={x.id === value ? 0 : -1} onClick={() => onChange(x.id)}>
          {x.icon && <Ms n={x.icon} size={18} />}{x.label}
        </button>
      ))}
    </div>
  );
}

export function Builder({ data, live, scheme, request, onRequestDone, onLink, onDraft, onView }: {
  data: LibData; live: boolean; scheme: SchemeKey; request: BuilderRequest | null; onRequestDone: () => void;
  onLink: (slot: string) => void; onDraft: (d: DraftInfo) => void; onView: (name: string, module: string) => void;
}) {
  const init = useMemo(loadDraft, []);
  const [docs, setDocs] = useState<Docs>(init?.docs ?? { line: [], filled: [] });
  const [meta, setMeta] = useState<Meta>(init?.meta ?? EMPTY_META);
  const [materialBase, setMaterialBase] = useState(init?.materialBase ?? false);
  const past = useRef<Docs[]>([]), future = useRef<Docs[]>([]);
  const [, bump] = useState(0);
  const [active, setActive] = useState<IconStyle>('line');
  const [mode, setMode] = useState<Mode>(init && init.docs.line.length + init.docs.filled.length > 0 ? 'draw' : 'upload');
  const [selected, setSelected] = useState<Path | null>(null);
  const [opts, setOpts] = useState<DrawOpts>({ tool: 'pen', snap: G.snapDefault, angle: true, rx: G.minCornerRadius, penR: 2, cut: false });
  const [ov, setOv] = useState({ grid: true, live: true, keylines: true, gap: false });
  const [msg, setMsg] = useState('');
  const [pick, setPick] = useState<CheckResult | null>(null);
  const [toast, setToast] = useState<{ name: string; module: string; text: string } | null>(null);
  const timer = useRef<number>();
  const say = (m: string) => { setMsg(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setMsg(''), 6000); };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hasWork = docs.line.length + docs.filled.length > 0;
  useEffect(() => { saveDraft(docs, meta, materialBase); }, [docs, meta, materialBase]);
  useEffect(() => { onDraft({ hasWork, name: meta.name, label: meta.label }); }, [hasWork, meta.name, meta.label]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onLink(meta.link); }, [meta.link]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback((next: Docs) => {
    setDocs((cur) => { past.current.push(cur); if (past.current.length > 200) past.current.shift(); future.current = []; return next; });
    bump((n) => n + 1);
  }, []);
  const setStyleEls = (style: IconStyle, els: El[]) => commit({ ...docs, [style]: els });
  const undo = () => { const p = past.current.pop(); if (!p) return; future.current.push(docs); setDocs(p); setSelected(null); bump((n) => n + 1); };
  const redo = () => { const f = future.current.pop(); if (!f) return; past.current.push(docs); setDocs(f); setSelected(null); bump((n) => n + 1); };
  const switchStyle = (s: IconStyle) => { setActive(s); setSelected(null); setPick(null); };

  // Keyboard: undo/redo, delete, nudge.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (!selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); setStyleEls(active, updateAt(docs[active], selected, () => null)); setSelected(null); return; }
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (d) {
        e.preventDefault();
        const el = getAt(docs[active], selected);
        if (el) setStyleEls(active, updateAt(docs[active], selected, () => translateEl(el, d[0] * opts.snap, d[1] * opts.snap)));
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  // Requests from the shell: open a library slot (#/builder?slot=name, "Build", "Edit in builder") or start a new icon.
  const handled = useRef(0);
  useEffect(() => {
    if (!request || handled.current === request.nonce) return;
    handled.current = request.nonce;
    onRequestDone();
    if (request.kind === 'new') {
      if (hasWork && !confirm('Start a new icon? This clears the canvas and the name. (Undo brings the drawing back.)')) return;
      if (hasWork) commit({ line: [], filled: [] });
      setMeta(EMPTY_META); setMaterialBase(false); setSelected(null); setPick(null); setMode('upload'); setActive('line');
      say('New icon: upload, build from parts or draw.');
      return;
    }
    const e = data.index.icons.find((i) => i.name === request.name);
    if (!e) { say(`There is no library slot called "${request.name}".`); onLink(meta.link); return; }
    if (hasWork && meta.link === e.name) { say(`Continuing your unsaved work on ${e.name}.`); return; }
    if (hasWork && !confirm(`Replace the work in the builder with "${e.label}"? (Undo brings it back.)`)) { onLink(meta.link); return; }
    const l = data.svgs.line[e.name], f = data.svgs.filled[e.name];
    commit({ line: l ? fromSvg(l) : [], filled: f ? fromSvg(f) : [] });
    setMeta({ name: e.name, label: e.label, module: e.module, tags: e.tags.join(', '), link: e.name });
    setMaterialBase(false);
    setSelected(null);
    setPick(null);
    setMode(l || f ? 'draw' : 'upload');
    say(l || f ? `Opened ${e.name} from the library.` : `${e.name} has no SVG yet: upload, build or draw it. Adding it fills this slot.`);
  }, [request?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const svgs = { line: toSvg('line', docs.line), filled: toSvg('filled', docs.filled) };
  const reports = useMemo(() => ({
    line: docs.line.length ? checkSvg(svgs.line, 'line', { materialBase }) : null,
    filled: docs.filled.length ? checkSvg(svgs.filled, 'filled', { materialBase }) : null,
  }), [svgs.line, svgs.filled, materialBase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- code box (two-way) ---------- */
  const [code, setCode] = useState(svgs[active]);
  const [codeErr, setCodeErr] = useState('');
  const codeFocus = useRef(false);
  useEffect(() => { if (!codeFocus.current) { setCode(svgs[active]); setCodeErr(''); } }, [svgs[active], active]); // eslint-disable-line react-hooks/exhaustive-deps
  const applyCode = (text: string) => {
    try {
      const els = fromSvg(text);
      if (toSvg(active, els) !== svgs[active]) setStyleEls(active, els);
      setCodeErr('');
    } catch (e) { setCodeErr((e as Error).message); }
  };
  useEffect(() => {
    if (!codeFocus.current) return;
    const t = window.setTimeout(() => applyCode(code), 500);
    return () => window.clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- upload ---------- */
  const [paste, setPaste] = useState<Record<IconStyle, string>>({ line: '', filled: '' });
  const [notes, setNotes] = useState<Record<IconStyle, string[]>>({ line: [], filled: [] });
  const [dragOver, setDragOver] = useState<IconStyle | null>(null);
  const takeSvg = (style: IconStyle, text: string, from: string) => {
    try {
      const n = normalizeSvg(text, style);
      setStyleEls(style, n.children);
      setNotes((x) => ({ ...x, [style]: n.notes }));
      setMaterialBase(false);
      switchStyle(style);
      say(`${cap(style)} SVG from ${from} normalised. Check the guard rails.`);
    } catch (e) { say(`Could not read that SVG: ${(e as Error).message}`); }
  };
  const readFile = (style: IconStyle, f: File | undefined) => {
    if (!f) return;
    if (f.size > 500_000) { say('That file is over 500 kB: not an icon.'); return; }
    void f.text().then((t) => takeSvg(style, t, f.name));
  };
  const onDrop = (style: IconStyle) => (e: DragEvent) => { e.preventDefault(); setDragOver(null); readFile(style, e.dataTransfer.files[0]); };

  /* ---------- build from parts ---------- */
  const [baseKind, setBaseKind] = useState<'library' | 'material' | 'none'>('library');
  const [baseQ, setBaseQ] = useState('');
  const [base, setBase] = useState('');
  const [part, setPart] = useState('add');
  const drawnIcons = data.index.icons.filter((i) => data.svgs.line[i.name] || data.svgs.filled[i.name]);
  const libMatches = drawnIcons.filter((i) => !baseQ || i.name.includes(baseQ.toLowerCase()) || i.label.toLowerCase().includes(baseQ.toLowerCase())).slice(0, 40);
  const matMatches = useMemo(() => (baseKind === 'material' ? searchSymbols(baseQ, 40) : []), [baseKind, baseQ]);
  const build = async () => {
    const p = part === 'none' ? null : PART_BY_ID.get(part) ?? null;
    let line: string | null = null, filled: string | null = null, mat = false;
    if (baseKind === 'library' && base) { line = data.svgs.line[base] ?? null; filled = data.svgs.filled[base] ?? null; }
    if (baseKind === 'material' && base) {
      const e = await loadSymbol(base);
      if (e.state !== 'ready') { say(`"${base}" is not a Material Symbol.`); return; }
      line = normalizeSvg(materialSvg(e.line), 'line').svg;
      filled = normalizeSvg(materialSvg(e.fill), 'filled').svg;
      mat = true;
    }
    if (!line && !filled && !p) { say('Pick a base, a badge, or both.'); return; }
    try {
      commit({ line: fromSvg(compose(line, p, 'line')), filled: fromSvg(compose(filled, p, 'filled')) });
      setMaterialBase(mat);
      setSelected(null);
      say(mat ? 'Built on a Material base: redraw recommended (Material outlines are filled shapes, not ANTZ strokes).' : 'Built line and filled from parts.');
    } catch (e) { say(`Could not build: ${(e as Error).message}`); }
  };

  /* ---------- name and add to library ---------- */
  const modules = [...new Set(data.index.icons.map((i) => i.module))];
  const [newModule, setNewModule] = useState(false);
  const linked = meta.link ? data.index.icons.find((i) => i.name === meta.link) : undefined;
  // A link to a slot that no longer exists in the live library (removed on disk) is dropped.
  useEffect(() => { if (live && meta.link && !linked) setMeta((m) => ({ ...m, link: '' })); }, [live, meta.link, linked]);
  const nameErr = !meta.name ? 'Name is required.' : !NAME_RE.test(meta.name) ? 'Use snake_case: a–z, 0–9 and _ only.'
    : data.index.icons.some((i) => i.name === meta.name) && meta.name !== meta.link ? `"${meta.name}" already exists. Link to it to replace it, or pick another name.` : '';
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (nameErr) { say(nameErr); return; }
    const hasL = docs.line.length > 0, hasF = docs.filled.length > 0;
    if (!hasL && !hasF) { say('Nothing to add: upload, build or draw an icon first.'); return; }
    if ((!hasL || !hasF) && !confirm(`Only the ${hasL ? 'line' : 'filled'} style is drawn. Library icons need both styles. Add it anyway?`)) return;
    if ((reports.line?.level === 'fail' || reports.filled?.level === 'fail') && !confirm('Some guard rails fail. Add it to the library as a draft anyway?')) return;
    setSaving(true);
    try {
      const tags = meta.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const r = await saveIcon({
        entry: { name: meta.name, label: meta.label || meta.name.replace(/_/g, ' '), module: meta.module || linked?.module || 'Unsorted', tags, status: 'draft' },
        line: hasL ? svgs.line : null, filled: hasF ? svgs.filled : null, replaces: meta.link || null,
      });
      setMeta((m) => ({ ...m, link: r.entry.name }));
      const text = `Added ${r.entry.name} to the library as a draft (line ${r.report.line ?? 'none'}, filled ${r.report.filled ?? 'none'}).`;
      say(text);
      setToast({ name: r.entry.name, module: r.entry.module, text: `Added ${r.entry.label} to the library` });
    } catch (e) { say(`Not added: ${(e as Error).message}`); } finally { setSaving(false); }
  };
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 12000);
    return () => window.clearTimeout(t);
  }, [toast]);
  const linkTo = (name: string) => {
    const e = data.index.icons.find((i) => i.name === name);
    setMeta((m) => (e ? { name: e.name, label: e.label, module: e.module, tags: e.tags.join(', '), link: e.name } : { ...m, link: '' }));
  };

  const clearAll = () => { if (confirm('Clear both styles and the name? (Undo brings the drawing back.)')) { commit({ line: [], filled: [] }); setMeta(EMPTY_META); setMaterialBase(false); setSelected(null); setPick(null); } };
  const copyLineToFilled = () => { commit({ ...docs, filled: docs.line.map((e) => ({ ...e })) }); switchStyle('filled'); say('Copied the line shapes into filled. Make them solid shapes with cut-outs: strokes are flagged.'); };

  const other: IconStyle = active === 'line' ? 'filled' : 'line';
  const tools: { id: Tool; label: string; icon: string; key: string }[] = [
    { id: 'select', label: 'Select / move', icon: 'arrow_selector_tool', key: 'V' },
    { id: 'line', label: 'Line', icon: 'pen_size_2', key: 'L' },
    { id: 'pen', label: 'Pen (straight segments, rounded corners)', icon: 'polyline', key: 'P' },
    { id: 'rect', label: 'Rectangle', icon: 'rectangle', key: 'R' },
    { id: 'circle', label: 'Circle', icon: 'circle', key: 'C' },
    { id: 'ellipse', label: 'Ellipse', icon: 'radio_button_unchecked', key: 'E' },
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [role="tab"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = tools.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (t) { setOpts((o) => ({ ...o, tool: t.id })); setMode('draw'); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
  // Upload and parts modes show the canvas for selecting and nudging only; drawing tools belong to Draw.
  const canvasOpts: DrawOpts = mode === 'draw' ? opts : { ...opts, tool: 'select' };

  /* ---------- step status ---------- */
  const rep = reports[active];
  const activePick = pick && rep && rep.results.find((r) => r.id === pick.id && r.title === pick.title);
  const onPick = (r: CheckResult) => {
    if (pick && pick.id === r.id && pick.title === r.title) { setPick(null); return; }
    setPick(r);
    if (r.id === 'gap') setOv((o) => ({ ...o, gap: true }));
    if (r.id === 'grid') setOv((o) => ({ ...o, grid: true }));
    if (r.id === 'keyline') setOv((o) => ({ ...o, keylines: true }));
  };
  const both = [reports.line, reports.filled].filter((r): r is Report => !!r);
  const worst: Level | 'none' = both.length ? both.reduce<Level>((a, r) => (RANK[r.level] > RANK[a] ? r.level : a), 'pass') : 'none';
  const tally = (lv: Level) => both.reduce((n, r) => n + r.results.filter((x) => x.level === lv).length, 0);
  const fails = tally('fail'), warns = tally('warn');
  const buildDone = docs.line.length > 0 && docs.filled.length > 0;
  const steps: { id: string; n: number; label: string; state: 'done' | 'todo' | 'warn' | 'fail'; note: string }[] = [
    { id: 'step-build', n: 1, label: 'Build', state: buildDone ? 'done' : 'todo', note: buildDone ? 'Line and filled' : hasWork ? `${docs.line.length ? 'Filled' : 'Line'} still empty` : 'Nothing yet' },
    { id: 'step-check', n: 2, label: 'Check', state: worst === 'fail' ? 'fail' : worst === 'warn' ? 'warn' : worst === 'none' ? 'todo' : 'done', note: worst === 'none' ? 'Waiting for an icon' : fails ? `${fails} failing` : warns ? `${warns} to review` : 'All rules pass' },
    { id: 'step-save', n: 3, label: 'Name and add', state: !nameErr && hasWork ? 'done' : 'todo', note: nameErr && meta.name ? 'Fix the name' : !meta.name ? 'Needs a name' : linked ? `Fills ${linked.name}` : meta.name },
  ];
  const jump = (id: string) => { const el = document.getElementById(id); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); el?.focus({ preventScroll: true }); };

  return (
    <div className="builder" data-scheme={scheme}>
      <header className="page-h b-head">
        <div className="page-t">
          <h1>{linked ? <>Building <span className="mono-t">{linked.name}</span></> : 'New icon'}</h1>
          <p className="page-sub">Build a line and a filled version, check them against the Material 3 guard rails, then name the icon and add it to the library.</p>
        </div>
        <ol className="stepper" aria-label="Steps">
          {steps.map((s) => (
            <li key={s.id} className={`step-i st-${s.state}`}>
              <button type="button" onClick={() => jump(s.id)} aria-label={`Step ${s.n}, ${s.label}: ${s.note}`}>
                <span className="step-n" aria-hidden="true">{s.state === 'done' ? <Ms n="check" size={16} /> : s.n}</span>
                <span className="step-l"><span>{s.label}</span><small>{s.note}</small></span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="b-grid">
        {/* ① Build */}
        <section className="step b-build" aria-labelledby="step-build">
          <h2 id="step-build" tabIndex={-1} className="step-h"><span className="step-n" aria-hidden="true">1</span>Build</h2>
          <Tabs<Mode> label="How to build" idBase="mode" value={mode} onChange={setMode} items={MODES} />

          <div className="mode-p" role="tabpanel" id={`mode-p-${mode}`} aria-labelledby={`mode-t-${mode}`}>
            {mode === 'upload' && (
              <div className="ups">
                {(['line', 'filled'] as IconStyle[]).map((s) => (
                  <div key={s} className={`up${dragOver === s ? ' is-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(s); }} onDragLeave={() => setDragOver(null)} onDrop={onDrop(s)}>
                    <p className="up-h">{cap(s)} <LevelChip level={reports[s]?.level ?? 'none'} /></p>
                    <label className="drop"><Ms n="upload_file" size={20} /><span>Drop an .svg or <u>choose a file</u></span>
                      <input type="file" accept=".svg,image/svg+xml" className="sr-only" onChange={(e) => { readFile(s, e.target.files?.[0]); e.target.value = ''; }} /></label>
                    <textarea className="code code-sm" placeholder={`Or paste ${s} SVG code`} value={paste[s]} onChange={(e) => setPaste((p) => ({ ...p, [s]: e.target.value }))} aria-label={`Paste ${s} SVG code`} />
                    <button type="button" className="btn btn-sm" disabled={!paste[s].trim()} onClick={() => takeSvg(s, paste[s], 'pasted code')}>Use pasted {s} SVG</button>
                    {notes[s].length > 0 && <details className="notes-d"><summary>What normalising changed ({notes[s].length})</summary><ul className="notes">{notes[s].map((n) => <li key={n}>{n}</li>)}</ul></details>}
                  </div>
                ))}
              </div>
            )}

            {mode === 'parts' && (
              <div className="parts">
                <div className="parts-base">
                  <Segmented<'library' | 'material' | 'none'> label="Base" value={baseKind} onChange={(k) => { setBaseKind(k); setBase(''); setBaseQ(''); }}
                    options={[{ value: 'library', label: 'Library icon' }, { value: 'material', label: 'Material' }, { value: 'none', label: 'No base' }]} />
                  {baseKind !== 'none' && <>
                    <input className="field" type="search" placeholder={baseKind === 'library' ? `Search ${drawnIcons.length} drawn icons` : 'Search Material Symbols'} value={baseQ} onChange={(e) => setBaseQ(e.target.value)} aria-label="Search base icons" />
                    <ul className="pick" role="listbox" aria-label="Base icon">
                      {baseKind === 'library' && libMatches.map((i) => (
                        <li key={i.name} role="option" aria-selected={base === i.name}><button type="button" onClick={() => setBase(i.name)}>
                          {data.svgs.line[i.name] ? <LibSvg svg={data.svgs.line[i.name]} size={20} /> : <LibSvg svg={data.svgs.filled[i.name]} size={20} />}<span className="mono">{i.name}</span></button></li>
                      ))}
                      {baseKind === 'library' && !libMatches.length && <li className="muted">No drawn library icons match.</li>}
                      {baseKind === 'material' && matMatches.map((n) => (
                        <li key={n} role="option" aria-selected={base === n}><button type="button" onClick={() => setBase(n)}><SymbolIcon name={n} style="line" size={20} /><span className="mono">{n}</span></button></li>
                      ))}
                    </ul>
                    {baseKind === 'material' && <p className="muted">Material is a reference: a Material base is flagged “redraw recommended”.</p>}
                  </>}
                </div>
                <div className="parts-badge">
                  <label className="fld">
                    <span>Badge</span>
                    <select value={part} onChange={(e) => setPart(e.target.value)}>
                      <option value="none">None</option>
                      {PARTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>
                  <p className="muted">Badges sit bottom-right with a {G.badgeGap}px cut-out gap. Building replaces both styles (Undo restores them).</p>
                  <button type="button" className="btn" onClick={() => void build()}><Ms n="build" size={18} />Build line and filled</button>
                </div>
              </div>
            )}

            {mode === 'draw' && (
              <div className="draw">
                <div className="b-toolbar" role="toolbar" aria-label="Drawing tools">
                  {tools.map((t) => (
                    <button key={t.id} type="button" className="tool" aria-pressed={opts.tool === t.id} title={`${t.label} (${t.key})`} aria-label={t.label} onClick={() => setOpts((o) => ({ ...o, tool: t.id }))}>
                      <Ms n={t.icon} size={20} />
                    </button>
                  ))}
                  <span className="tb-sep" />
                  <button type="button" className="tool" title="Delete selected (Delete)" aria-label="Delete selected" disabled={!selected} onClick={() => { if (selected) { setStyleEls(active, updateAt(docs[active], selected, () => null)); setSelected(null); } }}><Ms n="delete" size={20} /></button>
                </div>
                <div className="b-options">
                  <label className="check"><input type="checkbox" checked={opts.snap === G.snapFine} onChange={(e) => setOpts((o) => ({ ...o, snap: e.target.checked ? G.snapFine : G.snapDefault }))} />Half-pixel snap ({G.snapFine})</label>
                  <label className="check"><input type="checkbox" checked={opts.angle} onChange={(e) => setOpts((o) => ({ ...o, angle: e.target.checked }))} />{G.angleSnapDeg}° angles</label>
                  {opts.tool === 'rect' && <label className="fld fld-inline"><span>Corner rx</span><input className="field num" type="number" min={0} max={6} step={0.5} value={opts.rx} onChange={(e) => setOpts((o) => ({ ...o, rx: Math.max(0, Number(e.target.value)) }))} /></label>}
                  {opts.tool === 'pen' && <label className="fld fld-inline"><span>Corner radius</span><input className="field num" type="number" min={0} max={6} step={0.5} value={opts.penR} onChange={(e) => setOpts((o) => ({ ...o, penR: Math.max(0, Number(e.target.value)) }))} /></label>}
                  {active === 'filled' && opts.tool !== 'select' && <label className="check"><input type="checkbox" checked={opts.cut} onChange={(e) => setOpts((o) => ({ ...o, cut: e.target.checked }))} />Draw as 2px cut-out</label>}
                </div>
                <p className="muted hint">{opts.tool === 'pen' ? 'Pen: click to add points, click the first point to close, double-click or Enter to finish, Esc to cancel.'
                  : opts.tool === 'select' ? 'Select: click a shape, drag to move, arrow keys nudge, Delete removes.' : 'Drag on the canvas to draw. Coordinates snap to the grid.'}</p>
              </div>
            )}
          </div>

          <div className="cv-bar">
            <div className="style-tabs" role="group" aria-label="Style on the canvas">
              {(['line', 'filled'] as IconStyle[]).map((s) => (
                <button key={s} type="button" aria-pressed={active === s} onClick={() => switchStyle(s)}>
                  <span className="st-mini"><DocSvg style={s} els={docs[s]} size={18} /></span>{cap(s)}<LevelChip level={reports[s]?.level ?? 'none'} />
                </button>
              ))}
            </div>
            <span className="grow" />
            <button type="button" className="tool" title="Undo (Cmd/Ctrl+Z)" aria-label="Undo" disabled={!past.current.length} onClick={undo}><Ms n="undo" size={20} /></button>
            <button type="button" className="tool" title="Redo (Shift+Cmd/Ctrl+Z)" aria-label="Redo" disabled={!future.current.length} onClick={redo}><Ms n="redo" size={20} /></button>
          </div>

          <div className="canvases">
            <figure className="cv-main">
              <Canvas style={active} els={docs[active]} overlays={ov} gap={ov.gap} opts={canvasOpts} fine={opts.snap < 1} selected={selected} setSelected={setSelected}
                onCommit={(els) => setStyleEls(active, els)} highlight={activePick && rep ? <Highlight rule={activePick} report={rep} /> : null} />
              <figcaption>
                <span>{cap(active)}{mode === 'draw' ? `, ${tools.find((t) => t.id === opts.tool)?.label.split(' (')[0].toLowerCase()} tool` : ', select and nudge'}</span>
                <span className="ovs" role="group" aria-label="Overlays">
                  {([['grid', 'Grid'], ['live', 'Live area'], ['keylines', 'Keylines'], ['gap', '2px gap']] as const).map(([k, l]) => (
                    <label key={k} className="check"><input type="checkbox" checked={ov[k]} onChange={(e) => setOv((o) => ({ ...o, [k]: e.target.checked }))} />{l}</label>
                  ))}
                </span>
              </figcaption>
            </figure>
            <div className="cv-side">
              <button type="button" className="cv-other" onClick={() => switchStyle(other)} aria-label={`Show ${other} on the canvas`}>
                <span className="canvas canvas-small"><DocSvg style={other} els={docs[other]} className="canvas-icon" /></span>
                <span className="muted">{cap(other)}: select to edit</span>
              </button>
              <div className="previews" aria-label="Live preview at small sizes">
                {(['line', 'filled'] as IconStyle[]).map((s) => (
                  <div key={s} className="pv-row">
                    <span className="pv-l">{cap(s)}</span>
                    {[16, 20, 24, 48].map((z) => <span key={z} className="pv" title={`${z}px`}><DocSvg style={s} els={docs[s]} size={z} /><small>{z}</small></span>)}
                  </div>
                ))}
              </div>
              <div className="b-actions">
                <button type="button" className="btn btn-sm" onClick={copyLineToFilled} disabled={!docs.line.length}><Ms n="content_copy" size={16} />Line to filled</button>
                <button type="button" className="btn btn-sm btn-quiet" onClick={clearAll} disabled={!hasWork && !meta.name}><Ms n="restart_alt" size={16} />Clear</button>
              </div>
            </div>
          </div>
          <p className="status" role="status" aria-live="polite">{msg}</p>

          <details className="code-d">
            <summary><Ms n="chevron_right" size={18} />SVG code ({active}): edit to update the canvas</summary>
            <div className="code-b">
              <textarea className="code" spellCheck={false} value={code} aria-label={`${active} SVG code`} aria-invalid={!!codeErr}
                onFocus={() => { codeFocus.current = true; }} onBlur={() => { codeFocus.current = false; applyCode(code); }} onChange={(e) => setCode(e.target.value)} />
              {codeErr && <p className="warn-line" role="alert"><Ms n="error" size={16} fill />{codeErr}</p>}
              <button type="button" className="btn btn-sm" onClick={() => takeSvg(active, code, 'the code box')}><Ms n="auto_fix" size={16} />Normalise this code</button>
            </div>
          </details>
        </section>

        {/* ② Check */}
        <section className="step b-check" aria-labelledby="step-check">
          <h2 id="step-check" tabIndex={-1} className="step-h">
            <span className="step-n" aria-hidden="true">2</span>
            <a href={M3_ICONS_URL} target="_blank" rel="noopener noreferrer" className="gr-link">Guard rails · Material Design 3<Ms n="open_in_new" size={16} /><span className="sr-only"> (opens m3.material.io in a new tab)</span></a>
          </h2>
          <p className="muted">Material 3 icon rules, plus ANTZ house rules where M3 gives no value or ANTZ departs on purpose.</p>
          <div className="gr-styles" role="group" aria-label="Guard rails for">
            {(['line', 'filled'] as IconStyle[]).map((s) => (
              <button key={s} type="button" aria-pressed={active === s} onClick={() => switchStyle(s)}>{cap(s)}<LevelChip level={reports[s]?.level ?? 'none'} /></button>
            ))}
          </div>
          {materialBase && <p className="flag"><Ms n="flag" size={16} fill />Material base, redraw recommended</p>}
          {rep ? <>
            <p className="muted gr-hint">Select a rule marked <Ms n="ads_click" size={14} /> to see it on the canvas.</p>
            <RuleList report={rep} active={activePick ? activePick.id + activePick.title : undefined} onPick={onPick} pickable={(r) => PICKABLE.has(r.id)} />
          </> : <div className="gr-empty"><Ms n="rule" size={24} /><p>No {active} icon yet. Upload, build or draw one and every rule is checked as you go.</p></div>}
        </section>

        {/* ③ Name and add to library */}
        <section className="step b-save" aria-labelledby="step-save">
          <h2 id="step-save" tabIndex={-1} className="step-h"><span className="step-n" aria-hidden="true">3</span>Name and add to library</h2>
          <form className="save-f" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <label className="fld">
              <span>Name (snake_case)</span>
              <input className="field mono-f" value={meta.name} onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value.trim() }))} aria-invalid={!!(meta.name && nameErr)} aria-describedby="name-err" placeholder="egg_nest" autoComplete="off" spellCheck={false} />
            </label>
            {meta.name && nameErr && <p id="name-err" className="warn-line"><Ms n="error" size={16} fill />{nameErr}</p>}
            <label className="fld"><span>Label</span><input className="field" value={meta.label} onChange={(e) => setMeta((m) => ({ ...m, label: e.target.value }))} placeholder="Egg in nest" /></label>
            <label className="fld">
              <span>Module</span>
              {newModule ? <input className="field" value={meta.module} onChange={(e) => setMeta((m) => ({ ...m, module: e.target.value }))} placeholder="New module name" />
                : <select value={meta.module} onChange={(e) => { if (e.target.value === '__new') { setNewModule(true); setMeta((m) => ({ ...m, module: '' })); } else setMeta((m) => ({ ...m, module: e.target.value })); }}>
                  <option value="">Choose…</option>
                  {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value="__new">New module…</option>
                </select>}
            </label>
            <label className="fld"><span>Tags (comma separated)</span><input className="field" value={meta.tags} onChange={(e) => setMeta((m) => ({ ...m, tags: e.target.value }))} /></label>
            <label className="fld">
              <span>Fills a “To design” slot (optional)</span>
              <select value={meta.link} onChange={(e) => linkTo(e.target.value)}>
                <option value="">No slot: a new library entry</option>
                <optgroup label="To design">
                  {data.index.icons.filter((i) => i.status === 'to_design').map((i) => <option key={i.name} value={i.name}>{i.label} ({i.name})</option>)}
                </optgroup>
                <optgroup label="Draft or approved (replace)">
                  {data.index.icons.filter((i) => i.status !== 'to_design').map((i) => <option key={i.name} value={i.name}>{i.label} ({i.name}, {STATUS_LABEL[i.status]})</option>)}
                </optgroup>
              </select>
            </label>
            {linked && <p className="muted">Adding {meta.name === linked.name ? 'fills' : 'replaces'} the “{linked.label}” slot and keeps its {linked.sources.length} old sources.</p>}

            <div className={`gr-sum gr-sum-${worst}`} aria-label="Guard-rail summary">
              <span className="gr-sum-h">Guard rails</span>
              <LevelChip level={reports.line?.level ?? 'none'}>Line</LevelChip>
              <LevelChip level={reports.filled?.level ?? 'none'}>Filled</LevelChip>
              <p>{worst === 'none' ? 'Nothing to check yet.' : fails ? `${fails} rule${fails > 1 ? 's' : ''} failing. You can still add it as a draft.` : warns ? `${warns} warning${warns > 1 ? 's' : ''} to review.` : 'Every rule passes.'}{!buildDone && hasWork ? ` The ${docs.line.length ? 'filled' : 'line'} style is still empty.` : ''}</p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !live || !!nameErr || !hasWork}><Ms n="library_add" size={20} />{saving ? 'Adding…' : 'Add to library'}</button>
            {!live ? <p className="muted">Adding needs the dev server (npm run dev).</p> : <p className="muted">Added icons start as Draft. Unsaved work stays in this browser under Drafts.</p>}
          </form>
        </section>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Ms n="check_circle" size={20} fill />
          <span>{toast.text}</span>
          <button type="button" className="btn btn-sm btn-on-toast" onClick={() => { const t = toast; setToast(null); onView(t.name, t.module); }}>View in library</button>
          <button type="button" className="icon-btn icon-btn-sm" aria-label="Dismiss" onClick={() => setToast(null)}><Ms n="close" size={18} /></button>
        </div>
      )}
    </div>
  );
}
