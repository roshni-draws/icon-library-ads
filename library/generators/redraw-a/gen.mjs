// Redraw batch A: priority bars, necropsy scalpel, fetus, carcass vans, transfer, request_quote (₹),
// ear tags, tag_public globe, travel_explore, compost.   node gen.mjs <outLibDir> [names...]
// Helpers in lib.mjs are copied from draft-animals/gen.mjs (filled = ONE mask: white silhouette = fill + white
// 2px round stroke, black 2px cuts, painted through a cover path). Badges = parts.ts (17,17) ink r5, cut r7.
import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const icons = {};

/* ---------- 1. Priority: signal-style level bars, bottom-aligned on y=20, landscape keyline ----------
   Slots x 4–8 / 10–14 / 16–20, ink tops 14 / 9 / 4. ACTIVE bar = solid 4px bar (line: rect w2 rx1 stroked;
   filled: rect w4 rx2). UNUSED bar = a plain 2px stroke in the same slot (a hollow outline would need 6px-wide
   bars, and 3×6 + 2×2 = 22px does not fit the 20px live area). Filled keeps the same unused strokes. */
{
  const BARS = [[4, 14], [10, 9], [16, 4]];
  const barL = ([x, t]) => R(x + 1, t + 1, 2, 19 - t - 1, 1);
  const barF = ([x, t]) => WF(R(x, t, 4, 20 - t, 2));
  const ghost = ([x, t]) => P(`M${x + 2} ${t + 1}V19`);
  const fam = (k) => ({
    line: line([...BARS.slice(0, k).map(barL), ...BARS.slice(k).map(ghost)]),
    filled: masked([...BARS.slice(0, k).map(barF), ...BARS.slice(k).map((b) => WS(ghost(b)))], [2, 2, 22, 22]),
  });
  icons.priority_low = fam(1);
  icons.priority_medium = fam(2);
  icons.priority_high = fam(3);
  // critical: three bars + alert badge. 4px bars cannot clear the r7 badge cut-out (any bar ink right of x≈10.7
  // on y=20 is cut), so the bars are 2px strokes at x 4 / 8 / 12; the tallest one passes behind the badge.
  const TB = [[4, 15], [8, 10], [12, 5]];
  const tb = ([x, t]) => P(`M${x} ${t}V19`);
  icons.priority_critical = badged('alert', TB.map(tb), TB.map((b) => WS(tb(b))), { box: [2, 2, 22, 22] });
}

/* ---------- 2. Necropsy: scalpel at 45°: 2px handle (bottom-left) joined to a curved blade (top-right) ---------- */
{
  const BLADE = 'M10 14L19 5Q20 12 12 16Z'; // straight back edge on x+y=24, curved belly, base (10,14)-(12,16)
  const HANDLE = 'M5 21L11 15'; // ends on the blade base
  icons.necropsy = { line: line([P(BLADE), P(HANDLE)]), filled: masked([W(P(BLADE)), WS(P(HANDLE))]) };
}

/* ---------- 3. Fetus: one silhouette. Big round head (r5 round 14,8), the spine runs on from the back of the head
   down the left, rump at the bottom, knees tucked up under the chin (notch). A crease from the notch marks the
   curled leg. fetal_death = the same fetus + 45° slash, base cut 2px either side (built like egg_infertile). ---------- */
{
  const BODY = process.env.FB || 'M17 12A5 5 0 1 0 9 8C8 11 5 13 5 16C5 20 9 21 12 21C16 21 19 19 19 16C19 14 17 13 15 14Z';
  const CREASE = process.env.CR || 'M15 14Q12 15 11 13';
  const BX = [2, 2, 22, 22];
  const fetusL = [P(BODY), P(CREASE)];
  const fetusF = [W(P(BODY)), K(P(CREASE))];
  icons.repro_viviparous = { line: line(fetusL), filled: masked(fetusF, BX) };
  const SLASH = 'M4 4L20 20';
  icons.fetal_death = {
    line: line([P(SLASH)], { cut: [P(capsule(3))], behind: fetusL }),
    filled: masked([...fetusF, KF(P(capsule(3))), WS(P(SLASH))], BX),
  };
}

/* ---------- 4. Carcass vans (draft-pharm-lab van, no glyph on the box) ---------- */
{
  const BODY = 'M6 19H5A2 2 0 0 1 3 17V5A2 2 0 0 1 5 3H13A2 2 0 0 1 15 5V9H18A3 3 0 0 1 21 12V17A2 2 0 0 1 19 19';
  const MID = 'M10 19H15';
  const BODY_F = 'M5 20A3 3 0 0 1 2 17V5A3 3 0 0 1 5 2H13A3 3 0 0 1 16 5V8H18A4 4 0 0 1 22 12V17A3 3 0 0 1 19 20Z';
  const vanL = [P(BODY), P(MID), C(8, 19, 2), C(17, 19, 2)];
  const vanF = [WF(P(BODY_F)), KF(C(8, 19, 5)), KF(C(17, 19, 5)), WF(C(8, 19, 3)), WF(C(17, 19, 3))];
  icons.carcass_pickup = { line: line(vanL), filled: masked(vanF, [2, 2, 22, 22]) };
  icons.carcass_transfer = badged('arrow', vanL, vanF, { box: [2, 2, 22, 22] });
}

/* ---------- 5. Transfer: two parallel arrows, both pointing right, stacked and offset ---------- */
{
  const T = 'M3 8H15M12 5L15 8L12 11M9 16H21M18 13L21 16L18 19';
  icons.transfer = { line: line([P(T)]), filled: masked([WS(P(T))]) };
}

/* ---------- 6. Quotation: shared DOCUMENT base (GEO) with ₹ in the page body ---------- */
{
  const DOC = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z';
  const FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
  // two horizontals (top bar + bowl bottom), a vertical bar and a 45° leg that lands on the page edge (joined)
  const RUPEE = 'M9 13H15M13 13V17H9L13 21';
  icons.request_quote = { line: line([P(DOC), P(FOLD), P(RUPEE)]), filled: masked([W(P(DOC)), K(P(FOLD)), K(P(RUPEE))]) };
}

/* ---------- 7. Ear tags: one clean open ear outline (no inner arc) + a ring tag (line) / solid disc r3 (filled),
   rim cut 2px around the tag. Tag at the top / middle / lobe of the rim. Left = exact mirror of right. ---------- */
{
  const mx = (x) => 24 - x;
  // right ear: rim arc r6 round (12,11), back of the ear down to the lobe (arc r3 round 11,18)
  const EAR_R = 'M6 11A6 6 0 0 1 18 11C18 15 14 16 14 18A3 3 0 0 1 8 18';
  const EAR_Lf = `M${mx(6)} 11A6 6 0 0 0 ${mx(18)} 11C${mx(18)} 15 ${mx(14)} 16 ${mx(14)} 18A3 3 0 0 0 ${mx(8)} 18`;
  const POS = { high: [15, 6], moderate: [18, 12], low: [8, 18] };
  for (const [lvl, [x, y]] of Object.entries(POS)) {
    for (const side of ['left', 'right']) {
      const m = side === 'left';
      const tx = m ? mx(x) : x;
      const ear = P(m ? EAR_Lf : EAR_R);
      icons[`ear_tag_${lvl}_${side}`] = {
        line: line([C(tx, y, 2)], { cut: [C(tx, y, 5)], behind: [ear] }),
        filled: masked([WS(ear), KF(C(tx, y, 5)), WF(C(tx, y, 3))]),
      };
    }
  }
}

/* ---------- 8. Tags: tag_public (simple globe badge), tag_private (padlock badge) ---------- */
{
  const TAG = 'M3 10L8 5H19A2 2 0 0 1 21 7V13A2 2 0 0 1 19 15H8Z';
  const b = (id) => badged(id, [P(TAG), C(10, 10, 1)], [W(P(TAG)), KF(C(10, 10, 2))]);
  icons.tag_private = b('lock');
  // simpler globe badge: ring r4 + one vertical meridian; filled = solid disc r5 with the meridian cut (same weight as the padlock)
  icons.tag_public = {
    line: line([C(17, 17, 4), P('M17 13V21')], { cut: [C(17, 17, 7)], behind: [P(TAG), C(10, 10, 1)] }),
    filled: masked([W(P(TAG)), KF(C(10, 10, 2)), KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P('M17 14V20'))]),
  };
}

/* ---------- 9. travel_explore: globe + magnifier; filled cuts only the equator ---------- */
{
  const GLOBE = [C(11, 11, 8), P('M3 11H19M11 3A10 10 0 0 1 11 19A10 10 0 0 1 11 3')];
  const HANDLE = 'M18 18L21 21';
  icons.travel_explore = {
    line: line([C(16, 16, 3), P(HANDLE)], { cut: [C(16, 16, 6)], behind: GLOBE }),
    filled: masked([WF(C(11, 11, 9)), K(P('M4 11H18')), KF(C(16, 16, 6)), WF(C(16, 16, 4)), WS(P(HANDLE))]),
  };
}

/* ---------- 10. Compost (food wastage): leaf resting in a shallow bin (delete bin lid + body, shortened to y 12–21).
   Lid and body are one retraced stroke so the leaf, which sits on the lid, is joined to it. ---------- */
{
  const BIN = 'M4 12H20H18V19A2 2 0 0 1 16 21H8A2 2 0 0 1 6 19V12';
  const LEAF = 'M10 12C10 7 13 4 18 3C19 8 16 11 11 12Z';
  icons.compost = {
    line: line([P(BIN), P(LEAF)]),
    filled: masked([WS(P('M4 12H20')), W(P('M6 12V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V12Z')), W(P(LEAF))]),
  };
}

emit(icons, process.argv[2], process.argv.slice(3));
