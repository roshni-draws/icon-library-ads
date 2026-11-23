import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE=decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const D=new URL('.',import.meta.url).pathname;
const j=JSON.parse(readFileSync(BASE+'library/index.json','utf8'));
const list=j.icons.filter(e=>['Animals and species','Housing and diet'].includes(e.module)&&(process.argv[2]?e.name.match(process.argv[2]):e.status==='to_design'));
let h='<html><body style="margin:0;padding:6px;font:10px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:4px">';
for(const e of list){h+=`<div style="border:1px solid #ddd;padding:2px"><b>${e.name}</b><br>`;
 for(const s of e.sources){const p=BASE+`app/public/current/mobile_${s}.svg`; if(existsSync(p)) h+=`<img src="file://${p}" style="width:56px;height:56px;border:1px solid #eee">`;}
 if(e.reference){const p=BASE+`app/node_modules/@material-symbols/svg-400/rounded/${e.reference}.svg`; if(existsSync(p)) h+=`<img src="file://${p}" style="width:56px;height:56px;background:#eef">`;}
 h+='</div>';}
writeFileSync(D+'old.html',h+'</body></html>');
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',`--window-size=1200,${Math.ceil(list.length/6)*140+20}`,`--screenshot=${D}old.png`,`file://${D}old.html`],{stdio:'ignore'});
console.log(D+'old.png');
