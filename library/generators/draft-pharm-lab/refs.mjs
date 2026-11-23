import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const D = new URL('.', import.meta.url).pathname;
const idx = JSON.parse(readFileSync(BASE + 'library/index.json', 'utf8'));
const mine = idx.icons.filter(i => /^(Pharmacy|Lab$|Mortality|Assessments)/.test(i.module));
let h = '<html><body style="margin:0;padding:6px;font:11px sans-serif;background:#fff">';
for (const i of mine) {
  h += `<div style="display:flex;gap:8px;align-items:center;height:56px;border-bottom:1px solid #ddd"><div style="width:130px">${i.name}</div>`;
  const r = `${BASE}app/node_modules/@material-symbols/svg-400/rounded/${i.reference}.svg`;
  if (i.reference && existsSync(r)) h += `<img src="file://${r}" style="width:48px;height:48px;background:#eef">`; else h += '<span style="width:48px;display:inline-block">-</span>';
  for (const s of i.sources) { const p = `${BASE}app/public/current/mobile_${s}.svg`; if (existsSync(p)) h += `<img src="file://${p}" style="width:48px;height:48px;object-fit:contain;border:1px solid #eee">`; }
  h += '</div>';
}
writeFileSync(D + 'refs.html', h + '</body></html>');
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',`--window-size=520,${mine.length*57+20}`,`--screenshot=${D}refs.png`,`file://${D}refs.html`],{stdio:'ignore'});
