import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE=decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const D=new URL('.',import.meta.url).pathname;
const MODS=['Requests, approvals and transfers','Notes, journal and announcements','Notifications','Chat'];
const ix=JSON.parse(readFileSync(BASE+'library/index.json','utf8'));
const mine=ix.icons.filter(i=>MODS.includes(i.module));
let h='<html><body style="margin:0;padding:6px;font:11px sans-serif;background:#fff">';
for(const i of mine){
  h+=`<div style="display:flex;align-items:center;gap:8px;height:52px;border-bottom:1px solid #eee"><div style="width:150px">${i.name}</div>`;
  const r=BASE+`app/node_modules/@material-symbols/svg-400/rounded/${i.reference}.svg`;
  if(existsSync(r)) h+=`<img src="file://${r}" style="width:44px;height:44px;background:#eef">`;
  for(const s of i.sources){const p=BASE+`app/public/current/mobile_${s}.svg`; if(existsSync(p)) h+=`<img src="file://${p}" style="width:44px;height:44px;object-fit:contain;border:1px solid #ddd">`;}
  h+='</div>';
}
writeFileSync(D+'refs.html',h+'</body></html>');
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',`--window-size=520,${mine.length*53+20}`,`--screenshot=${D}refs.png`,`file://${D}refs.html`],{stdio:'ignore'});
console.log(mine.length);
