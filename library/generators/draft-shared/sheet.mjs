import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const index = JSON.parse(readFileSync(BASE + 'library/index.json', 'utf8'));
const META = {
  add: 'Plus. Common base.', add_circle: 'Plus inside the r9 circle (filled: disc with plus cut).',
  search: 'Magnifier: lens r7 + 45° handle. Filled: solid lens with a glint cut.',
  filter: 'Funnel with 45° shoulders and a rounded stem (chosen over sliders / filter_list so it does not look like Sort).',
  delete: 'Trash can: lid with handle, body with two slots.', document: 'Dog-ear page (shared DOCUMENT base) with two text lines.',
  person: 'Head r4 + rounded shoulders. Common PERSON base.', priority_flag: 'Pole with a swallow-tail flag (45° notch). Common FLAG base.',
  image: 'Photo frame, sun dot and mountain (same geometry as add_photo).', gallery: 'Photo in front of a second photo (L-shaped back edge).',
  time: 'Clock: r9 circle with 45° hands.', calendar: 'Shared CALENDAR base with a 2 × 3 date-dot grid.',
  swap: 'Two opposite full-width arrows (⇄).', transfer: 'Two staggered opposite arrows (compare_arrows).',
  line_start_circle: 'Circle at the start of a line.', line_end_circle: 'Line ending in a circle.', line_end_square: 'Line ending in a square.',
  checkbox_unchecked: 'Rounded square. Filled = solid square.', checkbox_checked: 'Rounded square with a 45° check.', checkbox_partial: 'Rounded square with a minus (indeterminate).',
  add_column_right: 'Three-column table + add badge.', forum: 'Two speech bubbles, the back one hidden 2px behind the front one.',
  folder: 'Folder with a 45° tab.', sort: 'Three left-aligned lines, longest to shortest.', encrypted: 'Shield with a keyhole.',
  fetal_death: 'Curled fetus: large head, body curling underneath. Needs a designer pass.', arrow_forward: 'Arrow pointing right (6px head).',
  visibility: 'Eye with pupil ring. Filled: solid eye, pupil ring cut.', monitoring: 'Chart axes with a 45° trend line.',
  query_stats: 'Trend line with a small magnifier cut into it (bottom right).', qr_code_scanner: 'Scan corners (same as select_all) around three QR finder squares and a dot.',
  redo: 'U-turn arrow returning right.', person_off: 'Person with a 45° slash, person cut 2px either side.',
  verified: '8-point seal (square + diamond, all 45°) with a check.', call: 'Phone handset.',
  local_hospital: 'Hospital building: cross on the façade, arched door, ground line.', fingerprint: 'Three nested arches of different lengths.',
  lock: 'Padlock with keyhole.', logout: 'Door bracket with an arrow leaving to the right.', mail: 'Envelope with flap.',
  visibility_off: 'Eye with a 45° slash.', person_pin_circle: 'Person whose head is a location pin (assigned location).',
  sms: 'Speech bubble with three dots (shared BUBBLE base).', file_excel: 'Document base with a small table grid.',
  play_circle: 'Play triangle in a circle.', sort_a_to_z: 'Rounded A over Z, down arrow.', sort_z_to_a: 'Z over rounded A, down arrow.',
  article: 'Square page with three text lines.', unfold_more: 'Up and down chevrons.',
  sort_oldest_first: 'History: open clock arc, arrow at the left end turning back (counter-clockwise).',
  sort_newest_first: 'Update: mirrored history (clockwise arrow).', priority_critical: 'Circle with a double up chevron (priority family: high ^, low v, medium =).',
  priority_medium: 'Circle with two bars (=).', arrow_right_alt: 'Long arrow, small head (sort direction).',
  bookmark_added: 'Bookmark with a check.', note_alt: 'Clipboard (shared CLIPBOARD base) with a pencil stroke.',
};
const SLUG = process.argv[2]; const MODS = process.argv.slice(3);
const mine = JSON.parse(readFileSync(new URL('./mine.json', import.meta.url), 'utf8'));
const eggs = index.icons.filter((i) => (MODS.includes('*') ? !['Home, navigation and insights','Login, account and staff','Shared controls (filter, sort, media)','Shared across modules'].includes(i.module) && mine.includes(i.name) : MODS.includes(i.module)));
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
  <td class="meta">${META[n] ?? ''}${MODS.includes('*') ? `<br><em>${e.module}</em>` : ''}</td>
  <td class="old">${old.map((s) => `<figure><img src="../../app/public/current/mobile_${s}.svg" alt="old ${s}"><figcaption>${s}</figcaption></figure>`).join('') || '<span class="none">none</span>'}</td>
</tr>`;
}).join('\n');
const TITLE = process.env.TITLE; const SUB = process.env.SUB;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE}</title>
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
<h1>${TITLE}</h1>
<p class="sub">${SUB} Line and filled at 16, 24 and 48px (48px sits on a tile), next to the old mobile SVGs they replace. Icons are inlined from <code>library/line</code> and <code>library/filled</code> when this sheet was generated. Old SVGs load live from <code>app/public/current</code>.</p>
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
