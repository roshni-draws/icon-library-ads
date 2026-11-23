import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const require = createRequire(BASE + 'app/package.json');
const { build } = require('esbuild');
const out = await build({ entryPoints: [BASE + 'app/src/lib/checker.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { checkSvg } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));

const n = (v) => +v.toFixed(3);
const HEAD_L = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;
const RND = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const P = (d) => ({ tag: 'path', a: { d } });
const C = (cx, cy, r) => ({ tag: 'circle', a: { cx, cy, r } });
const R = (x, y, width, height, rx) => ({ tag: 'rect', a: { x, y, width, height, ...(rx ? { rx } : {}) } });
const el = (e, extra = '') => `<${e.tag} ${Object.entries(e.a).map(([k, v]) => `${k}="${v}"`).join(' ')}${extra ? ' ' + extra : ''}/>`;

const W = (e) => ({ e, paint: `fill="white" stroke="white" ${RND}` });
const WS = (e) => ({ e, paint: `fill="none" stroke="white" ${RND}` });
const WF = (e) => ({ e, paint: 'fill="white"' });
const K = (e) => ({ e, paint: `fill="none" stroke="black" ${RND}` });
const KF = (e) => ({ e, paint: 'fill="black"' });

function inkBox(layers) {
  const parts = layers.filter((l) => !l.paint.includes('black')).map((l) => el(l.e, l.paint.includes('stroke="white"') ? '' : ' stroke="none" fill="black"'));
  const { x0, y0, x1, y1 } = checkSvg(wrap(HEAD_L, parts), 'line').ink;
  return [Math.floor(x0 + 1e-6), Math.floor(y0 + 1e-6), Math.ceil(x1 - 1e-6), Math.ceil(y1 - 1e-6)];
}
function masked(layers, box) {
  const [x0, y0, x1, y1] = box ?? inkBox(layers);
  return wrap(HEAD_F, ['<mask id="cut">', ...layers.map((l) => '  ' + el(l.e, l.paint)), '</mask>', `<path d="M${x0} ${y0}H${x1}V${y1}H${x0}Z" mask="url(#cut)"/>`]);
}
function line(els, { cut = [], behind = [] } = {}) {
  if (!cut.length) return wrap(HEAD_L, els.map((e) => el(e)));
  return wrap(HEAD_L, [
    '<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>',
    ...cut.map((e) => '  ' + el(e, 'fill="black" stroke="none"')), '</mask>',
    '<g mask="url(#cut)">', ...behind.map((e) => '  ' + el(e)), '</g>', ...els.map((e) => el(e)),
  ]);
}

/* Badges: parts.ts (centre 17,17, ink r5, cut r7); arrow + lock from draft-animals. */
const BADGE = {
  alert: { line: [P('M17 13V17M17 21V21')], knock: 'M17 14V17M17 20V20' },
  arrow: { line: [P('M13 17H21M18 14L21 17L18 20')], knock: 'M14 17H20M17 14L20 17L17 20' },
  // simpler globe: ring r4 + one vertical meridian (filled keeps the strokes, like the old globe badge)
  globe: { line: [C(17, 17, 4), P('M17 13V21')], filled: [WS(C(17, 17, 4)), WS(P('M17 13V21'))] },
  lock: {
    line: [R(13, 16, 8, 5, 2), P('M15 16V15A2 2 0 0 1 19 15V16')],
    filled: [WF(R(12, 15, 10, 7, 3)), WS(P('M15 15A2 2 0 0 1 19 15')), K(P('M17 18V19'))],
  },
};
function badged(id, baseL, baseF, { box } = {}) {
  const b = BADGE[id];
  const badgeF = b.filled ? [KF(C(17, 17, 7)), ...b.filled] : [KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P(b.knock))];
  return { line: line(b.line, { cut: [C(17, 17, 7)], behind: baseL }), filled: masked([...baseF, ...badgeF], box) };
}
const capsule = (r) => { // 45° slash capsule from (4,4) to (20,20), radius r (eggs/gen.mjs)
  const o = r / Math.SQRT2;
  return `M${n(4 + o)} ${n(4 - o)}L${n(20 + o)} ${n(20 - o)}A${r} ${r} 0 0 1 ${n(20 - o)} ${n(20 + o)}L${n(4 - o)} ${n(4 + o)}A${r} ${r} 0 0 1 ${n(4 + o)} ${n(4 - o)}Z`;
};


export function emit(icons, OUT, only = []) {
  mkdirSync(`${OUT}/line`, { recursive: true }); mkdirSync(`${OUT}/filled`, { recursive: true });
  for (const [name, { line: l, filled: f }] of Object.entries(icons)) {
    if (only.length && !only.includes(name)) continue;
    writeFileSync(`${OUT}/line/${name}.svg`, l);
    writeFileSync(`${OUT}/filled/${name}.svg`, f);
    for (const [st, s] of [['line', l], ['filled', f]]) {
      const r = checkSvg(s, st);
      const bad = r.results.filter((c) => c.level === 'warn' || c.level === 'fail');
      if (bad.length) console.log(name, st, r.level, JSON.stringify(bad.map((c) => c.id + ': ' + c.message)));
    }
  }
}
export { n, HEAD_L, HEAD_F, wrap, P, C, R, el, W, WS, WF, K, KF, masked, line, BADGE, badged, capsule, checkSvg };
