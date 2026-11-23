// quick variants: append to gen by eval of its source
import { readFileSync, writeFileSync } from 'node:fs';
let src = readFileSync('./gen.mjs', 'utf8');
src = src.replace(/const only = process\.argv[\s\S]*$/, '');
src += `
const V = {};
const mk = (name, c, l, r) => { V[name] = {
  line: line({ back: [...personL(l), ...personL(r)], front: personL(c), hide: personHide(c) }),
  filled: filled({ sil: [...personF(l), ...personF(r)], hide: personHide(c), front: personF(c) }) }; };
mk('zz_a', SMALL(12,10), {cx:6,hy:6,hr:3,top:13,hw:4,cr:3,bottom:21}, {cx:18,hy:6,hr:3,top:13,hw:4,cr:3,bottom:21});
mk('zz_b', SMALL(12,11), {cx:6,hy:6,hr:3,top:13,hw:4,cr:3,bottom:18}, {cx:18,hy:6,hr:3,top:13,hw:4,cr:3,bottom:18});
mk('zz_c', {cx:12,hy:9,hr:3,top:16,hw:6,cr:3,bottom:21}, {cx:5,hy:8,hr:2,top:13,hw:3,cr:2,bottom:21}, {cx:19,hy:8,hr:2,top:13,hw:3,cr:2,bottom:21});
mk('zz_d', {cx:12,hy:10,hr:3,top:17,hw:6,cr:3,bottom:21}, {cx:6,hy:7,hr:3,top:14,hw:4,cr:2,bottom:21}, {cx:18,hy:7,hr:3,top:14,hw:4,cr:2,bottom:21});
for (const [n, v] of Object.entries(V)) { writeFileSync(LIB + '/line/' + n + '.svg', v.line); writeFileSync(LIB + '/filled/' + n + '.svg', v.filled); }
`;
writeFileSync('./_v.mjs', src);
