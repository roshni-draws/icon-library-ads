import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { svgRoot } from './src/lib/svg';
import { checkSvg } from './src/lib/checker';

const app = fileURLToPath(new URL('.', import.meta.url));
// The ANTZ icon library (index.json + line/ + filled/) is the source of truth for icons.
const LIBRARY = resolve(fileURLToPath(new URL('../library/', import.meta.url)));
const SYMBOLS = `${app}node_modules/@material-symbols/svg-400/rounded/`;
/**
 * Primary icons (animated tile badges): library/primary/ with index.json, svg/<name>.svg, lottie/<name>.<scheme>.json
 * (one Lottie per colour scheme: light, light-medium-contrast, light-high-contrast, dark, dark-medium-contrast, dark-high-contrast).
 * ANTZ_PRIMARY_DIR points the app at another folder (for testing with a fixture) without touching library/.
 */
const PRIMARY = resolve(process.env.ANTZ_PRIMARY_DIR || resolve(LIBRARY, 'primary'));

/** Inner markup of a Material Symbols svg file (the paths, without the <svg> wrapper). */
const inner = (svg: string) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/**
 * Material Symbols Rounded (weight 400) from @material-symbols/svg-400, used as references and build bases.
 *  - virtual:symbol-index  every name in the package (for the Material search)
 *  - virtual:symbol-pack   line + fill markup for every name the inventory references (ghost references render at once)
 *  - /symbols/<name>.svg    any other file on demand (served from node_modules in dev, copied into dist on build)
 */
function materialSymbols(): Plugin {
  const dataFiles = ['src/data/inventory.json'].map((f) => app + f);
  const names = () => readdirSync(SYMBOLS).filter((f) => f.endsWith('.svg') && !f.endsWith('-fill.svg')).map((f) => f.slice(0, -4)).sort();
  return {
    name: 'antz-material-symbols',
    resolveId(id) {
      return id === 'virtual:symbol-index' || id === 'virtual:symbol-pack' ? '\0' + id : null;
    },
    load(id) {
      if (id === '\0virtual:symbol-index') {
        const all = names();
        const fill = new Set(readdirSync(SYMBOLS).filter((f) => f.endsWith('-fill.svg')).map((f) => f.slice(0, -9)));
        return `export default ${JSON.stringify(all.filter((n) => fill.has(n)))};`;
      }
      if (id === '\0virtual:symbol-pack') {
        const used = new Set<string>();
        for (const f of dataFiles) {
          this.addWatchFile(f);
          JSON.stringify(JSON.parse(readFileSync(f, 'utf8'))).replace(/"name":"([a-z0-9_]+)"/g, (_, n: string) => (used.add(n), ''));
        }
        const pack: Record<string, [string, string]> = {};
        for (const n of [...used].sort()) {
          const line = `${SYMBOLS}${n}.svg`, fill = `${SYMBOLS}${n}-fill.svg`;
          if (existsSync(line) && existsSync(fill)) pack[n] = [inner(readFileSync(line, 'utf8')), inner(readFileSync(fill, 'utf8'))];
        }
        return `export default ${JSON.stringify(pack)};`;
      }
      return null;
    },
    configureServer(server) {
      server.middlewares.use('/symbols', (req, res, next) => {
        const file = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\//, '');
        if (!/^[a-z0-9_]+(-fill)?\.svg$/.test(file) || !existsSync(SYMBOLS + file)) return next();
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(readFileSync(SYMBOLS + file));
      });
    },
    generateBundle() {
      for (const f of readdirSync(SYMBOLS)) if (f.endsWith('.svg')) this.emitFile({ type: 'asset', fileName: `symbols/${f}`, source: readFileSync(SYMBOLS + f) });
    },
  };
}

/* ---------------- ANTZ library: files are the source of truth ---------------- */
const NAME = /^[a-z0-9_]+$/;
const STATUSES = ['to_design', 'draft', 'approved'] as const;
const STYLES = ['line', 'filled'] as const;
type Style = (typeof STYLES)[number];
interface Entry { name: string; label: string; module: string; status: string; sources: string[]; reference: string | null; tags: string[]; notes: string }
interface Index { version: number; style: string; icons: Entry[] }

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** Absolute path inside library/, or throws (no traversal). */
function libPath(...parts: string[]): string {
  const p = resolve(LIBRARY, ...parts);
  if (p !== LIBRARY && !p.startsWith(LIBRARY + sep)) throw new HttpError(400, 'Path outside library/');
  return p;
}

function readIndex(): Index {
  return JSON.parse(readFileSync(libPath('index.json'), 'utf8')) as Index;
}
/** Write via a temp file + rename, so readers never see a half-written file. */
function writeAtomic(path: string, body: string) {
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, body);
  renameSync(tmp, path);
}
function readLibrary() {
  const index = readIndex();
  const svgs: Record<Style, Record<string, string>> = { line: {}, filled: {} };
  for (const s of STYLES) {
    const dir = libPath(s);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.svg') && NAME.test(f.slice(0, -4))) svgs[s][f.slice(0, -4)] = readFileSync(libPath(s, f), 'utf8');
  }
  return { index, svgs };
}

const str = (v: unknown, max = 400) => (typeof v === 'string' && v.length <= max ? v : undefined);
const strArr = (v: unknown) => (Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length <= 200) ? (v as string[]) : undefined);

function validSvg(svg: unknown, style: Style): string | null {
  if (svg === undefined || svg === null || svg === '') return null;
  if (typeof svg !== 'string' || svg.length > 200_000) throw new HttpError(400, `${style} SVG must be a string under 200 kB`);
  let root;
  try { root = svgRoot(svg); } catch (e) { throw new HttpError(400, `${style} SVG does not parse: ${(e as Error).message}`); }
  if (!root) throw new HttpError(400, `${style} SVG has no <svg> element`);
  if (/<script|\son[a-z]+\s*=|javascript:/i.test(svg)) throw new HttpError(400, `${style} SVG contains script`);
  return svg.endsWith('\n') ? svg : svg + '\n';
}

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 1_000_000) throw new HttpError(413, 'Body too large');
    chunks.push(c as Buffer);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch { throw new HttpError(400, 'Body must be a JSON object'); }
}

const send = (res: ServerResponse, status: number, data: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
};

let queue: Promise<unknown> = Promise.resolve();
/** Serialises writes so two saves never interleave on index.json. */
const locked = <T,>(fn: () => T | Promise<T>): Promise<T> => { const p = queue.then(fn, fn); queue = p.catch(() => undefined); return p; };

function putIcon(b: Record<string, unknown>) {
  const e = (b.entry ?? {}) as Record<string, unknown>;
  const name = str(e.name, 80);
  if (!name || !NAME.test(name)) throw new HttpError(400, 'name must match ^[a-z0-9_]+$');
  const replaces = b.replaces === undefined || b.replaces === null ? null : str(b.replaces, 80);
  if (replaces !== null && (!replaces || !NAME.test(replaces))) throw new HttpError(400, 'replaces must match ^[a-z0-9_]+$');
  const status = str(e.status) ?? 'draft';
  if (!(STATUSES as readonly string[]).includes(status)) throw new HttpError(400, `status must be one of ${STATUSES.join(', ')}`);
  const line = validSvg(b.line, 'line'), filled = validSvg(b.filled, 'filled');
  if (!line && !filled) throw new HttpError(400, 'Send at least one of line or filled');

  const index = readIndex();
  const existing = index.icons.findIndex((i) => i.name === name);
  const slot = replaces ? index.icons.findIndex((i) => i.name === replaces) : -1;
  if (replaces && slot < 0) throw new HttpError(404, `No library entry "${replaces}" to replace`);
  if (existing >= 0 && replaces !== name && b.overwrite !== true) throw new HttpError(409, `"${name}" already exists. Pick another name, or link to that entry to replace it.`);

  const prev = slot >= 0 ? index.icons[slot] : existing >= 0 ? index.icons[existing] : null;
  const entry: Entry = {
    name,
    label: str(e.label, 200) ?? prev?.label ?? name,
    module: str(e.module, 200) ?? prev?.module ?? 'Unsorted',
    status,
    sources: strArr(e.sources) ?? prev?.sources ?? [],
    reference: e.reference === null ? null : str(e.reference, 120) ?? prev?.reference ?? null,
    tags: strArr(e.tags) ?? prev?.tags ?? [],
    notes: str(e.notes, 4000) ?? prev?.notes ?? '',
  };
  // Write SVGs first, then the index: a crash leaves at worst an SVG the index does not list yet.
  for (const [s, svg] of [['line', line], ['filled', filled]] as const) {
    if (!svg) continue;
    mkdirSync(libPath(s), { recursive: true });
    writeAtomic(libPath(s, `${name}.svg`), svg);
  }
  if (slot >= 0) index.icons[slot] = entry;
  else if (existing >= 0) index.icons[existing] = entry;
  else index.icons.push(entry);
  // Replacing a slot under a new name: keep one entry for the name, and remove the old slot's files.
  if (slot >= 0 && replaces !== name) {
    index.icons = index.icons.filter((i, k) => i.name !== name || k === slot);
    for (const s of STYLES) { const p = libPath(s, `${replaces}.svg`); if (existsSync(p)) unlinkSync(p); }
  }
  writeAtomic(libPath('index.json'), JSON.stringify(index, null, 2) + '\n');
  return {
    ok: true, entry,
    report: { line: line ? checkSvg(line, 'line').level : null, filled: filled ? checkSvg(filled, 'filled').level : null },
  };
}

function patchIcon(name: string, b: Record<string, unknown>) {
  if (!NAME.test(name)) throw new HttpError(400, 'name must match ^[a-z0-9_]+$');
  const index = readIndex();
  const i = index.icons.find((x) => x.name === name);
  if (!i) throw new HttpError(404, `No library entry "${name}"`);
  if (b.status !== undefined) {
    if (!(STATUSES as readonly unknown[]).includes(b.status)) throw new HttpError(400, `status must be one of ${STATUSES.join(', ')}`);
    i.status = b.status as string;
  }
  for (const k of ['label', 'module', 'notes'] as const) if (b[k] !== undefined) { const v = str(b[k], 4000); if (v === undefined) throw new HttpError(400, `${k} must be a string`); i[k] = v; }
  if (b.tags !== undefined) { const v = strArr(b.tags); if (!v) throw new HttpError(400, 'tags must be a list of strings'); i.tags = v; }
  if (b.reference !== undefined) { if (b.reference !== null && str(b.reference, 120) === undefined) throw new HttpError(400, 'reference must be a string or null'); i.reference = b.reference as string | null; }
  writeAtomic(libPath('index.json'), JSON.stringify(index, null, 2) + '\n');
  return { ok: true, entry: i };
}

/**
 * Dev-only API (configureServer never runs in a build):
 *   GET   /api/library              index + every SVG
 *   PUT   /api/library/icon         { entry, line?, filled?, replaces?, overwrite? } writes the SVGs and updates index.json
 *   PATCH /api/library/icon/:name   { status?, label?, module?, tags?, notes?, reference? }
 * Library file changes on disk (from the API or from anyone else) send the HMR event "antz:library-changed".
 * For builds, virtual:library bundles a snapshot of the library so the static page still shows it (read only).
 */
function antzLibrary(): Plugin {
  return {
    name: 'antz-library',
    resolveId(id) { return id === 'virtual:library' ? '\0virtual:library' : null; },
    load(id) {
      if (id !== '\0virtual:library') return null;
      return `export default ${JSON.stringify(readLibrary())};`;
    },
    configureServer(server: ViteDevServer) {
      server.watcher.add(LIBRARY);
      let t: ReturnType<typeof setTimeout> | undefined;
      const onFile = (file: string) => {
        const f = resolve(file);
        if (!f.startsWith(LIBRARY + sep) || f.endsWith('.tmp')) return;
        clearTimeout(t);
        t = setTimeout(() => server.ws.send({ type: 'custom', event: 'antz:library-changed', data: { file: f.slice(LIBRARY.length + 1) } }), 120);
      };
      server.watcher.on('add', onFile).on('change', onFile).on('unlink', onFile);

      server.middlewares.use('/api/library', (req, res) => {
        void (async () => {
          try {
            const url = (req.url ?? '/').split('?')[0];
            if (req.method === 'GET' && (url === '/' || url === '')) return send(res, 200, readLibrary());
            if (req.method === 'PUT' && url === '/icon') { const b = await body(req); return send(res, 200, await locked(() => putIcon(b))); }
            const m = /^\/icon\/([^/]+)$/.exec(url);
            if (req.method === 'PATCH' && m) { const b = await body(req); const name = decodeURIComponent(m[1]); return send(res, 200, await locked(() => patchIcon(name, b))); }
            send(res, 404, { ok: false, error: `No route ${req.method} /api/library${url}` });
          } catch (e) {
            send(res, e instanceof HttpError ? e.status : 500, { ok: false, error: (e as Error).message });
          }
        })();
      });
    },
  };
}

/* ---------------- Primary icons: animated tile badges (library/primary/) ---------------- */
const PRIMARY_STATUSES = ['draft', 'approved'] as const;
/** The colour library's scheme keys; one Lottie file per scheme: lottie/<name>.<scheme>.json. */
const LOTTIE_SCHEMES = ['light', 'light-medium-contrast', 'light-high-contrast', 'dark', 'dark-medium-contrast', 'dark-high-contrast'] as const;
type LottieScheme = (typeof LOTTIE_SCHEMES)[number];
const LOTTIE_FILE = new RegExp(`^([a-z0-9_]+)\\.(${LOTTIE_SCHEMES.join('|')})\\.json$`);
interface PrimaryEntry { name: string; label: string; module: string; status: string; baseIcon: string | null; loopMs: number; order: number; motion: string }

/** Absolute path inside the primary folder, or throws (no traversal). */
function primPath(...parts: string[]): string {
  const p = resolve(PRIMARY, ...parts);
  if (p !== PRIMARY && !p.startsWith(PRIMARY + sep)) throw new HttpError(400, 'Path outside the primary folder');
  return p;
}

/** Keeps only well-formed entries, so a half-written index from the design agent never breaks the page. */
function cleanPrimary(raw: unknown): PrimaryEntry[] {
  const icons = (raw as { icons?: unknown })?.icons;
  if (!Array.isArray(icons)) return [];
  const out: PrimaryEntry[] = [];
  let pos = 0;
  for (const x of icons as Record<string, unknown>[]) {
    pos++;
    const name = str(x?.name, 80);
    if (!name || !NAME.test(name)) continue;
    const base = str(x.baseIcon, 80);
    out.push({
      name,
      label: str(x.label, 200) ?? name,
      module: str(x.module, 200) ?? 'Unsorted',
      status: str(x.status, 40) ?? 'draft',
      baseIcon: base && NAME.test(base) ? base : null,
      loopMs: typeof x.loopMs === 'number' && x.loopMs > 0 && x.loopMs < 600_000 ? x.loopMs : 0,
      // `order` (1–30) sets the tile order; entries without one keep their place in the file, after the ordered ones.
      order: typeof x.order === 'number' && Number.isFinite(x.order) ? x.order : 10_000 + pos,
      motion: str(x.motion, 1000) ?? '',
    });
  }
  return out.sort((a, b) => a.order - b.order);
}

/**
 * { present, error, index: { version, icons }, svgs: { name: svg }, lottie: { name: { <scheme>: true } } } (the 6 scheme
 * files found on disk). Icons are sorted by `order`.
 * A missing or empty folder is not an error: present is false, or icons is empty.
 */
function readPrimary() {
  const empty = { present: false, error: '', index: { version: 1, icons: [] as PrimaryEntry[] }, svgs: {} as Record<string, string>, lottie: {} as Record<string, Partial<Record<LottieScheme, boolean>>> };
  if (!existsSync(PRIMARY)) return empty;
  const out = { ...empty, present: true };
  const idx = primPath('index.json');
  if (existsSync(idx)) {
    try {
      const raw = JSON.parse(readFileSync(idx, 'utf8'));
      out.index = { version: typeof raw?.version === 'number' ? raw.version : 1, icons: cleanPrimary(raw) };
    } catch (e) { out.error = `index.json does not parse: ${(e as Error).message}`; }
  }
  const svgDir = primPath('svg');
  if (existsSync(svgDir)) {
    for (const f of readdirSync(svgDir)) {
      const n = f.slice(0, -4);
      if (!f.endsWith('.svg') || !NAME.test(n)) continue;
      const svg = readFileSync(primPath('svg', f), 'utf8');
      // Same safety rule as the library: no script or event handlers (the page inlines these).
      if (svg.length <= 400_000 && !/<script|\son[a-z]+\s*=|javascript:/i.test(svg)) out.svgs[n] = svg;
    }
  }
  const lotDir = primPath('lottie');
  if (existsSync(lotDir)) {
    for (const f of readdirSync(lotDir)) {
      const m = LOTTIE_FILE.exec(f);
      if (!m) continue;
      (out.lottie[m[1]] ??= {})[m[2] as LottieScheme] = true;
    }
  }
  return out;
}

function patchPrimary(name: string, b: Record<string, unknown>) {
  if (!NAME.test(name)) throw new HttpError(400, 'name must match ^[a-z0-9_]+$');
  const idx = primPath('index.json');
  if (!existsSync(idx)) throw new HttpError(404, 'No primary index.json');
  let raw: { icons?: Record<string, unknown>[] };
  try { raw = JSON.parse(readFileSync(idx, 'utf8')); } catch { throw new HttpError(409, 'Primary index.json does not parse; not writing it'); }
  const i = Array.isArray(raw.icons) ? raw.icons.find((x) => x?.name === name) : undefined;
  if (!i) throw new HttpError(404, `No primary entry "${name}"`);
  if (b.status !== undefined) {
    if (!(PRIMARY_STATUSES as readonly unknown[]).includes(b.status)) throw new HttpError(400, `status must be one of ${PRIMARY_STATUSES.join(', ')}`);
    i.status = b.status;
  }
  for (const k of ['label', 'module'] as const) if (b[k] !== undefined) { const v = str(b[k], 200); if (v === undefined) throw new HttpError(400, `${k} must be a string`); i[k] = v; }
  // Only the fields above change; every other key the design agent wrote is kept as is.
  writeAtomic(idx, JSON.stringify(raw, null, 2) + '\n');
  return { ok: true, entry: cleanPrimary({ icons: [i] })[0] };
}

/**
 * Dev-only API for Primary icons:
 *   GET   /api/primary              { present, error, index, svgs, lottie }
 *   PATCH /api/primary/icon/:name   { status?: draft | approved, label?, module? }
 *   GET   /primary/lottie/<name>.<scheme>.json, /primary/svg/<name>.svg   the files, served as they are
 * Changes on disk send the same "antz:library-changed" event as the library. The build bundles virtual:primary
 * (a snapshot) and copies the files into dist/primary/.
 */
function antzPrimary(): Plugin {
  return {
    name: 'antz-primary',
    resolveId(id) { return id === 'virtual:primary' ? '\0virtual:primary' : null; },
    load(id) {
      if (id !== '\0virtual:primary') return null;
      return `export default ${JSON.stringify(readPrimary())};`;
    },
    configureServer(server: ViteDevServer) {
      // library/ is already watched (and includes primary/); an outside ANTZ_PRIMARY_DIR needs its own watch.
      if (!PRIMARY.startsWith(LIBRARY + sep)) {
        server.watcher.add(PRIMARY);
        let t: ReturnType<typeof setTimeout> | undefined;
        const onFile = (file: string) => {
          const f = resolve(file);
          if (!f.startsWith(PRIMARY + sep) || f.endsWith('.tmp')) return;
          clearTimeout(t);
          t = setTimeout(() => server.ws.send({ type: 'custom', event: 'antz:library-changed', data: { file: `primary/${f.slice(PRIMARY.length + 1)}` } }), 120);
        };
        server.watcher.on('add', onFile).on('change', onFile).on('unlink', onFile).on('addDir', onFile).on('unlinkDir', onFile);
      }
      server.middlewares.use('/primary', (req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0]);
        const lot = url.startsWith('/lottie/') && LOTTIE_FILE.test(url.slice(8)) ? [url, url.slice(8)] : null;
        const svg = /^\/svg\/([a-z0-9_]+\.svg)$/.exec(url);
        const file = lot ? primPath('lottie', lot[1]) : svg ? primPath('svg', svg[1]) : null;
        if (!/^\/(lottie|svg)\//.test(url)) return next();
        // A missing file is a 404, not the SPA fallback (the page checks r.ok).
        if (!file || !existsSync(file)) { res.statusCode = 404; res.end('Not found'); return; }
        res.setHeader('Content-Type', lot ? 'application/json' : 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(file));
      });
      server.middlewares.use('/api/primary', (req, res) => {
        void (async () => {
          try {
            const url = (req.url ?? '/').split('?')[0];
            if (req.method === 'GET' && (url === '/' || url === '')) return send(res, 200, readPrimary());
            const m = /^\/icon\/([^/]+)$/.exec(url);
            if (req.method === 'PATCH' && m) { const b = await body(req); const name = decodeURIComponent(m[1]); return send(res, 200, await locked(() => patchPrimary(name, b))); }
            send(res, 404, { ok: false, error: `No route ${req.method} /api/primary${url}` });
          } catch (e) {
            send(res, e instanceof HttpError ? e.status : 500, { ok: false, error: (e as Error).message });
          }
        })();
      });
    },
    generateBundle() {
      const p = readPrimary();
      for (const n of Object.keys(p.svgs)) this.emitFile({ type: 'asset', fileName: `primary/svg/${n}.svg`, source: p.svgs[n] });
      for (const [n, v] of Object.entries(p.lottie)) {
        for (const sc of LOTTIE_SCHEMES) if (v[sc]) this.emitFile({ type: 'asset', fileName: `primary/lottie/${n}.${sc}.json`, source: readFileSync(primPath('lottie', `${n}.${sc}.json`)) });
      }
      if (p.present) this.emitFile({ type: 'asset', fileName: 'primary/index.json', source: JSON.stringify(p.index, null, 2) + '\n' });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), materialSymbols(), antzLibrary(), antzPrimary()],
  server: { port: 5181, strictPort: true, fs: { allow: [app, LIBRARY] } },
  preview: { port: 5181 },
  // The main chunk carries the bundled symbol pack (about 600 kB of path data) on purpose, so the grid renders at once.
  build: { chunkSizeWarningLimit: 1400 },
});
