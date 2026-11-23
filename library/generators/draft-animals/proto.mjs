// node proto.mjs out file.json  -> json: [[label, svgBody(line elements as string)], ...] rendered as line icons
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const D = new URL('.', import.meta.url).pathname;
const [out, file] = process.argv.slice(2);
const items = JSON.parse(readFileSync(file, 'utf8'));
const H = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="i">';
let k = 0;
let h = '<html><body style="margin:0;padding:8px;background:#fff;color:#1b1b1b;font:11px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
for (const [lab, body] of items) {
  const b = body.replace(/id="cut"/g, `id="c${k}"`).replace(/#cut\)/g, `#c${k++})`);
  h += `<div style="display:flex;gap:10px;align-items:center;border:1px solid #eee;padding:4px"><div style="width:70px">${lab}</div><span class=s24>${H}${b}</svg></span><span class=s48>${H}${b.replace(/id="c(\d+)"/g,'id="d$1"').replace(/#c(\d+)\)/g,'#d$1)')}</svg></span><span class=s96>${H}${b.replace(/id="c(\d+)"/g,'id="e$1"').replace(/#c(\d+)\)/g,'#e$1)')}</svg></span></div>`;
}
h += '<style>.i{width:100%;height:100%;display:block}.s24{width:24px;height:24px}.s48{width:48px;height:48px}.s96{width:96px;height:96px;background:repeating-linear-gradient(0deg,#0000 0 3px,#eee 3px 4px),repeating-linear-gradient(90deg,#0000 0 3px,#eee 3px 4px)}span{display:inline-block}</style></body></html>';
writeFileSync(`${D}${out}.html`, h);
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=1000,${Math.ceil(items.length / 3) * 110 + 20}`, `--screenshot=${D}${out}.png`, `file://${D}${out}.html`], { stdio: 'ignore' });
console.log(`${D}${out}.png`);
