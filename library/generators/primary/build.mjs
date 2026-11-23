// Build the ANTZ Primary (tile badge) icons, v2.1.
//
//   node build.mjs [--out <dir>] [--names a,b,c] [--dry-run]
//   node build.mjs <outDir> [names...]                     (v2 form, still accepted)
//
//   --out <dir>     output folder (default: library/primary). Use a private folder per agent, e.g.
//                   --out /tmp/primary-ward, so parallel builds never touch library/primary.
//   --names a,b     build only these specs (specs/<name>.mjs). Other spec files are still read for the loop
//                   registry; one that fails to import is skipped with a warning unless it is named.
//   --dry-run       lint only (motion, contrast, accent rule, structure, base paths, loop registry); write nothing.
//
// Writes into <out>:
//   svg/<name>.svg               animated SVG, CSS keyframes, --antz-* variables with light fallbacks
//   lottie/<name>.<scheme>.json  Lottie, one per colour scheme (6), colours baked in
//   index.json                   { version: 1, style, schemes, icons: [...] }: read-modify-write. Entries for icons
//                                that were not built (other agents' icons, icons without a spec here) are kept
//                                as they are; built entries are replaced in place (a manual `status` is kept) or
//                                appended. Nothing is ever dropped.
//   contrast.json                role table + lint rows; rows of icons not built are kept (same merge)
//   review.html                  offline review page for every icon in the merged index that has a spec
//
// Fails (writes nothing) on any motion-rule, contrast (< 3:1), accent-rule, structure, base-path or loop problem.
// Loop registry: a built icon's loopMs must differ from every other icon's: the other spec files, the entries in
// <out>/index.json, and the entries in library/primary/index.json.
//
// Env: ANTZ_COLOURS = path to ANTZ_colour_library.json (default: the vendored app/src/data copy).
//      ANTZ_LIBRARY = library/ folder (base paths in line/<baseIcon>.svg; default out = <library>/primary).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { toSvg } from './lib/svg.mjs';
import { toLottie } from './lib/lottie.mjs';
import { lint, contrastLint, ROLES, SCHEME_KEYS, flatScheme, contrast, STYLE } from './lib/model.mjs';
import { reviewHtml } from './lib/review.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// Repo root (this file is library/generators/primary/<file>.mjs).
const ROOT = resolve(HERE, '../../..');
const COLOURS = process.env.ANTZ_COLOURS || join(ROOT, 'app/src/data/ANTZ_colour_library.json');
const LIB = process.env.ANTZ_LIBRARY || join(ROOT, 'library');
const CANON = join(LIB, 'primary');

// ---- CLI
const argv = process.argv.slice(2);
const opt = { out: null, names: null, dry: false };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out') opt.out = argv[++i];
  else if (a.startsWith('--out=')) opt.out = a.slice(6);
  else if (a === '--names') opt.names = argv[++i];
  else if (a.startsWith('--names=')) opt.names = a.slice(8);
  else if (a === '--dry-run') opt.dry = true;
  else if (a === '-h' || a === '--help') { console.log('usage: node build.mjs [--out <dir>] [--names a,b] [--dry-run]'); process.exit(0); }
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}`); process.exit(1); }
  else pos.push(a);
}
if (!opt.out && pos.length) opt.out = pos.shift();
const names = opt.names ? opt.names.split(',').map((s) => s.trim()).filter(Boolean) : pos.length ? pos : null;
const OUT = resolve(opt.out || CANON);

// ---- colours
const colours = JSON.parse(readFileSync(COLOURS, 'utf8'));
const SCHEMES = Object.fromEntries(SCHEME_KEYS.map((k) => {
  if (!colours.schemes[k]) throw new Error(`colour library has no scheme ${k}`);
  return [k, flatScheme(colours, k)];
}));
for (const s of SCHEME_KEYS) for (const r of Object.values(ROLES)) if (!SCHEMES[s][r.scheme]) throw new Error(`missing ${s}.${r.scheme}`);

// ---- specs (every file is read for the loop registry; a broken file only fails the build if it is named)
const specs = [];
for (const f of readdirSync(join(HERE, 'specs')).filter((x) => x.endsWith('.mjs')).sort()) {
  const fileName = basename(f, '.mjs');
  try {
    const s = (await import(pathToFileURL(join(HERE, 'specs', f)).href)).default;
    if (!s?.name) throw new Error('no default export with a name');
    if (s.name !== fileName) throw new Error(`spec name "${s.name}" ≠ file name "${fileName}"`);
    specs.push(s);
  } catch (e) {
    if (!names || names.includes(fileName)) { console.error(`✗ specs/${f}: ${e.message}`); process.exit(1); }
    console.warn(`! skipped specs/${f} (not in --names): ${e.message}`);
  }
}
specs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
const byName = Object.fromEntries(specs.map((s) => [s.name, s]));
if (names) for (const n of names) if (!byName[n]) { console.error(`✗ no spec named ${n}`); process.exit(1); }
const build = names ? specs.filter((s) => names.includes(s.name)) : specs;

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const oldIndex = readJson(join(OUT, 'index.json'));
const canonIndex = OUT === resolve(CANON) ? null : readJson(join(CANON, 'index.json'));

// Loop registry: name → loopMs, from the canonical index, the target index, then the spec files (latest wins).
const registry = new Map();
for (const ix of [canonIndex, oldIndex]) for (const e of ix?.icons || []) if (e.loopMs) registry.set(e.name, e.loopMs);
for (const s of specs) registry.set(s.name, s.loopMs);

// ---- lint
let failed = false;
const contrastRows = [];
for (const spec of build) {
  const errs = lint(spec);
  for (const [n, ms] of registry) if (n !== spec.name && ms === spec.loopMs) errs.push(`loop ${spec.loopMs}ms already used by ${n} (see the loop registry in STYLE-PRIMARY.md)`);
  // Lottie masks are per layer: a clip must sit on a top-level layer or a child of a layerize group.
  const deep = (l, depth, inLayerize) => {
    if (l.clip && depth > (inLayerize ? 1 : 0)) errs.push(`${l.id}: clip too deep for a Lottie layer mask`);
    (l.children || []).forEach((c) => deep(c, depth + 1, depth === 0 && l.layerize));
  };
  spec.layers.forEach((l) => deep(l, 0, false));
  const c = contrastLint(spec, SCHEMES);
  errs.push(...c.errs);
  contrastRows.push(...c.rows);
  const line = join(LIB, 'line', `${spec.baseIcon}.svg`);
  if (existsSync(line)) {
    const src = readFileSync(line, 'utf8');
    for (const d of spec.base || []) if (!src.includes(d)) errs.push(`base path not in line/${spec.baseIcon}.svg: ${d}`);
  } else errs.push(`base icon not found: ${line}`);
  if (errs.length) { failed = true; console.error(`✗ ${spec.name}\n  ` + errs.join('\n  ')); }
}
if (failed) process.exit(1);
if (opt.dry) { console.log(`✓ lint ok: ${build.map((s) => `${s.name} (${s.loopMs}ms)`).join(', ')}`); process.exit(0); }

// ---- emit
mkdirSync(join(OUT, 'svg'), { recursive: true });
mkdirSync(join(OUT, 'lottie'), { recursive: true });
const svgs = {}, lotties = {};
const emit = (spec) => {
  if (svgs[spec.name]) return;
  svgs[spec.name] = toSvg(spec, SCHEMES.light);
  lotties[spec.name] = Object.fromEntries(SCHEME_KEYS.map((k) => [k, toLottie(spec, SCHEMES[k], k)]));
};
for (const spec of build) {
  emit(spec);
  writeFileSync(join(OUT, 'svg', `${spec.name}.svg`), svgs[spec.name]);
  for (const k of SCHEME_KEYS) writeFileSync(join(OUT, 'lottie', `${spec.name}.${k}.json`), JSON.stringify(lotties[spec.name][k]));
  console.log(`✓ ${spec.name}  ${spec.loopMs}ms  svg ${svgs[spec.name].length}B  lottie ${JSON.stringify(lotties[spec.name].light).length}B × ${SCHEME_KEYS.length}`);
}

// ---- index.json: read-modify-write, unknown entries kept
const entry = (s, old) => ({
  ...(old || {}),
  name: s.name, order: s.order, label: s.label, module: s.module, status: old?.status || 'draft', baseIcon: s.baseIcon, loopMs: s.loopMs,
  motion: s.motion,
  svg: `svg/${s.name}.svg`,
  lottie: Object.fromEntries(SCHEME_KEYS.map((k) => [k, `lottie/${s.name}.${k}.json`])),
});
const icons = [...(oldIndex?.icons || [])];
for (const s of build) {
  const i = icons.findIndex((e) => e.name === s.name);
  if (i >= 0) icons[i] = entry(s, icons[i]); else icons.push(entry(s));
}
// Keep index.json in nav order (spec `order`); entries without a spec here stay at the end in their old order.
const rank = (e) => byName[e.name]?.order ?? 1e3;
icons.sort((a, b) => rank(a) - rank(b));
const index = { ...(oldIndex || {}), version: 1, style: STYLE, schemes: SCHEME_KEYS, icons };
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');

// ---- contrast.json: role values, pairwise contrast, lint rows (rows of icons not built are kept)
const pair = (a, b) => SCHEME_KEYS.map((k) => +contrast(SCHEMES[k][ROLES[a].scheme], SCHEMES[k][ROLES[b].scheme]).toFixed(2));
const roleTable = {
  roles: Object.fromEntries(Object.entries(ROLES).map(([r, d]) => [r, { ...d, values: SCHEME_KEYS.map((k) => SCHEMES[k][d.scheme]) }])),
  pairs: { 'ink/tile': pair('ink', 'tile'), 'ink/fill': pair('ink', 'fill'), 'accent/fill': pair('accent', 'fill'), 'fill/tile': pair('fill', 'tile'), 'accent/ink': pair('accent', 'ink'), 'accent/tile': pair('accent', 'tile') },
};
const builtNames = new Set(build.map((s) => s.name));
const oldContrast = readJson(join(OUT, 'contrast.json'));
const lintRows = [...(oldContrast?.lint || []).filter((r) => !builtNames.has(r.icon)), ...contrastRows];
writeFileSync(join(OUT, 'contrast.json'), JSON.stringify({ style: STYLE, schemes: SCHEME_KEYS, ...roleTable, lint: lintRows }, null, 2) + '\n');

// ---- review.html: every icon in the merged index that has a spec (rendered from the spec)
const reviewSpecs = [];
for (const e of icons) {
  const s = byName[e.name];
  if (!s) { console.warn(`! review.html: no spec for ${e.name}, left out`); continue; }
  try { emit(s); reviewSpecs.push(s); } catch (err) { console.warn(`! review.html: ${e.name} failed to render (${err.message}), left out`); }
}
const require = createRequire(import.meta.url);
const lottieJs = readFileSync(require.resolve('lottie-web/build/player/lottie_light.min.js'), 'utf8');
writeFileSync(join(OUT, 'review.html'), reviewHtml({ specs: reviewSpecs, svgs, lotties, colours, schemes: SCHEMES, schemeKeys: SCHEME_KEYS, roleTable, lottieJs }));
console.log(`✓ ${OUT}: index.json (${icons.length} icons, ${build.length} built), contrast.json, review.html (${reviewSpecs.length})`);
for (const [k, v] of Object.entries(roleTable.pairs)) console.log(`  ${k.padEnd(12)} ${v.map((x) => x.toFixed(2).padStart(6)).join('')}   min ${Math.min(...v).toFixed(2)}`);
