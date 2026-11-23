// node render.mjs <out> <names...> : grid sheet, each cell: line 24/48 filled 24/48, plus 16px
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SP = new URL('.', import.meta.url).pathname;
const LIB = decodeURIComponent(new URL('../../../library', import.meta.url).pathname);
const [out, ...names] = process.argv.slice(2);
let k = 0;
const inline = (st, n) => { const id = `m${k++}`; return readFileSync(`${LIB}/${st}/${n}.svg`, 'utf8').replace('<svg ', '<svg class="i" ').replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`); };
let h = '<html><body style="margin:0;padding:6px;background:#fff;color:#1b1b1b;font:10px sans-serif;display:grid;grid-template-columns:repeat(4,240px);gap:4px">';
for (const n of names) {
  h += `<div class=c><div>${n}</div><div style="display:flex;gap:8px;align-items:center">`;
  for (const st of ['line', 'filled']) for (const s of [16, 24, 48]) h += `<span class="s${s}">${inline(st, n)}</span>`;
  h += '</div></div>';
}
h += '<style>.c{border:1px solid #eee;padding:3px}.i{width:100%;height:100%;display:block}.s16{width:16px;height:16px}.s24{width:24px;height:24px}.s48{width:48px;height:48px;background:repeating-linear-gradient(0deg,#0000 0 1px,#eee 1px 2px)}span{display:inline-block}</style></body></html>';
h = h.replace('repeating-linear-gradient(0deg,#0000 0 1px,#eee 1px 2px)', '#f6f6f6');
writeFileSync(`${SP}${out}.html`, h);
const rows = Math.ceil(names.length / 4);
execFileSync(`${SP}shot.sh`, [`${SP}${out}.html`, `${SP}${out}.png`, '1000', String(rows * 74 + 14)], { env: { ...process.env, DSF: '1' } });
console.log(`${SP}${out}.png`);
