// Staff: the library people pair (library/line/people.svg) scaled ×1.7 about the centre (instead of ×1.5) so the
// figures hold a visible fill: a staff member in front of a colleague.
// Scene: two light figures in ink outlines (heads and bodies), the front one wearing a green ID badge.
// Story: the colleague ducks down behind, then steps back up beside the staff member; the badge flashes once
// (scale 1.1); then rest. Static pose: both figures in place, badge on.
import svgpath from 'svgpath';
const r3 = (v) => +v.toFixed(3);
const K = 0.5523; // cubic quarter-circle constant: explicit beziers render the same in the SVG and in Lottie
/** Rounded rect as a cubic path. */
const rrect = (x, y, w, h, r) => {
  const k = r * (1 - K), X = x + w, Y = y + h, n = (v) => r3(v);
  return `M${n(x + r)} ${n(y)}H${n(X - r)}C${n(X - k)} ${n(y)} ${n(X)} ${n(y + k)} ${n(X)} ${n(y + r)}V${n(Y - r)}C${n(X)} ${n(Y - k)} ${n(X - k)} ${n(Y)} ${n(X - r)} ${n(Y)}H${n(x + r)}C${n(x + k)} ${n(Y)} ${n(x)} ${n(Y - k)} ${n(x)} ${n(Y - r)}V${n(y + r)}C${n(x)} ${n(y + k)} ${n(x + k)} ${n(y)} ${n(x + r)} ${n(y)}Z`;
};
/** Circle as a cubic path. */
const disc = (cx, cy, r) => {
  const c = r * K, n = (v) => r3(v);
  return `M${n(cx)} ${n(cy - r)}C${n(cx + c)} ${n(cy - r)} ${n(cx + r)} ${n(cy - c)} ${n(cx + r)} ${n(cy)}C${n(cx + r)} ${n(cy + c)} ${n(cx + c)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}C${n(cx - c)} ${n(cy + r)} ${n(cx - r)} ${n(cy + c)} ${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - c)} ${n(cx - c)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}Z`;
};
const BACK_BODY = 'M13 13H17A4 4 0 0 1 21 17V19A2 2 0 0 1 19 21H11A2 2 0 0 1 9 19V17A4 4 0 0 1 13 13Z';
const FRONT_BODY = 'M7 15H11A4 4 0 0 1 15 19A2 2 0 0 1 13 21H5A2 2 0 0 1 3 19A4 4 0 0 1 7 15Z';
const k = 1.7, c = 24 - 12 * k;
const S = (d) => svgpath(d).scale(k).translate(c, c).round(3).toString();
const head = (x, y) => disc(r3(x * k + c), r3(y * k + c), r3(3 * k));
// front body fill: y 30.6–37.8, x 10.2–27.6
const BADGE = [15.25, 32, 5.5, 4.25];

const outlined = (id, d) => ({ id, shapes: [{ path: d }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } });

export default {
  name: 'staff',
  order: 25,
  label: 'Staff',
  module: 'Staff',
  baseIcon: 'people',
  base: [BACK_BODY, FRONT_BODY],
  motion: 'Team: a colleague ducks behind and steps back up beside the staff member, whose badge flashes, then rest.',
  loopMs: 4150,
  peaks: [0.14, 0.42], // colleague gone · colleague up, badge at 1.1
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'colleague',
      anim: {
        keys: [
          { t: 0, o: 1, y: 0 }, { t: 0.04, o: 1, y: 0 }, { t: 0.14, o: 0, y: 3.5 }, { t: 0.2, o: 0, y: 3.5 },
          { t: 0.3, o: 1, y: -1.5 }, { t: 0.38, o: 1, y: 0 }, { t: 1, o: 1, y: 0 },
        ],
      },
      children: [outlined('backBody', S(BACK_BODY)), outlined('backHead', head(15, 6))],
    },
    { id: 'member', children: [outlined('frontBody', S(FRONT_BODY)), outlined('frontHead', head(9, 8))] },
    {
      id: 'badge',
      shapes: [{ path: rrect(...BADGE, 1.25) }],
      fill: 'accent',
      on: ['fill'],
      anim: {
        origin: [BADGE[0] + BADGE[2] / 2, BADGE[1] + BADGE[3] / 2],
        keys: [{ t: 0 }, { t: 0.36, s: 1 }, { t: 0.42, s: 1.1 }, { t: 0.48, s: 0.96 }, { t: 0.54, s: 1 }, { t: 1 }],
      },
    },
  ],
};
