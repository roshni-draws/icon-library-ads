// node earfrac.mjs "<ear d>" '[[x,y],...]'  — % of the ear centre line left visible outside each tag cut (r5)
import { createRequire } from 'node:module';
const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const { build } = createRequire(BASE + 'app/package.json')('esbuild');
const out = await build({ entryPoints: [BASE + 'app/src/lib/svg.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { parsePath, sampleSegs } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const pts = sampleSegs(parsePath(process.argv[2]), 0.05).flatMap((o) => o.pts);
let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
for (const [x, y] of JSON.parse(process.argv[3])) {
  const vis = pts.filter((p) => Math.hypot(p[0] - x, p[1] - y) >= 5).length / pts.length;
  console.log(`len ${len.toFixed(1)}  tag ${x},${y}: ${(vis * 100).toFixed(0)}% visible`);
}
