import { useCallback, useEffect, useState } from 'react';
import SNAPSHOT from 'virtual:library';

/**
 * The ANTZ icon library: ../library/index.json + line/<name>.svg + filled/<name>.svg (the source of truth).
 * In dev it is read and written through the dev-server API (/api/library) and reloads when files change on disk
 * (HMR event "antz:library-changed", plus a refetch when the window regains focus). A static build shows the
 * snapshot bundled at build time, read only.
 */
export type Status = 'to_design' | 'draft' | 'approved';
export const STATUSES: Status[] = ['to_design', 'draft', 'approved'];
export const STATUS_LABEL: Record<Status, string> = { to_design: 'To design', draft: 'Draft', approved: 'Approved' };

export interface LibEntry { name: string; label: string; module: string; status: Status; sources: string[]; reference: string | null; tags: string[]; notes: string }
export interface LibIndex { version: number; style: string; icons: LibEntry[] }
export interface LibData { index: LibIndex; svgs: { line: Record<string, string>; filled: Record<string, string> } }

export const NAME_RE = /^[a-z0-9_]+$/;

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`api/library${path}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) throw new Error('Saving needs the dev server: run npm run dev.');
  const j = (await r.json()) as T & { ok?: boolean; error?: string };
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
}

export const saveIcon = (b: { entry: Partial<LibEntry> & { name: string }; line?: string | null; filled?: string | null; replaces?: string | null }) =>
  api<{ ok: true; entry: LibEntry; report: { line: string | null; filled: string | null } }>('PUT', '/icon', b);
export const patchIcon = (name: string, b: Partial<Omit<LibEntry, 'name' | 'sources'>>) => api<{ ok: true; entry: LibEntry }>('PATCH', `/icon/${encodeURIComponent(name)}`, b);

export function useLibrary() {
  const [data, setData] = useState<LibData>(SNAPSHOT as LibData);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    try {
      const d = await api<LibData>('GET', '/');
      setData(d);
      setLive(true);
      setError('');
    } catch (e) {
      setLive(false);
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    addEventListener('focus', onFocus);
    const hot = import.meta.hot;
    const onChange = () => void reload();
    hot?.on('antz:library-changed', onChange);
    return () => { removeEventListener('focus', onFocus); hot?.off?.('antz:library-changed', onChange); };
  }, [reload]);
  return { data, live, error, reload };
}

let uid = 0;
/** Inner markup of an svg with ids made unique for inlining many icons on one page (mask ids would clash). */
export function uniqueInner(svg: string): { inner: string; attrs: Record<string, string> } {
  const n = ++uid;
  const open = /<svg\b([^>]*)>/.exec(svg);
  const attrs: Record<string, string> = {};
  if (open) for (const m of open[1].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = m[2];
  let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const ids = [...inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    inner = inner.replace(new RegExp(`id="${esc}"`, 'g'), `id="u${n}-${id}"`).replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#u${n}-${id})`);
  }
  return { inner, attrs };
}
