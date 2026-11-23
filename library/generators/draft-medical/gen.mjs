// Generates the Medical-module icons into library/line and library/filled.
//   node gen.mjs [names...]
// Helpers follow the Animals batch (draft-animals/gen.mjs), which follows the Eggs pilot:
// line = 2px round strokes on whole pixels; filled = the line centre line pushed out 1px,
// built with ONE mask (white silhouettes = fill + 2px white round stroke, black 2px cuts).
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const LIB = BASE + 'library';
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

const W = (e) => ({ e, paint: `fill="white" stroke="white" ${RND}` }); // closed shape: fill + 1px push-out
const WS = (e) => ({ e, paint: `fill="none" stroke="white" ${RND}` }); // open stroke: its own 2px ink
const WF = (e) => ({ e, paint: 'fill="white"' }); // exact solid (already offset)
const K = (e) => ({ e, paint: `fill="none" stroke="black" ${RND}` }); // 2px cut-out stroke
const KF = (e) => ({ e, paint: 'fill="black"' }); // cut-out shape

function inkBox(layers) {
  const parts = layers.filter((l) => !l.paint.includes('black')).map((l) => el(l.e, l.paint.includes('stroke="white"') ? '' : ' stroke="none" fill="black"'));
  const { x0, y0, x1, y1 } = checkSvg(wrap(HEAD_L, parts), 'line').ink;
  return [Math.floor(x0 + 1e-6), Math.floor(y0 + 1e-6), Math.ceil(x1 - 1e-6), Math.ceil(y1 - 1e-6)];
}
/** Filled icon: ordered mask layers, painted through a cover path = the ink bbox. */
function masked(layers) {
  const [x0, y0, x1, y1] = inkBox(layers).map((v) => Math.min(22, Math.max(2, v)));
  return wrap(HEAD_F, ['<mask id="cut">', ...layers.map((l) => '  ' + el(l.e, l.paint)), '</mask>', `<path d="M${x0} ${y0}H${x1}V${y1}H${x0}Z" mask="url(#cut)"/>`]);
}
/** Line icon; `cut` black shapes clip the `behind` group. */
function line(els, { cut = [], behind = [] } = {}) {
  if (!cut.length) return wrap(HEAD_L, els.map((e) => el(e)));
  return wrap(HEAD_L, [
    '<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>',
    ...cut.map((e) => '  ' + el(e, 'fill="black" stroke="none"')), '</mask>',
    '<g mask="url(#cut)">', ...behind.map((e) => '  ' + el(e)), '</g>', ...els.map((e) => el(e)),
  ]);
}

/* ---- Badges: parts.ts output (centre 17,17, ink r5, cut r7) + glyphs shared with the other batches ---- */
const BADGE = {
  add: { line: [P('M17 13V21M13 17H21')], knock: 'M17 14V20M14 17H20' },
  check: { line: [P('M13 17L16 20L21 14')], knock: 'M14 17L16 19L19 16' },
  clock: { line: [C(17, 17, 4), P('M17 15V17L18 18')], knock: 'M17 14V17L19 18' },
  arrow: { line: [P('M13 17H21M18 14L21 17L18 20')], knock: 'M14 17H20M17 14L20 17L17 20' }, // = Animals batch
  lock: { line: [R(13, 16, 8, 5, 2), P('M15 16V15A2 2 0 0 1 19 15V16')], knock: null }, // = Animals batch
  // new here: solid glyphs (filled = the same strokes, solid), no disc
  repeat: { line: [P('M20 17A3 3 0 1 1 17 14'), P('M16 13L17 14L16 15')], knock: null }, // mini circular arrow
  letterP: { line: [P('M16 20V13H18A2 2 0 0 1 18 17H16')], knock: null },
  letterW: { line: [P('M14 14L15 20L17 17L19 20L20 14')], knock: null },
  tube: { line: [P('M15 14V19A2 2 0 0 0 19 19V14'), P('M14 14H20')], knock: null },
  // capsule badge: filled = solid capsule split by a 2px cut
  pill: { line: [R(13, 15, 8, 4, 2), P('M17 15V19')], filled: [WF(R(12, 14, 10, 6, 3)), K(P('M17 14V20'))] },
};
function badged(id, baseL, baseF, { behindCut = [] } = {}) {
  const b = BADGE[id];
  const l = line(b.line, { cut: [C(17, 17, 7), ...behindCut], behind: baseL });
  const bf = b.filled ? [KF(C(17, 17, 7)), ...b.filled]
    : b.knock ? [KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P(b.knock))]
      : [KF(C(17, 17, 7)), ...b.line.map((e) => (e.tag === 'path' && !/Z$/.test(e.a.d) ? WS(e) : W(e)))];
  return { line: l, filled: masked([...baseF, ...bf]) };
}
const simple = (els, layers) => ({ line: line(els), filled: masked(layers) });
const strokesOnly = (ds) => simple(ds.map(P), ds.map((d) => WS(P(d))));

/* ======================= COMMON BASES =======================
 * Reused exactly from the other batches:
 *   CIRCLE    line circle (12,12) r9, filled disc r10 (library/done.svg).
 *   DOCUMENT  (Pharmacy/Lab) M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z + fold M13 3V7A2 2 0 0 0 15 9H19;
 *             filled M7 2H14L20 8V19A3 3 0 0 1 17 22H7A3 3 0 0 1 4 19V5A3 3 0 0 1 7 2Z, fold cut 2px.
 *             Text lines (so it is not `draft`): M9 13H15M9 17H13.
 *   CLIPBOARD (Pharmacy/Lab) board M9 5H7…H15 + clip rect x9 y3 w6 h4 rx2; filled board rect x4 y4 w16 h18 rx3,
 *             clip rect x8 y2 w8 h6 rx3, clip cut M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5.
 *   CALENDAR  (Pharmacy/Lab) rect x3 y5 w18 h16 rx2, rings M8 3V5M16 3V5, header M3 9H21; filled rect x2 y4 w20 h18 rx3,
 *             rings rect x7/x15 y2 w2 h4 rx1, header cut M4 9H20.
 *   IMAGE     (Pharmacy add_photo) rect x3 y3 w18 h18 rx2, sun (8,8) r1, mountain M3 19L9 13L15 19.
 *   STACK     (Requests) front rect x8 y7 w12 h14 rx2 + back L M4 17V5A2 2 0 0 1 6 3H16.
 *   TAG       (Animals) M3 12L8 7H19A2 2 0 0 1 21 9V15A2 2 0 0 1 19 17H8Z, hole (10,12) r1.
 *   FLAME     (Pharmacy emergency) M11 3C9 6 6 9 6 14A6 6 0 0 0 18 14C18 11 17.5 8.5 17 7C16 9 15 10 13 11C13 8 12.5 5 11 3Z.
 *   REFRESH   (Mortality refresh) arc M20 12A8 8 0 1 1 12 4C15 4 17 5 18 6L20 8 + head M20 4V8H16 (history = its mirror).
 *   PEN       (Animals edit) M4 20V16L15 5Q17 3 19 5Q21 7 19 9L8 20Z, scaled by pen() below.
 * New here (saved for reuse):
 *   CLOCK     circle r9 + hands M12 7V12L15 15 (filled disc r10, hands cut).
 *   STICKY    note M20 15V6A2 2 0 0 0 18 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H15Z + fold M15 20V17A2 2 0 0 1 17 15H20.
 *   FOLDER    = Shared batch folder M5 4H9L12 7H19A2 2 0 0 1 21 9V18A2 2 0 0 1 19 20H5A2 2 0 0 1 3 18V6A2 2 0 0 1 5 4Z.
 *   BOTTLE    cap rect x4 y3 w16 h4 rx2 + body M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7 (medicine bottle).
 *   SYRINGE   barrel M12 8L4 16L8 20L16 12, flange M11 7L17 13, rod M14 10L18 6, handle M16 4L20 8, needle M6 18L3 21.
 *   PILL      45° capsule M5 13L13 5A4.243 4.243 0 0 1 19 11L11 19A4.243 4.243 0 0 1 5 13Z + divider M9 9L15 15.
 *   HOUSE     M12 3L4 11V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V11Z (+ cross M12 11V17M9 14H15 = hospital).
 *   PAW       toes circles r1 at (5,10)(9,5)(15,5)(19,10) + pad M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z.
 *   FLASK     M10 3V9L5 19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19L14 9V3 + rim M8 3H16 + liquid M7 15H17.
 *   WARNING   M10 5L3 18A2 2 0 0 0 5 21H19A2 2 0 0 0 21 18L14 5A2 2 0 0 0 10 5Z, "!" M12 10V13M12 17V17.
 *   CROSS     medical plus, 6×6 (arms 3) in a 12-wide interior, 4×4 in a bottle.
 */
const CIRC_L = C(12, 12, 9);
const CIRC_F = WF(C(12, 12, 10));

const DOC_L = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z';
const DOC_FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
const DOC_F = 'M7 2H14L20 8V19A3 3 0 0 1 17 22H7A3 3 0 0 1 4 19V5A3 3 0 0 1 7 2Z';
const DOCL = [P(DOC_L), P(DOC_FOLD)];
const DOCF = [WF(P(DOC_F)), K(P(DOC_FOLD))];
const DOC_LINES = 'M9 13H15M9 17H13';

const CLIP_L = [P('M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15'), R(9, 3, 6, 4, 2)];
const CLIP_F = [WF(R(4, 4, 16, 18, 3)), WF(R(8, 2, 8, 6, 3)), K(P('M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5'))];

const CAL_L = [R(3, 5, 18, 16, 2), P('M8 3V5M16 3V5M3 9H21')];
const CAL_F = [WF(R(2, 4, 20, 18, 3)), WF(R(7, 2, 2, 4, 1)), WF(R(15, 2, 2, 4, 1)), K(P('M4 9H20'))];

const STICKY = 'M20 15V6A2 2 0 0 0 18 4H6A2 2 0 0 0 4 6V18A2 2 0 0 0 6 20H15Z';
const STICKY_FOLD = 'M15 20V17A2 2 0 0 1 17 15H20';
const FOLDER = 'M5 4H9L12 7H19A2 2 0 0 1 21 9V18A2 2 0 0 1 19 20H5A2 2 0 0 1 3 18V6A2 2 0 0 1 5 4Z'; // = Shared batch folder
const BOTTLE_CAP = R(4, 3, 16, 4, 2);
const BOTTLE_BODY = 'M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7';
const BOTTLE_L = [BOTTLE_CAP, P(BOTTLE_BODY)];
const BOTTLE_F = [WF(R(3, 2, 18, 6, 3)), W(P(BOTTLE_BODY + 'Z'))];
const HOUSE = 'M12 3L4 11V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V11Z';
const TAG_L = 'M3 12L8 7H19A2 2 0 0 1 21 9V15A2 2 0 0 1 19 17H8Z';
const FLAME = 'M11 3C9 6 6 9 6 14A6 6 0 0 0 18 14C18 11 17.5 8.5 17 7C16 9 15 10 13 11C13 8 12.5 5 11 3Z';

/* small pen (same construction as the Animals PEN): tip at (tx,ty), width w, length len */
function pen(tx, ty, w, len) {
  const ax = tx + len, ay = ty - w - len; // A' (upper end of the left edge)
  const bx = tx + w + len, by = ty - len; // B'
  const mx = ax + w, my = ay;
  return `M${tx} ${ty}V${ty - w}L${ax} ${ay}Q${n(ax + w / 2)} ${n(ay - w / 2)} ${mx} ${my}Q${n(mx + w / 2)} ${n(my + w / 2)} ${bx} ${by}L${tx + w} ${ty}Z`;
}
/* capsule along a 45° axis (x0,y0)-(x1,y1), radius r: used as a black "hide" shape */
function capsule(x0, y0, x1, y1, r) {
  const o = r / Math.SQRT2;
  return `M${n(x0 + o)} ${n(y0 - o)}L${n(x1 + o)} ${n(y1 - o)}A${r} ${r} 0 0 1 ${n(x1 - o)} ${n(y1 + o)}L${n(x0 - o)} ${n(y0 + o)}A${r} ${r} 0 0 1 ${n(x0 + o)} ${n(y0 - o)}Z`;
}

const icons = {};
const META = {};
const def = (name, v, meta) => { icons[name] = v; META[name] = meta; };

/* ---------------- Circles ---------------- */
def('error', simple([CIRC_L, P('M12 7V13M12 17V17')], [CIRC_F, K(P('M12 7V13M12 17V17'))]), 'Circle with "!" (missing batch number). Use with the error role.');
def('stop_circle', simple([CIRC_L, R(9, 9, 6, 6, 2)], [CIRC_F, KF(R(8, 8, 8, 8, 3))]), 'Circle with a rounded stop square. Filled: the square is a hole.');
def('symptoms', simple([CIRC_L, P('M9 10V10M15 10V10'), P('M9 16A4 4 0 0 1 15 16')], [CIRC_F, K(P('M9 10V10M15 10V10')), K(P('M9 16A4 4 0 0 1 15 16'))]),
  'Unwell face: eyes and a frown (sick / mood_bad).');
def('chronic', (() => {
  const INF = 'M12 12C9 8 3 8 3 12C3 16 9 16 12 12C15 8 21 8 21 12C21 16 15 16 12 12Z';
  return simple([P(INF)], [W(P(INF))]);
})(), 'Infinity loop = long-lasting, ongoing condition. Filled: both lobes solid.');
def('history', (() => {
  const ARC = 'M4 12A8 8 0 1 0 12 4C9 4 7 5 6 6L4 8', HEADP = 'M4 4V8H8', HANDS = 'M12 8V12L14 14';
  return strokesOnly([ARC, HEADP, HANDS]);
})(), 'Counter-clockwise arrow round clock hands: the mirror of the shared refresh arrow.');

/* ---------------- Documents, notes, clipboards ---------------- */
def('note_add', badged('add', DOCL, DOCF), 'Shared document + add badge.');
def('file_pdf', badged('letterP', DOCL, DOCF), 'Shared document + a "P" letter in the badge position.');
def('file_word', badged('letterW', DOCL, DOCF), 'Shared document + a "W" letter in the badge position.');
def('lab_profile', badged('tube', DOCL, DOCF), 'Shared document + a small test tube in the badge position = lab record.');
def('note', simple([P(STICKY), P(STICKY_FOLD), P('M8 9H16M8 13H12')], [W(P(STICKY)), K(P(STICKY_FOLD)), K(P('M8 9H16M8 13H12'))]),
  'Sticky note: square with the bottom-right corner folded, two lines. New STICKY base.');
def('clinical_notes', simple([P(STICKY), P(STICKY_FOLD), P('M11 8V14M8 11H14')], [W(P(STICKY)), K(P(STICKY_FOLD)), K(P('M11 8V14M8 11H14'))]),
  'Sticky note with a medical cross.');
def('edit_note', (() => {
  const PEN = pen(11, 21, 3, 6);
  const LINES = 'M3 6H19M3 11H12M3 16H7';
  return simple([P(LINES), P(PEN)], [WS(P(LINES)), W(P(PEN))]);
})(), 'Three text lines with a 45° pencil (same construction as the Animals edit pen).');
def('assessment', simple([...CLIP_L, P('M9 13L11 15L15 11')], [...CLIP_F, K(P('M9 13L11 15L15 11'))]), 'Shared clipboard with a check.');
def('diagnosis', (() => {
  const HEART = 'M12 17L10 15C8.5 13.5 9.5 12 10.5 12C11.3 12 12 13 12 13C12 13 12.7 12 13.5 12C14.5 12 15.5 13.5 14 15Z';
  return simple([...CLIP_L, P(HEART)], [...CLIP_F, K(P(HEART))]);
})(), 'Shared clipboard with a heart.');
def('prescription', badged('pill', [...CLIP_L, P('M9 11H15')], [...CLIP_F, K(P('M9 11H15'))]), 'Shared clipboard (one line) + a capsule in the badge position.');
def('medical_record', simple([P(FOLDER), P('M12 11V15M10 13H14')], [W(P(FOLDER)), K(P('M12 11V15M10 13H14'))]), 'Shared folder (Shared batch) with a medical cross.');
def('animal_batch', simple([R(8, 7, 12, 14, 2), P('M4 17V5A2 2 0 0 1 6 3H16'), P('M12 11H16M12 15H16')],
  [WF(R(7, 6, 14, 16, 3)), WF(P('M3 17V5A3 3 0 0 1 6 2H16A1 1 0 0 1 16 4H6A1 1 0 0 0 5 5V17A1 1 0 0 1 3 17Z')), K(P('M12 11H16M12 15H16'))]),
  'Shared stacked sheets with list lines = a batch of records (like the old icon).');

/* ---------------- Calendar ---------------- */
def('calendar_add_on', badged('add', CAL_L, CAL_F), 'Shared calendar + add badge (schedule).');
def('event_upcoming', badged('clock', CAL_L, CAL_F), 'Shared calendar + clock badge (upcoming).');
def('event_repeat', badged('repeat', CAL_L, CAL_F), 'Shared calendar + small circular arrow (follow-up / repeat).');
def('event_note', simple([...CAL_L, P('M7 13H17M7 17H13')], [...CAL_F, K(P('M7 13H17M7 17H13'))]), 'Shared calendar with two text lines (visit type).');

/* ---------------- Medicine ---------------- */
def('medication', simple([...BOTTLE_L, P('M12 12V16M10 14H14')], [...BOTTLE_F, K(P('M12 12V16M10 14H14'))]), 'Medicine bottle (cap + body) with a cross. New BOTTLE base.');
def('controlled_substance', badged('lock', BOTTLE_L, BOTTLE_F), 'Medicine bottle + padlock (the Animals lock glyph) = controlled.');
def('pill', (() => {
  const CAP = 'M5 13L13 5A4.243 4.243 0 0 1 19 11L11 19A4.243 4.243 0 0 1 5 13Z';
  return simple([P(CAP), P('M9 9L15 15')], [W(P(CAP)), K(P('M9 9L15 15'))]);
})(), '45° capsule with a divider. New PILL base.');
def('vaccine', (() => {
  const BARREL = 'M12 8L4 16L8 20L16 12', REST = 'M11 7L17 13M14 10L18 6M16 4L20 8M6 18L3 21';
  return simple([P(BARREL), P(REST)], [W(P(BARREL + 'Z')), WS(P(REST))]);
})(), 'Syringe at 45°: needle, barrel, flange, plunger, handle. New SYRINGE base.');
def('deworming', (() => {
  const WORM = 'M8 16C8 12 12 16 12 12C12 8 16 12 16 8';
  const HIDE = P(capsule(9, 9, 15, 15, 3));
  return {
    line: line([CIRC_L, P('M6 6L18 18')], { cut: [HIDE], behind: [P(WORM)] }),
    filled: masked([WF(C(12, 12, 10)), KF(C(12, 12, 8)), WS(P(WORM)), KF(HIDE), WS(P('M6 6L18 18'))]),
  };
})(), 'No-entry circle over a worm: anti-parasite treatment. Filled keeps the ring (like block).');
def('supplement', simple([C(12, 14, 7), P('M12 7C12 4 14 3 17 3C17 6 15 7 12 7Z')], [WF(C(12, 14, 8)), W(P('M12 7C12 4 14 3 17 3C17 6 15 7 12 7Z'))]),
  'Fruit with a leaf (nutrition).');
def('skip', simple([P('M5 4V20L13 12Z'), P('M18 4V20')], [W(P('M5 4V20L13 12Z')), WS(P('M18 4V20'))]), 'Skip next: 45° triangle + bar. Skipped state: filled, error role.');
def('route', simple([C(6, 5, 2), C(18, 19, 2), P('M6 11V16A3 3 0 0 0 12 16V8A3 3 0 0 1 18 8V13')],
  [WF(C(6, 5, 3)), WF(C(18, 19, 3)), WS(P('M6 11V16A3 3 0 0 0 12 16V8A3 3 0 0 1 18 8V13'))]), 'Route: start and end points joined by an S path.');
def('urgent', simple([P(FLAME)], [W(P(FLAME))]), 'Flame: exactly the Pharmacy emergency flame (same idea: urgent).');
def('medical', simple([R(3, 7, 18, 14, 2), P('M9 7V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V7'), P('M12 11V17M9 14H15')],
  [WF(R(2, 6, 20, 16, 3)), WS(P('M9 7V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V7')), K(P('M12 11V17M9 14H15'))]), 'First-aid bag with a cross.');
def('home_health', simple([P(HOUSE), P('M12 11V17M9 14H15')], [W(P(HOUSE)), K(P('M12 11V17M9 14H15'))]), 'House with a cross = hospital. New HOUSE base.');
def('hospital_transfer', (() => {
  const BODY = 'M5 21V5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21', X = 'M12 7V13M9 10H15', DOOR = 'M10 21V19A2 2 0 0 1 14 19V21';
  return badged('arrow', [P(BODY), P('M3 21H21'), P(X), P(DOOR)], [W(P(BODY + 'Z')), WS(P('M3 21H21')), K(P(X)), KF(P('M10 20V19A2 2 0 0 1 14 19V20Z'))]);
})(), 'Shared local_hospital building (cross, door) + arrow badge = transfer to hospital.');

/* ---------------- Lab ---------------- */
def('lab_request', (() => {
  const FL = 'M10 3V9L5 19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19L14 9V3';
  return simple([P(FL), P('M8 3H16M7 15H17')], [W(P(FL + 'Z')), WS(P('M8 3H16')), KF(P('M11 4H13V9L15 14H9L11 9Z'))]);
})(), 'Flask with a liquid level (science). Filled: liquid solid, headspace open (like lab_sample).');
def('lab_microscope', simple([R(7, 3, 4, 10, 2), P('M11 9H14A5 5 0 0 1 14 19V21M5 21H19M6 17H10')],
  [WF(R(6, 2, 6, 12, 3)), WS(P('M11 9H14A5 5 0 0 1 14 19V21M5 21H19M6 17H10'))]), 'Microscope: exactly the necropsy microscope geometry (Notifications batch).');
def('vital_signs', strokesOnly(['M3 12H6L9 6L15 18L18 12H21']), 'Pulse trace.');
def('monitor_weight', simple([R(3, 3, 18, 18, 2), P('M8 12A4 4 0 0 1 16 12Z'), P('M12 12L14 10')],
  [WF(R(2, 2, 20, 20, 3)), K(P('M8 12A4 4 0 0 1 16 12Z')), K(P('M12 12L14 10'))]), 'Scale: square platform with a dial and needle.');

/* ---------------- Time of day ---------------- */
def('wb_sunny', simple([C(12, 12, 3), P('M12 3V5M12 19V21M3 12H5M19 12H21M5 5L7 7M17 17L19 19M5 19L7 17M17 7L19 5')],
  [WF(C(12, 12, 4)), WS(P('M12 3V5M12 19V21M3 12H5M19 12H21M5 5L7 7M17 17L19 19M5 19L7 17M17 7L19 5'))]), 'Sun with eight rays (afternoon dose).');
def('wb_twilight', simple([P('M7 18A5 5 0 0 1 17 18'), P('M3 18H21M12 4V8M4 10L5 11M20 10L19 11')],
  [W(P('M7 18A5 5 0 0 1 17 18Z')), WS(P('M3 18H21M12 4V8M4 10L5 11M20 10L19 11'))]), 'Half sun rising on the horizon (morning dose).');
def('bedtime', simple([P('M12 3A9 9 0 1 0 21 12A9 9 0 0 1 12 3Z')], [W(P('M12 3A9 9 0 1 0 21 12A9 9 0 0 1 12 3Z'))]), 'Crescent moon (night dose).');

/* ---------------- Generic UI used in Medical ---------------- */
def('expand_more', strokesOnly(['M6 9L12 15L18 9']), 'Chevron down (mirror of expand_less).');
def('repeat', strokesOnly(['M4 11V9A2 2 0 0 1 6 7H20', 'M17 4L20 7L17 10', 'M20 13V15A2 2 0 0 1 18 17H4', 'M7 14L4 17L7 20']), 'Repeat loop: two arrows round a rectangle (alternate-day dosing).');
def('attach_file', strokesOnly(['M19 8V15A6 6 0 0 1 7 15V7A4 4 0 0 1 15 7V15A2 2 0 0 1 11 15V9']), 'Upright paperclip.');
def('category', simple([P('M12 4L18 10H6Z'), R(3, 14, 7, 7, 2), C(18, 18, 3)], [W(P('M12 4L18 10H6Z')), WF(R(2, 13, 9, 9, 3)), WF(C(18, 18, 4))]), 'Triangle, square, circle.');
def('sell', simple([P(TAG_L), C(10, 12, 1)], [W(P(TAG_L)), KF(C(10, 12, 1))]), 'Shared tag (Animals) with a hole.');
def('add_a_photo', (() => {
  const CAM = 'M3 9A2 2 0 0 1 5 7H7L9 5H15L17 7H19A2 2 0 0 1 21 9V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19Z';
  return badged('add', [P(CAM), C(11, 14, 3)], [W(P(CAM)), K(C(11, 14, 3))]);
})(), 'Camera + add badge (photo proof of dose).');
def('like', (() => {
  const HAND = 'M7 10L11 3C12 3 14 4 14 6V9H19A2 2 0 0 1 21 11V12L19 19C18.6 20.3 18 21 17 21H7Z';
  const CUFF = 'M7 10H4A1 1 0 0 0 3 11V20A1 1 0 0 0 4 21H7';
  return simple([P(HAND), P(CUFF)], [W(P(HAND)), W(P(CUFF + 'Z')), K(P('M7 10V21'))]);
})(), 'Thumb up. Liked: filled.');
def('print', (() => {
  const TOP = 'M7 8V4A1 1 0 0 1 8 3H16A1 1 0 0 1 17 4V8';
  const BODY = 'M7 17H5A2 2 0 0 1 3 15V10A2 2 0 0 1 5 8H19A2 2 0 0 1 21 10V15A2 2 0 0 1 19 17H17';
  const PAPER = 'M7 13H17V20A1 1 0 0 1 16 21H8A1 1 0 0 1 7 20Z';
  return simple([P(TOP), P(BODY), P(PAPER)], [WS(P(TOP)), W(P('M5 8H19A2 2 0 0 1 21 10V15A2 2 0 0 1 19 17H5A2 2 0 0 1 3 15V10A2 2 0 0 1 5 8Z')), W(P(PAPER)), K(P(PAPER))]);
})(), 'Printer: paper in, body, printed sheet out.');
def('warning', (() => {
  const T = 'M10 5L4 18A2 2 0 0 0 6 21H18A2 2 0 0 0 20 18L14 5A2 2 0 0 0 10 5Z', X = 'M12 10V13M12 17V17';
  return simple([P(T), P(X)], [W(P(T)), K(P(X))]);
})(), 'Rounded warning triangle with "!". New WARNING base.');
def('report', (() => {
  const O = 'M8 3H16L21 8V16L16 21H8L3 16V8Z', X = 'M12 7V12M12 16V16';
  return simple([P(O), P(X)], [W(P(O)), K(P(X))]);
})(), '45° octagon with "!" (complaint warning).');
def('animal', (() => {
  const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
  const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
  return simple([P(PAD), ...TOES.map(([x, y]) => C(x, y, 1))], [W(P(PAD)), ...TOES.map(([x, y]) => WF(C(x, y, 2)))]);
})(), 'Paw: four toe dots and a pad. New PAW base.');

const only = process.argv.slice(2);
for (const [name, { line: l, filled: f }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(`${LIB}/line/${name}.svg`, l);
  writeFileSync(`${LIB}/filled/${name}.svg`, f);
}
writeFileSync(new URL('./meta.json', import.meta.url), JSON.stringify(META, null, 1));
console.log('wrote', Object.keys(icons).length);
