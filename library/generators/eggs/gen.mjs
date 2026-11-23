// Generates the Eggs-module icons into library/line and library/filled.
import { writeFileSync } from 'node:fs';

const LIB = process.argv[2];
const n = (v) => +v.toFixed(3);

const HEAD_L = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;

/* ---- Egg geometry ------------------------------------------------------
 * The base egg (line) is "M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z":
 * a bottom half-circle of radius r centred on (cx, cy), an apex 11/7·r above the centre,
 * and cubic shoulders. egg(cx, cy, r, d) offsets it outward by d (d=1 gives the filled
 * silhouette, d=3 gives the 2px-gap cut-out used in masks). r=7,d=0 and r=7,d=1 reproduce
 * library/line/egg.svg and library/filled/egg.svg exactly.
 */
function egg(cx, cy, r, d = 0) {
  const apex = cy - Math.round((r * 11) / 7) - d;
  const R = r + d;
  const c1 = R / 2;
  const c2 = (r * 5) / 7 + d / 2;
  return `M${n(cx)} ${n(apex)}C${n(cx - c1)} ${n(apex)} ${n(cx - R)} ${n(cy - c2)} ${n(cx - R)} ${n(cy)}A${n(R)} ${n(R)} 0 0 0 ${n(cx + R)} ${n(cy)}C${n(cx + R)} ${n(cy - c2)} ${n(cx + c1)} ${n(apex)} ${n(cx)} ${n(apex)}Z`;
}
const EGG_L = egg(12, 14, 7, 0);
const EGG_F = egg(12, 14, 7, 1);
if (EGG_L !== 'M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z') throw new Error('egg L drift ' + EGG_L);
if (EGG_F !== 'M12 2C8 2 4 8.5 4 14A8 8 0 0 0 20 14C20 8.5 16 2 12 2Z') throw new Error('egg F drift ' + EGG_F);

/* ---- Badges (bottom-right, centre 17,17, ink radius 5, cut radius 7) -- */
const BADGE = {
  add: { line: 'M17 13V21M13 17H21', knock: 'M17 14V20M14 17H20' },
  check: { line: 'M13 17L16 20L21 14', knock: 'M14 17L16 19L19 16' },
  close: { line: 'M14 14L20 20M20 14L14 20', knock: 'M15 15L19 19M19 15L15 19' },
  // 4-point sparkle: tips on radius 4 (line, +1 stroke = ink 5) and radius 5 (filled, solid)
  sparkle: {
    line: 'M17 13Q17.6 16.4 21 17Q17.6 17.6 17 21Q16.4 17.6 13 17Q16.4 16.4 17 13Z',
    solid: 'M17 12Q17.8 16.2 22 17Q17.8 17.8 17 22Q16.2 17.8 12 17Q16.2 16.2 17 12Z',
  },
};
function badged(id, baseL = EGG_L, baseF = EGG_F) {
  const b = BADGE[id];
  const line = wrap(HEAD_L, [
    '<mask id="cut">',
    '  <rect width="24" height="24" fill="white" stroke="none"/>',
    '  <circle cx="17" cy="17" r="7" fill="black" stroke="none"/>',
    '</mask>',
    '<g mask="url(#cut)">',
    `  <path d="${baseL}"/>`,
    '</g>',
    `<path d="${b.line}"/>`,
  ]);
  const filled = b.solid
    ? wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white"/>',
      '  <circle cx="17" cy="17" r="7" fill="black"/>',
      '</mask>',
      `<path d="${baseF}" mask="url(#cut)"/>`,
      `<path d="${b.solid}"/>`,
    ])
    : wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white"/>',
      '  <circle cx="17" cy="17" r="7" fill="black"/>',
      '  <circle cx="17" cy="17" r="5" fill="white"/>',
      `  <path d="${b.knock}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      '</mask>',
      '<g mask="url(#cut)">',
      `  <path d="${baseF}"/>`,
      '  <circle cx="17" cy="17" r="5"/>',
      '</g>',
    ]);
  return { line, filled };
}

/* ---- Offset helper for the hatched-shell rim (mask region below the rim, 3px clear) ---- */
function rimCut(pts, d) {
  // pts: polyline left→right, region kept black = everything below the polyline offset up by d.
  const out = [];
  const seg = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, y1 - y0);
    let nx = (y1 - y0) / L, ny = -(x1 - x0) / L; // left normal
    if (ny > 0) { nx = -nx; ny = -ny; } // point up
    seg.push({ a: [x0 + nx * d, y0 + ny * d], b: [x1 + nx * d, y1 + ny * d], dir: [(x1 - x0) / L, (y1 - y0) / L] });
  }
  // extend first and last segments to the canvas edges
  const s0 = seg[0], sl = seg[seg.length - 1];
  const ext = 12;
  const start = [s0.a[0] - s0.dir[0] * ext, s0.a[1] - s0.dir[1] * ext];
  const end = [sl.b[0] + sl.dir[0] * ext, sl.b[1] + sl.dir[1] * ext];
  let p = `M${n(start[0])} ${n(start[1])}L${n(s0.a[0])} ${n(s0.a[1])}`;
  for (let i = 0; i < seg.length; i++) {
    const s = seg[i];
    if (i > 0) {
      const prev = seg[i - 1];
      const cross = prev.dir[0] * s.dir[1] - prev.dir[1] * s.dir[0];
      if (cross > 0) {
        // turning clockwise on screen → peak (convex up): round arc around the vertex
        p += `A${d} ${d} 0 0 1 ${n(s.a[0])} ${n(s.a[1])}`;
      } else {
        // valley: lines meet at the intersection
        const [x, y] = pts[i];
        const ix = x, iy = y - d * Math.SQRT2;
        p = p.replace(/L([\d.-]+) ([\d.-]+)$/, `L${n(ix)} ${n(iy)}`);
        p += '';
        s.a = [ix, iy];
      }
    }
    p += `L${n(s.b[0])} ${n(s.b[1])}`;
  }
  p += `L${n(end[0])} ${n(end[1])}L24 24L0 24Z`;
  return p;
}

const icons = {};

/* Badged eggs */
icons.egg_add = badged('add');
icons.egg_collected = badged('check');
icons.egg_discarded = badged('close');
icons.egg_golden = badged('sparkle');

/* Infertile: egg with a 45° slash, egg cut 2px either side of the slash */
{
  const capsule = (r) => {
    const o = r / Math.SQRT2;
    return `M${n(4 + o)} ${n(4 - o)}L${n(20 + o)} ${n(20 - o)}A${r} ${r} 0 0 1 ${n(20 - o)} ${n(20 + o)}L${n(4 - o)} ${n(4 + o)}A${r} ${r} 0 0 1 ${n(4 + o)} ${n(4 - o)}Z`;
  };
  icons.egg_infertile = {
    line: wrap(HEAD_L, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white" stroke="none"/>',
      `  <path d="${capsule(3)}" fill="black" stroke="none"/>`,
      '</mask>',
      '<g mask="url(#cut)">',
      `  <path d="${EGG_L}"/>`,
      '</g>',
      '<path d="M4 4L20 20"/>',
    ]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white"/>',
      `  <path d="${capsule(3)}" fill="black"/>`,
      '  <path d="M4 4L20 20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '</mask>',
      '<g mask="url(#cut)">',
      `  <path d="${EGG_F}"/>`,
      '  <path d="M2 4L4 2L22 20L20 22Z"/>',
      '</g>',
    ]),
  };
}

/* Hatched shell: lower part of the base egg (same r7 arc, sides continue straight up to y=11), broken rim with 45° teeth */
const SHELL_L = 'M5 11V14A7 7 0 0 0 19 14V11L17 9L15 11L12 8L9 11L7 9Z';
const SHELL_F = 'M4 11V14A8 8 0 0 0 20 14V11L17 8L15 10L12 7L9 10L7 8Z';
icons.egg_hatched = {
  line: wrap(HEAD_L, [`<path d="${SHELL_L}"/>`]),
  filled: wrap(HEAD_F, [`<path d="${SHELL_F}"/>`]),
};

/* Hatched chick: the base egg's bottom arc with the shell split open in a V; a chick head (eye + beak)
   rises out of it. The head is clipped by the rim offset 3px (so 2px clear of the rim ink). */
{
  const RIM_V = [[5, 14], [8, 11], [12, 15], [16, 11], [19, 14]];
  const SHELL_VL = 'M5 14A7 7 0 0 0 19 14L16 11L12 15L8 11Z';
  const SHELL_VF = 'M4 14A8 8 0 0 0 20 14L16 10L12 14L8 10Z';
  const cut = rimCut(RIM_V, 3);
  icons.chick_hatched = {
    line: wrap(HEAD_L, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white" stroke="none"/>',
      `  <path d="${cut}" fill="black" stroke="none"/>`,
      '</mask>',
      '<g mask="url(#cut)">',
      '  <circle cx="12" cy="8" r="4"/>',
      '  <path d="M16 6L18 8L16 10"/>',
      '</g>',
      '<path d="M12 8V8"/>',
      `<path d="${SHELL_VL}"/>`,
    ]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white"/>',
      `  <path d="${cut}" fill="black"/>`,
      '  <path d="M12 8V8" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '</mask>',
      '<g mask="url(#cut)">',
      '  <circle cx="12" cy="8" r="5"/>',
      '  <path d="M16 5L19 8L16 11L13 8Z"/>',
      '</g>',
      `<path d="${SHELL_VF}"/>`,
    ]),
  };
}

/* Nest: a medium egg (r5) resting in a concentric cradle arc (r9): an even 2px gap all round the egg's base */
{
  icons.egg_nest = {
    line: wrap(HEAD_L, [
      `<path d="${egg(12, 11, 5, 0)}"/>`,
      '<path d="M3 11A9 9 0 0 0 21 11"/>',
    ]),
    filled: wrap(HEAD_F, [
      `<path d="${egg(12, 11, 5, 1)}"/>`,
      '<path d="M2 11A10 10 0 0 0 22 11A1 1 0 0 0 20 11A8 8 0 0 1 4 11A1 1 0 0 0 2 11Z"/>',
    ]),
  };
}

/* Clutch: two medium eggs (r5), the back one hidden 2px behind the front one */
{
  const front = [15, 15], back = [9, 12];
  icons.egg_clutch = {
    line: wrap(HEAD_L, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white" stroke="none"/>',
      `  <path d="${egg(...front, 5, 3)}" fill="black" stroke="none"/>`,
      '</mask>',
      `<path d="${egg(...back, 5, 0)}" mask="url(#cut)"/>`,
      `<path d="${egg(...front, 5, 0)}"/>`,
    ]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect width="24" height="24" fill="white"/>',
      `  <path d="${egg(...front, 5, 3)}" fill="black"/>`,
      '</mask>',
      `<path d="${egg(...back, 5, 1)}" mask="url(#cut)"/>`,
      `<path d="${egg(...front, 5, 1)}"/>`,
    ]),
  };
}

/* Nursery: incubator hood (dome) with a small egg (r4) inside */
{
  const DOME_L = 'M5 21A2 2 0 0 1 3 19V12A9 9 0 0 1 21 12V19A2 2 0 0 1 19 21Z';
  const DOME_F = 'M5 22A3 3 0 0 1 2 19V12A10 10 0 0 1 22 12V19A3 3 0 0 1 19 22Z';
  const small = egg(12, 13, 4, 0);
  icons.egg_nursery = {
    line: wrap(HEAD_L, [`<path d="${DOME_L}"/>`, `<path d="${small}"/>`]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      `  <path d="${DOME_F}" fill="white"/>`,
      `  <path d="${small}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      '</mask>',
      `<path d="${DOME_F}" mask="url(#cut)"/>`,
    ]),
  };
}

/* Select all: dashed frame (corners + mid dashes) around a rounded square */
{
  const FRAME = 'M3 6V5A2 2 0 0 1 5 3H6M18 3H19A2 2 0 0 1 21 5V6M21 18V19A2 2 0 0 1 19 21H18M6 21H5A2 2 0 0 1 3 19V18M10 3H14M21 10V14M10 21H14M3 10V14';
  const cornersF = [
    'M2 6V5A3 3 0 0 1 5 2H6A1 1 0 0 1 6 4H5A1 1 0 0 0 4 5V6A1 1 0 0 1 2 6Z',
    'M18 2H19A3 3 0 0 1 22 5V6A1 1 0 0 1 20 6V5A1 1 0 0 0 19 4H18A1 1 0 0 1 18 2Z',
    'M22 18V19A3 3 0 0 1 19 22H18A1 1 0 0 1 18 20H19A1 1 0 0 0 20 19V18A1 1 0 0 1 22 18Z',
    'M6 22H5A3 3 0 0 1 2 19V18A1 1 0 0 1 4 18V19A1 1 0 0 0 5 20H6A1 1 0 0 1 6 22Z',
  ].join('');
  icons.select_all = {
    line: wrap(HEAD_L, [`<path d="${FRAME}"/>`, '<rect x="8" y="8" width="8" height="8" rx="2"/>']),
    filled: wrap(HEAD_F, [
      `<path d="${cornersF}"/>`,
      '<rect x="9" y="2" width="6" height="2" rx="1"/>',
      '<rect x="20" y="9" width="2" height="6" rx="1"/>',
      '<rect x="9" y="20" width="6" height="2" rx="1"/>',
      '<rect x="2" y="9" width="2" height="6" rx="1"/>',
      '<rect x="7" y="7" width="10" height="10" rx="3"/>',
    ]),
  };
}

/* Site: a tall and a low building on a ground line, with windows */
{
  const WIN = 'M7 8H9M7 12H9M7 16H9M17 14V16';
  const SIL = 'M2 20V5A3 3 0 0 1 5 2H11A3 3 0 0 1 14 5V9H19A3 3 0 0 1 22 12V20A2 2 0 0 1 20 22H4A2 2 0 0 1 2 20Z';
  icons.site = {
    line: wrap(HEAD_L, [
      '<path d="M3 21V5A2 2 0 0 1 5 3H11A2 2 0 0 1 13 5V21"/>',
      '<path d="M13 10H19A2 2 0 0 1 21 12V21"/>',
      '<path d="M3 21H21"/>',
      `<path d="${WIN}"/>`,
    ]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      `  <path d="${SIL}" fill="white"/>`,
      `  <path d="${WIN}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      '</mask>',
      `<path d="${SIL}" mask="url(#cut)"/>`,
    ]),
  };
}

const only = process.argv.slice(3);
for (const [name, { line, filled }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(`${LIB}/line/${name}.svg`, line);
  writeFileSync(`${LIB}/filled/${name}.svg`, filled);
}
console.log('wrote', Object.keys(icons).filter((k) => !only.length || only.includes(k)).join(', '));
