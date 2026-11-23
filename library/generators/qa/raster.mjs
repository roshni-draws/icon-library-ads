import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [LIB, Q] = process.argv.slice(2);
const data = {};
for (const s of ['line','filled']) for (const f of readdirSync(`${LIB}/${s}`)) if (f.endsWith('.svg')) data[`${s}/${f.slice(0,-4)}`] = readFileSync(`${LIB}/${s}/${f}`,'utf8').replace(/currentColor/g,'#000');
const html = `<html><body><pre id=out></pre><script>
const D=${JSON.stringify(data)};const S=24;
(async()=>{const res={};const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d',{willReadFrequently:true});
for(const k in D){const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(D[k]);await img.decode();x.clearRect(0,0,S,S);x.drawImage(img,0,0,S,S);const d=x.getImageData(0,0,S,S).data;const a=[];for(let i=3;i<d.length;i+=4)a.push(d[i]);res[k]=a.join(',');}
document.getElementById('out').textContent='<'+'<BEGIN>'+JSON.stringify(res)+'<'+'<END>';})();
</script></body></html>`;
writeFileSync(`${Q}/raster.html`, html);
const out = execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--disable-gpu',`--user-data-dir=${Q}/chrome`,'--virtual-time-budget=20000','--dump-dom',`file://${Q}/raster.html`], {maxBuffer: 1<<28}).toString();
const m = out.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').match(/<<BEGIN>(.*)<<END>/s); writeFileSync(`${Q}/alpha.json`, m[1]); console.log('ok', Object.keys(JSON.parse(m[1])).length);
