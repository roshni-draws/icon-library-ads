#!/usr/bin/env node
/**
 * Checks ../library/index.json: names are snake_case and unique, statuses are valid, every `reference` is a
 * Material Symbols name in @material-symbols/svg-400, every source is a file in src/data/inventory.json, and
 * drafted/approved icons have both SVGs. Exits 1 on errors. Run: npm run validate
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
const lib = fileURLToPath(new URL('../../library/', import.meta.url));
const sym = (n) => existsSync(`${app}node_modules/@material-symbols/svg-400/rounded/${n}.svg`);
const inv = new Set(JSON.parse(readFileSync(`${app}src/data/inventory.json`, 'utf8')).map((r) => r.file));
const { icons } = JSON.parse(readFileSync(lib + 'index.json', 'utf8'));
const bad = [], warn = [], seen = new Set();
for (const i of icons) {
  if (!/^[a-z0-9_]+$/.test(i.name)) bad.push(`${i.name}: name is not snake_case`);
  if (seen.has(i.name)) bad.push(`${i.name}: duplicate name`);
  seen.add(i.name);
  if (!['to_design', 'draft', 'approved'].includes(i.status)) bad.push(`${i.name}: bad status ${i.status}`);
  if (i.reference && !sym(i.reference)) bad.push(`${i.name}: reference "${i.reference}" is not in @material-symbols/svg-400`);
  for (const s of i.sources) if (!inv.has(s)) warn.push(`${i.name}: source "${s}" is not in the inventory`);
  if (i.status !== 'to_design') for (const st of ['line', 'filled']) if (!existsSync(`${lib}${st}/${i.name}.svg`)) warn.push(`${i.name}: ${i.status} but ${st}/${i.name}.svg is missing`);
}
console.log(`Checked ${icons.length} library entries.`);
if (warn.length) console.log(`\nWarnings:\n  ${warn.join('\n  ')}`);
if (bad.length) { console.error(`\nErrors:\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('\nIndex valid.');
