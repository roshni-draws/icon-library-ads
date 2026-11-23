// Validate Lottie against SVG (Primary v2.1). For every icon, render both in headless Chrome at the story times
// 0 (static pose), peak A, peak B and the rest pose (spec.peaks / spec.restAt), in all 6 colour schemes, diff each
// SVG/Lottie pair, check the accent rule in pixels, and write a frame strip (light, dark, light-high-contrast).
//
//   node validate.mjs [--out <dir>] [--names a,b] [--png <strip.png>] [--report <report.json>]
//   node validate.mjs <primaryDir> <outPng> [reportJson]      (v2 form, still accepted)
//
//   --out <dir>     the folder build.mjs wrote (default: library/primary); reads <dir>/index.json, svg/, lottie/
//   --names a,b     validate only these icons (default: every icon in <dir>/index.json)
//   --png <file>    frame strip (default: <tmpdir>/antz-primary-validate/frames.png; the path is printed)
//   --report <file> JSON report (optional)
//
// Checks (exit 1 on failure):
//   svgVsLottie  structural difference between SVG and Lottie, every time × scheme: ≤ 0.1% of pixels.
//                "Structural" = a pixel whose whole 3×3 neighbourhood differs by > 48/255, so 1px anti-aliasing
//                seams along edges (worst on white-on-dark contrast schemes) don't count; anything offset by
//                ≥ 2px does. The raw share of differing pixels is reported too (aaPct, ≤ 1.5%).
//   restVsStart  the rest pose equals frame 0 (seamless loop, reduced-motion pose): ≤ 0.1%
//   reduced      SVG with prefers-reduced-motion: reduce vs Lottie frame 0: ≤ 0.1%
//   motion       at least one peak differs from the rest pose by ≥ 2% of the icon's pixels (visible at 48px)
//   accentOnFill the SVG is rendered with the accent variable set to #FF00FF and the tile to #00FFFF at all
//                4 story times: no accent pixel may lie within 1 CSS px of a tile pixel (accent only on fill).
// Needs Google Chrome in /Applications.
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import { mkdirSync } from 'node:fs';
import { SCHEME_KEYS, flatScheme, ROLES } from './lib/model.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// Repo root (this file is library/generators/primary/<file>.mjs).
const ROOT = resolve(HERE, '../../..');
const LIB = process.env.ANTZ_LIBRARY || join(ROOT, 'library');
const argv = process.argv.slice(2);
const opt = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const m = a.match(/^--(out|names|png|report)(?:=(.*))?$/);
  if (m) opt[m[1]] = m[2] ?? argv[++i];
  else if (a === '-h' || a === '--help') { console.log('usage: node validate.mjs [--out <dir>] [--names a,b] [--png <file>] [--report <file>]'); process.exit(0); }
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}`); process.exit(1); }
  else pos.push(a);
}
const DIR = resolve(opt.out || pos[0] || join(LIB, 'primary'));
const outPng = resolve(opt.png || pos[1] || join(tmpdir(), 'antz-primary-validate', 'frames.png'));
const reportPath = opt.report || pos[2];
const NAMES = opt.names ? opt.names.split(',').map((s) => s.trim()).filter(Boolean) : null;
mkdirSync(dirname(outPng), { recursive: true });
const colours = JSON.parse(readFileSync(process.env.ANTZ_COLOURS || join(ROOT, 'app/src/data/ANTZ_colour_library.json'), 'utf8'));
const require = createRequire(import.meta.url);
const lottieJs = readFileSync(require.resolve('lottie-web/build/player/lottie_light.min.js'), 'utf8');
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'));
const STRIP = ['light', 'dark', 'light-high-contrast'];
const CELL = 48; // CSS px: the real nav size; screenshots at 2x
const DPR = 2;
const LIM = { svgVsLottie: 0.1, aa: 1.5, restVsStart: 0.1, reduced: 0.1, motion: 2 };

const wanted = NAMES || index.icons.map((e) => e.name);
for (const n of wanted) if (!index.icons.some((e) => e.name === n)) { console.error(`✗ ${n} is not in ${join(DIR, 'index.json')}`); process.exit(1); }
const specs = {};
for (const f of readdirSync(join(HERE, 'specs')).filter((x) => x.endsWith('.mjs'))) {
  if (!wanted.includes(f.slice(0, -4))) continue; // other agents' specs may be mid-edit
  const s = (await import(pathToFileURL(join(HERE, 'specs', f)).href)).default;
  specs[s.name] = s;
}

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const vars = (m) => Object.entries(flatScheme(colours, m)).map(([k, v]) => `--antz-${kebab(k)}:${v}`).join(';');
const short = (k) => k.replace('light', 'L').replace('dark', 'D').replace('-medium-contrast', ' MC').replace('-high-contrast', ' HC');

const data = index.icons.filter((ic) => wanted.includes(ic.name)).map((ic) => {
  const s = specs[ic.name];
  if (!s) throw new Error(`no spec for ${ic.name}`);
  const times = [0, s.peaks[0], s.peaks[1], s.restAt];
  return {
    ...ic, times,
    svg: readFileSync(join(DIR, 'svg', `${ic.name}.svg`), 'utf8'),
    lottie: Object.fromEntries(SCHEME_KEYS.map((m) => [m, JSON.parse(readFileSync(join(DIR, 'lottie', `${ic.name}.${m}.json`), 'utf8'))])),
  };
});
const LABELS = ['start', 'peak A', 'peak B', 'rest'];
const key = (t) => Math.round(t * 1000);

let rows = '';
const headCells = STRIP.map((m) => `<th colspan="${LABELS.length}" class="grp">${m}</th>`).join('');
const sub = STRIP.map(() => LABELS.map((l) => `<th>${l}</th>`).join('')).join('');
const cell = (kind, ic, m, t) => kind === 's'
  ? `<div class="cell svg" id="s-${ic.name}-${m}-${key(t)}" data-t="${t}" data-loop="${ic.loopMs}" style="${vars(m)}">${ic.svg}</div>`
  : `<div class="cell lot" id="l-${ic.name}-${m}-${key(t)}" data-name="${ic.name}" data-mode="${m}" data-t="${t}"></div>`;
for (const ic of data) {
  const tl = ic.times.map((t) => `${Math.round(t * 100)}%`).join(' · ');
  rows += `<tr><th rowspan="2" class="nm">${ic.label}<br><small>${ic.loopMs} ms<br>${tl}</small></th><td class="k">SVG</td>`;
  for (const m of STRIP) for (const t of ic.times) rows += `<td>${cell('s', ic, m, t)}</td>`;
  rows += `</tr><tr><td class="k">Lottie</td>`;
  for (const m of STRIP) for (const t of ic.times) rows += `<td>${cell('l', ic, m, t)}</td>`;
  rows += '</tr>';
}
// Off-strip cells: the other 3 schemes (diffed, not shown) and the reduced-motion SVG per scheme.
let extra = '';
for (const ic of data) for (const m of SCHEME_KEYS) {
  if (!STRIP.includes(m)) for (const t of ic.times) extra += cell('s', ic, m, t) + cell('l', ic, m, t);
  extra += `<div class="cell rm" id="r-${ic.name}-${m}" style="${vars(m)}">${ic.svg}</div>`;
}
// Accent-rule probes: light scheme with the accent painted pure magenta and the tile pure cyan.
const PROBE = `${vars('light')};${ROLES.accent.cssVar}:#FF00FF;${ROLES.tile.cssVar}:#00FFFF`;
for (const ic of data) for (const t of ic.times) extra += `<div class="cell svg" id="a-${ic.name}-${key(t)}" data-t="${t}" data-loop="${ic.loopMs}" style="${PROBE}">${ic.svg}</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#fff;font:11px system-ui,sans-serif;color:#222}
table{border-collapse:separate;border-spacing:4px;padding:8px}
th{font-weight:600;text-align:center}.grp{border-bottom:1px solid #ccc}
.nm{text-align:right;padding-right:6px;font-size:12px}.nm small{font-weight:400;color:#555}.k{color:#666}
.cell{width:${CELL}px;height:${CELL}px}
.cell svg{width:${CELL}px;height:${CELL}px;display:block}
td{background:#f3f3f3;border-radius:6px;padding:4px}
#extra{display:flex;flex-wrap:wrap;gap:4px;padding:8px}
@media (prefers-reduced-motion:reduce){}
</style></head><body><table id="strip"><tr><th></th><th></th>${headCells}</tr><tr><th></th><th></th>${sub}</tr>${rows}</table>
<div id="extra">${extra}</div>
<script>${lottieJs}</script><script>
const L=${JSON.stringify(Object.fromEntries(data.map((d) => [d.name, d.lottie])))};
const animated=(root)=>[...root.querySelectorAll('[class]')].filter(e=>getComputedStyle(e).animationName!=='none');
document.querySelectorAll('.svg').forEach(el=>{
  const t=+el.dataset.t,loop=+el.dataset.loop;const els=animated(el);
  els.forEach(g=>{g.style.animationDelay=(-t*loop)+'ms';g.style.animationPlayState='paused';});
  /* bake the browser-computed keyframe values: headless Chrome does not repaint paused SVG CSS animations */
  const v=els.map(g=>{const c=getComputedStyle(g);return {transform:c.transform,opacity:c.opacity,strokeDasharray:c.strokeDasharray,strokeDashoffset:c.strokeDashoffset};});
  els.forEach((g,i)=>{g.style.animation='none';g.style.transform=v[i].transform;g.style.opacity=v[i].opacity;if(g.getAttribute('pathLength')){g.style.strokeDasharray=v[i].strokeDasharray;g.style.strokeDashoffset=v[i].strokeDashoffset;}});
});
document.querySelectorAll('.lot').forEach(el=>{const j=L[el.dataset.name][el.dataset.mode];const a=lottie.loadAnimation({container:el,renderer:'svg',loop:false,autoplay:false,animationData:j});a.goToAndStop(+el.dataset.t*j.op,true);});
window.READY=true;
</script></body></html>`;

const tmp = mkdtempSync(join(tmpdir(), 'antz-primary-'));
const page0 = join(tmp, 'validate.html'); // private per run, so parallel validations don't collide
writeFileSync(page0, html);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  userDataDir: join(tmp, 'chrome'),
});
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: DPR });
await page.goto('file://' + page0);
await page.waitForFunction('window.READY');
await new Promise((r) => setTimeout(r, 400));

const decode = (buf) => PNG.sync.read(buf);
// Returns { pct: structural difference %, aa: raw > 48/255 difference % }.
const diffFull = (a, b) => {
  const w = a.width, h = a.height, n = w * h;
  const m = new Uint8Array(n);
  let raw = 0;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > 48) { m[p] = 1; raw++; }
  }
  let core = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let all = 1;
    for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (!m[(y + dy) * w + x + dx]) { all = 0; break; }
    core += all;
  }
  return { pct: +((100 * core) / n).toFixed(3), aa: +((100 * raw) / n).toFixed(2) };
};
const diff = (a, b) => diffFull(a, b).pct;
const diffRaw = (a, b) => diffFull(a, b).aa;
const shot = async (sel) => decode(await (await page.$(sel)).screenshot());
const report = [];
const fails = [];
for (const ic of data) for (const m of SCHEME_KEYS) {
  const start = await shot(`#s-${ic.name}-${m}-0`);
  const motion = [];
  ic.times.forEach((t, j) => motion.push({ t, label: LABELS[j] }));
  for (const [j, t] of ic.times.entries()) {
    const a = await shot(`#s-${ic.name}-${m}-${key(t)}`);
    const b = await shot(`#l-${ic.name}-${m}-${key(t)}`);
    const dl = diffFull(a, b);
    const r = { icon: ic.name, scheme: m, at: LABELS[j], t, svgVsLottie: dl.pct, aaPct: dl.aa, vsStart: diffRaw(a, start) };
    report.push(r);
    if (r.svgVsLottie > LIM.svgVsLottie) fails.push(`${ic.name} ${m} ${LABELS[j]}: SVG vs Lottie ${r.svgVsLottie}% structural`);
    if (r.aaPct > LIM.aa) fails.push(`${ic.name} ${m} ${LABELS[j]}: SVG vs Lottie ${r.aaPct}% of pixels (anti-aliasing budget ${LIM.aa}%)`);
    if (LABELS[j] === 'rest' && r.vsStart > LIM.restVsStart) fails.push(`${ic.name} ${m}: rest pose ≠ frame 0 (${r.vsStart}%)`);
  }
  const peak = Math.max(...report.filter((r) => r.icon === ic.name && r.scheme === m && r.at.startsWith('peak')).map((r) => r.vsStart));
  if (peak < LIM.motion) fails.push(`${ic.name} ${m}: peak motion only ${peak}% of pixels (< ${LIM.motion}%)`);
}
// Reduced motion: the SVG with prefers-reduced-motion: reduce (animation: none → attribute rest pose) vs Lottie frame 0.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await new Promise((r) => setTimeout(r, 200));
const reduced = [];
for (const ic of data) for (const m of SCHEME_KEYS) {
  const d = diff(await shot(`#r-${ic.name}-${m}`), await shot(`#l-${ic.name}-${m}-0`));
  reduced.push({ icon: ic.name, scheme: m, reducedVsLottie0: d });
  if (d > LIM.reduced) fails.push(`${ic.name} ${m}: reduced-motion SVG ≠ Lottie frame 0 (${d}%)`);
}
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await new Promise((r) => setTimeout(r, 200));
// Accent rule in pixels: an accent pixel (near #FF00FF) with a tile pixel (near #00FFFF) within R device px.
const R = DPR; // 1 CSS px
const accent = [];
for (const ic of data) for (const [j, t] of ic.times.entries()) {
  const im = await shot(`#a-${ic.name}-${key(t)}`);
  const { width: w, height: h, data: px } = im;
  const isA = (i) => px[i] > 200 && px[i + 1] < 60 && px[i + 2] > 200;
  const isT = (i) => px[i] < 60 && px[i + 1] > 200 && px[i + 2] > 200;
  let n = 0, acc = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isA((y * w + x) * 4)) continue;
    acc++;
    let hit = false;
    for (let dy = -R; dy <= R && !hit; dy++) for (let dx = -R; dx <= R; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < w && Y < h && isT((Y * w + X) * 4)) { hit = true; break; }
    }
    if (hit) n++;
  }
  accent.push({ icon: ic.name, at: LABELS[j], accentPx: acc, accentOnTilePx: n });
  if (n > 0) fails.push(`${ic.name} ${LABELS[j]}: ${n} accent pixels touch the tile (accent only on fill)`);
}
await (await page.$('#strip')).screenshot({ path: outPng });
await browser.close();

const summary = {};
for (const r of report) {
  const s = (summary[r.icon] ||= { worstSvgVsLottie: 0, worstAA: 0, peakMotion: 0 });
  s.worstSvgVsLottie = Math.max(s.worstSvgVsLottie, r.svgVsLottie);
  s.worstAA = Math.max(s.worstAA, r.aaPct);
  if (r.at.startsWith('peak')) s.peakMotion = Math.max(s.peakMotion, r.vsStart);
}
for (const r of reduced) summary[r.icon].worstReduced = Math.max(summary[r.icon].worstReduced || 0, r.reducedVsLottie0);
for (const r of accent) summary[r.icon].accentOnTilePx = (summary[r.icon].accentOnTilePx || 0) + r.accentOnTilePx;
console.table(report.filter((r) => STRIP.includes(r.scheme)).map(({ icon, scheme, at, svgVsLottie, aaPct, vsStart }) => ({ icon, scheme: short(scheme), at, svgVsLottie, aaPct, vsStart })));
console.table(summary);
if (reportPath) writeFileSync(reportPath, JSON.stringify({ cellCssPx: CELL, dpr: DPR, limits: LIM, summary, report, reduced, accent, fails }, null, 2));
if (fails.length) { console.error('✗ ' + fails.join('\n✗ ')); process.exit(1); }
console.log(`✓ ${data.length} icons × ${SCHEME_KEYS.length} schemes × 4 story times: SVG = Lottie, rest = frame 0, reduced motion = frame 0, motion visible, accent only on fill`);
console.log(`  strip: ${outPng}`);
