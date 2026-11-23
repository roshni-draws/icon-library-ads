// node render.mjs <out> <names...>   (DSF env for device scale factor)
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SP = new URL('.', import.meta.url).pathname;
const LIB = process.env.LIB || decodeURIComponent(new URL('../../../library', import.meta.url).pathname);
const [out, ...names] = process.argv.slice(2);
let k = 0;
const inline = (style, n) => {
  const id = `m${k++}`;
  return readFileSync(`${LIB}/${style}/${n}.svg`, 'utf8').replace('<svg ', '<svg class="i" ').replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`);
};
let h = '<html><body style="margin:0;padding:8px;background:#fff;color:#1b1b1b;font:11px -apple-system,sans-serif">';
for (const n of names) {
  h += `<div class=row><div style="width:110px">${n}</div>`;
  for (const s of [24, 48, 96]) for (const st of ['line', 'filled']) h += `<span class="s${s}">${inline(st, n)}</span>`;
  h += '</div>';
}
h += '<style>.row{display:flex;align-items:center;gap:14px;height:104px;border-bottom:1px solid #eee}.i{width:100%;height:100%;display:block}.s24{width:24px;height:24px}.s48{width:48px;height:48px}.s96{width:96px;height:96px;background:repeating-linear-gradient(0deg,#0000 0 3px,#eee 3px 4px),repeating-linear-gradient(90deg,#0000 0 3px,#eee 3px 4px)}span{display:inline-block}</style></body></html>';
writeFileSync(`${SP}${out}.html`, h);
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--force-device-scale-factor=${process.env.DSF || 1}`, `--window-size=560,${names.length * 105 + 20}`, `--screenshot=${SP}${out}.png`, `file://${SP}${out}.html`], { stdio: 'ignore' });
console.log(`${SP}${out}.png`);
