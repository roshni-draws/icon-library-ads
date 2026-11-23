import { readFileSync, writeFileSync } from 'node:fs';
const [LIB,Q]=process.argv.slice(2);
const A=JSON.parse(readFileSync(`${Q}/alpha.json`,'utf8'));
const out={};
for(const s of ['line','filled']){
  const keys=Object.keys(A).filter(k=>k.startsWith(s+'/')).map(k=>k.slice(s.length+1));
  const V=Object.fromEntries(keys.map(k=>[k,A[`${s}/${k}`].split(',').map(Number)]));
  const T=Object.fromEntries(keys.map(k=>[k,readFileSync(`${LIB}/${s}/${k}.svg`,'utf8').replace(/\s+/g,' ').trim()]));
  const pairs=[];
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
    const a=V[keys[i]],b=V[keys[j]];let d=0,u=0;for(let p=0;p<576;p++){d+=Math.abs(a[p]-b[p]);u+=Math.max(a[p],b[p]);}
    pairs.push({a:keys[i],b:keys[j],area:d/255/576*100,rel:u?d/u*100:0,same:T[keys[i]]===T[keys[j]]});
  }
  pairs.sort((x,y)=>x.area-y.area);
  out[s]=pairs.slice(0,40);
}
writeFileSync(`${Q}/dups.json`,JSON.stringify(out,null,1));
for(const s in out){console.log('==',s);for(const p of out[s].slice(0,30))console.log(p.a.padEnd(24),p.b.padEnd(24),p.area.toFixed(2).padStart(6),p.rel.toFixed(1).padStart(6),p.same?'IDENTICAL':'')}
const known=[['urgent','emergency'],['lab_microscope','necropsy'],['repro_oviparous','egg'],['transfer','swap']];
