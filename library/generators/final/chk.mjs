import { readFileSync } from 'node:fs';
import { checkSvg } from '../redraw-c/lib.mjs';
const [f, st] = process.argv.slice(2);
const r = checkSvg(readFileSync(f, 'utf8'), st);
console.log(JSON.stringify(r.results.filter(c => c.level !== 'pass'), null, 1).slice(0, 3000));
