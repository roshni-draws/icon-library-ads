import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [LIB, Q] = process.argv.slice(2);
const idx = JSON.parse(readFileSync(`${LIB}/index.json`, 'utf8'));
// checker warns
const chk = readFileSync(`${Q}/check.txt`, 'utf8').split('\n');
const warns = {}; let cur = null, side = null;
for (const l of chk) {
  let m;
  if ((m = l.match(/^(PASS|WARN|FAIL)\s+(\S+)/))) { cur = m[2]; side = null; continue; }
  if ((m = l.match(/^  (line|filled)\s+(PASS|WARN|FAIL)/))) { side = m[1]; continue; }
  if ((m = l.match(/^    (WARN|FAIL)\s+(.*)$/)) && cur) (warns[cur] ??= []).push(`${m[1]} (${side}): ${m[2]}`);
}
// duplicates: recomputed from dups.json (raster alpha diff at 24px + normalised SVG text) on the current files.
// exact = identical SVG text or 0% pixel difference in line or filled; near = under 3% relative difference.
const DJ = JSON.parse(readFileSync(`${Q}/dups.json`, 'utf8'));
const pairMap = {};
for (const s of ['line', 'filled']) for (const p of DJ[s]) {
  const key = [p.a, p.b].sort().join('|');
  (pairMap[key] ??= {})[s] = p;
}
const DUP = [];
for (const [key, v] of Object.entries(pairMap)) {
  const [a, b] = key.split('|');
  const desc = (s) => v[s] ? (v[s].same ? 'identical SVG' : v[s].area === 0 ? 'pixel-identical' : `${v[s].rel.toFixed(1)}%`) : 'n/a';
  const exact = ['line', 'filled'].some((s) => v[s] && (v[s].same || v[s].area === 0));
  const near = ['line', 'filled'].some((s) => v[s] && v[s].rel < 3);
  if (exact || near) DUP.push([a, b, `${exact ? 'exact duplicate' : 'near duplicate'} (line ${desc('line')}, filled ${desc('filled')})`]);
}
writeFileSync(`${Q}/dup-pairs.json`, JSON.stringify(DUP, null, 1));
const dups = {};
for (const [a, b, why] of DUP) { (dups[a] ??= []).push(`${b}: ${why}`); (dups[b] ??= []).push(`${a}: ${why}`); }
const WEAK = new Set('carcass_pickup carcass_transfer request priority_high priority_low emergency fetal_death file_excel note_alt query_stats call mail bookmark_added transfer swap request_quote contact_support progress_activity groups people announcement deworming lab_profile prescription chronic event_repeat file_word file_pdf tag_public travel_explore repro_viviparous repro_ovoviviparous compost breeding_pair egg_nursery'.split(' '));
const FIXED = new Set('carcass_pickup carcass_transfer compost fetal_death necropsy priority_low priority_medium priority_high priority_critical repro_viviparous request_quote tag_private tag_public transfer travel_explore chat_bubble comment chat add_comment forum admin_panel_settings person_search people groups draft note_add file_pdf file_word file_excel lab_profile vaccine controlled_substance diagnosis pill deworming prescription chronic event_repeat mail call query_stats bookmark_added'.split(' '));
const MERGED = new Set(['urgent', 'repro_oviparous', 'assignment_turned_in', 'pending_actions', 'sms', 'repro_viviparous']);
const isWeak = (n) => WEAK.has(n) && !FIXED.has(n) && !MERGED.has(n); // ear tags were redrawn (redraw-a/c)
let k = 0;
const svg = (st, n) => {
  const p = `${LIB}/${st}/${n}.svg`;
  if (!existsSync(p)) return '<span class="missing">missing</span>';
  const id = `m${k++}`;
  return readFileSync(p, 'utf8').replace(/<\?xml[^>]*>/, '').replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`).replace(/\s*\n\s*/g, '').replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mods = [];
for (const i of idx.icons) { let m = mods.find((x) => x.name === i.module); if (!m) mods.push(m = { name: i.module, icons: [] }); m.icons.push(i); }
const counts = { warn: 0, dup: 0, weak: 0 };
let body = '';
for (const m of mods) {
  body += `<section id="${slug(m.name)}"><h2>${esc(m.name)} <span class="n">${m.icons.length}</span></h2><div class="grid">`;
  for (const i of m.icons) {
    const b = [];
    if (warns[i.name]) { counts.warn++; b.push(`<span class="b warn" title="${esc(warns[i.name].join('\n'))}">Checker warn</span>`); }
    if (dups[i.name]) { counts.dup++; b.push(`<span class="b dup" title="${esc(dups[i.name].join('\n'))}">Duplicate</span>`); }
    if (isWeak(i.name)) { counts.weak++; b.push(`<span class="b weak" title="Flagged as weak by the drafting agent">Weak</span>`); }
    const notes = [...(warns[i.name] || []), ...(dups[i.name] || []).map((d) => 'Same as ' + d)];
    const flags = [warns[i.name] && 'warn', dups[i.name] && 'dup', isWeak(i.name) && 'weak'].filter(Boolean).join(' ');
    body += `<article class="card" data-flags="${flags}"><div class="ics">
<div class="set"><span class="ic s24">${svg('line', i.name)}</span><span class="ic s48">${svg('line', i.name)}</span><small>Line</small></div>
<div class="set"><span class="ic s24">${svg('filled', i.name)}</span><span class="ic s48">${svg('filled', i.name)}</span><small>Filled</small></div></div>
<div class="meta"><code>${esc(i.name)}</code><span class="lbl">${esc(i.label || '')}</span><span class="st">${esc(i.status)}</span>${b.join('')}${notes.length ? `<ul class="why">${notes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></article>`;
  }
  body += '</div></section>';
}
const st = {}; for (const i of idx.icons) st[i.status] = (st[i.status] || 0) + 1;
const nav = mods.map((m) => `<a href="#${slug(m.name)}">${esc(m.name)} <span>${m.icons.length}</span></a>`).join('');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ANTZ icon review</title>
<style>
:root{--bg:#fbfbf9;--surface:#fff;--ink:#1c1f1d;--muted:#5d6661;--line:#e3e6e3;--tile:#f2f4f2;--warn-bg:#fff1d6;--warn-ink:#7a4b00;--dup-bg:#e3ecff;--dup-ink:#1d3f8f;--weak-bg:#f6e3ec;--weak-ink:#7d2350;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121413;--surface:#1a1d1b;--ink:#e6e9e6;--muted:#9aa39e;--line:#2c312e;--tile:#232724;--warn-bg:#3d2e10;--warn-ink:#ffd28a;--dup-bg:#1c2a4a;--dup-ink:#b5c9ff;--weak-bg:#3d1e2c;--weak-ink:#f6b8d3;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121413;--surface:#1a1d1b;--ink:#e6e9e6;--muted:#9aa39e;--line:#2c312e;--tile:#232724;--warn-bg:#3d2e10;--warn-ink:#ffd28a;--dup-bg:#1c2a4a;--dup-ink:#b5c9ff;--weak-bg:#3d1e2c;--weak-ink:#f6b8d3;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line)}
.top{max-width:1240px;margin:0 auto;padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
h1{font-size:18px;margin:0;flex:1 1 auto}
.top button,.top select{font:inherit;border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:8px;padding:6px 12px;cursor:pointer}
nav{max-width:1240px;margin:0 auto;padding:0 16px 10px;display:flex;flex-wrap:wrap;gap:6px}
nav a{flex:0 0 auto;color:var(--ink);text-decoration:none;border:1px solid var(--line);background:var(--surface);border-radius:99px;padding:3px 10px;font-size:12px}
nav a span{color:var(--muted)}
nav a:hover,nav a:focus-visible{border-color:var(--muted)}
main{max-width:1240px;margin:0 auto;padding:16px 16px 64px}
p.sub{margin:0 0 8px;color:var(--muted);max-width:80ch}
section{scroll-margin-top:150px;margin-top:28px}
h2{font-size:16px;margin:0 0 10px}h2 .n{color:var(--muted);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;align-items:start}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;gap:12px;min-width:0}
.ics{display:flex;flex-direction:column;gap:8px;flex:0 0 auto}
.set{display:flex;align-items:center;gap:8px}
.set small{color:var(--muted);font-size:11px;width:34px}
.ic{display:inline-grid;place-items:center;color:var(--ink)}
.ic svg{width:100%;height:100%;display:block}
.s24{width:24px;height:24px}
.s48{width:48px;height:48px;background:var(--tile);border-radius:6px}
.meta{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.meta code{font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
.lbl{color:var(--muted);font-size:12px}
.st,.b{display:inline-block;font-size:11px;padding:1px 8px;border-radius:99px;background:var(--tile);color:var(--muted)}
.b.warn{background:var(--warn-bg);color:var(--warn-ink)}
.b.dup{background:var(--dup-bg);color:var(--dup-ink)}
.b.weak{background:var(--weak-bg);color:var(--weak-ink)}
.why{margin:2px 0 0;padding-left:16px;font-size:11px;color:var(--muted)}
.missing{font-size:10px;color:var(--warn-ink)}
.hide{display:none}
</style></head><body>
<header><div class="top"><h1>ANTZ icon review</h1>
<label>Show <select id="flt"><option value="">All icons</option><option value="warn">Checker warn</option><option value="dup">Duplicates</option><option value="weak">Weak</option></select></label>
<button type="button" id="theme" aria-label="Toggle light or dark theme">Dark</button></div>
<nav aria-label="Modules">${nav}</nav></header>
<main><p class="sub">${idx.icons.length} icons in index.json · status: ${Object.entries(st).map(([a, b]) => `${b} ${a}`).join(', ')} · ${counts.warn} with checker warnings, ${counts.dup} in duplicate pairs, ${counts.weak} flagged weak (still open after redraw rounds A–C and the final pass). Each icon shows line and filled at 24px and 48px. Hover a badge for its reason. Built ${new Date().toISOString().slice(0, 10)} from the files in library/.</p>
${body}</main>
<script>
(function(){var r=document.documentElement,b=document.getElementById('theme');
function cur(){return r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
function lab(){b.textContent=cur()==='dark'?'Light':'Dark'}
try{var s=localStorage.getItem('antz-review-theme');if(s)r.dataset.theme=s}catch(e){}
lab();b.onclick=function(){r.dataset.theme=cur()==='dark'?'light':'dark';try{localStorage.setItem('antz-review-theme',r.dataset.theme)}catch(e){}lab()};
document.getElementById('flt').onchange=function(e){var v=e.target.value;document.querySelectorAll('.card').forEach(function(c){c.classList.toggle('hide',!!v&&c.dataset.flags.split(' ').indexOf(v)<0)});document.querySelectorAll('section').forEach(function(s){s.classList.toggle('hide',!s.querySelector('.card:not(.hide)'))})};})();
</script></body></html>`;
writeFileSync(`${LIB}/review/index.html`, html);
console.log(counts, html.length, k);
