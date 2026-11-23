import { useEffect, useMemo, useRef, useState } from 'react';
import { checkSvg } from '../lib/checker';
import { INV_BY_FILE, currentSrc } from '../lib/data';
import type { LibStyle } from '../lib/hash';
import { STATUS_LABEL, patchIcon, type LibData, type Status } from '../lib/iconLibrary';
import type { SchemeKey } from '../lib/library';
import { DraftGlyph, EmptySlot, LibSvg, SymbolIcon } from './Icon';
import { draftIdOf } from './Library';
import { GridOverlay } from './Overlay';
import { PrimaryPeek } from './Primary';
import { primaryFor, type PrimaryData } from '../lib/primary';
import { LevelChip, ReportView } from './Report';
import { Ms, Segmented } from './Segmented';

const cap = (s: LibStyle) => (s === 'line' ? 'Line' : 'Filled');

/** Side detail panel for one library icon, shown in the style of the current library page (with a peek at the other). */
export function IconDrawer({ name, style, data, scheme, live, onClose, onBuild, primary, primaryHref }: {
  name: string; style: LibStyle; data: LibData; scheme: SchemeKey; live: boolean; onClose: () => void; onBuild: (name: string) => void;
  primary?: PrimaryData; primaryHref?: (name: string) => string;
}) {
  const e = data.index.icons.find((i) => i.name === name);
  const [shown, setShown] = useState<LibStyle>(style);
  const [grid, setGrid] = useState(true);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number>();
  useEffect(() => { heading.current?.focus(); setStatus(''); }, [name]);
  useEffect(() => setShown(style), [style, name]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const say = (m: string) => { setStatus(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setStatus(''), 5000); };

  const line = data.svgs.line[name], filled = data.svgs.filled[name];
  const reports = useMemo(() => ({ line: line ? checkSvg(line, 'line') : null, filled: filled ? checkSvg(filled, 'filled') : null }), [line, filled]);
  const svg = shown === 'line' ? line : filled;

  const copy = async (what: string, text: string | undefined) => {
    if (!text) { say(`Nothing to copy: no ${what} yet.`); return; }
    try { await navigator.clipboard.writeText(text); say(`Copied ${what}.`); } catch { say('Could not copy: the browser blocked the clipboard.'); }
  };
  const setSt = async (s: Status) => {
    if (!e) return;
    if (s === 'approved' && (!line || !filled)) { say('Approve needs both a line and a filled SVG.'); return; }
    if (s === 'approved' && (reports.line?.level === 'fail' || reports.filled?.level === 'fail') && !confirm('Some guard rails fail. Approve anyway?')) return;
    setBusy(true);
    try { await patchIcon(e.name, { status: s }); say(`Status set to ${STATUS_LABEL[s]}.`); } catch (err) { say((err as Error).message); } finally { setBusy(false); }
  };

  const draft = e ? draftIdOf(e) : null;
  const prim = primary && e ? primaryFor(primary, e.name) : undefined;
  return (
    <aside className="panel-d" aria-labelledby="detail-h">
      <div className="pd-h">
        <div className="grow">
          <h2 id="detail-h" ref={heading} tabIndex={-1}>{e?.label ?? 'Not found'}</h2>
          {e && <p className="pd-sub"><code>{e.name}</code> in {e.module}</p>}
        </div>
        <button type="button" className="icon-btn" aria-label="Close details" title="Close (Esc)" onClick={onClose}><Ms n="close" size={20} /></button>
      </div>
      {!e ? <div className="pd-body"><p className="muted">This icon is not in the library.</p></div> : (
        <div className="pd-body">
          <figure className="pd-preview" data-scheme={scheme}>
            <div className="big-canvas">
              {grid && <GridOverlay />}
              {svg ? <LibSvg svg={svg} size="100%" title={`${e.label}, ${shown}`} /> : <span className="big-empty"><EmptySlot size={48} /><span>No {shown} version yet</span></span>}
            </div>
            <figcaption className="pd-cap">
              <Segmented<LibStyle> label="Preview style" value={shown} onChange={setShown}
                options={(['line', 'filled'] as LibStyle[]).map((s) => ({ value: s, label: <>{cap(s)}{s !== style && <span className="sr-only"> (peek)</span>}</>, title: s === style ? `${cap(s)}: this page's style` : `Peek at the ${s} version` }))} />
              <label className="check"><input type="checkbox" checked={grid} onChange={(ev) => setGrid(ev.target.checked)} />Grid and keylines</label>
            </figcaption>
          </figure>

          <div className="pd-actions">
            <button type="button" className="btn btn-primary" onClick={() => onBuild(e.name)}><Ms n="draw" size={18} />{line || filled ? 'Edit in builder' : 'Build in builder'}</button>
            <button type="button" className="btn" onClick={() => void copy('the name', e.name)}><Ms n="content_copy" size={18} />Copy name</button>
            <button type="button" className="btn" onClick={() => void copy(`the ${shown} SVG`, svg)} disabled={!svg}><Ms n="code" size={18} />Copy {shown} SVG</button>
          </div>
          <p className="status" role="status" aria-live="polite">{status}</p>

          <section className="pd-sec" aria-labelledby="pd-st">
            <h3 id="pd-st">Status</h3>
            <div className="st-row" role="group" aria-label="Set status">
              <span className={`badge st-${e.status}`}>{STATUS_LABEL[e.status]}</span>
              <span className="grow" />
              {(['draft', 'approved'] as Status[]).map((s) => (
                <button key={s} type="button" className="btn btn-sm" aria-pressed={e.status === s} disabled={busy || !live || e.status === s} onClick={() => void setSt(s)}>
                  {s === 'approved' ? 'Approve' : 'Mark draft'}
                </button>
              ))}
              {e.status !== 'to_design' && <button type="button" className="btn btn-sm btn-quiet" disabled={busy || !live} onClick={() => void setSt('to_design')} title="Back to To design">Reset</button>}
            </div>
            {!live && <p className="muted">Read-only snapshot: run <code>npm run dev</code> to change status.</p>}
          </section>

          {prim && primary && primaryHref && (
            <section className="pd-sec" aria-labelledby="pd-prim">
              <h3 id="pd-prim">Primary version</h3>
              <PrimaryPeek e={prim} svg={primary.svgs[prim.name]} href={primaryHref(prim.name)} scheme={scheme} />
            </section>
          )}

          <section className="pd-sec" aria-labelledby="pd-gr">
            <h3 id="pd-gr">Guard rails <span className="pd-both"><LevelChip level={reports.line?.level ?? 'none'}>Line</LevelChip><LevelChip level={reports.filled?.level ?? 'none'}>Filled</LevelChip></span></h3>
            <ReportView report={reports[shown]} title={cap(shown)} compact />
          </section>

          {(e.reference || draft) && (
            <section className="pd-sec" aria-labelledby="pd-ref">
              <h3 id="pd-ref">References</h3>
              <div className="refs" data-scheme={scheme}>
                {e.reference && <figure><SymbolIcon name={e.reference} style="line" size={36} /><SymbolIcon name={e.reference} style="filled" size={36} /><figcaption>Material <code>{e.reference}</code> (reference only)</figcaption></figure>}
                {draft && <figure><DraftGlyph id={draft} style="line" size={36} /><DraftGlyph id={draft} style="filled" size={36} /><figcaption>Earlier draft <code>{draft}</code></figcaption></figure>}
              </div>
            </section>
          )}

          <section className="pd-sec" aria-labelledby="pd-src">
            <h3 id="pd-src">Old sources <span className="dim">{e.sources.length}</span></h3>
            <p className="muted">Current mobile SVGs merged into this icon, with the old mapping.</p>
            <ul className="sources">
              {e.sources.map((s) => {
                const r = INV_BY_FILE.get(s);
                return (
                  <li key={s}>
                    <img src={currentSrc(s)} alt="" width={32} height={32} />
                    <div>
                      <p className="mono">{s}</p>
                      {r && <p className="muted">{r.indicates}, {r.usedIn}{r.note ? `. ${r.note}` : ''}</p>}
                      {r && <p className="muted">Old mapping: <code>{r.name}</code> ({r.confidence})</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <dl className="dl">
            {e.tags.length > 0 && <div><dt>Tags</dt><dd>{e.tags.join(', ')}</dd></div>}
            {e.notes && <div><dt>Notes</dt><dd>{e.notes}</dd></div>}
            <div><dt>Files</dt><dd><code>library/line/{e.name}.svg</code><br /><code>library/filled/{e.name}.svg</code></dd></div>
          </dl>
        </div>
      )}
    </aside>
  );
}
