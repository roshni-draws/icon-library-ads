import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const index = JSON.parse(readFileSync(BASE + 'library/index.json', 'utf8'));
const MODULE = process.argv[2];
const SLUG = process.argv[3];
const META = {
  priority_high: 'Circle container with an up chevron. Family: critical = double chevron, medium = two bars, low = down chevron. Pair with the Warning role when selected.',
  priority_low: 'Circle container with a down chevron (pair with the Success role when selected).',
  emergency: 'A flame with a second tongue: urgent / hot. Replaces the old flame-in-circle.',
  assignment_add: 'Clipboard (shared base) + add badge = new pharmacy request.',
  add_photo: 'Picture frame (sun dot, mountain) + add badge.',
  archive: 'Archive box: lid on a box with a down arrow. Filled cuts the lid seam.',
  request: 'Rubber stamp (handle, pad, base line) = request / approval.',
  lab_sample: 'Test tube with a liquid level. Filled: liquid solid, headspace open.',
  carcass_pickup: 'Van (cargo box, cab, two wheels) with a medical cross on the box: pickup / ambulance.',
  carcass_transfer: 'Same van with a right arrow on the box: transfer.',
  pending_actions: 'Clipboard (shared base) + clock badge = awaiting approval.',
  hourglass_bottom: 'Hourglass with sand settled in the bottom bulb. Filled: top glass hollow, sand solid.',
  fish_bones: 'Fish skeleton: tail fork, spine, two ribs, head = mortality / carcass.',
  timeline: 'Zigzag line through four solid nodes.',
  block: 'Circle with a 45° slash. Filled keeps the ring (a split disc would read differently).',
  download: 'Down arrow into a tray.',
  draft: 'Blank document with a 45° dog-ear (shared document base).',
  cancelled: 'Circle with an X. Filled: solid disc, X knocked out.',
  refresh: 'Clockwise 270° arc with a corner arrowhead at the top right.',
  expand_less: 'Up chevron (collapse). Filled is the same stroke.',
  event_available: 'Calendar (shared base) with a check in the date area.',
};
const eggs = index.icons.filter((i) => i.module === MODULE);
const names = eggs.map((e) => e.name);
let k = 0;
const inline = (style, n) => {
  const id = `${n}-${style}-${k++}`;
  return readFileSync(`${BASE}library/${style}/${n}.svg`, 'utf8').trim()
    .replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`)
    .replace(/ width="24" height="24"/, ' aria-hidden="true"');
};
const rows = names.map((n) => {
  const e = eggs.find((x) => x.name === n);
  const old = (e.sources || []).filter((s) => existsSync(`${BASE}app/public/current/mobile_${s}.svg`));
  const sizes = (style) => [16, 24, 48].map((s) => `<span class="ic s${s}" title="${style} ${s}px">${inline(style, n)}</span>`).join('');
  return `<tr>
  <th scope="row"><code>${n}</code><span class="lbl">${e.label}</span><span class="st st-${e.status}">${e.status.replace('_', ' ')}</span></th>
  <td class="set">${sizes('line')}</td>
  <td class="set">${sizes('filled')}</td>
  <td class="meta">${META[n] ?? ''}</td>
  <td class="old">${old.map((s) => `<figure><img src="../../app/public/current/mobile_${s}.svg" alt="old ${s}"><figcaption>${s}</figcaption></figure>`).join('') || '<span class="none">none</span>'}</td>
</tr>`;
}).join('\n');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${MODULE} icons</title>
<style>
:root{--bg:#fbfbf9;--surface:#fff;--ink:#1c1f1d;--muted:#5d6661;--line:#e3e6e3;--tile:#f2f4f2}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121413;--surface:#1a1d1b;--ink:#e6e9e6;--muted:#9aa39e;--line:#2c312e;--tile:#232724}}
:root[data-theme="dark"]{--bg:#121413;--surface:#1a1d1b;--ink:#e6e9e6;--muted:#9aa39e;--line:#2c312e;--tile:#232724}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:22px;margin:0 0 4px}
p.sub{margin:0 0 20px;color:var(--muted);max-width:70ch}
.bar{display:flex;gap:8px;margin-bottom:16px}
.bar button{font:inherit;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:900px}
th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
thead th{font-size:12px;font-weight:600;color:var(--muted);background:var(--tile)}
tbody tr:last-child>*{border-bottom:0}
th[scope=row]{width:190px;font-weight:400}
th code{font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;display:block}
.lbl{display:block;color:var(--muted);font-size:12px}
.st{display:inline-block;margin-top:4px;font-size:11px;padding:1px 8px;border-radius:99px;background:var(--tile);color:var(--muted)}
.set{white-space:nowrap}
.ic{display:inline-grid;place-items:center;margin-right:10px;vertical-align:middle;color:var(--ink)}
.ic svg{width:100%;height:100%;display:block}
.s16{width:16px;height:16px}.s24{width:24px;height:24px}
.s48{width:48px;height:48px;background:var(--tile);border-radius:6px;padding:0;outline:1px dashed var(--line)}
.meta{color:var(--muted);font-size:13px;max-width:260px}
.old{white-space:nowrap}
.old figure{display:inline-block;margin:0 10px 0 0;text-align:center}
.old img{width:40px;height:40px;object-fit:contain;display:block;margin:0 auto;background:#fff;border-radius:6px;border:1px solid var(--line)}
.old figcaption{font-size:10px;color:var(--muted);max-width:72px;overflow:hidden;text-overflow:ellipsis}
.none{color:var(--muted);font-size:12px}
</style></head>
<body><main>
<h1>${MODULE} icon review</h1>
<p class="sub">ANTZ Rounded draft batch: every icon in the ${MODULE} module. Line and filled at 16, 24 and 48px (48px sits on a tile), next to the old mobile SVGs they replace. Icons are inlined from <code>library/line</code> and <code>library/filled</code> when this sheet was generated. Old SVGs load live from <code>app/public/current</code>.</p>
<div class="bar"><button type="button" id="theme">Toggle light / dark</button></div>
<div class="wrap"><table>
<thead><tr><th scope="col">Icon</th><th scope="col">Line 16 · 24 · 48</th><th scope="col">Filled 16 · 24 · 48</th><th scope="col">Metaphor</th><th scope="col">Old SVG</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
</main>
<script>
document.getElementById('theme').addEventListener('click',()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark';});
</script>
</body></html>
`;
mkdirSync(BASE + 'library/review', { recursive: true });
writeFileSync(BASE + `library/review/${SLUG}.html`, html);
console.log('ok', names.length);
