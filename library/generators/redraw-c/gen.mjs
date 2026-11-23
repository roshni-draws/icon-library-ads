// Redraw round 2 (batch C): priority 4-bar signal, paw for viviparous / fetal_death, tag_public open padlock,
// compost = delete bin + leaf, ear tags on one fixed ear.   node gen.mjs <outLibDir> [names...]
// Helpers in lib.mjs (from redraw-a): filled = ONE mask (white silhouette, black 2px cuts) painted through a cover path.
import { HEAD_L, wrap, P, C, R, W, WS, WF, K, KF, masked, line, capsule, emit } from './lib.mjs';
const icons = {};
const env = (k, d) => process.env[k] ?? d;

/* ---------- 1. Priority: 4 signal bars, 3px wide, 2px gaps, x 3–21, bottoms on y=20, tops 15/11/7/3.
   ACTIVE = solid 3px bar: a closed 1px-wide path (x+1..x+2) stroked 2px with round joins (ink 3px, corners r1,
   all on whole pixels). A rect would need rx>=2 on a 3px shape (corner warn). GHOST = 2px round-capped stroke.
   A 2px stroke cannot be centred on a 3px slot on whole pixels (centre x.5 warns), so it sits 0.5px right of
   centre (ink x+1..x+3, flush with the bar's right edge). Filled = same drawing (bars are already solid). ---------- */
{
  const BARS = [[3, 15], [8, 11], [13, 7], [18, 3]];
  const bar = ([x, t]) => P(`M${x + 1} ${t + 1}H${x + 2}V19H${x + 1}Z`);
  const ghost = ([x, t]) => P(`M${x + 2} ${t + 1}V19`);
  const fam = (k) => ({
    line: line([...BARS.slice(0, k).map(bar), ...BARS.slice(k).map(ghost)]),
    filled: masked([...BARS.slice(0, k).map((b) => W(bar(b))), ...BARS.slice(k).map((b) => WS(ghost(b)))]),
  });
  icons.priority_low = fam(1); icons.priority_medium = fam(2); icons.priority_high = fam(3); icons.priority_critical = fam(4);
}

/* ---------- 2–3. Paw (= library animal). fetal_death = paw + 45° slash (4,4)-(20,20), paw cut 2px either side
   (capsule r3 around the slash), built like egg_infertile. ---------- */
{
  const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
  const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
  const pawL = [P(PAD), ...TOES.map(([x, y]) => C(x, y, 1))];
  const pawF = [W(P(PAD)), ...TOES.map(([x, y]) => WF(C(x, y, 2)))];
  icons.repro_viviparous = { line: line(pawL), filled: masked(pawF, [3, 3, 21, 22]) };
  const SLASH = 'M4 4L20 20';
  icons.fetal_death = {
    // the r3 circles on the slash lie inside the capsule (no visual change); they tell the checker's gap test where the cut is
    line: line([P(SLASH)], { cut: [P(capsule(3)), ...[6, 7, 8, 9].map((v) => C(v, v, 3))], behind: pawL }),
    filled: masked([...pawF, KF(P(capsule(3))), WS(P(SLASH))], [3, 3, 21, 22]),
  };
}

/* ---------- 4. tag_public: tag_private's tag + the same padlock badge (body rect 13,16 8×5 rx2, shackle r2),
   with the shackle lifted 2px and open on the right (right end stops 1px above the body).
   The lifted shackle needs a second cut circle (r5 round the shackle arc centre 17,13) so the tag keeps 2px clear of it. ---------- */
{
  const TAG = 'M3 10L8 5H19A2 2 0 0 1 21 7V13A2 2 0 0 1 19 15H8Z';
  const LIFT = +env('LIFT', 2);
  const SH_L = `M15 16V${15 - LIFT}A2 2 0 0 1 19 ${15 - LIFT}`;
  const SH_F = `M15 15V${15 - LIFT}A2 2 0 0 1 19 ${15 - LIFT}`;
  const XC = env('XC', '17,13,5').split(',').map(Number);
  icons.tag_public = {
    line: line([R(13, 16, 8, 5, 2), P(SH_L)], { cut: [C(17, 17, 7), C(...XC)], behind: [P(TAG), C(10, 10, 1)] }),
    filled: masked([W(P(TAG)), KF(C(10, 10, 2)), KF(C(17, 17, 7)), KF(C(...XC)), WF(R(12, 15, 10, 7, 3)), WS(P(SH_F)), K(P('M17 18V19'))]),
  };
}

/* ---------- 5. Compost: the delete bin (lid, handle, body) with the slots replaced by a leaf + midrib.
   Line: leaf outline stroked, midrib cut through it (mask). Filled: leaf outline + midrib cut 2px out of the body. ---------- */
{
  const LID = 'M4 6H9V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6H20';
  const BODY = 'M6 6V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V6';
  const LEAF = env('LEAF', 'M10 17C10 13 11 11 14 10C14 14 13 16 10 17Z');
  const RIB = env('RIB', 'M10 17L12 14');
  icons.compost = {
    line: env('RIBMODE', 'stroke') === 'stroke' ? line([P(LID), P(BODY), P(LEAF), P(RIB)]) : wrap(HEAD_L, ['<mask id="cut">', '  <rect width="24" height="24" fill="white" stroke="none"/>',
      `  <path d="${RIB}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`, '</mask>',
      `<path d="${LEAF}" mask="url(#cut)"/>`, `<path d="${LID}"/>`, `<path d="${BODY}"/>`]),
    filled: masked([WS(P('M4 6H20')), W(P('M9 6V5A2 2 0 0 1 11 3H13A2 2 0 0 1 15 5V6Z')), W(P(BODY + 'Z')), K(P(LEAF)), K(P(RIB))], [2, 2, 22, 22]),
  };
}

/* ---------- 6. Ear tags: ONE fixed ear outline (front edge up over the helix, down the back, lobe curling in), the same in all six.
   Each tag cut leaves 76–78% of the outline visible.
   Tag = ring r2 (line) / disc r3 (filled) on the rim, rim cut 2px round it (cut r5). Left = exact mirror. ---------- */
{
  const EAR = env('EAR', 'M7 13C5 10 5 3 12 3C16 3 19 6 19 10C19 14 15 14 14 17C13 20 9 20 8 17');
  const mirror = (d) => d.replace(/A(\S+) (\S+) (\S+) (\S+) (\S+) /g, (m, a, b, c, d2, s) => `A${a} ${b} ${c} ${d2} ${1 - +s} `)
    .replace(/([MLHVCAQ])([^MLHVCAQZ]*)/g, (m, cmd, args) => {
      const v = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (cmd === 'V') return m;
      if (cmd === 'H') return 'H' + (24 - v[0]);
      if (cmd === 'A') return `A${v[0]} ${v[1]} ${v[2]} ${v[3]} ${v[4]} ${24 - v[5]} ${v[6]}`;
      return cmd + v.map((x, i) => (i % 2 ? x : 24 - x)).join(' ');
    });
  const POS = JSON.parse(env('POS', '{"high":[17,5],"moderate":[19,12],"low":[11,19]}'));
  for (const [lvl, [x, y]] of Object.entries(POS)) for (const side of ['left', 'right']) {
    const m = side === 'left';
    const tx = m ? 24 - x : x;
    const ear = P(m ? mirror(EAR) : EAR);
    icons[`ear_tag_${lvl}_${side}`] = {
      line: line([C(tx, y, 2)], { cut: [C(tx, y, 5)], behind: [ear] }),
      filled: masked([WS(ear), KF(C(tx, y, 5)), WF(C(tx, y, 3))]),
    };
  }
}

emit(icons, process.argv[2], process.argv.slice(3));
