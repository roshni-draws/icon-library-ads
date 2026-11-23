// node render.mjs <out> <srcDir|lib> <names...> : each cell = line 16/24/48 + filled 16/24/48
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const SP = new URL('.', import.meta.url).pathname;
const LIB = decodeURIComponent(new URL('../../../library', import.meta.url).pathname);
const [out, src, ...names] = process.argv.slice(2);
const dir = src === 'lib' ? LIB : SP + src;
let k = 0;
const inline = (st, n) => { const id = `m${k++}`; return readFileSync(`${dir}/${st}/${n}.svg`, 'utf8').replace('<svg ', '<svg class="i" ').replace(/id="cut"/g, `id="${id}"`).replace(/url\(#cut\)/g, `url(#${id})`); };
let h = '<html><body style="margin:0;padding:6px;background:#fff;color:#1b1b1b;font:11px sans-serif;display:grid;grid-template-columns:repeat(3,300px);gap:4px">';
for (const n of names) {
  h += `<div class=c><div>${n}</div><div style="display:flex;gap:8px;align-items:center">`;
  for (const st of ['line', 'filled']) for (const s of [16, 24, 48]) h += `<span class="s${s}">${inline(st, n)}</span>`;
  h += '</div></div>';
}
h += '<style>.c{border:1px solid #eee;padding:3px}.i{width:100%;height:100%;display:block}.s16{width:16px;height:16px}.s24{width:24px;height:24px}.s48{width:48px;height:48px;background:#f3f3f3}span{display:inline-block}</style></body></html>';
writeFileSync(`${SP}${out}.html`, h);
const rows = Math.ceil(names.length / 3);
execFileSync(`${SP}shot.sh`, [`${SP}${out}.html`, `${SP}${out}.png`, '940', String(rows * 76 + 14)], { env: { ...process.env, DSF: '2' } });
console.log(`${SP}${out}.png`);
