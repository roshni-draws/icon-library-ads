// Offline review page for the Primary icons: inline SVG at 48/64/96, <img> fallback, the scheme's own Lottie
// file side by side, six colour schemes, a Filled/Stroke variant toggle, reduced-motion toggle, a scrubber, the
// role/contrast table.
// lottie-web (svg-only "light" build) is inlined.
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function reviewHtml({ specs, svgs, lotties, svgsStroke = {}, lottiesStroke = {}, schemes, schemeKeys, roleTable, lottieJs }) {
  const vars = {};
  for (const k of schemeKeys) vars[k] = Object.fromEntries(Object.entries(schemes[k]).map(([r, v]) => [`--antz-${kebab(r)}`, v]));
  const short = (k) => k.replace('light', 'Light').replace('dark', 'Dark').replace('-medium-contrast', ' MC').replace('-high-contrast', ' HC');
  const head = `<tr><th>Role</th><th>Library role</th>${schemeKeys.map((k) => `<th>${short(k)}</th>`).join('')}</tr>`;
  const sw = (hex, op) => `<span class="sw" style="background:${hex};opacity:${op}"></span><code>${hex}</code>`;
  const roleRows = Object.entries(roleTable.roles)
    .map(([r, d]) => `<tr><td>${r}${d.opacity !== 1 ? ` (${d.opacity * 100}%)` : ''}</td><td><code>${d.scheme}</code></td>${d.values.map((v) => `<td>${sw(v, d.opacity)}</td>`).join('')}</tr>`)
    .join('');
  const pairRows = Object.entries(roleTable.pairs)
    .map(([p, v]) => `<tr><td>${p}</td><td></td>${v.map((x) => `<td class="${x < 3 ? 'low' : ''}">${x.toFixed(2)}:1</td>`).join('')}</tr>`)
    .join('');
  const cards = specs.map((s) => {
    const svg = svgs[s.name];
    const svgS = svgsStroke[s.name] || svg;
    // Both variants are inlined; body.stroke shows the stroke ones (.vs) and hides the filled ones (.vf).
    const both = (size) => `<div class="sz vf" style="--s:${size}px">${svg}</div><div class="sz vs" style="--s:${size}px">${svgS}</div>`;
    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const uriS = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgS);
    return `<article class="card">
  <header><h2>${esc(s.label)}</h2><span class="meta">${s.name} · base <code>${s.baseIcon}</code> · ${s.loopMs} ms · peaks ${s.peaks.map((t) => Math.round(t * 100) + '%').join(', ')}</span></header>
  <p class="motion">${esc(s.motion || '')}</p>
  <div class="row">
    <figure>${both(48)}<figcaption>48</figcaption></figure>
    <figure>${both(64)}<figcaption>64</figcaption></figure>
    <figure>${both(96)}<figcaption>96 · SVG</figcaption></figure>
    <figure><div class="lot" data-name="${s.name}"></div><figcaption>96 · Lottie <span class="lf"></span></figcaption></figure>
    <figure><img class="vf" src="${uri}" width="64" height="64" alt="${esc(s.label)}"><img class="vs" src="${uriS}" width="64" height="64" alt="${esc(s.label)} (stroke)"><figcaption>img (light fallback)</figcaption></figure>
  </div>
</article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ANTZ Primary icons</title>
<style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
body{margin:0;background:var(--antz-surface);color:var(--antz-on-surface);line-height:1.45}
main{max-width:1080px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:22px;margin:0 0 4px}
.sub{color:var(--antz-on-surface-variant);margin:0 0 20px;font-size:14px}
.bar{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;padding:12px 16px;border-radius:16px;background:var(--antz-surface-container);margin-bottom:20px;position:sticky;top:8px;z-index:2}
.bar label{font-size:14px;display:flex;gap:8px;align-items:center}
.seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--antz-outline);border-radius:999px;overflow:hidden}
.seg button{font:inherit;font-size:13px;border:0;background:transparent;color:var(--antz-on-surface);padding:6px 12px;cursor:pointer;min-height:32px}
.seg button[aria-pressed=true]{background:var(--antz-secondary-container);color:var(--antz-on-secondary-container)}
input[type=range]{width:160px}
.grid{display:grid;gap:16px}
.card{background:var(--antz-surface-container-low);border-radius:20px;padding:16px 20px}
.card header{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
h2{font-size:17px;margin:0}
.meta{font-size:13px;color:var(--antz-on-surface-variant)}
.motion{margin:6px 0 12px;font-size:14px}
.row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end}
figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}
figcaption{font-size:12px;color:var(--antz-on-surface-variant);font-variant-numeric:tabular-nums;text-align:center}
.sz svg{width:var(--s);height:var(--s);display:block}
.lot{width:96px;height:96px}
.wall{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px 8px;background:var(--antz-surface-container-low);border-radius:20px;padding:20px;max-width:560px}
.wall figure{gap:4px}.wall figcaption{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.wall svg{width:48px;height:48px;display:block;margin:auto}
body.wallview .grid,body.wallview .cardsonly{display:none}
body:not(.stroke) .vs,body.stroke .vf{display:none!important}
h3{font-size:15px;margin:28px 0 10px}
.tw{overflow-x:auto}
table{border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}td,th{padding:4px 10px 4px 0;text-align:left;white-space:nowrap}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:4px;border:1px solid var(--antz-outline-variant)}
td.low{color:var(--antz-error)}
code{font-size:12px}
body.rm .sz svg *,body.rm .wall svg *{animation:none!important}
body.seek .sz svg *,body.seek .wall svg *{animation-play-state:paused!important}
</style>
</head>
<body>
<main>
<h1>ANTZ Primary icons: v2.1 (style locked), ${specs.length} icons, Filled and Stroke</h1>
<p class="sub">Illustrative tile badges, 48 grid, a short story beat then rest. v2.1: the accent is the brand green (<code>onPrimaryFixedVariant</code>) and sits only on the light fill, never on the tile. SVG (CSS keyframes, themed by --antz-* variables) next to the Lottie file for the selected scheme. Stroke variant: the same scenes and motion, outline only in ink on the tile (no light fill, no accent); files in <code>svg-stroke/</code> and <code>lottie-stroke/</code>. Draft for review.</p>
<div class="bar" role="group" aria-label="Preview settings">
  <span class="seg" role="group" aria-label="Colour scheme">${schemeKeys.map((k, i) => `<button type="button" data-scheme="${k}" aria-pressed="${i === 0}">${short(k)}</button>`).join('')}</span>
  <span class="seg" role="group" aria-label="Variant"><button type="button" data-variant="filled" aria-pressed="true">Filled</button><button type="button" data-variant="stroke" aria-pressed="false">Stroke</button></span>
  <span class="seg" role="group" aria-label="View"><button type="button" data-view="cards" aria-pressed="true">Cards</button><button type="button" data-view="wall" aria-pressed="false">Wall</button></span>
  <label><input type="checkbox" id="rm"> Reduced motion</label>
  <label>Scrub <input type="range" id="scrub" min="0" max="100" value="0" aria-label="Scrub loop position"> <span id="pct">play</span></label>
</div>
<div class="grid">
${cards}
</div>
<h3>Wall: all ${specs.length} icons at 48 px, in nav order (scrub to pause every icon at the same loop position)</h3>
<div class="wall" id="wall"></div>
<h3>Roles per scheme</h3>
<div class="tw"><table>${head}${roleRows}</table></div>
<h3>Measured contrast (WCAG ratio, per scheme)</h3>
<div class="tw"><table>${head.replace('<th>Library role</th>', '<th></th>')}${pairRows}</table></div>
<p class="sub">fill/tile is under 3:1 by design: the 3px ink outline carries the silhouette (ink/tile and ink/fill are both ≥ 3:1 in every scheme). accent/tile and accent/ink are informational: the accent never sits on the tile or on ink. The <code>img</code> shows the light fallbacks, since an image can't read page variables. Scrub to 0% for the static (reduced-motion) pose.</p>
</main>
<script>${lottieJs}</script>
<script>
const SCHEMES=${JSON.stringify(vars)};
const LOTTIE={filled:${JSON.stringify(lotties)},stroke:${JSON.stringify(Object.keys(lottiesStroke).length ? lottiesStroke : lotties)}};
const WALL=${JSON.stringify(specs.map((s) => [s.label, ...[svgs[s.name], svgsStroke[s.name] || svgs[s.name]].map((v) => v.replace(/id="([^"]+)"/g, 'id="$1-wall"').replace(/url\(#([^)]+)\)/g, 'url(#$1-wall)').replace(/href="#([^"]+)"/g, 'href="#$1-wall"'))]))};
const LOOPS=${JSON.stringify(Object.fromEntries(specs.map((s) => [s.name, s.loopMs])))};
let scheme='${schemeKeys[0]}',variant='filled',anims=[],seek=null;
const osRM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const rmBox=document.getElementById('rm');rmBox.checked=osRM;
const wall=document.getElementById('wall');
for(const [label,svg,svgS] of WALL){const f=document.createElement('figure');f.innerHTML='<div class="vf">'+svg+'</div><div class="vs">'+svgS+'</div><figcaption></figcaption>';f.lastChild.textContent=label;wall.appendChild(f);}
function seekSvgs(){
  document.querySelectorAll('.sz svg,.wall svg').forEach(svg=>{
    const name=(svg.getAttribute('class')||'').replace('antz-p-','').replace(/-stroke$/,'');const loop=LOOPS[name]||3000;
    svg.querySelectorAll('[class*="antz-p-"]').forEach(el=>{el.style.animationDelay=seek===null?'':(-seek*loop)+'ms';});
  });
}
function apply(){
  const v=SCHEMES[scheme];const r=document.documentElement.style;
  for(const k in v)r.setProperty(k,v[k]);
  document.documentElement.style.colorScheme=scheme.startsWith('dark')?'dark':'light';
  document.body.classList.toggle('rm',rmBox.checked);
  document.body.classList.toggle('stroke',variant==='stroke');
  document.body.classList.toggle('seek',seek!==null);
  seekSvgs();
  anims.forEach(a=>a.destroy());anims=[];
  document.querySelectorAll('.lot').forEach(el=>{
    const data=LOTTIE[variant][el.dataset.name][scheme];
    el.nextElementSibling.querySelector('.lf').textContent=(variant==='stroke'?'lottie-stroke/':'lottie/')+el.dataset.name+'.'+scheme+'.json';
    const still=rmBox.checked||seek!==null;
    const a=lottie.loadAnimation({container:el,renderer:'svg',loop:true,autoplay:!still,animationData:data});
    if(still)a.goToAndStop(rmBox.checked?0:seek*data.op,true);
    anims.push(a);
  });
}
document.querySelectorAll('[data-scheme]').forEach(b=>b.addEventListener('click',()=>{scheme=b.dataset.scheme;document.querySelectorAll('[data-scheme]').forEach(x=>x.setAttribute('aria-pressed',x===b));apply();}));
rmBox.addEventListener('change',apply);
document.querySelectorAll('[data-variant]').forEach(b=>b.addEventListener('click',()=>{variant=b.dataset.variant;document.querySelectorAll('[data-variant]').forEach(x=>x.setAttribute('aria-pressed',x===b));apply();}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));document.body.classList.toggle('wallview',b.dataset.view==='wall');}));
const scrub=document.getElementById('scrub'),pct=document.getElementById('pct');
scrub.addEventListener('input',()=>{seek=+scrub.value/100;pct.textContent=scrub.value+'%';apply();});
pct.addEventListener('click',()=>{seek=null;pct.textContent='play';apply();});
apply();
</script>
</body>
</html>
`;
}
