// Generates the "Animals and species" and "Housing and diet" icons into library/line and library/filled.
//   node gen.mjs [names...]
// Approach follows the Eggs pilot (generators/eggs/gen.mjs): line = 2px round strokes on whole pixels;
// filled = the line centre line pushed out 1px. Where the silhouette is not axis-aligned (45° edges, curves)
// the filled icon is built with ONE mask: the line shapes drawn white with fill + a 2px white stroke
// (= exactly +1px), black 2px cuts for inner details, painted through a cover path = the ink bbox.
import { writeFileSync, readFileSync } from 'node:fs';
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

/* ---- element constructors: {tag, a} ---------------------------------------------------- */
const P = (d) => ({ tag: 'path', a: { d } });
const C = (cx, cy, r) => ({ tag: 'circle', a: { cx, cy, r } });
const R = (x, y, width, height, rx) => ({ tag: 'rect', a: { x, y, width, height, ...(rx ? { rx } : {}) } });
const el = (e, extra = '') => `<${e.tag} ${Object.entries(e.a).map(([k, v]) => `${k}="${v}"`).join(' ')}${extra ? ' ' + extra : ''}/>`;

/* paints inside the filled mask */
const W = (e) => ({ e, paint: `fill="white" stroke="white" ${RND}` }); // closed shape: fill + 1px push-out
const WS = (e) => ({ e, paint: `fill="none" stroke="white" ${RND}` }); // open stroke: its own 2px ink
const WF = (e) => ({ e, paint: 'fill="white"' }); // exact solid shape (already offset)
const K = (e) => ({ e, paint: `fill="none" stroke="black" ${RND}` }); // 2px cut-out stroke
const KF = (e) => ({ e, paint: 'fill="black"' }); // cut-out shape (e.g. offset 3 = 2px gap)

/** Ink bbox (whole pixels, outward) of a list of white layers, measured with the app checker. */
function inkBox(layers) {
  const parts = layers.filter((l) => !l.paint.includes('black')).map((l) => {
    const sw = l.paint.includes('stroke="white"') ? '' : ' stroke="none" fill="black"';
    return el(l.e, sw);
  });
  const r = checkSvg(wrap(HEAD_L, parts), 'line');
  const { x0, y0, x1, y1 } = r.ink;
  return [Math.floor(x0 + 1e-6), Math.floor(y0 + 1e-6), Math.ceil(x1 - 1e-6), Math.ceil(y1 - 1e-6)];
}
/** Filled icon from ordered mask layers, painted through a cover path = the ink bbox. */
function masked(layers, box) {
  const [x0, y0, x1, y1] = box ?? inkBox(layers);
  return wrap(HEAD_F, [
    '<mask id="cut">',
    ...layers.map((l) => '  ' + el(l.e, l.paint)),
    '</mask>',
    `<path d="M${x0} ${y0}H${x1}V${y1}H${x0}Z" mask="url(#cut)"/>`,
  ]);
}
/** Line icon: plain elements, optionally with a mask (black shapes cut the masked group). */
function line(els, { cut = [], behind = [] } = {}) {
  if (!cut.length) return wrap(HEAD_L, els.map((e) => el(e)));
  return wrap(HEAD_L, [
    '<mask id="cut">',
    '  <rect width="24" height="24" fill="white" stroke="none"/>',
    ...cut.map((e) => '  ' + el(e, 'fill="black" stroke="none"')),
    '</mask>',
    '<g mask="url(#cut)">',
    ...behind.map((e) => '  ' + el(e)),
    '</g>',
    ...els.map((e) => el(e)),
  ]);
}

/* ---- Badges: exact output of app/src/parts/parts.ts + compose.ts (centre 17,17, ink r5, cut r7) ---- */
const BADGE = {
  add: { line: [P('M17 13V21M13 17H21')], knock: 'M17 14V20M14 17H20' },
  check: { line: [P('M13 17L16 20L21 14')], knock: 'M14 17L16 19L19 16' },
  close: { line: [P('M14 14L20 20M20 14L14 20')], knock: 'M15 15L19 19M19 15L15 19' },
  clock: { line: [C(17, 17, 4), P('M17 15V17L18 18')], knock: 'M17 14V17L19 18' },
  alert: { line: [P('M17 13V17M17 21V21')], knock: 'M17 14V17M17 20V20' },
  // new glyphs in the same zone (drawn for this batch)
  arrow: { line: [P('M13 17H21M18 14L21 17L18 20')], knock: 'M14 17H20M17 14L20 17L17 20' },
  // globe r4 + equator + one meridian lens (public)
  globe: {
    line: [C(17, 17, 4), P('M13 17H21M17 13A6 6 0 0 0 17 21')],
    filled: [WS(C(17, 17, 4)), WS(P('M13 17H21M17 13A6 6 0 0 0 17 21'))], // globe keeps its strokes (a knocked disc reads as "+")
  },
  // padlock: body 8x5 + shackle (private)
  lock: {
    line: [R(13, 16, 8, 5, 2), P('M15 16V15A2 2 0 0 1 19 15V16')],
    filled: [WF(R(12, 15, 10, 7, 3)), WS(P('M15 15A2 2 0 0 1 19 15')), K(P('M17 18V19'))],
  },
};
/** Badged icon: base line elements + base filled layers, badge glyph bottom-right. */
function badged(id, baseL, baseF, { behindCut = [] } = {}) {
  const b = BADGE[id];
  const l = line(b.line, { cut: [C(17, 17, 7), ...behindCut], behind: baseL });
  const badgeF = b.filled ? [KF(C(17, 17, 7)), ...b.filled] : [KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P(b.knock))];
  const f = masked([...baseF, ...badgeF]);
  return { line: l, filled: f };
}

/* ======================= COMMON BASES =======================
 * Reused exactly from other agents where they already existed:
 *   CALENDAR (draft-pharm-lab): line rect x3 y5 w18 h16 rx2, rings M8 3V5 M16 3V5, header M3 9H21;
 *            filled rect x2 y4 w20 h18 rx3, rings rect x7/x15 y2 w2 h4 rx1, header cut M4 9H20.
 *   CLIPBOARD (draft-pharm-lab / draft-requests): board M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15,
 *            clip rect x9 y3 w6 h4 rx2; filled board rect x4 y4 w16 h18 rx3 + clip rect x8 y2 w8 h6 rx3,
 *            clip separated by cut M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5.
 *   PERSON (draft-requests): head circle (12,8) r4, body M4 21V20A4 4 0 0 1 8 16H16A4 4 0 0 1 20 20V21 (top 16, half-width 8, r4).
 *   LOCATION PIN (Eggs pilot library/line/location.svg).
 *   EGG (Eggs pilot): egg(cx, cy, r, d).
 * New here (saved for reuse):
 *   SEARCH  lens circle (10,10) r6 + handle M14 14L20 20 (ink 3–21); filled lens disc r7, handle 2px.
 *   TRASH   lid M4 6H20, handle M9 6V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6, can M6 6V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V6,
 *           slots M10 10V17 M14 10V17.
 *   TAG     horizontal luggage tag pointing left: M3 12L8 7H19A2 2 0 0 1 21 9V15A2 2 0 0 1 19 17H8Z, hole circle (10,12) r1.
 *   GLOBE   circle r9 + equator + meridian lens (two arcs r12).
 *   SHIELD  M7 3H17A2 2 0 0 1 19 5V11C19 16 16 19.5 12 21C8 19.5 5 16 5 11V5A2 2 0 0 1 7 3Z.
 *   STAR    10-vertex star (12,3)(14,9)(21,9)(15,13)(18,20)(12,16)(6,20)(9,13)(3,9)(10,9).
 *   EMBRYO  head circle + C-shaped body arc (see repro_*).
 *   EAR     ear leaf (see ear_tag_*).
 */
const egg = (cx, cy, r, d = 0) => {
  const apex = cy - Math.round((r * 11) / 7) - d;
  const Rr = r + d, c1 = Rr / 2, c2 = (r * 5) / 7 + d / 2;
  return `M${n(cx)} ${n(apex)}C${n(cx - c1)} ${n(apex)} ${n(cx - Rr)} ${n(cy - c2)} ${n(cx - Rr)} ${n(cy)}A${n(Rr)} ${n(Rr)} 0 0 0 ${n(cx + Rr)} ${n(cy)}C${n(cx + Rr)} ${n(cy - c2)} ${n(cx + c1)} ${n(apex)} ${n(cx)} ${n(apex)}Z`;
};
const EGG_L = egg(12, 14, 7, 0);
if (EGG_L !== 'M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z') throw new Error('egg drift');

const CAL_L = [R(3, 5, 18, 16, 2), P('M8 3V5M16 3V5M3 9H21')];
const CAL_F = [WF(R(2, 4, 20, 18, 3)), WF(R(7, 2, 2, 4, 1)), WF(R(15, 2, 2, 4, 1)), K(P('M4 9H20'))];

const CLIP_L = [P('M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15'), R(9, 3, 6, 4, 2)];
const CLIP_F = [WF(R(4, 4, 16, 18, 3)), WF(R(8, 2, 8, 6, 3)), K(P('M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5'))];

const personBody = (cx, top, hw, cr, bottom) => `M${cx - hw} ${bottom}V${top + cr}A${cr} ${cr} 0 0 1 ${cx - hw + cr} ${top}H${cx + hw - cr}A${cr} ${cr} 0 0 1 ${cx + hw} ${top + cr}V${bottom}`;

const PIN_L = (cx, cy) => `M${cx} ${cy + 11}C${cx} ${cy + 11} ${cx - 7} ${cy + 5.5} ${cx - 7} ${cy}A7 7 0 0 1 ${cx + 7} ${cy}C${cx + 7} ${cy + 5.5} ${cx} ${cy + 11} ${cx} ${cy + 11}Z`;

const LENS = { cx: 10, cy: 10, r: 6, handle: 'M14 14L20 20' };
const TRASH = {
  lid: 'M4 6H20', handle: 'M9 6V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6',
  can: 'M6 6V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V6', slots: 'M10 10V17M14 10V17',
};
const TAG_L = 'M3 12L8 7H19A2 2 0 0 1 21 9V15A2 2 0 0 1 19 17H8Z';
const SHIELD_L = 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V11C19 16 15.5 19.5 12 21C8.5 19.5 5 16 5 11Z'; // = draft-shared GEO.SHIELD
const STAR = [[12, 3], [14, 9], [21, 9], [15, 13], [18, 20], [12, 16], [6, 20], [9, 13], [3, 9], [10, 9]];
const STAR_L = 'M' + STAR.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';

const icons = {};
const META = {};
const def = (name, v, meta) => { icons[name] = v; META[name] = meta; };
const simple = (els, layers) => ({ line: line(els), filled: masked(layers) });
// stroke-only icon: filled = the same strokes (no enclosed area to fill)
const strokesOnly = (ds) => simple(ds.map(P), ds.map((d) => WS(P(d))));

/* ============================== GENERIC UI ============================== */

def('close', strokesOnly(['M6 6L18 18M18 6L6 18']), 'Cross. Filled is the same strokes.');
def('open_in_full', strokesOnly(['M14 4H20V10M10 20H4V14M20 4L4 20']), 'Two corner arrowheads joined by a diagonal: expand.');
def('close_fullscreen', strokesOnly(['M14 4V10H20M10 20V14H4M14 10L20 4M10 14L4 20']), 'Arrowheads pointing in to the centre: collapse.');

def('star', { line: line([P(STAR_L)]), filled: masked([W(P(STAR_L))]) }, 'Five-point star. Line = not favourite, filled = favourite.');

def('info', {
  line: line([C(12, 12, 9), P('M12 11V16M12 7V7')]),
  filled: masked([WF(C(12, 12, 10)), K(P('M12 11V16M12 7V7'))], [2, 2, 22, 22]),
}, 'Circle with "i" (same circle as done).');

def('edit', (() => {
  const PEN = 'M4 20V16L15 5Q17 3 19 5Q21 7 19 9L8 20Z';
  return { line: line([P(PEN), P('M13 7L17 11')]), filled: masked([W(P(PEN)), K(P('M13 7L17 11'))]) };
})(), 'Pencil at 45°, tip bottom-left, ferrule line.');

def('grid_view', {
  line: line([R(3, 3, 7, 7, 2), R(14, 3, 7, 7, 2), R(3, 14, 7, 7, 2), R(14, 14, 7, 7, 2)]),
  filled: wrap(HEAD_F, [2, 13].flatMap((y) => [2, 13].map((x) => `<rect x="${x}" y="${y}" width="9" height="9" rx="3"/>`))),
}, 'Four rounded tiles.');

def('list', strokesOnly(['M4 6H4M4 12H4M4 18H4', 'M8 6H20M8 12H20M8 18H20']), 'Three bullets and lines. Active state is the colour role.');

def('bar_chart', {
  line: line([R(3, 3, 18, 18, 2), P('M8 17V12M12 17V7M16 17V14')]),
  filled: masked([WF(R(2, 2, 20, 20, 3)), K(P('M8 17V12M12 17V7M16 17V14'))], [2, 2, 22, 22]),
}, 'Three bars in a rounded frame. Filled: solid frame, bars cut out.');

{
  // the three step rings and their links are one continuous stroke (the middle ring's right half is retraced)
  const STEPS = 'M5 7A2 2 0 0 1 5 3A2 2 0 0 1 5 7V10A2 2 0 0 1 5 14A2 2 0 0 1 5 10A2 2 0 0 1 5 14V17A2 2 0 0 1 5 21A2 2 0 0 1 5 17';
  const LN = 'M5 7V10M5 14V17M11 5H21M11 12H21M11 19H21';
  def('format_list_numbered', {
    line: line([P(STEPS), P('M11 5H21M11 12H21M11 19H21')]),
    filled: masked([...[5, 12, 19].map((y) => WF(C(5, y, 3))), WS(P(LN))]),
  }, 'Stepper: three linked step circles beside three lines (steps taken). Digits are illegible at 24px, so no numerals.');
}

def('move_in', strokesOnly(['M14 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H14', 'M3 12H15M11 8L15 12L11 16']), 'Arrow entering a doorway (move into an enclosure).');

/* ============================== ANIMALS ============================== */

/* Gender symbols: ring r5 (female) and r6 (male) */
def('male', {
  line: line([C(9, 15, 6), P('M13 11L20 4M15 4H20V9')]),
  filled: masked([WS(C(9, 15, 6)), WS(P('M13 11L20 4M15 4H20V9'))]),
}, 'Male symbol ♂: ring with a 45° arrow. Filled keeps the ring (a solid ball reads as a pin).');
def('family_history', {
  line: line([C(12, 8, 5), P('M12 13V21M9 18H15')]),
  filled: masked([WS(C(12, 8, 5)), WS(P('M12 13V21M9 18H15'))]),
}, 'Female symbol ♀ (the old icon "add_parent" is a ♀). Filled keeps the ring, like male.');

/* Breeding pair ⚤: female ring (cross down) and male ring (arrow up-right) interlocked side by side, r4 rings.
   Filled = the same rings (gender symbols keep their rings in both styles). */
{
  const S = 'M7 15V21M4 19H10M17 8L21 4M18 4H21V7';
  def('breeding_pair', {
    line: line([C(7, 11, 4), C(14, 11, 4), P(S)]),
    filled: masked([WS(C(7, 11, 4)), WS(C(14, 11, 4)), WS(P(S))]),
  }, 'Interlocked female and male symbols ⚤.');
}

def('mortality', (() => {
  const SKULL = 'M4 11A8 8 0 0 1 20 11V14A2 2 0 0 1 18 16V19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19V16A2 2 0 0 1 4 14Z';
  const EYES = [C(9, 12, 1), C(15, 12, 1)];
  return {
    line: line([P(SKULL), ...EYES, P('M12 17V21')]),
    filled: masked([W(P(SKULL)), KF(C(9, 12, 2)), KF(C(15, 12, 2)), K(P('M12 17V22'))]),
  };
})(), 'Skull: cranium, two eyes, jaw split.');

def('account_tree', (() => {
  const B = [R(3, 9, 6, 6, 2), R(15, 3, 6, 6, 2), R(15, 15, 6, 6, 2)];
  const CONN = 'M9 12H13M15 6A2 2 0 0 0 13 8V16A2 2 0 0 0 15 18';
  return {
    line: line([...B, P(CONN)]),
    filled: masked([WF(R(2, 8, 8, 8, 3)), WF(R(14, 2, 8, 8, 3)), WF(R(14, 14, 8, 8, 3)), WS(P(CONN))]),
  };
})(), 'Hierarchy: one parent box branching to two child boxes (taxonomy tree).');

def('assignment_turned_in', {
  line: line([...CLIP_L, P('M9 13L11 15L15 11')]),
  filled: masked([...CLIP_F, K(P('M9 13L11 15L15 11'))]),
}, 'Clipboard (shared base) with a check: action taken.');

def('arrow_shape_up_stack', (() => {
  const AR = 'M12 9L19 16H15V21H9V16H5Z';
  const CH = 'M5 10L12 3L19 10';
  return { line: line([P(AR), P(CH)]), filled: masked([W(P(AR)), WS(P(CH))]) };
})(), 'Arrow-shape pointing up with a chevron stacked above (move up, in bulk).');

def('beenhere', (() => {
  const B = 'M7 3H17A2 2 0 0 1 19 5V14L12 21L5 14V5A2 2 0 0 1 7 3Z';
  return { line: line([P(B), P('M9 10L11 12L15 8')]), filled: masked([W(P(B)), K(P('M9 10L11 12L15 8'))]) };
})(), 'Pointed badge (marker) with a check: tagged / saved.');

def('hard_drive', (() => {
  const BOX = 'M3 12L8 7H16L21 12V18A2 2 0 0 1 19 20H5A2 2 0 0 1 3 18Z';
  return {
    line: line([P(BOX), P('M3 12H21M17 16V16')]),
    filled: masked([W(P(BOX)), K(P('M4 12H20M17 16V16'))]),
  };
})(), 'Drive box with a slanted top and an LED: records storage.');

def('health_and_safety', {
  line: line([P(SHIELD_L), P('M12 8V14M9 11H15')]),
  filled: masked([W(P(SHIELD_L)), K(P('M12 8V14M9 11H15'))]),
}, 'Shield with a plus: health assessment.');

/* Enclosure: picket fence. Each picket is a closed narrow post with a 45° point (reads solid at 24px). */
{
  const PK = (x) => `M${x - 1} 21V8L${x} 7L${x + 1} 8V21Z`;
  const POSTS = PK(5) + PK(12) + PK(19);
  const RAILS = 'M3 11H21M3 16H21';
  def('enclosure', {
    line: line([P(POSTS), P(RAILS)]),
    filled: masked([W(P(POSTS)), WS(P(RAILS))]),
  }, 'Picket fence: three pointed posts and two rails (enclosure / housing).');
}

/* Person search: small person (head r3) with a magnifier bottom-right, person cut 2px around the lens. */
{
  const HEAD = [9, 7, 3];
  const BODY = personBody(9, 14, 6, 3, 21);
  const HANDLE = 'M18 18L21 21';
  def('person_search', {
    line: line([C(16, 16, 3), P(HANDLE)], { cut: [C(16, 16, 6)], behind: [C(...HEAD), P(BODY)] }),
    filled: masked([WF(C(9, 7, 4)), W(P(BODY + 'Z')), KF(C(16, 16, 6)), WF(C(16, 16, 4)), WS(P(HANDLE))]),
  }, 'Person (shared head-and-shoulders base, small) with a magnifier: found by.');
}

/* Search public tags: globe with a magnifier bottom-right. */
{
  const GLOBE = [C(11, 11, 8), P('M3 11H19M11 3A10 10 0 0 1 11 19A10 10 0 0 1 11 3')];
  const HANDLE = 'M18 18L21 21';
  def('travel_explore', {
    line: line([C(16, 16, 3), P(HANDLE)], { cut: [C(16, 16, 6)], behind: GLOBE }),
    filled: masked([WF(C(11, 11, 9)), K(P('M4 11H18M11 3A10 10 0 0 1 11 19A10 10 0 0 1 11 3')), KF(C(16, 16, 6)), WF(C(16, 16, 4)), WS(P(HANDLE))]),
  }, 'Globe with a magnifier: search public tags.');
}

/* Tags: horizontal luggage tag pointing left with a hole; public = globe badge, private = padlock badge. */
{
  const TAG = 'M3 10L8 5H19A2 2 0 0 1 21 7V13A2 2 0 0 1 19 15H8Z';
  const HOLE = C(10, 10, 1);
  const base = (id) => badged(id, [P(TAG), HOLE], [W(P(TAG)), KF(C(10, 10, 2))]);
  def('tag_public', base('globe'), 'Tag with a globe badge: public tag.');
  def('tag_private', base('lock'), 'Tag with a padlock badge: private tag.');
}

/* Moved location: the Eggs pilot location pin, moved left, with an arrow badge. */
{
  const PIN = PIN_L(10, 10);
  def('moved_location', {
    line: line(BADGE.arrow.line, { cut: [C(17, 17, 7)], behind: [P(PIN), C(10, 10, 2)] }),
    filled: masked([W(P(PIN)), KF(C(10, 10, 2)), KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P(BADGE.arrow.knock))]),
  }, 'Location pin (Eggs pilot geometry) with an arrow badge: moved location.');
}

/* Injury: adhesive bandage at 45° with a pad between two lines. */
{
  const BAND = 'M5 13L13 5Q15 3 17 5L19 7Q21 9 19 11L11 19Q9 21 7 19L5 17Q3 15 5 13Z';
  const PAD = 'M7 11L13 17M11 7L17 13';
  def('personal_injury', {
    line: line([P(BAND), P(PAD)]),
    filled: masked([W(P(BAND)), K(P(PAD))]),
  }, 'Adhesive bandage at 45°: injury details.');
}

/* ---------------- Reproduction modes (egg geometry from the Eggs pilot) ---------------- */
{
  const EGG_F = egg(12, 14, 7, 1);
  const EMB = [C(12, 10, 1), P('M11 11A3 3 0 0 0 15 14')]; // embryo: head dot + curled body
  def('repro_oviparous', {
    line: line([P(EGG_L)]),
    filled: wrap(HEAD_F, [`<path d="${EGG_F}"/>`]),
  }, 'Empty egg: lays eggs (same geometry as the base egg).');
  def('repro_ovoviviparous', {
    line: line([P(EGG_L), ...EMB]),
    filled: masked([WF(P(EGG_F)), KF(C(12, 10, 2)), K(P('M11 11A3 3 0 0 0 15 14'))], [4, 2, 20, 22]),
  }, 'Egg with an embryo inside: eggs hatch inside the mother.');
  // fetus = the shared agent's fetal_death base (draft-shared GEO), reused exactly
  const FET = 'M9 9C5 12 6 19 11 20C15 21 19 19 19 15';
  def('repro_viviparous', {
    line: line([C(13, 8, 4), P(FET)]),
    filled: masked([WF(C(13, 8, 5)), WS(P(FET))]),
  }, 'Curled fetus, no shell: live birth (same fetus as fetal_death).');
  const Q = 'M10 11A2 2 0 1 1 12 13M12 17V17';
  def('repro_unknown', {
    line: line([P(EGG_L), P(Q)]),
    filled: masked([WF(P(EGG_F)), K(P(Q))], [4, 2, 20, 22]),
  }, 'Egg with a question mark: reproduction mode unknown.');
}

/* ---------------- Ear tags: hearing-style ear; tag = ring r2 on the rim at high / moderate / low.
   Right = rim bulges right, tag on the right; left = mirrored. Rim cut 2px around the tag. ---------------- */
{
  const mx = (x) => 24 - x;
  const EAR = (m) => m
    ? `M${mx(6)} 9A6 6 0 0 0 ${mx(18)} 9C${mx(18)} 13 ${mx(14)} 14 ${mx(14)} 17A3 3 0 0 0 ${mx(8)} 17`
    : 'M6 9A6 6 0 0 1 18 9C18 13 14 14 14 17A3 3 0 0 1 8 17';
  const IN = 'M10 9A2 2 0 0 1 14 9';
  const POS = { high: [16, 5], moderate: [18, 10], low: [9, 19] };
  for (const [lvl, [x, y]] of Object.entries(POS)) {
    for (const side of ['left', 'right']) {
      const m = side === 'left';
      const tx = m ? mx(x) : x;
      def(`ear_tag_${lvl}_${side}`, {
        line: line([C(tx, y, 2)], { cut: [C(tx, y, 5)], behind: [P(EAR(m)), P(IN)] }),
        filled: masked([WS(P(EAR(m))), WS(P(IN)), KF(C(tx, y, 5)), WF(C(tx, y, 3))]),
      }, `Ear (rim bulging ${side}) with a ring tag ${lvl === 'high' ? 'at the top of the rim' : lvl === 'moderate' ? 'at the middle of the rim' : 'on the lobe'}.`);
    }
  }
}

/* ---------------- Housing and diet ---------------- */
{
  const APPLE = 'M12 11C10 9 5 9 5 15C5 19 8 21 12 21C16 21 19 19 19 15C19 9 14 9 12 11Z';
  const STEM = 'M12 11V6';
  const LEAF = 'M12 6Q12 3 15 3Q15 6 12 6Z';
  def('dietitian', {
    line: line([P(APPLE), P(STEM), P(LEAF)]),
    filled: masked([W(P(APPLE)), WS(P(STEM)), W(P(LEAF))]),
  }, 'Apple with stem and leaf: nutrition / dietitian.');
}
{
  const LOOP = 'M19 13A7 7 0 1 1 12 6';
  const HEADA = 'M10 4L12 6L10 8';
  const LEAF = 'M10 15Q11 11 15 11Q14 15 10 15Z';
  def('compost', {
    line: line([P(LOOP), P(HEADA), P(LEAF)]),
    filled: masked([WS(P(LOOP)), WS(P(HEADA)), W(P(LEAF))]),
  }, 'Leaf inside a circular arrow: food waste turned to compost (wastage count).');
}


const only = process.argv.slice(2);
// Guard: never overwrite an icon another agent has drafted (status != to_design and not written by this script).
const MINE = new URL('./mine.json', import.meta.url);
let mine = new Set();
try { mine = new Set(JSON.parse(readFileSync(MINE, 'utf8'))); } catch { /* first run */ }
const index = JSON.parse(readFileSync(LIB + '/index.json', 'utf8'));
const status = Object.fromEntries(index.icons.map((i) => [i.name, i.status]));
export { icons, META };
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, { line: l, filled: f }] of Object.entries(icons)) {
    if (only.length && !only.includes(name)) continue;
    if (status[name] !== 'to_design' && !mine.has(name)) { console.log('skip (not mine):', name); continue; }
    mine.add(name);
    writeFileSync(`${LIB}/line/${name}.svg`, l);
    writeFileSync(`${LIB}/filled/${name}.svg`, f);
  }
  writeFileSync(new URL('./meta.json', import.meta.url), JSON.stringify(META, null, 1));
  writeFileSync(MINE, JSON.stringify([...mine].sort(), null, 1));
  console.log('wrote', Object.keys(icons).filter((k) => !only.length || only.includes(k)).length);
}
void readFileSync;
