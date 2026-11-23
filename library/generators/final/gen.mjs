// Final pass: priority (dots for inactive), deworming (worm), controlled_substance (tag_private padlock).
//   node gen.mjs <outLibDir> [names...]
import { P, C, R, W, WS, WF, K, KF, masked, line, BADGE, badged, emit } from '../redraw-c/lib.mjs';
const icons = {};
// ✕ badge from parts.ts / redraw-b (not in redraw-c's BADGE table)
BADGE.close = { line: [P('M14 14L20 20M20 14L14 20')], knock: 'M15 15L19 19M19 15L15 19' };
const env = (k, d) => process.env[k] ?? d;

/* Priority: 4 slots, 3px wide, 2px gaps, x 3–21, ink bottoms on y=20, tops 15/11/7/3 (redraw-c).
   ACTIVE = solid 3px bar (1px closed path stroked 2px). INACTIVE = one 2px dot sitting on the baseline:
   a zero-length round-capped stroke centred (x+2, 19), so its ink spans y 18–20, flush with the bar bottoms. */
{
  const BARS = [[3, 15], [8, 11], [13, 7], [18, 3]];
  const DY = +env('DOTY', 19);
  const bar = ([x, t]) => P(`M${x + 1} ${t + 1}H${x + 2}V19H${x + 1}Z`);
  const dot = ([x]) => P(`M${x + 2} ${DY}V${DY}`);
  const fam = (k) => ({
    line: line([...BARS.slice(0, k).map(bar), ...BARS.slice(k).map(dot)]),
    filled: masked([...BARS.slice(0, k).map((b) => W(bar(b))), ...BARS.slice(k).map((b) => WS(dot(b)))], [3, 3, 21, 21]),
  });
  icons.priority_low = fam(1); icons.priority_medium = fam(2); icons.priority_high = fam(3); icons.priority_critical = fam(4);
}

/* Deworming: a worm crawling right along y=8. Body = three tall half-waves (elliptical arcs rx2 ry3 on whole pixels:
   up, down, up) and a shallower r2 neck dipping into the head. Solid head at (20,8) joined to the neck (line: circle r1
   stroked 2 = solid disc r2; filled: disc r2). Plain round tail at (3,8). ✕ badge at (17,17), cut r7. */
{
  const WORM = env('WORM', 'M3 8A2 3 0 0 1 7 8A2 3 0 0 0 11 8A2 3 0 0 1 15 8A2 2 0 0 0 19 8');
  const HEAD = env('HEAD', '20,8').split(',').map(Number);
  icons.deworming = badged('close', [P(WORM), C(HEAD[0], HEAD[1], 1)], [WS(P(WORM)), WF(C(HEAD[0], HEAD[1], 2))]);
}

/* controlled_substance: bottle base (redraw-b) + tag_private's padlock badge (BADGE.lock in redraw-c lib). */
{
  const BOTTLE_L = [R(4, 3, 16, 4, 2), P('M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7')];
  const BOTTLE_F = [WF(R(3, 2, 18, 6, 3)), W(P('M6 7V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V7Z'))];
  // tag_private's padlock ink reaches past r5 (body corners to 5.8, shackle top to y 12), so two extra cuts keep the
  // bottle 2px clear: r5 round the body's lower-left corner centre (15,19) and r6 round the shackle centre (17,15).
  const CUTS = [C(17, 17, 7), C(17, 15, 6), C(15, 19, 5)];
  icons.controlled_substance = {
    line: line(BADGE.lock.line, { cut: CUTS, behind: BOTTLE_L }),
    filled: masked([...BOTTLE_F, ...CUTS.map(KF), ...BADGE.lock.filled], [3, 2, 22, 22]),
  };
}

emit(icons, process.argv[2], process.argv.slice(3));
