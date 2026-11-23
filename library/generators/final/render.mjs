// node render.mjs <out> <label=dir:name>...   dir relative to final/ or "lib"; line+filled at 16/24/48/96
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SP = new URL('.', import.meta.url).pathname;
const LIB = decodeURIComponent(new URL('../../../library', import.meta.url).pathname);
const [out, ...items] = process.argv.slice(2);
let k = 0;
const inline = (dir, st, n) => { const id = `m${k++}`; return readFileSync(`${dir === 'lib' ? LIB : SP + dir}/${st}/${n}.svg`, 'utf8').replace('<svg ', '<svg class="i" ').replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`); };
let h = '<html><body style="margin:0;padding:6px;background:#fff;color:#1b1b1b;font:12px sans-serif">';
for (const it of items) {
  const [label, src] = it.includes('=') ? it.split('=') : [it.split(':')[1], it];
  const [dir, n] = src.split(':');
  h += `<div class=row><div style="width:170px">${label}</div>`;
  for (const st of ['line', 'filled']) for (const s of [16, 24, 48, 96]) h += `<span class="s${s}">${inline(dir, st, n)}</span>`;
  h += '</div>';
}
h += '<style>.row{display:flex;align-items:center;gap:12px;height:104px;border-bottom:1px solid #eee}.i{width:100%;height:100%;display:block}.s16{width:16px;height:16px}.s24{width:24px;height:24px}.s48{width:48px;height:48px}.s96{width:96px;height:96px;background:repeating-linear-gradient(0deg,#0000 0 3px,#eee 3px 4px),repeating-linear-gradient(90deg,#0000 0 3px,#eee 3px 4px)}span{display:inline-block}</style></body></html>';
writeFileSync(`${SP}${out}.html`, h);
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${SP}chrome`, `--force-device-scale-factor=${process.env.DSF || 1}`, `--window-size=900,${items.length * 105 + 14}`, `--screenshot=${SP}${out}.png`, `file://${SP}${out}.html`], { stdio: 'ignore', timeout: 60000 });
console.log(`${SP}${out}.png`);
