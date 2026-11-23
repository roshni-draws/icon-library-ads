import { useMemo } from 'react';
import { CUSTOM_BY_ID, parseSvg } from '../lib/custom';
import { uniqueInner } from '../lib/iconLibrary';
import { MATERIAL_VIEWBOX, useSymbol, type Style } from '../lib/symbols';
import { Ms } from './Segmented';

const PAINT = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule'] as const;
const camel = (k: string) => k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** A library SVG (line or filled) rendered inline so it takes currentColor. Mask ids are made unique per instance. */
export function LibSvg({ svg, size, title, className = 'glyph' }: { svg: string; size: number | string; title?: string; className?: string }) {
  const { inner, attrs } = useMemo(() => uniqueInner(svg), [svg]);
  const paint: Record<string, string> = {};
  for (const k of PAINT) if (attrs[k] !== undefined) paint[camel(k)] = attrs[k];
  return (
    <svg className={className} width={size} height={size} viewBox={attrs.viewBox ?? '0 0 24 24'} {...paint} role={title ? 'img' : undefined} aria-label={title}
      aria-hidden={title ? undefined : true} focusable="false" dangerouslySetInnerHTML={{ __html: inner }} />
  );
}

/** Material Symbols Rounded, used only as a reference ("ghost") and as a build base. */
export function SymbolIcon({ name, style, size, title, className = 'glyph' }: { name: string; style: Style; size: number; title?: string; className?: string }) {
  const e = useSymbol(name);
  if (e.state === 'missing') return <span className="glyph-missing" style={{ width: size, height: size }} title={`"${name}" is not in @material-symbols/svg-400`}><Ms n="warning" size={Math.max(12, Math.round(size * 0.7))} fill /></span>;
  if (e.state === 'loading') return <span className="glyph-loading" style={{ width: size, height: size }} aria-hidden="true" />;
  return <svg className={className} width={size} height={size} viewBox={MATERIAL_VIEWBOX} fill="currentColor" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title} focusable="false" dangerouslySetInnerHTML={{ __html: style === 'line' ? e.line : e.fill }} />;
}

/** Earlier custom draft (src/custom), shown as a reference for zoo concepts with no Material Symbol. */
export function DraftGlyph({ id, style, size, className = 'glyph' }: { id: string; style: Style; size: number; className?: string }) {
  const c = CUSTOM_BY_ID.get(id);
  if (!c) return null;
  const { viewBox, body } = parseSvg(style === 'line' ? c.line : c.filled);
  return <svg className={className} width={size} height={size} viewBox={viewBox} fill="currentColor" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: body }} />;
}

/** Empty 24 grid slot for an icon with no SVG yet. */
export function EmptySlot({ size, label = 'To design' }: { size: number; label?: string }) {
  const s = Math.max(size, 24);
  return (
    <span className="slot" style={{ width: s, height: s }} title={label}>
      <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true">
        <rect x="0.5" y="0.5" width="23" height="23" rx="2" className="slot-frame" />
        <rect x="2" y="2" width="20" height="20" rx="1" className="slot-live" />
      </svg>
    </span>
  );
}
