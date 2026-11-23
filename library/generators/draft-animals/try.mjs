import { createRequire } from 'node:module';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const require = createRequire(BASE + 'app/package.json');
const { build } = require('esbuild');
const out = await build({ entryPoints: [BASE + 'app/src/lib/checker.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { checkSvg } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const H = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
for (const body of process.argv.slice(2)) {
  const r = checkSvg(H + body + '</svg>', 'line');
  console.log(r.level, r.results.filter((x) => x.level !== 'pass' && x.level !== 'info').map((x) => x.message).join(' | '), '::', body.slice(0, 120));
}
