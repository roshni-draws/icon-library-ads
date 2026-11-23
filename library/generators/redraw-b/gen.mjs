// Redraw batch B: consistency fixes, checker warnings, weak icons.
//   node gen.mjs            -> writes previews to ./out/{line,filled} and prints checker results
//   node gen.mjs --write    -> also writes library/{line,filled}/<name>.svg
//   node gen.mjs --write a b  -> only these icons
// Helpers follow draft-medical/gen.mjs (Animals / Eggs pilot): line = 2px round strokes on whole pixels;
// filled = ONE mask (white silhouettes = fill + white 2px round stroke, black 2px cuts) painted through a cover rect.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = decodeURIComponent(new URL('../../../', import.meta.url).pathname);
const LIB = BASE + 'library';
const OUT = new URL('./out/', import.meta.url).pathname;
const require = createRequire(BASE + 'app/package.json');
const { build } = require('esbuild');
const ob = await build({ entryPoints: [BASE + 'app/src/lib/checker.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { checkSvg } = await import('data:text/javascript;base64,' + Buffer.from(ob.outputFiles[0].text).toString('base64'));

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
const KW = (e) => ({ e, paint: `fill="black" stroke="black" ${RND}` }); // cut-out shape pushed out 1px

function inkBox(layers) {
  const parts = layers.filter((l) => !l.paint.includes('black')).map((l) => el(l.e, l.paint.includes('stroke="white"') ? '' : ' stroke="none" fill="black"'));
  const { x0, y0, x1, y1 } = checkSvg(wrap(HEAD_L, parts), 'line').ink;
  return [Math.floor(x0 + 1e-6), Math.floor(y0 + 1e-6), Math.ceil(x1 - 1e-6), Math.ceil(y1 - 1e-6)];
}
/** Filled icon: ordered mask layers, painted through a cover rect = the ink bbox. */
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

/* ---- Badges: parts.ts (centre 17,17, ink r5, cut r7). Glyph badges (letters, objects) are solid in filled, no disc. ---- */
const BADGE = {
  add: { line: [P('M17 13V21M13 17H21')], knock: 'M17 14V20M14 17H20' },
  check: { line: [P('M13 17L16 20L21 14')], knock: 'M14 17L16 19L19 16' },
  close: { line: [P('M14 14L20 20M20 14L14 20')], knock: 'M15 15L19 19M19 15L15 19' },
  // letters (file type): centre-line inside r4 so the ink stays inside r5
  letterP: { line: [P('M15 20V14H17A2 2 0 0 1 17 18H15')] },
  letterW: { line: [P('M14 14L15 20L17 17L19 20L20 14')] },
  letterX: { line: [P('M15 14L19 20M19 14L15 20')] },
  // lock: body 6 × 5, shackle r2 (fits r5 ink)
  lock: { line: [R(14, 16, 6, 5, 2), P('M15 16V15A2 2 0 0 1 19 15V16')] },
  // flask: Medical FLASK (neck, 1:2 body taper, rim, liquid) scaled into r5
  flask: { line: [P('M16 14V16L14 20H20L18 16V14')], filled: [W(P('M16 14V16L14 20H20L18 16V14Z'))] },
  // capsule: 10 × 6 outline split in two; filled = solid capsule with a 2px split
  pill: { line: [R(13, 15, 8, 4, 2), P('M17 15V19')], filled: [WF(R(12, 14, 10, 6, 3)), K(P('M17 13V21'))] },
  // repeat: circular arrow r4 (= progress_activity arc) with a chevron head turned inward
  repeat: { line: [P('M17 13A4 4 0 1 1 13 17'), P('M12 14H14V16')], cut: [C(12, 14, 3)] },
};
function badged(id, baseL, baseF) {
  const b = typeof id === 'string' ? BADGE[id] : id;
  const cuts = [C(17, 17, 7), ...(b.cut || [])];
  const l = line(b.line, { cut: cuts, behind: baseL });
  const bf = b.filled ? [...cuts.map(KF), ...b.filled]
    : b.knock ? [KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P(b.knock))]
      : [...cuts.map(KF), ...b.line.map((e) => (e.tag === 'path' && !/Z$/.test(e.a.d) ? WS(e) : W(e)))];
  return { line: l, filled: masked([...baseF, ...bf]) };
}
const simple = (els, layers) => ({ line: line(els), filled: masked(layers) });

/* ======================= Shared bases (reused exactly) ======================= */
// draft-shared GEO
const BUBBLE = 'M5 3H19A2 2 0 0 1 21 5V15A2 2 0 0 1 19 17H7L3 21V5A2 2 0 0 1 5 3Z';
const SHIELD = 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V11C19 16 15.5 19.5 12 21C8.5 19.5 5 16 5 11Z';
const DOC = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z';
const DOC_FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
const DOCL = [P(DOC), P(DOC_FOLD)];
const DOCF = [W(P(DOC)), K(P(DOC_FOLD))]; // = library/filled/document.svg: stroke-pushed, rounded fold corners
// Pharmacy clipboard
const CLIP_L = [P('M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15'), R(9, 3, 6, 4, 2)];
const CLIP_F = [WF(R(4, 4, 16, 18, 3)), WF(R(8, 2, 8, 6, 3)), K(P('M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5'))];
// Calendar
const CAL_L = [R(3, 5, 18, 16, 2), P('M8 3V5M16 3V5M3 9H21')];
const CAL_F = [WF(R(2, 4, 20, 18, 3)), WF(R(7, 2, 2, 4, 1)), WF(R(15, 2, 2, 4, 1)), K(P('M4 9H20'))];
// Medicine bottle
const BOTTLE_L = [R(4, 3, 16, 4, 2), P('M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7')];
const BOTTLE_F = [WF(R(3, 2, 18, 6, 3)), W(P('M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7Z'))];

/* Person (draft-requests): personBody(p, d) d=0 line, 1 filled silhouette, 3 hide region. */
function personBody({ cx, top, hw, cr, bottom, rb = 2 }, d = 0) {
  const L = cx - hw, Rr = cx + hw, c = cr + d, b = rb + d;
  const vR = bottom - rb > top + cr ? `V${bottom - rb}` : '';
  const vL = bottom - rb > top + cr ? `V${top + cr}` : '';
  return `M${L + cr} ${top - d}H${Rr - cr}A${c} ${c} 0 0 1 ${Rr + d} ${top + cr}${vR}A${b} ${b} 0 0 1 ${Rr - rb} ${bottom + d}H${L + rb}A${b} ${b} 0 0 1 ${L - d} ${bottom - rb}${vL}A${c} ${c} 0 0 1 ${L + cr} ${top - d}Z`;
}
const PERSON = { cx: 12, hy: 7, hr: 4, top: 15, hw: 8, cr: 4, bottom: 21 };
if (personBody(PERSON) !== 'M8 15H16A4 4 0 0 1 20 19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19A4 4 0 0 1 8 15Z') throw new Error('person drift');
// SMALL person (draft-requests): head r3, half-width 6, shoulder r4, foot r2, 6 tall; head–body clear 2px.
const SMALL = (cx, hy) => ({ cx, hy, hr: 3, top: hy + 7, hw: 6, cr: 4, bottom: hy + 13 });
const personL = (p) => [C(p.cx, p.hy, p.hr), P(personBody(p))];
const personF = (p) => [WF(C(p.cx, p.hy, p.hr + 1)), WF(P(personBody(p, 1)))];
const personHide = (p) => [C(p.cx, p.hy, p.hr + 3), P(personBody(p, 3))];

const icons = {};
const def = (name, v) => { icons[name] = v; };

/* ---------------- A1. Speech bubble: GEO.BUBBLE everywhere ---------------- */
def('chat_bubble', simple([P(BUBBLE)], [W(P(BUBBLE))]));
{
  const lines = 'M8 8H16M8 12H13';
  def('comment', simple([P(BUBBLE), P(lines)], [W(P(BUBBLE)), K(P(lines))]));
  const dots = 'M8 10V10M12 10V10M16 10V10';
  def('chat', simple([P(BUBBLE), P(dots)], [W(P(BUBBLE)), K(P(dots))]));
  const plus = 'M12 7V13M9 10H15';
  def('add_comment', simple([P(BUBBLE), P(plus)], [W(P(BUBBLE)), K(P(plus))]));
}
{
  // forum: two bubbles of the BUBBLE construction (r2 corners, 45° tail to the bottom-left corner).
  // front = bottom-right, 12 × 8 body; back = the same shape 12 × 10, top-left, hidden 3px round the front.
  const back = 'M5 3H15A2 2 0 0 1 17 5V11A2 2 0 0 1 15 13H7L3 17V5A2 2 0 0 1 5 3Z';
  const front = 'M11 9H19A2 2 0 0 1 21 11V15A2 2 0 0 1 19 17H13L9 21V11A2 2 0 0 1 11 9Z';
  const hide = R(6, 6, 18, 18, 5); // front body pushed out 3
  def('forum', { line: line([P(front)], { cut: [hide], behind: [P(back)] }), filled: masked([W(P(back)), KF(hide), W(P(front))]) });
}

/* ---------------- A2. Shield: GEO.SHIELD + person ---------------- */
{
  // head r2 + shoulders arc r4 that runs into the shield's lower curve (joined, like Material).
  // Filled: person-silhouette cut; the shield's 2px rim is painted back on top so the cut stops at the rim.
  const head = C(12, 9, 2), body = 'M8 19A4 4 0 0 1 16 19';
  def('admin_panel_settings', simple([P(SHIELD), head, P(body)], [W(P(SHIELD)), KF(C(12, 9, 3)), KW(P(body + 'Z')), WS(P(SHIELD))]));
}

/* ---------------- A3. People ---------------- */
{
  // person_search: SMALL person + the standard small magnifier (lens r3, handle to 21,21), lens cut r6
  const p = SMALL(9, 7);
  const lensCut = C(16, 16, 6);
  def('person_search', {
    line: line([C(16, 16, 3), P('M18 18L21 21')], { cut: [lensCut], behind: personL(p) }),
    filled: masked([...personF(p), KF(lensCut), WF(C(16, 16, 4)), WS(P('M18 18L21 21'))]),
  });
}
{
  // people: two SMALL persons (front + back), = draft-requests
  const front = SMALL(9, 8);
  const back = { ...SMALL(15, 6), bottom: 21 };
  def('people', {
    line: line(personL(front), { cut: personHide(front), behind: personL(back) }),
    filled: masked([...personF(back), ...personHide(front).map(KF), ...personF(front)]),
  });
}
{
  // groups: SMALL person in front; the two people behind use the same head (r3) and shoulder (r4) geometry,
  // only their outer half shows.
  const c = SMALL(12, 8);
  // side people: SMALL head (r3) and SMALL body profile (shoulder r4, foot r2, 6 tall); only the outer half is drawn,
  // its open ends sit under the front person's hide region.
  const sideBodyF = (bx) => ({ cx: bx, hy: 6, hr: 3, top: 13, hw: 4, cr: 4, bottom: 19 });
  const L = [C(6, 6, 3), P('M11 13H7A4 4 0 0 0 3 17A2 2 0 0 0 5 19H9'), C(18, 6, 3), P('M13 13H17A4 4 0 0 1 21 17A2 2 0 0 1 19 19H15')];
  const F = [WF(C(6, 6, 4)), WF(P(personBody(sideBodyF(7), 1))), WF(C(18, 6, 4)), WF(P(personBody(sideBodyF(17), 1)))];
  def('groups', {
    line: line(personL(c), { cut: personHide(c), behind: L }),
    filled: masked([...F, ...personHide(c).map(KF), ...personF(c)]),
  });
}

/* ---------------- A4/A5. Document family ---------------- */
def('draft', simple(DOCL, DOCF));
def('note_add', badged('add', DOCL, DOCF));
def('file_pdf', badged('letterP', DOCL, DOCF));
def('file_word', badged('letterW', DOCL, DOCF));
def('file_excel', badged('letterX', DOCL, DOCF));
def('lab_profile', badged('flask', DOCL, DOCF));

/* ---------------- B. Checker warnings ---------------- */
{
  // syringe: barrel closed so the plunger rod touches it (was a 0.83px gap between rod and barrel ends)
  const BARREL = 'M12 8L4 16L8 20L16 12Z', REST = 'M11 7L17 13M14 10L18 6M16 4L20 8M6 18L3 21';
  def('vaccine', simple([P(BARREL), P(REST)], [W(P(BARREL)), WS(P(REST))]));
}
def('controlled_substance', badged('lock', BOTTLE_L, BOTTLE_F));
{
  const HEART = 'M12 17L9 14A2 2 0 0 1 12 12A2 2 0 0 1 15 14Z';
  def('diagnosis', simple([...CLIP_L, P(HEART)], [...CLIP_F, K(P(HEART))]));
}
{
  // horizontal capsule (same capsule as the prescription badge), split in two
  def('pill', simple([R(3, 8, 18, 8, 4), P('M12 8V16')], [WF(R(2, 7, 20, 10, 5)), K(P('M12 6V18'))]));
}

/* ---------------- C. Weak icons ---------------- */
{
  // worm: S-curve body with a round head, + ✕ badge (removed)
  const WORM = 'M16 5C10 5 6 6 6 9S10 12 10 14C10 17 7 19 4 19';
  def('deworming', badged('close', [P(WORM), C(18, 5, 2)], [WS(P(WORM)), WF(C(18, 5, 3))]));
}
def('prescription', badged('pill', [...CLIP_L, P('M9 11H15')], [...CLIP_F, K(P('M9 11H15'))]));
{
  const INF = 'M12 12C9 8 3 8 3 12C3 16 9 16 12 12C15 8 21 8 21 12C21 16 15 16 12 12Z';
  def('chronic', simple([P(INF)], [WS(P(INF))])); // filled = line, like block
}
def('event_repeat', badged('repeat', CAL_L, CAL_F));
{
  const FLAP = 'M5 5L12 12L19 5';
  def('mail', simple([R(3, 5, 18, 14, 2), P(FLAP)], [WF(R(2, 4, 20, 16, 3)), K(P(FLAP))]));
}
{
  // Material call proportions: near-vertical earpiece side, 45° inner corners, symmetric about x + y = 24
  const PH = 'M5 3H8L9 8L7 10A16 16 0 0 0 14 17L16 15L21 16V19A2 2 0 0 1 19 21A16 16 0 0 1 3 5A2 2 0 0 1 5 3Z';
  def('call', simple([P(PH)], [W(P(PH))]));
}
{
  // query_stats: simple rising trend (45° segments, clear of the lens) + magnifier, lens r4
  const TREND = 'M3 13L7 9L9 11L15 5';
  const lensCut = C(16, 16, 7);
  def('query_stats', {
    line: line([C(16, 16, 4), P('M19 19L21 21')], { cut: [lensCut], behind: [P(TREND)] }),
    filled: masked([WS(P(TREND)), KF(lensCut), WF(C(16, 16, 5)), WS(P('M19 19L21 21'))]),
  });
}
{
  const BM = 'M5 5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21L12 17L5 21Z';
  def('bookmark_added', badged('check', [P(BM)], [W(P(BM))]));
}

/* ---------------- write + check ---------------- */
const args = process.argv.slice(2);
const doWrite = args.includes('--write');
const only = args.filter((a) => !a.startsWith('--'));
for (const d of ['line', 'filled']) mkdirSync(OUT + d, { recursive: true });
const names = [];
for (const [name, { line: l, filled: f }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  names.push(name);
  writeFileSync(`${OUT}line/${name}.svg`, l);
  writeFileSync(`${OUT}filled/${name}.svg`, f);
  if (doWrite && !name.includes('__')) { writeFileSync(`${LIB}/line/${name}.svg`, l); writeFileSync(`${LIB}/filled/${name}.svg`, f); }
  for (const [st, svg] of [['line', l], ['filled', f]]) {
    const r = checkSvg(svg, st);
    const bad = r.results.filter((c) => c.level === 'warn' || c.level === 'fail');
    if (bad.length) console.log(`${name} ${st}: ` + bad.map((c) => `${c.level.toUpperCase()} ${c.title}: ${c.message}`).join(' | '));
  }
}
writeFileSync(new URL('./names.txt', import.meta.url), names.join(' '));
console.log((doWrite ? 'wrote ' : 'previewed ') + names.length + ': ' + names.join(' '));
