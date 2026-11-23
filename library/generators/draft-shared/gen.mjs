// Generates the common bases + Home / Login / Shared controls / Shared across modules icons.
// node gen.mjs <libraryDir> [names...]      (FORCE=1 to overwrite bases another agent already wrote)
// Follows the Eggs pilot (generators/eggs/gen.mjs) and the Pharmacy agent's mask approach.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const LIB = process.argv[2];
const MINE_FILE = new URL('./mine.json', import.meta.url).pathname;
const mine = new Set(existsSync(MINE_FILE) ? JSON.parse(readFileSync(MINE_FILE, 'utf8')) : []);

const HEAD_L = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;
const P = (d) => `<path d="${d}"/>`;
const ST = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
// Mask parts (filled style)
const W = (d) => `<path d="${d}" fill="white" stroke="white" ${ST}/>`; // closed line path pushed out 1px, solid
const WS = (d) => `<path d="${d}" fill="none" stroke="white" ${ST}/>`; // open line path, solid 2px
const B = (d) => `<path d="${d}" fill="none" stroke="black" ${ST}/>`; // 2px cut
const BF = (el) => el.replace('/>', ' fill="black"/>'); // black shape (hole / offset-3 hide)
const WF = (el) => el.replace('/>', ' fill="white"/>'); // white plain shape (already offset)
const PAINT = '<rect x="2" y="2" width="20" height="20" rx="2" mask="url(#cut)"/>';

/* ---- Badges: exact output of app/src/parts/parts.ts + compose.ts (cut r7, ink r5, centre 17,17) ---- */
const BADGE = {
  add: { line: ['<path d="M17 13V21M13 17H21"/>'], knock: 'M17 14V20M14 17H20' },
  check: { line: ['<path d="M13 17L16 20L21 14"/>'], knock: 'M14 17L16 19L19 16' },
  close: { line: ['<path d="M14 14L20 20M20 14L14 20"/>'], knock: 'M15 15L19 19M19 15L15 19' },
  clock: { line: ['<circle cx="17" cy="17" r="4"/>', '<path d="M17 15V17L18 18"/>'], knock: 'M17 14V17L19 18' },
  alert: { line: ['<path d="M17 13V17M17 21V21"/>'], knock: 'M17 14V17M17 20V20' },
};

/**
 * icon({ L, F, lineMask, badge })
 *  L:        line elements
 *  lineMask: black shapes (mask) that cut the `back` line elements (object in front, offset 3); with `back`
 *  F:        filled mask parts (W / WS / B / BF ...), painted through the live-area rect
 *  Fplain:   filled elements drawn directly (no mask needed)
 */
function icon({ L = [], back = [], lineMask = [], F = [], Fplain = null, badge = null }) {
  const lb = [];
  const needMask = badge || lineMask.length;
  if (needMask) {
    lb.push('<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>');
    for (const m of lineMask) lb.push('  ' + m.replace('/>', ' fill="black" stroke="none"/>'));
    if (badge) lb.push('  <circle cx="17" cy="17" r="7" fill="black" stroke="none"/>');
    lb.push('</mask>');
    const masked = back.length ? back : L;
    lb.push('<g mask="url(#cut)">', ...masked.map((e) => '  ' + e), '</g>');
    if (back.length) lb.push(...L);
    if (badge) lb.push(...BADGE[badge].line);
  } else lb.push(...L);
  const line = wrap(HEAD_L, lb);
  let filled;
  if (Fplain) filled = wrap(HEAD_F, Fplain);
  else {
    const fb = ['<mask id="cut">', ...F.map((e) => '  ' + e)];
    if (badge) fb.push('  <circle cx="17" cy="17" r="7" fill="black"/>', '  <circle cx="17" cy="17" r="5" fill="white"/>', '  ' + B(BADGE[badge].knock));
    fb.push('</mask>', PAINT);
    filled = wrap(HEAD_F, fb);
  }
  return { line, filled };
}
// Disc container (like library/done.svg): circle r9 line, disc r10 filled with the glyph cut.
const disc = (glyph, glyphEls = [P(glyph)]) => ({
  line: wrap(HEAD_L, ['<circle cx="12" cy="12" r="9"/>', ...glyphEls]),
  filled: wrap(HEAD_F, ['<mask id="cut">', '  <circle cx="12" cy="12" r="10" fill="white"/>', '  ' + B(glyph), '</mask>', '<circle cx="12" cy="12" r="10" mask="url(#cut)"/>']),
});
const slashCapsule = (r) => {
  const o = +(r / Math.SQRT2).toFixed(3);
  return `<path d="M${4 + o} ${4 - o}L${20 + o} ${20 - o}A${r} ${r} 0 0 1 ${20 - o} ${20 + o}L${4 - o} ${4 + o}A${r} ${r} 0 0 1 ${4 + o} ${4 - o}Z"/>`;
};

/* ======================= COMMON BASES (reusable geometry) =======================
 * Line centre lines. Filled = the same path drawn white with fill + 2px stroke inside the mask (= pushed out 1px).
 */
export const GEO = {
  // Pharmacy agent's bases, reused exactly
  CAL: ['<rect x="3" y="5" width="18" height="16" rx="2"/>', 'M8 3V5M16 3V5', 'M3 9H21'], // rect, rings, header
  DOC: 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z',
  DOC_FOLD: 'M13 3V7A2 2 0 0 0 15 9H19',
  DOC_LINES: 'M9 13H15M9 17H15',
  IMAGE: ['<rect x="3" y="3" width="18" height="18" rx="2"/>', '<circle cx="8" cy="8" r="1"/>', 'M3 19L9 13L15 19'], // = add_photo (Requests agent)
  // Mine
  PLUS: 'M12 5V19M5 12H19',
  SEARCH: ['<circle cx="10" cy="10" r="7"/>', 'M15 15L21 21'],
  FUNNEL: 'M3 4H21L14 11V18A2 2 0 0 1 10 18V11Z',
  TRASH_LID: 'M4 6H20',
  TRASH_HANDLE: 'M9 6V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6',
  TRASH_BODY: 'M6 6V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V6',
  TRASH_LINES: 'M10 11V16M14 11V16',
  HEAD: '<circle cx="12" cy="7" r="4"/>', // filled: r5
  SHOULDERS: 'M8 15H16A4 4 0 0 1 20 19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19A4 4 0 0 1 8 15Z',
  FLAG: 'M5 21V4H19L15 8L19 12H5', // pole + swallow-tail cloth (45° notch); cloth closed = 'M5 4H19L15 8L19 12H5Z'
  CLOCK_HANDS: 'M12 7V12L15 15', // inside circle r9
  SWAP: 'M4 8H20M16 4L20 8L16 12M20 16H4M8 12L4 16L8 20',
  TRANSFER: 'M3 7H15M12 4L15 7L12 10M21 17H9M12 14L9 17L12 20',
  CHECKBOX: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  BUBBLE: 'M5 3H19A2 2 0 0 1 21 5V15A2 2 0 0 1 19 17H7L3 21V5A2 2 0 0 1 5 3Z', // speech bubble, tail bottom-left 45°
  EYE: 'M3 12C5 7.5 8.5 5 12 5S19 7.5 21 12C19 16.5 15.5 19 12 19S5 16.5 3 12Z', // pupil circle r3
  SHIELD: 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V11C19 16 15.5 19.5 12 21C8.5 19.5 5 16 5 11Z',
};
const G = GEO;

const icons = {};
const BASES = new Set();
const base = (name, v) => { icons[name] = v; BASES.add(name); };

/* ---------------- Common bases ---------------- */
base('add', icon({ L: [P(G.PLUS)], F: [WS(G.PLUS)] }));
base('add_circle', disc('M12 8V16M8 12H16'));
base('search', icon({ L: [G.SEARCH[0], P(G.SEARCH[1])], F: [WF('<circle cx="10" cy="10" r="8"/>'), WS(G.SEARCH[1]), B('M7 10A3 3 0 0 1 10 7')] }));
base('filter', icon({ L: [P(G.FUNNEL)], F: [W(G.FUNNEL)] }));
base('delete', icon({
  L: [P('M4 6H9V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6H20'), P(G.TRASH_BODY), P(G.TRASH_LINES)],
  F: [WS(G.TRASH_LID), W(G.TRASH_HANDLE + 'Z'), W(G.TRASH_BODY + 'Z'), B(G.TRASH_LINES)],
}));
base('document', icon({ L: [P(G.DOC), P(G.DOC_FOLD), P(G.DOC_LINES)], F: [W(G.DOC), B(G.DOC_FOLD), B(G.DOC_LINES)] }));
base('person', icon({ L: [G.HEAD, P(G.SHOULDERS)], F: [WF('<circle cx="12" cy="7" r="5"/>'), W(G.SHOULDERS)] }));
base('priority_flag', icon({ L: [P(G.FLAG)], F: [WS(G.FLAG), W('M5 4H19L15 8L19 12H5Z')] }));
base('image', icon({ L: [G.IMAGE[0], G.IMAGE[1], P(G.IMAGE[2])], F: [WF('<rect x="2" y="2" width="20" height="20" rx="3"/>'), BF('<circle cx="8" cy="8" r="2"/>'), B(G.IMAGE[2])] }));
{
  const front = '<rect x="7" y="3" width="14" height="14" rx="2"/>';
  const back = 'M3 7V19A2 2 0 0 0 5 21H17';
  const mtn = 'M7 15L11 11L17 17';
  base('gallery', icon({
    L: [front, P(back), '<circle cx="16" cy="8" r="1"/>', P(mtn)],
    F: [WF('<rect x="6" y="2" width="16" height="16" rx="3"/>'), WS(back), BF('<circle cx="16" cy="8" r="2"/>'), B(mtn)],
  }));
}
base('time', disc(G.CLOCK_HANDS));
{
  const dots = 'M8 13V13M12 13V13M16 13V13M8 17V17M12 17V17';
  base('calendar', icon({
    L: [G.CAL[0], P(G.CAL[1] + G.CAL[2]), P(dots)],
    F: [WF('<rect x="2" y="4" width="20" height="18" rx="3"/>'), WF('<rect x="7" y="2" width="2" height="4" rx="1"/>'), WF('<rect x="15" y="2" width="2" height="4" rx="1"/>'), B('M4 9H20'), B(dots)],
  }));
}
base('swap', icon({ L: [P(G.SWAP)], F: [WS(G.SWAP)] }));
base('transfer', icon({ L: [P(G.TRANSFER)], F: [WS(G.TRANSFER)] }));
base('line_start_circle', icon({ L: ['<circle cx="7" cy="12" r="4"/>', P('M11 12H21')], F: [WF('<circle cx="7" cy="12" r="5"/>'), WS('M11 12H21')] }));
base('line_end_circle', icon({ L: ['<circle cx="17" cy="12" r="4"/>', P('M3 12H13')], F: [WF('<circle cx="17" cy="12" r="5"/>'), WS('M3 12H13')] }));
base('line_end_square', icon({ L: ['<rect x="13" y="8" width="8" height="8" rx="2"/>', P('M3 12H13')], F: [WF('<rect x="12" y="7" width="10" height="10" rx="3"/>'), WS('M3 12H13')] }));
base('checkbox_unchecked', icon({ L: [G.CHECKBOX], Fplain: ['<rect x="2" y="2" width="20" height="20" rx="3"/>'] }));
base('checkbox_checked', icon({ L: [G.CHECKBOX, P('M7 12L10 15L17 8')], F: [WF('<rect x="2" y="2" width="20" height="20" rx="3"/>'), B('M7 12L10 15L17 8')] }));
base('checkbox_partial', icon({ L: [G.CHECKBOX, P('M8 12H16')], F: [WF('<rect x="2" y="2" width="20" height="20" rx="3"/>'), B('M8 12H16')] }));

/* ---------------- Home, navigation and insights ---------------- */
{
  const grid = '<rect x="3" y="3" width="18" height="18" rx="2"/>';
  icons.add_column_right = icon({ L: [grid, P('M9 3V21M15 3V21')], badge: 'add', F: [WF('<rect x="2" y="2" width="20" height="20" rx="3"/>'), B('M9 4V20M15 4V20')] });
}
{
  const backB = 'M5 3H15A2 2 0 0 1 17 5V12A2 2 0 0 1 15 14H7L3 18V5A2 2 0 0 1 5 3Z';
  const frontB = 'M13 11H19A2 2 0 0 1 21 13V21L18 18H13A2 2 0 0 1 11 16V13A2 2 0 0 1 13 11Z';
  const hide = '<rect x="8" y="8" width="16" height="16" rx="5"/>'; // front bubble pushed out 3
  icons.forum = icon({ back: [P(backB)], lineMask: [hide], L: [P(frontB)], F: [W(backB), BF(hide), W(frontB)] });
}
{
  const f = 'M5 4H9L12 7H19A2 2 0 0 1 21 9V18A2 2 0 0 1 19 20H5A2 2 0 0 1 3 18V6A2 2 0 0 1 5 4Z';
  icons.folder = icon({ L: [P(f)], F: [W(f)] });
}
{
  const s = 'M4 6H20M4 12H15M4 18H10';
  icons.sort = icon({ L: [P(s)], F: [WS(s)] });
}
icons.encrypted = icon({ L: [P(G.SHIELD), '<circle cx="12" cy="10" r="2"/>', P('M12 12V15')], F: [W(G.SHIELD), BF('<circle cx="12" cy="10" r="2"/>'), B('M12 10V15')] });
{
  // Fetus: large head, body curled round underneath it
  const body = 'M9 9C5 12 6 19 11 20C15 21 19 19 19 15';
  icons.fetal_death = icon({ L: ['<circle cx="13" cy="8" r="4"/>', P(body)], F: [WF('<circle cx="13" cy="8" r="5"/>'), WS(body)] });
}
{
  const a = 'M4 12H20M14 6L20 12L14 18';
  icons.arrow_forward = icon({ L: [P(a)], F: [WS(a)] });
}
icons.person = icons.person; // base above
icons.visibility = icon({ L: [P(G.EYE), '<circle cx="12" cy="12" r="3"/>'], F: [W(G.EYE), B('M15 12A3 3 0 1 1 9 12A3 3 0 1 1 15 12Z')] });
{
  const axis = 'M3 3V19A2 2 0 0 0 5 21H21';
  const trend = 'M7 15L11 11L14 14L20 8';
  icons.monitoring = icon({ L: [P(axis), P(trend)], F: [WS(axis), WS(trend)] });
}
{
  const trend = 'M3 14L8 9L12 13L19 6';
  const lens = '<circle cx="16" cy="16" r="3"/>';
  const L = wrap(HEAD_L, [
    '<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>', '  <circle cx="16" cy="16" r="6" fill="black" stroke="none"/>', '</mask>',
    `<path d="${trend}" mask="url(#cut)"/>`, lens, P('M19 19L21 21'),
  ]);
  const F = wrap(HEAD_F, ['<mask id="cut">', '  ' + WS(trend), '  <circle cx="16" cy="16" r="6" fill="black"/>', '  <circle cx="16" cy="16" r="4" fill="white"/>', '  ' + WS('M19 19L21 21'), '  <circle cx="16" cy="16" r="1" fill="black"/>', '</mask>', PAINT]);
  icons.query_stats = { line: L, filled: F };
}
{
  const corners = 'M3 6V5A2 2 0 0 1 5 3H6M18 3H19A2 2 0 0 1 21 5V6M21 18V19A2 2 0 0 1 19 21H18M6 21H5A2 2 0 0 1 3 19V18'; // = select_all corners
  const sq = ['<rect x="8" y="8" width="2" height="2"/>', '<rect x="14" y="8" width="2" height="2"/>', '<rect x="8" y="14" width="2" height="2"/>'];
  icons.qr_code_scanner = icon({
    L: [P(corners), ...sq, P('M15 15V15')],
    F: [WS(corners), WF('<path d="M8 7H10A1 1 0 0 1 11 8V10A1 1 0 0 1 10 11H8A1 1 0 0 1 7 10V8A1 1 0 0 1 8 7Z"/>'), WF('<path d="M14 7H16A1 1 0 0 1 17 8V10A1 1 0 0 1 16 11H14A1 1 0 0 1 13 10V8A1 1 0 0 1 14 7Z"/>'), WF('<path d="M8 13H10A1 1 0 0 1 11 14V16A1 1 0 0 1 10 17H8A1 1 0 0 1 7 16V14A1 1 0 0 1 8 13Z"/>'), WS('M15 15V15')],
  });
}
{
  const r = 'M20 10H8A4 4 0 0 0 8 18H12M16 6L20 10L16 14';
  icons.redo = icon({ L: [P(r)], F: [WS(r)] });
}

/* ---------------- Login, account and staff ---------------- */
icons.person_off = icon({
  back: [G.HEAD, P(G.SHOULDERS)], lineMask: [slashCapsule(3)], L: [P('M4 4L20 20')],
  F: [WF('<circle cx="12" cy="7" r="5"/>'), W(G.SHOULDERS), BF(slashCapsule(3)), WS('M4 4L20 20')],
});
{
  const seal = 'M12 3L14 5H19V10L21 12L19 14V19H14L12 21L10 19H5V14L3 12L5 10V5H10Z';
  const chk = 'M9 12L11 14L15 10';
  icons.verified = icon({ L: [P(seal), P(chk)], F: [W(seal), B(chk)] });
}
{
  const ph = 'M5 3H8L10 8L8 10A11 11 0 0 0 14 16L16 14L21 16V19A2 2 0 0 1 19 21A16 16 0 0 1 3 5A2 2 0 0 1 5 3Z';
  icons.call = icon({ L: [P(ph)], F: [W(ph)] });
}
{
  const body = 'M5 21V5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21';
  const cross = 'M12 7V13M9 10H15';
  const door = 'M10 21V19A2 2 0 0 1 14 19V21';
  icons.local_hospital = icon({
    L: [P(body), P('M3 21H21'), P(cross), P(door)],
    F: [W(body + 'Z'), WS('M3 21H21'), B(cross), BF('<path d="M10 20V19A2 2 0 0 1 14 19V20Z"/>')],
  });
}
{
  const fp = ['M4 15V12A8 8 0 0 1 20 12V13', 'M8 21V12A4 4 0 0 1 16 12V17', 'M12 12V19'];
  icons.fingerprint = icon({ L: fp.map(P), F: fp.map(WS) });
}
{
  const sh = 'M8 10V7A4 4 0 0 1 16 7V10';
  icons.lock = icon({
    L: ['<rect x="4" y="10" width="16" height="11" rx="2"/>', P(sh), P('M12 15V16')],
    F: [WF('<rect x="3" y="9" width="18" height="13" rx="3"/>'), WS(sh), B('M12 15V16')],
  });
}
{
  const br = 'M10 3H5A2 2 0 0 0 3 5V19A2 2 0 0 0 5 21H10';
  const ar = 'M9 12H21M17 8L21 12L17 16';
  icons.logout = icon({ L: [P(br), P(ar)], F: [WS(br), WS(ar)] });
}
{
  const flap = 'M3 7L12 13L21 7';
  icons.mail = icon({ L: ['<rect x="3" y="5" width="18" height="14" rx="2"/>', P(flap)], F: [WF('<rect x="2" y="4" width="20" height="16" rx="3"/>'), B(flap)] });
}
icons.visibility_off = icon({
  back: [P(G.EYE), '<circle cx="12" cy="12" r="3"/>'], lineMask: [slashCapsule(3)], L: [P('M4 4L20 20')],
  F: [W(G.EYE), B('M15 12A3 3 0 1 1 9 12A3 3 0 1 1 15 12Z'), BF(slashCapsule(3)), WS('M4 4L20 20')],
});
{
  // person whose head is a location pin
  const pin = 'M12 12C12 12 8 9.5 8 7A4 4 0 0 1 16 7C16 9.5 12 12 12 12Z';
  const sh = 'M8 16H16A3 3 0 0 1 19 19A2 2 0 0 1 17 21H7A2 2 0 0 1 5 19A3 3 0 0 1 8 16Z';
  icons.person_pin_circle = icon({ L: [P(pin), P(sh)], F: [W(pin), W(sh), B('M12 7V7')] });
}
{
  const dots = 'M8 10V10M12 10V10M16 10V10';
  icons.sms = icon({ L: [P(G.BUBBLE), P(dots)], F: [W(G.BUBBLE), B(dots)] });
}

/* ---------------- Shared controls (filter, sort, media) ---------------- */
{
  const grid = 'M9 13H15M9 17H15M12 13V17';
  icons.file_excel = icon({ L: [P(G.DOC), P(G.DOC_FOLD), P(grid)], F: [W(G.DOC), B(G.DOC_FOLD), B(grid)] });
}
{
  const tri = 'M10 8L16 12L10 16Z';
  icons.play_circle = {
    line: wrap(HEAD_L, ['<circle cx="12" cy="12" r="9"/>', P(tri)]),
    filled: wrap(HEAD_F, ['<mask id="cut">', '  <circle cx="12" cy="12" r="10" fill="white"/>', '  ' + W(tri).replace(/white/g, 'black'), '</mask>', '<circle cx="12" cy="12" r="10" mask="url(#cut)"/>']),
  };
}
{
  const A = (y) => `M3 ${y + 7}V${y + 3}A3 3 0 0 1 9 ${y + 3}V${y + 7}M3 ${y + 4}H9`; // rounded A, top at y
  const Z = (y) => `M3 ${y}H9L3 ${y + 6}H9`;
  const down = 'M17 4V20M13 16L17 20L21 16';
  const az = A(3) + Z(14) + down;
  const za = Z(4) + A(14) + down;
  icons.sort_a_to_z = icon({ L: [P(A(3)), P(Z(14)), P(down)], F: [WS(az)] });
  icons.sort_z_to_a = icon({ L: [P(Z(4)), P(A(14)), P(down)], F: [WS(za)] });
}
{
  const lines = 'M7 8H17M7 12H17M7 16H13';
  icons.article = icon({ L: ['<rect x="3" y="3" width="18" height="18" rx="2"/>', P(lines)], F: [WF('<rect x="2" y="2" width="20" height="20" rx="3"/>'), B(lines)] });
}
{
  const u = 'M8 9L12 5L16 9M8 15L12 19L16 15';
  icons.unfold_more = icon({ L: [P(u)], F: [WS(u)] });
}
{
  // history / update: 3/4 clock arc with an arrowhead at the open end, hands inside
  const old = ['M5 12A8 8 0 1 1 13 20', 'M3 10L5 12L7 10', 'M13 8V12L15 14'];
  const neu = ['M19 12A8 8 0 1 0 11 20', 'M17 10L19 12L21 10', 'M11 8V12L9 14'];
  // filled: the arrow ring stays a 2px stroke, the face becomes a solid disc r5 (2px gap) with short hands cut
  const mk = ([arc, head, hands], cx) => icon({
    L: [P(arc + head), P(hands)],
    F: [WS(arc + head), WF(`<circle cx="${cx}" cy="12" r="5"/>`), B(cx === 13 ? 'M13 9V12L15 14' : 'M11 9V12L9 14')],
  });
  icons.sort_oldest_first = mk(old, 13);
  icons.sort_newest_first = mk(neu, 11);
}
icons.priority_critical = disc('M9 10L12 7L15 10M9 16L12 13L15 16');
icons.priority_medium = disc('M8 10H16M8 14H16');
{
  const a = 'M3 12H21M17 8L21 12L17 16';
  icons.arrow_right_alt = icon({ L: [P(a)], F: [WS(a)] });
}

/* ---------------- Shared across modules ---------------- */
{
  const bm = 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21L12 17L5 21Z';
  const chk = 'M9 9L11 11L15 7';
  icons.bookmark_added = icon({ L: [P(bm), P(chk)], F: [W(bm), B(chk)] });
}
// checkbox_partial and line_start_circle are bases above
{
  const board = 'M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15'; // Pharmacy CLIPBOARD
  const pen = 'M9 17V15L14 10L16 12L11 17Z';
  icons.note_alt = icon({
    L: [P(board), '<rect x="9" y="3" width="6" height="4" rx="2"/>', P('M9 16L14 11')],
    F: [WF('<rect x="4" y="4" width="16" height="18" rx="3"/>'), WF('<rect x="8" y="2" width="8" height="6" rx="3"/>'), B('M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5'), B('M9 16L14 11')],
  });
  void pen;
}

const only = process.argv.slice(3);
const wrote = [], skipped = [];
for (const [name, { line, filled }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  if (BASES.has(name) && !mine.has(name) && existsSync(`${LIB}/line/${name}.svg`) && !process.env.FORCE) { skipped.push(name); continue; }
  writeFileSync(`${LIB}/line/${name}.svg`, line);
  writeFileSync(`${LIB}/filled/${name}.svg`, filled);
  mine.add(name);
  wrote.push(name);
}
writeFileSync(MINE_FILE, JSON.stringify([...mine], null, 1));
console.log('wrote', wrote.length, wrote.join(' '));
if (skipped.length) console.log('SKIPPED (exists, drawn by another agent):', skipped.join(' '));
