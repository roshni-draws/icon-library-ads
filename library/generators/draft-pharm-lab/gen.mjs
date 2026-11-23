// Generates the Pharmacy, Lab, Mortality and necropsy, and Assessments icons into library/line and library/filled.
// node gen.mjs <libraryDir> [names...]
import { writeFileSync } from 'node:fs';

const LIB = process.argv[2];

const HEAD_L = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;
// Paint surface for mask-built filled icons: the live area, rounded so the checker's corner rule holds.
const PAINT = '<rect x="2" y="2" width="20" height="20" rx="2" mask="url(#cut)"/>';
const CUT = 'fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
// White stroke+fill inside a mask = the line centre line pushed out by exactly 1px (round joins), i.e. the filled silhouette.
const SIL = 'fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const SILSTROKE = 'fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/* ======================= COMMON BASES (reusable) =======================
 * CLIPBOARD (portrait 16x20 keyline, ink x4-20 y2-22)
 *   line:   board  M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15
 *           clip   rect x9 y3 w6 h4 rx2
 *           (optional text lines M9 11H15 / M9 15H15 when there is no badge)
 *   filled: board  rect x4 y4 w16 h18 rx3, clip rect x8 y2 w8 h6 rx3,
 *           clip separated from the board by a 2px cut  M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5
 * CALENDAR (square 18 keyline, ink x2-22 y2-22)
 *   line:   rect x3 y5 w18 h16 rx2, rings M8 3V5M16 3V5, header M3 9H21
 *   filled: rect x2 y4 w20 h18 rx3, rings rect x7 y2 w2 h4 rx1 / x15, header shown as a 2px cut M4 9H20
 * DOCUMENT (portrait 16x20, ink x4-20 y2-22), dog-ear on the top right at 45°
 *   line:   M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z  + fold M13 3V7A2 2 0 0 0 15 9H19
 *   filled: M7 2H14L20 8V19A3 3 0 0 1 17 22H7A3 3 0 0 1 4 19V5A3 3 0 0 1 7 2Z, fold cut as 2px black stroke
 * VAN (landscape, ink x2-22 y2-22): cargo box + rounded cab + two wheels r2
 * IMAGE (square, ink x2-22): rect x3 y3 w18 h18 rx2, sun circle (8,8) r2, mountain M3 18L9 12L15 18
 * CIRCLE CONTAINER: line circle (12,12) r9, filled disc r10 (same as library/done.svg)
 */
const CLIP_BOARD_L = 'M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15';
const CLIP_L = ['<path d="' + CLIP_BOARD_L + '"/>', '<rect x="9" y="3" width="6" height="4" rx="2"/>'];
const CLIP_F_WHITE = ['<rect x="4" y="4" width="16" height="18" rx="3" fill="white"/>', '<rect x="8" y="2" width="8" height="6" rx="3" fill="white"/>'];
const CLIP_F_CUT = `<path d="M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5" ${CUT}/>`;

const CAL_L = ['<rect x="3" y="5" width="18" height="16" rx="2"/>', '<path d="M8 3V5M16 3V5M3 9H21"/>'];

const DOC_L = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z';
const DOC_FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
const DOC_F = 'M7 2H14L20 8V19A3 3 0 0 1 17 22H7A3 3 0 0 1 4 19V5A3 3 0 0 1 7 2Z';

/* ---- Badges: exact output of app/src/parts/parts.ts + compose.ts (cut r7, ink r5, centre 17,17) ---- */
const BADGE = {
  add: { line: ['<path d="M17 13V21M13 17H21"/>'], knock: 'M17 14V20M14 17H20' },
  check: { line: ['<path d="M13 17L16 20L21 14"/>'], knock: 'M14 17L16 19L19 16' },
  close: { line: ['<path d="M14 14L20 20M20 14L14 20"/>'], knock: 'M15 15L19 19M19 15L15 19' },
  clock: { line: ['<circle cx="17" cy="17" r="4"/>', '<path d="M17 15V17L18 18"/>'], knock: 'M17 14V17L19 18' },
  alert: { line: ['<path d="M17 13V17M17 21V21"/>'], knock: 'M17 14V17M17 20V20' },
};
/** baseL: line elements; baseFWhite: white silhouette elements; baseFCut: black cut elements (filled). */
function badged(id, baseL, baseFWhite, baseFCut = []) {
  const b = BADGE[id];
  const line = wrap(HEAD_L, [
    '<mask id="cut">',
    '  <rect width="24" height="24" fill="white" stroke="none"/>',
    '  <circle cx="17" cy="17" r="7" fill="black" stroke="none"/>',
    '</mask>',
    '<g mask="url(#cut)">',
    ...baseL.map((e) => '  ' + e),
    '</g>',
    ...b.line,
  ]);
  // Filled: base silhouette with its own cuts, then the badge cut ring, disc and knocked glyph.
  const filled = wrap(HEAD_F, [
    '<mask id="cut">',
    ...baseFWhite.map((e) => '  ' + e),
    ...baseFCut.map((e) => '  ' + e),
    '  <circle cx="17" cy="17" r="7" fill="black"/>',
    '  <circle cx="17" cy="17" r="5" fill="white"/>',
    `  <path d="${b.knock}" ${CUT}/>`,
    '</mask>',
    PAINT,
  ]);
  return { line, filled };
}

/** Filled icon from a mask: white silhouette parts, black cuts, painted through a rect = the ink bbox. */
function masked(white, black, [x, y, w, h]) {
  return wrap(HEAD_F, [
    '<mask id="cut">',
    ...white.map((e) => '  ' + e),
    ...black.map((e) => '  ' + e),
    '</mask>',
    PAINT,
  ]);
}
/** Turns line elements into white mask elements: open strokes stay strokes, closed shapes get fill + stroke (=+1px). */
const toWhite = (els, closed) => els.map((e, i) => e.replace(/\/>$/, ` ${closed[i] ? SIL : SILSTROKE}/>`));

const icons = {};


/* ---------------- Pharmacy ---------------- */

/* Priority: circle container with a chevron (up = high, down = low). Family: critical = double chevron, medium = two bars. */
for (const [name, chev] of [['priority_high', 'M8 14L12 10L16 14'], ['priority_low', 'M8 10L12 14L16 10']]) {
  icons[name] = {
    line: wrap(HEAD_L, ['<circle cx="12" cy="12" r="9"/>', `<path d="${chev}"/>`]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <circle cx="12" cy="12" r="10" fill="white"/>',
      `  <path d="${chev}" ${CUT}/>`,
      '</mask>',
      '<circle cx="12" cy="12" r="10" mask="url(#cut)"/>',
    ]),
  };
}

/* Emergency: a flame with a second tongue on the right. */
{
  const FLAME = 'M11 3C9 6 6 9 6 14A6 6 0 0 0 18 14C18 11 17.5 8.5 17 7C16 9 15 10 13 11C13 8 12.5 5 11 3Z';
  const INNER = 'M12 13C11 14.5 10 15 10 16A2 2 0 0 0 14 16C14 15 13 14.5 12 13Z';
  icons.emergency = {
    line: wrap(HEAD_L, [`<path d="${FLAME}"/>`]),
    filled: masked([`<path d="${FLAME}" ${SIL}/>`], [], [4, 2, 16, 20]),
  };
  void INNER;
}

/* Pharmacy request: clipboard + add badge. */
icons.assignment_add = badged('add', CLIP_L, CLIP_F_WHITE, [CLIP_F_CUT]);

/* Add photo: picture frame (sun + mountain) + add badge. */
{
  const IMG_L = ['<rect x="3" y="3" width="18" height="18" rx="2"/>', '<circle cx="8" cy="8" r="1"/>', '<path d="M3 19L9 13L15 19"/>'];
  icons.add_photo = badged('add', IMG_L,
    ['<rect x="2" y="2" width="20" height="20" rx="3" fill="white"/>'],
    ['<circle cx="8" cy="8" r="2" fill="black"/>', `<path d="M3 19L9 13L15 19" ${CUT}/>`]);
}

/* ---------------- Lab ---------------- */

/* Archive: lid + box + down arrow. */
{
  const L = ['<rect x="3" y="3" width="18" height="5" rx="2"/>', '<path d="M5 8V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V8"/>', '<path d="M12 12V17M9 14L12 17L15 14"/>'];
  icons.archive = {
    line: wrap(HEAD_L, L),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect x="2" y="2" width="20" height="7" rx="3" fill="white"/>',
      '  <path d="M4 8V19A3 3 0 0 0 7 22H17A3 3 0 0 0 20 19V8Z" fill="white"/>',
      `  <path d="M5 8H19M12 12V17M9 14L12 17L15 14" ${CUT}/>`,
      '</mask>',
      PAINT,
    ]),
  };
}

/* Request / approval: rubber stamp (handle, pad, base line). */
{
  const L = ['<path d="M10 13V7A2 2 0 0 1 14 7V13"/>', '<rect x="4" y="13" width="16" height="4" rx="2"/>', '<path d="M6 21H18"/>'];
  icons.request = {
    line: wrap(HEAD_L, L),
    filled: wrap(HEAD_F, [
      '<path d="M9 13V7A3 3 0 0 1 15 7V13Z"/>',
      '<rect x="3" y="12" width="18" height="6" rx="3"/>',
      '<rect x="5" y="20" width="14" height="2" rx="1"/>',
    ]),
  };
}

/* Lab sample: test tube with a liquid level. Filled: the liquid is solid, the headspace stays open. */
{
  const TUBE = 'M8 3V16A4 4 0 0 0 16 16V3';
  icons.lab_sample = {
    line: wrap(HEAD_L, [`<path d="${TUBE}"/>`, '<path d="M6 3H18M8 11H16"/>']),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect x="5" y="2" width="14" height="2" rx="1" fill="white"/>',
      '  <path d="M7 3V16A5 5 0 0 0 17 16V3Z" fill="white"/>',
      '  <rect x="9" y="4" width="6" height="6" fill="black"/>',
      '</mask>',
      PAINT,
    ]),
  };
}

/* ---------------- Mortality and necropsy ---------------- */

/* Van: cargo box, rounded cab, two wheels. Glyph on the cargo box: cross (pickup/ambulance) or arrow (transfer). */
{
  const BODY = 'M6 19H5A2 2 0 0 1 3 17V5A2 2 0 0 1 5 3H13A2 2 0 0 1 15 5V9H18A3 3 0 0 1 21 12V17A2 2 0 0 1 19 19';
  const MID = 'M10 19H15';
  const BODY_F = 'M5 20A3 3 0 0 1 2 17V5A3 3 0 0 1 5 2H13A3 3 0 0 1 16 5V8H18A4 4 0 0 1 22 12V17A3 3 0 0 1 19 20Z';
  const van = (glyph) => ({
    line: wrap(HEAD_L, [`<path d="${BODY}"/>`, `<path d="${MID}"/>`, '<circle cx="8" cy="19" r="2"/>', '<circle cx="17" cy="19" r="2"/>', `<path d="${glyph}"/>`]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      `  <path d="${BODY_F}" fill="white"/>`,
      '  <circle cx="8" cy="19" r="5" fill="black"/>',
      '  <circle cx="17" cy="19" r="5" fill="black"/>',
      '  <circle cx="8" cy="19" r="3" fill="white"/>',
      '  <circle cx="17" cy="19" r="3" fill="white"/>',
      `  <path d="${glyph}" ${CUT}/>`,
      '</mask>',
      PAINT,
    ]),
  });
  icons.carcass_pickup = van('M9 7V11M7 9H11');
  icons.carcass_transfer = van('M7 9H11M9 7L11 9L9 11');
}

/* Awaiting approval: clipboard + clock badge. */
icons.pending_actions = badged('clock', CLIP_L, CLIP_F_WHITE, [CLIP_F_CUT]);

/* Delayed: hourglass, sand settled in the bottom bulb. Filled: sand solid, upper glass hollow. */
{
  const L = ['<path d="M5 3H19M5 21H19"/>', '<path d="M7 3V7L12 12L17 7V3"/>', '<path d="M7 21V17L12 12L17 17V21"/>', '<path d="M7 17H17"/>'];
  icons.hourglass_bottom = {
    line: wrap(HEAD_L, L),
    filled: masked([
      ...toWhite(['<path d="M5 3H19M5 21H19"/>'], [false]),
      '<path d="M7 3V7L12 12L17 7V3ZM7 21V17L12 12L17 17V21Z" ' + SIL + '/>',
    ], [
      '<path d="M8 4H16V6L12 10L8 6Z" fill="black"/>',
      '<path d="M12 14L14 16H10Z" fill="black"/>',
    ], [4, 2, 16, 20]),
  };
}

/* Mortality / carcass: fish skeleton (tail fork, spine, two ribs, head). */
{
  const STROKES = 'M6 12L3 9M6 12L3 15M6 12H18M10 8V16M14 8V16';
  const HEAD = 'M18 9A3 3 0 0 1 18 15Z';
  icons.fish_bones = {
    line: wrap(HEAD_L, [`<path d="${STROKES}"/>`, `<path d="${HEAD}"/>`]),
    filled: masked([`<path d="${STROKES}" ${SILSTROKE}/>`, `<path d="${HEAD}" ${SIL}/>`], [], [2, 7, 20, 10]),
  };
}

/* Timeline: zigzag path with solid nodes (r1 circles stroked 2 = dots of radius 2). */
{
  const PATH = 'M4 16L9 11L14 16L20 10';
  const DOTS = [[4, 16], [9, 11], [14, 16], [20, 10]];
  icons.timeline = {
    line: wrap(HEAD_L, [`<path d="${PATH}"/>`, ...DOTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`)]),
    filled: masked([`<path d="${PATH}" ${SILSTROKE}/>`, ...DOTS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="white"/>`)], [], [2, 8, 20, 10]),
  };
}

/* Blocked: circle with a 45° slash. Filled keeps the ring (a solid disc split in two would read as something else). */
icons.block = {
  line: wrap(HEAD_L, ['<circle cx="12" cy="12" r="9"/>', '<path d="M6 6L18 18"/>']),
  filled: masked(['<circle cx="12" cy="12" r="10" fill="white"/>', '<circle cx="12" cy="12" r="8" fill="black"/>', `<path d="M6 6L18 18" ${SILSTROKE}/>`], [], [2, 2, 20, 20]),
};

/* Download: arrow into a tray. */
{
  const ARROW = 'M12 4V15M7 10L12 15L17 10';
  const TRAY = 'M4 17V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V17';
  icons.download = {
    line: wrap(HEAD_L, [`<path d="${ARROW}"/>`, `<path d="${TRAY}"/>`]),
    filled: masked([`<path d="${ARROW}" ${SILSTROKE}/>`, `<path d="${TRAY}" ${SILSTROKE}/>`], [], [3, 3, 18, 19]),
  };
}

/* Draft: blank document with a dog-ear. */
icons.draft = {
  line: wrap(HEAD_L, [`<path d="${DOC_L}"/>`, `<path d="${DOC_FOLD}"/>`]),
  filled: wrap(HEAD_F, [
    '<mask id="cut">',
    `  <path d="${DOC_F}" fill="white"/>`,
    `  <path d="${DOC_FOLD}" ${CUT}/>`,
    '</mask>',
    `<path d="${DOC_F}" mask="url(#cut)"/>`,
  ]),
};

/* Cancelled / rejected: circle with an X. */
icons.cancelled = {
  line: wrap(HEAD_L, ['<circle cx="12" cy="12" r="9"/>', '<path d="M9 9L15 15M15 9L9 15"/>']),
  filled: wrap(HEAD_F, [
    '<mask id="cut">',
    '  <circle cx="12" cy="12" r="10" fill="white"/>',
    `  <path d="M9 9L15 15M15 9L9 15" ${CUT}/>`,
    '</mask>',
    '<circle cx="12" cy="12" r="10" mask="url(#cut)"/>',
  ]),
};

/* Refresh: clockwise circular arrow, 270° arc + corner arrowhead at the top right. */
{
  const ARC = 'M20 12A8 8 0 1 1 12 4C15 4 17 5 18 6L20 8';
  const HEADP = 'M20 4V8H16';
  icons.refresh = {
    line: wrap(HEAD_L, [`<path d="${ARC}"/>`, `<path d="${HEADP}"/>`]),
    filled: masked([`<path d="${ARC}" ${SILSTROKE}/>`, `<path d="${HEADP}" ${SILSTROKE}/>`], [], [3, 3, 18, 18]),
  };
}

/* ---------------- Assessments ---------------- */

icons.expand_less = {
  line: wrap(HEAD_L, ['<path d="M6 15L12 9L18 15"/>']),
  filled: masked([`<path d="M6 15L12 9L18 15" ${SILSTROKE}/>`], [], [5, 8, 14, 8]),
};

/* Scheduled / date confirmed: calendar + check. */
{
  const CHECK = 'M9 15L11 17L15 13';
  icons.event_available = {
    line: wrap(HEAD_L, [...CAL_L, `<path d="${CHECK}"/>`]),
    filled: wrap(HEAD_F, [
      '<mask id="cut">',
      '  <rect x="2" y="4" width="20" height="18" rx="3" fill="white"/>',
      '  <rect x="7" y="2" width="2" height="4" rx="1" fill="white"/>',
      '  <rect x="15" y="2" width="2" height="4" rx="1" fill="white"/>',
      `  <path d="M4 9H20M${CHECK.slice(1)}" ${CUT}/>`,
      '</mask>',
      PAINT,
    ]),
  };
}

const only = process.argv.slice(3);
for (const [name, { line, filled }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(`${LIB}/line/${name}.svg`, line);
  writeFileSync(`${LIB}/filled/${name}.svg`, filled);
}
console.log('wrote', Object.keys(icons).filter((k) => !only.length || only.includes(k)).length);
export { icons, CLIP_L, CAL_L, DOC_L, DOC_FOLD, DOC_F };
