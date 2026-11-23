#!/usr/bin/env node
/**
 * Checks every SVG in ../library/line and ../library/filled against the ANTZ Rounded guard rails and prints a report.
 * Uses the same checker as the app (src/lib/checker.ts), bundled on the fly with esbuild (installed with Vite).
 *
 *   node scripts/check-library.mjs            report for every drawn icon + a summary
 *   node scripts/check-library.mjs egg done   only these icons
 *   node scripts/check-library.mjs --quiet    summary and problems only
 *   node scripts/check-library.mjs --json     machine-readable report
 *
 * Exit code 1 if any icon fails (warnings do not fail).
 */
import { build } from 'esbuild';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
const lib = fileURLToPath(new URL('../../library/', import.meta.url));
const args = process.argv.slice(2);
const quiet = args.includes('--quiet'), json = args.includes('--json');
const only = new Set(args.filter((a) => !a.startsWith('--')));

const out = await build({ entryPoints: [app + 'src/lib/checker.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { checkSvg } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));

const index = JSON.parse(readFileSync(lib + 'index.json', 'utf8'));
const names = new Set(index.icons.map((i) => i.name));
const files = (style) => (existsSync(lib + style) ? readdirSync(lib + style).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)) : []);
const drawn = [...new Set([...files('line'), ...files('filled')])].filter((n) => !only.size || only.has(n)).sort();

const ICON = { pass: 'PASS', info: 'info', warn: 'WARN', fail: 'FAIL' };
const report = [];
const count = { pass: 0, warn: 0, fail: 0 };
for (const name of drawn) {
  const entry = { name, inIndex: names.has(name), status: index.icons.find((i) => i.name === name)?.status ?? null, styles: {} };
  for (const style of ['line', 'filled']) {
    const p = `${lib}${style}/${name}.svg`;
    entry.styles[style] = existsSync(p) ? checkSvg(readFileSync(p, 'utf8'), style) : null;
  }
  const levels = Object.values(entry.styles).map((r) => (r ? r.level : 'fail'));
  entry.level = levels.includes('fail') ? 'fail' : levels.includes('warn') ? 'warn' : 'pass';
  count[entry.level]++;
  report.push(entry);
}

if (json) {
  console.log(JSON.stringify({ total: index.icons.length, drawn: drawn.length, count, icons: report }, null, 2));
} else {
  for (const e of report) {
    if (quiet && e.level === 'pass') continue;
    console.log(`\n${ICON[e.level]}  ${e.name}${e.inIndex ? ` (${e.status})` : '  — not in index.json'}`);
    for (const style of ['line', 'filled']) {
      const r = e.styles[style];
      if (!r) { console.log(`  ${style.padEnd(6)} FAIL  missing ${style}/${e.name}.svg`); continue; }
      console.log(`  ${style.padEnd(6)} ${ICON[r.level]}${r.keyline ? `  · ${r.keyline}` : ''}`);
      for (const c of r.results) {
        if (quiet && (c.level === 'pass' || c.level === 'info')) continue;
        console.log(`    ${ICON[c.level].padEnd(4)}  [${c.source}] ${c.title}: ${c.message}`);
      }
    }
  }
  const todo = index.icons.filter((i) => !drawn.includes(i.name)).length;
  console.log(`\n${index.icons.length} icons in index.json · ${drawn.length} checked (${count.pass} pass, ${count.warn} warn, ${count.fail} fail) · ${only.size ? '' : `${todo} with no SVG yet`}`);
}
process.exit(count.fail ? 1 : 0);
