// Generates the Requests / Notes / Notifications / Chat icons into library/line and library/filled.
// node gen.mjs <libraryDir> [names...]
// Follows the Eggs pilot (generators/eggs/gen.mjs): same headers, same badge parts, one <mask id="cut">.
import { writeFileSync } from 'node:fs';

const LIB = process.argv[2];

const HEAD_L = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;
const P = (d, extra = '') => `<path d="${d}"${extra}/>`;
const box = ([x0, y0, x1, y1], p = 0) => `M${x0 - p} ${y0 - p}H${x1 + p}V${y1 + p}H${x0 - p}Z`;
const KNOCK = ' fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/* ---- Badges: centre (17,17), ink r5, cut r7 (app/src/parts/parts.ts + pilot) ---------------------
 * line:  stroked glyph (inherits the line header)
 * knock: strokes knocked out of the solid r5 disc in the filled style
 * New glyphs (not in parts.ts yet): help (?), progress (open arc), block (no-entry slash), remove (minus).
 */
const BADGE = {
  add: { line: 'M17 13V21M13 17H21', knock: 'M17 14V20M14 17H20' },
  check: { line: 'M13 17L16 20L21 14', knock: 'M14 17L16 19L19 16' },
  close: { line: 'M14 14L20 20M20 14L14 20', knock: 'M15 15L19 19M19 15L15 19' },
  clock: { line: ['<circle cx="17" cy="17" r="4"/>', P('M17 15V17L18 18')], knock: 'M17 14V17L19 18' },
  alert: { line: 'M17 13V17M17 21V21', knock: 'M17 14V17M17 20V20' },
  help: { line: 'M15 15A2 2 0 1 1 17 17M17 21V21', knock: 'M15.5 15.5A1.5 1.5 0 1 1 17 17M17 19.5V19.5', kw: 1.5 },
  progress: { line: 'M17 13A4 4 0 1 1 13 17', knock: 'M17 15A2 2 0 1 1 15 17' },
  block: { line: ['<circle cx="17" cy="17" r="4"/>', P('M15 15L19 19')], knock: 'M15 15L19 19' },
  remove: { line: 'M13 17H21', knock: 'M14 17H20' },
  // dot (parts.ts): centre (18,18), ink r3, cut r5; filled = solid r3 disc, nothing knocked out
  dot: { c: 18, cut: 5, disc: 3, line: ['<circle cx="18" cy="18" r="2"/>'], knock: '' },
};
const bc = (id) => BADGE[id].c ?? 17;
const bcut = (id) => BADGE[id].cut ?? 7;
const bdisc = (id) => BADGE[id].disc ?? 5;
const badgeLine = (id) => {
  const l = BADGE[id].line;
  return Array.isArray(l) ? l : [P(l)];
};

/**
 * line({ back, front, badge, hide })
 *   back:  elements cut by the mask (badge cut-out r7, and `hide` shapes = an object in front, offset by 3)
 *   front: elements drawn as is
 */
function line({ back = [], front = [], badge = null, hide = [] }) {
  const body = [];
  const masked = badge || hide.length;
  if (masked) {
    body.push('<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>');
    for (const h of hide) body.push(`  ${h.replace('/>', ' fill="black" stroke="none"/>')}`);
    if (badge) body.push(`  <circle cx="${bc(badge)}" cy="${bc(badge)}" r="${bcut(badge)}" fill="black" stroke="none"/>`);
    body.push('</mask>');
    if (back.length === 1) body.push(back[0].replace('/>', ' mask="url(#cut)"/>'));
    else body.push('<g mask="url(#cut)">', ...back.map((e) => '  ' + e), '</g>');
  } else body.push(...back);
  body.push(...front);
  if (badge) body.push(...badgeLine(badge));
  return wrap(HEAD_L, body);
}

/**
 * filled({ sil, cuts, holes, badge, hide, front })
 *   sil:   solid silhouette elements (cut by the mask)
 *   cuts:  centre lines knocked out at 2px (round)
 *   holes: black shapes knocked out
 *   hide:  black shapes (an object in front, offset by 3) that cut `sil` but not `front`
 *   front: solid elements drawn unmasked
 */
function filled({ sil = [], cuts = [], holes = [], badge = null, hide = [], front = [], solid = [], rim = [] }) {
  const body = [];
  if (!cuts.length && !holes.length && !badge && !hide.length && !solid.length) return wrap(HEAD_F, [...sil, ...front]);
  body.push('<mask id="cut">', '  <rect width="24" height="24" fill="white"/>');
  // solid: 45° strokes made solid exactly = the line centre line pushed out 1px (white fill + white 2px round stroke),
  // drawn through an integer cover (its ink box) so the drawn geometry stays on whole pixels.
  // the black cover is 1px larger than the drawn cover so its anti-aliased edge never shows.
  for (const s of solid) body.push(`  ${P(box(s.cover, 1), ' fill="black"')}`);
  for (const s of solid) body.push(`  ${P(s.d, ` fill="${s.fill ? 'white' : 'none'}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`)}`);
  for (const h of [...holes, ...hide]) body.push(`  ${h.replace('/>', ' fill="black"/>')}`);
  for (const c of cuts) body.push(`  ${P(c, KNOCK)}`);
  // rim: restore a 2px outer rim (white 2px stroke on the line centre line) where a hole runs into the edge
  for (const r of rim) body.push(`  ${P(r, KNOCK.replace(/black/, 'white'))}`);
  if (badge) {
    const c = bc(badge);
    body.push(`  <circle cx="${c}" cy="${c}" r="${bcut(badge)}" fill="black"/>`, `  <circle cx="${c}" cy="${c}" r="${bdisc(badge)}" fill="white"/>`);
    if (BADGE[badge].knock) body.push(`  ${P(BADGE[badge].knock, BADGE[badge].kw ? KNOCK.replace('width="2"', `width="${BADGE[badge].kw}"`) : KNOCK)}`);
  }
  body.push('</mask>');
  const inMask = [...sil, ...solid.map((x) => P(box(x.cover))), ...(badge ? [`<circle cx="${bc(badge)}" cy="${bc(badge)}" r="${bdisc(badge)}"/>`] : [])];
  if (inMask.length === 1) body.push(inMask[0].replace('/>', ' mask="url(#cut)"/>'));
  else body.push('<g mask="url(#cut)">', ...inMask.map((e) => '  ' + e), '</g>');
  body.push(...front);
  return wrap(HEAD_F, body);
}

/* =====================================================================================
 * COMMON BASES (saved here for reuse by other modules)
 * ===================================================================================== */

/* Person (head and shoulders): the SAME geometry as library/line/person.svg (drawn by another module):
 *   head circle (12,7) r4, body "M8 15H16A4 4 0 0 1 20 19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19A4 4 0 0 1 8 15Z".
 * Generalised: person { cx, hy, hr, top, hw, cr, bottom, rb=2 } with top = hy + hr + 4 (2px clear under the head).
 *   PERSON = { cx 12, hy 7, hr 4, top 15, hw 8, cr 4, bottom 21 } reproduces person.svg exactly.
 *   SMALL(cx, hy) = head r3, half-width 6, same body profile (shoulder r4, foot r2, 6 tall) for 2–3 people in one icon.
 * d = 0 line centre line, d = 1 filled silhouette, d = 3 "hide" region for a person standing in front. */
function personHead(cx, cy, r, d = 0) { return `<circle cx="${cx}" cy="${cy}" r="${r + d}"/>`; }
function personBody({ cx, top, hw, cr, bottom, rb = 2 }, d = 0) {
  const L = cx - hw, R = cx + hw, c = cr + d, b = rb + d;
  const vR = bottom - rb > top + cr ? `V${bottom - rb}` : '';
  const vL = bottom - rb > top + cr ? `V${top + cr}` : '';
  return `M${L + cr} ${top - d}H${R - cr}A${c} ${c} 0 0 1 ${R + d} ${top + cr}${vR}A${b} ${b} 0 0 1 ${R - rb} ${bottom + d}H${L + rb}A${b} ${b} 0 0 1 ${L - d} ${bottom - rb}${vL}A${c} ${c} 0 0 1 ${L + cr} ${top - d}Z`;
}
const PERSON = { cx: 12, hy: 7, hr: 4, top: 15, hw: 8, cr: 4, bottom: 21 };
const SMALL = (cx, hy) => ({ cx, hy, hr: 3, top: hy + 7, hw: 6, cr: 4, bottom: hy + 13 });
const personL = (p) => [personHead(p.cx, p.hy, p.hr), P(personBody(p))];
const personF = (p) => [personHead(p.cx, p.hy, p.hr, 1), P(personBody(p, 1))];
const personHide = (p) => [personHead(p.cx, p.hy, p.hr, 3), P(personBody(p, 3))];
if (personBody(PERSON) !== 'M8 15H16A4 4 0 0 1 20 19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19A4 4 0 0 1 8 15Z') throw new Error('person drift ' + personBody(PERSON));

/* Clipboard = the "request" base. Board 14 × 16 (x 5–19, y 5–21, r2) with a pill clip (x 9–15, y 3–7). */
const CLIP_L = 'M9 5H7A2 2 0 0 0 5 7V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V7A2 2 0 0 0 17 5H15';
const CLIP_TAB_L = '<rect x="9" y="3" width="6" height="4" rx="2"/>';
// Filled clipboard = board + clip silhouettes; the clip's lower edge is knocked out (same as pending_actions / assignment_add).
const CLIP_F = ['<rect x="4" y="4" width="16" height="18" rx="3"/>', '<rect x="8" y="2" width="8" height="6" rx="3"/>'];
const CLIP_SLOT = 'M9 5A2 2 0 0 0 11 7H13A2 2 0 0 0 15 5';

/* Speech bubble (chat base). Rounded rect 16 × 14 (x 4–20, y 3–17, r2) with a 45° tail to (4,20). */
const BUBBLE_L = 'M4 20V5A2 2 0 0 1 6 3H18A2 2 0 0 1 20 5V15A2 2 0 0 1 18 17H7Z';
const BUBBLE_F = 'M3 20V5A3 3 0 0 1 6 2H18A3 3 0 0 1 21 5V15A3 3 0 0 1 18 18H7L4 21A1 1 0 0 1 3 20Z';

/* Stacked sheets (copy / gallery): front rect x8 y7 12 × 14, back sheet an L 2px clear. */
const STACK_FRONT_L = '<rect x="8" y="7" width="12" height="14" rx="2"/>';
const STACK_BACK_L = 'M4 17V5A2 2 0 0 1 6 3H16';
const STACK_FRONT_F = '<rect x="7" y="6" width="14" height="16" rx="3"/>';
const STACK_BACK_F = 'M3 17V5A3 3 0 0 1 6 2H16A1 1 0 0 1 16 4H6A1 1 0 0 0 5 5V17A1 1 0 0 1 3 17Z';

/* Flag: pole x5 (y 4–21) and a swallowtail pennant to x19, notch at (15,8). */
const FLAG_L = 'M5 21V4H19L15 8L19 12H5';

/* Capsule outline helpers for solid versions of 2px strokes (axis-aligned only → whole pixels). */
const hBar = (x0, x1, y) => `<rect x="${x0 - 1}" y="${y - 1}" width="${x1 - x0 + 2}" height="2" rx="1"/>`;
const vBar = (x, y0, y1) => `<rect x="${x - 1}" y="${y0 - 1}" width="2" height="${y1 - y0 + 2}" rx="1"/>`;

/* =====================================================================================
 * ICONS
 * ===================================================================================== */
const icons = {};
const meta = {};
const def = (name, l, f, m) => { icons[name] = { line: l, filled: f }; meta[name] = m; };

/* ---- Request statuses: clipboard + state badge ---- */
const requestStatus = (name, badge, m) => def(name,
  line({ back: [P(CLIP_L), CLIP_TAB_L], badge }),
  filled({ sil: CLIP_F, cuts: [CLIP_SLOT], badge }),
  m);
requestStatus('pending', 'clock', 'Request clipboard + clock badge (awaiting). Use with the Caution role.');
requestStatus('contact_support', 'help', 'Request clipboard + question-mark badge (clarification needed).');
requestStatus('task_alt', 'check', 'Request clipboard + check badge (completed).');
requestStatus('delete_forever', 'close', 'Request clipboard + close badge (deleted).');
requestStatus('progress_activity', 'progress', 'Request clipboard + open-arc spinner badge (in progress).');
requestStatus('do_not_disturb_on', 'block', 'Request clipboard + no-entry badge (rejected).');

/* ---- Assigned to: clipboard with a person standing on its bottom edge ---- */
{
  const head = '<circle cx="12" cy="11" r="2"/>';
  const body = 'M8 21V19A2 2 0 0 1 10 17H14A2 2 0 0 1 16 19V21';
  def('assignment_ind',
    line({ back: [P(CLIP_L), CLIP_TAB_L, head, P(body)] }),
    filled({ sil: CLIP_F, cuts: [CLIP_SLOT], holes: ['<circle cx="12" cy="11" r="3"/>', P('M7 20V19A3 3 0 0 1 10 16H14A3 3 0 0 1 17 19V20Z')] }),
    'Request clipboard with a person on it: the request is assigned to someone.');
}

/* ---- Copy: two stacked sheets ---- */
def('content_copy',
  line({ back: [P(STACK_BACK_L), STACK_FRONT_L] }),
  filled({ sil: [P(STACK_BACK_F), STACK_FRONT_F] }),
  'Two stacked sheets: the front sheet copied from the one behind.');

/* ---- Gallery: stacked sheets, the front one is a photo (mountain + sun) ---- */
{
  const mount = 'M8 21L13 16L18 21';
  const sun = 'M16 11V11';
  def('gallery',
    line({ back: [P(STACK_BACK_L), STACK_FRONT_L, P(mount), P(sun)] }),
    filled({ sil: [P(STACK_BACK_F), STACK_FRONT_F], cuts: [sun, 'M11 19L14 16L17 19Z'], holes: [P('M11 19L14 16L17 19Z')] }),
    'Stacked photos (the copy stack with a mountain and sun on the front sheet).');
}

/* ---- Emergency announcement: rounded diamond with an exclamation mark ---- */
{
  const D_L = 'M10 4Q12 2 14 4L20 10Q22 12 20 14L14 20Q12 22 10 20L4 14Q2 12 4 10Z';
  const bang = 'M12 8V12M12 16V16';
  def('emergency_announcement',
    line({ back: [P(D_L), P(bang)] }),
    filled({ solid: [{ d: D_L, fill: true, cover: [2, 2, 22, 22] }], cuts: [bang] }),
    'Rounded warning diamond with an exclamation mark (emergency).');
}

/* ---- Priority flag ---- */
def('priority_flag',
  line({ back: [P(FLAG_L)] }),
  filled({ solid: [{ d: FLAG_L + 'Z', fill: true, cover: [4, 3, 20, 22] }] }),
  'Swallowtail flag on a pole. Level is shown by line/filled + colour role (see notes).');

/* ---- People (two persons) and Groups (three persons) ---- */
{
  const front = SMALL(9, 8);
  const back = { ...SMALL(15, 6), bottom: 21 };
  def('people',
    line({ back: personL(back), front: personL(front), hide: personHide(front) }),
    filled({ sil: personF(back), hide: personHide(front), front: personF(front) }),
    'Two people, one standing slightly behind the other (team).');
}
{
  const c = SMALL(12, 8);
  const l = { cx: 5, hy: 8, hr: 2, top: 14, hw: 2, cr: 2, bottom: 19 };
  const r = { cx: 19, hy: 8, hr: 2, top: 14, hw: 2, cr: 2, bottom: 19 };
  def('groups',
    line({ back: [...personL(l), ...personL(r)], front: personL(c), hide: personHide(c) }),
    filled({ sil: [...personF(l), ...personF(r)], hide: personHide(c), front: personF(c) }),
    'Three people: one in front, two behind (a group).');
}

/* ---- Timeline end point: line ending in a square ---- */
def('line_end_square',
  line({ back: [P('M3 12H13'), '<rect x="13" y="8" width="8" height="8" rx="2"/>'] }),
  filled({ sil: [hBar(3, 13, 12), '<rect x="12" y="7" width="10" height="10" rx="3"/>'] }),
  'A line that ends in a square (timeline end point).');

/* ---- Start point: bar + arrow ---- */
{
  const arrow = 'M9 12H20M16 8L20 12L16 16';
  def('start',
    line({ back: [P('M4 6V18'), P(arrow)] }),
    filled({ sil: [vBar(4, 6, 18)], solid: [{ d: arrow, cover: [8, 7, 21, 17] }] }),
    'A start bar with an arrow leaving it.');
}

/* ---- Today: the shared calendar (library/line/calendar.svg geometry) with today's day marked ---- */
{
  const CAL_L = '<rect x="3" y="5" width="18" height="16" rx="2"/>';
  const rings = 'M8 3V5M16 3V5M3 9H21';
  const day = 'M8 15H9V16H8Z';
  def('today',
    line({ back: [CAL_L, P(rings), P(day)] }),
    filled({ sil: ['<rect x="2" y="4" width="20" height="18" rx="3"/>', '<rect x="7" y="2" width="2" height="4" rx="1"/>', '<rect x="15" y="2" width="2" height="4" rx="1"/>'], cuts: ['M4 9H20', day] }),
    'The shared calendar with one day block marked (today).');
}

/* ---- Full screen: four corner brackets ---- */
{
  const FS_L = 'M4 9V6A2 2 0 0 1 6 4H9M15 4H18A2 2 0 0 1 20 6V9M20 15V18A2 2 0 0 1 18 20H15M9 20H6A2 2 0 0 1 4 18V15';
  const corner = (x, y, sx, sy) => {
    // outline of an L-bracket stroke whose corner sits at (x,y), arms of length 5 pointing (sx,sy)
    const X = (v) => x + sx * v, Y = (v) => y + sy * v;
    const sw = sx * sy > 0 ? 1 : 0;
    return `M${X(-1)} ${Y(5)}V${Y(2)}A3 3 0 0 ${sw} ${X(2)} ${Y(-1)}H${X(5)}A1 1 0 0 ${sw} ${X(5)} ${Y(1)}H${X(2)}A1 1 0 0 ${1 - sw} ${X(1)} ${Y(2)}V${Y(5)}A1 1 0 0 ${sw} ${X(-1)} ${Y(5)}Z`;
  };
  def('fullscreen',
    line({ back: [P(FS_L)] }),
    filled({ sil: [P(corner(4, 4, 1, 1) + corner(20, 4, -1, 1) + corner(20, 20, -1, -1) + corner(4, 20, 1, -1))] }),
    'Four corner brackets pushed out to the edges.');
}

/* ---- Helpdesk: head with a headset (band, ear cups, microphone) ---- */
{
  const band = 'M4 12A8 8 0 0 1 20 12';
  const mic = 'M20 16V18A2 2 0 0 1 18 20H14';
  const cups = ['<rect x="3" y="12" width="2" height="4" rx="1"/>', '<rect x="19" y="12" width="2" height="4" rx="1"/>'];
  def('support_agent',
    line({ back: ['<circle cx="12" cy="12" r="3"/>', P(band + mic), ...cups] }),
    filled({ sil: ['<circle cx="12" cy="12" r="4"/>', P('M3 12A9 9 0 0 1 21 12H19A7 7 0 0 0 5 12Z'), P('M19 16V18A1 1 0 0 1 18 19H14A1 1 0 0 0 14 21H18A3 3 0 0 0 21 18V16Z'),
      '<rect x="2" y="11" width="4" height="6" rx="2"/>', '<rect x="18" y="11" width="4" height="6" rx="2"/>'] }),
    'A head wearing a headset with a microphone (helpdesk agent).');
}

/* ---- Video: camera body with a lens hood ---- */
{
  def('videocam',
    line({ back: ['<rect x="4" y="6" width="13" height="12" rx="2"/>', P('M17 11L20 8V16L17 13')] }),
    filled({ solid: [{ d: 'M17 11L20 8V16L17 13Z', fill: true, cover: [16, 7, 21, 17] }], front: ['<rect x="3" y="5" width="15" height="14" rx="3"/>'] }),
    'Video camera: a body with a lens hood.');
}

/* ---- Announcement: megaphone with sound lines ---- */
{
  const horn = 'M8 8H5A2 2 0 0 0 3 10V14A2 2 0 0 0 5 16H8L13 21V3Z';
  const handle = 'M6 16V20';
  const waves = 'M17 12H21M17 8L19 6M17 16L19 18';
  def('announcement',
    line({ back: [P(horn + handle.replace('M', 'M')), P(waves)] }),
    filled({ solid: [{ d: horn + handle, fill: true, cover: [2, 2, 14, 22] }, { d: waves, cover: [16, 5, 22, 19] }] }),
    'Megaphone with sound lines (announcement).');
}

/* ---- Chat family: one bubble ---- */
def('chat_bubble',
  line({ back: [P(BUBBLE_L)] }),
  filled({ sil: [P(BUBBLE_F)] }),
  'Empty speech bubble (reply).');
def('comment',
  line({ back: [P(BUBBLE_L), P('M8 8H16M8 12H13')] }),
  filled({ sil: [P(BUBBLE_F)], cuts: ['M8 8H16M8 12H13'] }),
  'Speech bubble with two lines of text (a written comment).');
def('chat',
  line({ back: [P(BUBBLE_L), P('M8 10V10M12 10V10M16 10V10')] }),
  filled({ sil: [P(BUBBLE_F)], cuts: ['M8 10V10M12 10V10M16 10V10'] }),
  'Speech bubble with three dots (a conversation).');
def('add_comment',
  line({ back: [P(BUBBLE_L), P('M12 7V13M9 10H15')] }),
  filled({ sil: [P(BUBBLE_F)], cuts: ['M12 7V13M9 10H15'] }),
  'Speech bubble with a plus (start a new chat).');

/* ---- User / profile: person in a circle ---- */
{
  const shoulders = 'M7 19A8 8 0 0 1 17 19';
  def('user',
    line({ back: ['<circle cx="12" cy="12" r="9"/>', '<circle cx="12" cy="10" r="3"/>', P(shoulders)] }),
    filled({ sil: ['<circle cx="12" cy="12" r="10"/>'], cuts: [shoulders, 'M12 7A3 3 0 1 0 12 13A3 3 0 1 0 12 7Z'] }),
    'Person (head and shoulders) inside a circle: the user\'s profile.');
}

/* ---- Remove member: person + minus ---- */
{
  const p = { cx: 9, hy: 7, hr: 4, top: 15, hw: 6, cr: 4, bottom: 21 };
  def('person_remove',
    line({ back: [...personL(p), P('M17 10H21')] }),
    filled({ sil: [...personF(p), hBar(17, 21, 10)] }),
    'A person with a minus beside them (remove member).');
}

/* ---- Filter applied: the shared filter funnel (library/line/filter.svg) + dot badge ---- */
{
  const FUNNEL = 'M3 4H21L14 11V18A2 2 0 0 1 10 18V11Z';
  def('filter_applied',
    line({ back: [P(FUNNEL)], badge: 'dot' }),
    filled({ solid: [{ d: FUNNEL, fill: true, cover: [2, 3, 22, 21] }], badge: 'dot' }),
    'The shared filter funnel with a dot badge: a filter is applied.');
}

/* ---- Necropsy: microscope (reference biotech) ---- */
{
  const stand = 'M11 9H14A5 5 0 0 1 14 19V21M5 21H19M6 17H10';
  def('necropsy',
    line({ back: ['<rect x="7" y="3" width="4" height="10" rx="2"/>', P(stand)] }),
    filled({ solid: [{ d: stand, cover: [4, 8, 21, 22] }], front: ['<rect x="6" y="2" width="6" height="12" rx="3"/>'] }),
    'Microscope (examination): the necropsy notification glyph.');
}

/* ---- Quotation: two quotation marks (as the old app icon) ---- */
{
  const head = (x) => `M${x + 5} 12V9A2 2 0 0 0 ${x + 3} 7H${x + 2}A2 2 0 0 0 ${x} 9V10A2 2 0 0 0 ${x + 2} 12Z`;
  const tail = (x) => `M${x + 5} 12V13A5 5 0 0 1 ${x + 2} 18`;
  def('request_quote',
    line({ back: [P(head(5) + tail(5)), P(head(14) + tail(14))] }),
    filled({ solid: [{ d: head(5) + head(14), fill: true, cover: [4, 6, 20, 13] }, { d: tail(5) + tail(14), cover: [4, 11, 20, 19] }] }),
    'Two quotation marks (a quote), matching the old app icon.');
}

/* Shield (new base): 16 × 20 portrait, x 4–20, y 2–22. */
const SHIELD_L = 'M12 3L18 5A2 2 0 0 1 19 7V11C19 16 16 19 12 21C8 19 5 16 5 11V7A2 2 0 0 1 6 5Z';

/* ---- Group admin: person inside a shield ---- */
{
  const body = 'M8 19V18A2 2 0 0 1 10 16H14A2 2 0 0 1 16 18V19';
  def('admin_panel_settings',
    line({ back: [P(SHIELD_L), '<circle cx="12" cy="10" r="2"/>', P(body)] }),
    filled({ solid: [{ d: SHIELD_L, fill: true, cover: [4, 2, 20, 22] }], holes: ['<circle cx="12" cy="10" r="3"/>', P('M7 23V18A3 3 0 0 1 10 15H14A3 3 0 0 1 17 18V23Z')], rim: [SHIELD_L] }),
    'A person inside a shield: the group admin (protected role).');
}

const only = process.argv.slice(3);
for (const [name, { line: l, filled: f }] of Object.entries(icons)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(`${LIB}/line/${name}.svg`, l);
  writeFileSync(`${LIB}/filled/${name}.svg`, f);
}
writeFileSync(new URL('./meta.json', import.meta.url), JSON.stringify(meta, null, 2));
console.log('wrote', Object.keys(icons).filter((k) => !only.length || only.includes(k)).length);
