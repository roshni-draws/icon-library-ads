import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const SP = new URL('.', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(BASE + 'library/index.json', 'utf8'));
const med = idx.icons.filter(i => i.module === 'Medical');
let h = '<html><body style="margin:0;padding:6px;font:10px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:4px">';
for (const e of med) {
  const srcs = e.sources.filter(s => existsSync(`${BASE}app/public/current/mobile_${s}.svg`)).slice(0,3);
  const ref = e.reference && existsSync(`${BASE}app/node_modules/@material-symbols/svg-400/rounded/${e.reference}.svg`) ? `<img src="file://${BASE}app/node_modules/@material-symbols/svg-400/rounded/${e.reference}.svg" style="width:36px;height:36px;background:#def">` : '';
  h += `<div style="border:1px solid #ccc;padding:3px"><b>${e.name}</b><br>${srcs.map(s=>`<img src="file://${BASE}app/public/current/mobile_${s}.svg" style="width:36px;height:36px;object-fit:contain">`).join('')}${ref}</div>`;
}
h += '</body></html>';
writeFileSync(SP + 'old.html', h);
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files','--window-size=900,900',`--screenshot=${SP}old.png`,`file://${SP}old.html`],{stdio:'ignore'});
