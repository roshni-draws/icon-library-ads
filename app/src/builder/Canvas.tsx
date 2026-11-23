import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react';
import { GridOverlay, type OverlayOpts } from '../components/Overlay';
import { GUARDRAILS as G } from '../lib/guardrails';
import { uniqueInner } from '../lib/iconLibrary';
import type { IconStyle } from '../lib/normalize';
import { fmt, serialize, translateEl, type El } from '../lib/svg';
import { addShape, leaves, penPath, samePath, snapAngle, toSvg, updateAt, type Path } from './doc';

export type Tool = 'select' | 'line' | 'pen' | 'rect' | 'circle' | 'ellipse';
export interface DrawOpts { tool: Tool; snap: number; angle: boolean; rx: number; penR: number; cut: boolean }
type Pt = [number, number];

const PAINT = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'] as const;
const camel = (k: string) => k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Renders a style's doc inline (unique mask ids per canvas). */
export function DocSvg({ style, els, className, size }: { style: IconStyle; els: El[]; className?: string; size?: number | string }) {
  const { inner, attrs } = useMemo(() => uniqueInner(toSvg(style, els)), [style, els]);
  const paint: Record<string, string> = {};
  for (const k of PAINT) if (attrs[k] !== undefined) paint[camel(k)] = attrs[k];
  return <svg className={className} viewBox="0 0 24 24" width={size} height={size} {...paint} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: inner }} />;
}

/**
 * The large 24 x 24 drawing canvas: overlays, the icon, a 2px gap preview, hit targets for selection and the
 * shape being drawn. All coordinates are snapped to the grid (1px by default, 0.5 optional) and lines/pen segments
 * to 45° when angle snap is on.
 */
export function Canvas({ style, els, overlays, gap, opts, selected, setSelected, onCommit, fine, highlight }: {
  style: IconStyle; els: El[]; overlays: OverlayOpts; gap: boolean; opts: DrawOpts; fine: boolean; highlight?: ReactNode;
  selected: Path | null; setSelected: (p: Path | null) => void; onCommit: (els: El[]) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState<El | null>(null);
  const [pen, setPen] = useState<Pt[]>([]);
  const [hover, setHover] = useState<Pt | null>(null);
  const drag = useRef<{ start: Pt; path?: Path; orig?: El; moved?: boolean } | null>(null);
  const [moving, setMoving] = useState<{ path: Path; el: El } | null>(null);
  const L = useMemo(() => leaves(els), [els]);
  const sw = String(G.strokeWidth);

  const toPt = (e: { clientX: number; clientY: number }, raw = false): Pt => {
    const s = svg.current!;
    const r = s.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 24, y = ((e.clientY - r.top) / r.height) * 24;
    if (raw) return [x, y];
    const q = opts.snap;
    return [Math.round(x / q) * q, Math.round(y / q) * q];
  };
  const shapeFor = (a: Pt, b: Pt): El | null => {
    const at = (attrs: Record<string, string>, tag: string): El => ({ tag, attrs, children: [] });
    switch (opts.tool) {
      case 'line': {
        const e = opts.angle ? snapAngle(a, b, G.angleSnapDeg, opts.snap) : b;
        if (e[0] === a[0] && e[1] === a[1]) return null;
        return at({ x1: fmt(a[0]), y1: fmt(a[1]), x2: fmt(e[0]), y2: fmt(e[1]) }, 'line');
      }
      case 'rect': {
        const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
        if (!w || !h) return null;
        const rx = Math.min(opts.rx, w / 2, h / 2);
        return at({ x: fmt(x), y: fmt(y), width: fmt(w), height: fmt(h), ...(rx ? { rx: fmt(rx) } : {}) }, 'rect');
      }
      case 'circle': {
        const r = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / opts.snap) * opts.snap;
        return r ? at({ cx: fmt(a[0]), cy: fmt(a[1]), r: fmt(r) }, 'circle') : null;
      }
      case 'ellipse': {
        const rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2;
        if (!rx || !ry) return null;
        return at({ cx: fmt((a[0] + b[0]) / 2), cy: fmt((a[1] + b[1]) / 2), rx: fmt(rx), ry: fmt(ry) }, 'ellipse');
      }
    }
    return null;
  };
  const finishPen = (closed: boolean) => {
    if (pen.length >= 2) onCommit(addShape(els, style, { tag: 'path', attrs: { d: penPath(pen, closed, opts.penR) }, children: [] }, opts.cut));
    setPen([]);
  };
  useEffect(() => { setPen([]); setDraft(null); }, [opts.tool, style]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (opts.tool !== 'pen' || !pen.length) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select')) return;
      if (e.key === 'Enter') { e.preventDefault(); finishPen(false); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setPen([]); }
    };
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  });

  const down = (e: RPE<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const p = toPt(e);
    const hitPath = (e.target as Element).closest('[data-path]')?.getAttribute('data-path');
    if (opts.tool === 'select') {
      if (hitPath) {
        const path = hitPath.split('.').map(Number);
        const leaf = L.find((l) => samePath(l.path, path));
        setSelected(path);
        drag.current = { start: p, path, orig: leaf?.el };
        svg.current?.setPointerCapture(e.pointerId);
      } else setSelected(null);
      return;
    }
    if (opts.tool === 'pen') {
      let q = p;
      if (pen.length && opts.angle) q = snapAngle(pen[pen.length - 1], p, G.angleSnapDeg, opts.snap);
      if (pen.length >= 2 && Math.hypot(q[0] - pen[0][0], q[1] - pen[0][1]) < 0.6) { finishPen(true); return; }
      if (pen.length && q[0] === pen[pen.length - 1][0] && q[1] === pen[pen.length - 1][1]) return;
      setPen([...pen, q]);
      return;
    }
    drag.current = { start: p };
    svg.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: RPE<SVGSVGElement>) => {
    const p = toPt(e);
    setHover(p);
    const d = drag.current;
    if (!d) return;
    if (opts.tool === 'select' && d.path && d.orig) {
      const dx = p[0] - d.start[0], dy = p[1] - d.start[1];
      if (dx || dy) { d.moved = true; setMoving({ path: d.path, el: translateEl(d.orig, dx, dy) }); }
      return;
    }
    if (opts.tool !== 'select') setDraft(shapeFor(d.start, p));
  };
  const up = (e: RPE<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (opts.tool === 'select') {
      if (d.moved && moving) onCommit(updateAt(els, moving.path, () => moving.el));
      setMoving(null);
      return;
    }
    const s = shapeFor(d.start, toPt(e));
    setDraft(null);
    if (s) onCommit(addShape(els, style, s, opts.cut));
  };

  const shown = moving ? updateAt(els, moving.path, () => moving.el) : els;
  const lastPen = pen[pen.length - 1];
  const penPreview = pen.length ? [...pen, hover ? (opts.angle ? snapAngle(lastPen, hover, G.angleSnapDeg, opts.snap) : hover) : lastPen] : [];
  const selLeaf = selected ? leaves(shown).find((l) => samePath(l.path, selected)) : null;
  const visibleLeaves = leaves(shown);

  return (
    <div className={`canvas canvas-${style}`}>
      <GridOverlay opts={overlays} fine={fine} />
      {gap && style === 'line' && (
        <svg className="gap-ov" viewBox="0 0 24 24" aria-hidden="true">
          {visibleLeaves.filter((l) => !l.inMask).map((l) => (
            <g key={l.path.join('.')} fill="none" stroke="currentColor" strokeWidth={G.strokeWidth + 2 * G.minGap} strokeLinecap="round" strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: serialize({ ...l.el, attrs: { ...l.el.attrs, 'stroke-width': String(G.strokeWidth + 2 * G.minGap), stroke: 'currentColor', fill: 'none' } }) }} />
          ))}
        </svg>
      )}
      <DocSvg style={style} els={shown} className="canvas-icon" />
      {highlight && <svg className="canvas-hl" viewBox="0 0 24 24" aria-hidden="true">{highlight}</svg>}
      <svg ref={svg} className={`canvas-hit tool-${opts.tool}`} viewBox="0 0 24 24" role="application" aria-label={`${style} drawing canvas, ${opts.tool} tool`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setHover(null)}
        onDoubleClick={() => { if (opts.tool === 'pen') finishPen(false); }}>
        {opts.tool === 'select' && visibleLeaves.map((l) => (
          <g key={l.path.join('.')} data-path={l.path.join('.')} className="hit" fill="transparent" stroke="transparent" strokeWidth={Math.max(G.strokeWidth, 1.5) + 1}
            dangerouslySetInnerHTML={{ __html: serialize({ ...l.el, attrs: { ...l.el.attrs, fill: 'transparent', stroke: 'transparent', 'stroke-width': '3' } }) }} />
        ))}
        {selLeaf && <g className="sel" dangerouslySetInnerHTML={{ __html: serialize({ ...selLeaf.el, attrs: { ...selLeaf.el.attrs, fill: 'none', stroke: 'currentColor', 'stroke-width': '0.25', 'stroke-dasharray': '0.6 0.4' } }) }} />}
        {draft && <g className="draft" fill={style === 'filled' && !opts.cut ? 'currentColor' : 'none'} stroke={style === 'line' || opts.cut ? 'currentColor' : 'none'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: serialize(draft) }} />}
        {penPreview.length > 1 && <path className="draft" d={penPath(penPreview, false, opts.penR)} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
        {pen.map((p, i) => <circle key={i} className="pen-pt" cx={p[0]} cy={p[1]} r={i === 0 ? 0.45 : 0.3} />)}
        {hover && opts.tool !== 'select' && <circle className="cursor-pt" cx={hover[0]} cy={hover[1]} r={0.22} />}
      </svg>
    </div>
  );
}
