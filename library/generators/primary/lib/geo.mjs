// Shared geometry for the Primary (tile badge) icons.
//
// Glyphs are the library's 24-grid line geometry scaled ×1.5 about the canvas centre:
//   x48 = 1.5 · x24 + 6
// The 24-grid live area 3–21 lands on 10.5–37.5, and the 2px stroke becomes 3px, so ink spans 9–39
// (a 30px glyph with 9px of tile padding). Integer 24-grid coordinates land on half pixels, and with a
// 3px centred stroke the edges fall on whole pixels, so the scaled glyph stays crisp.
import svgpath from 'svgpath';

export const SCALE = 1.5;
export const OFFSET = 6;
export const STROKE = 3; // 2px at 24 → 3px at 48

const r3 = (v) => +v.toFixed(3);

/** Scale a 24-grid path string onto the 48 tile. */
export const L = (d) => svgpath(d).scale(SCALE).translate(OFFSET, OFFSET).round(3).toString();

/** Scale a 24-grid point onto the 48 tile. */
export const P = (x, y) => [r3(x * SCALE + OFFSET), r3(y * SCALE + OFFSET)];

/** Scale a 24-grid length. */
export const D = (v) => r3(v * SCALE);

/**
 * The ANTZ egg (copied from library/generators/eggs/gen.mjs, unchanged). egg(12, 14, 7, 0) is
 * library/line/egg.svg; the Primary egg is that path through L(), i.e. egg(24, 27, 10.5) on the 48 tile.
 */
export function egg(cx, cy, r, d = 0) {
  const n = r3;
  const apex = cy - Math.round((r * 11) / 7) - d;
  const R = r + d;
  const c1 = R / 2;
  const c2 = (r * 5) / 7 + d / 2;
  return `M${n(cx)} ${n(apex)}C${n(cx - c1)} ${n(apex)} ${n(cx - R)} ${n(cy - c2)} ${n(cx - R)} ${n(cy)}A${n(R)} ${n(R)} 0 0 0 ${n(cx + R)} ${n(cy)}C${n(cx + R)} ${n(cy - c2)} ${n(cx + c1)} ${n(apex)} ${n(cx)} ${n(apex)}Z`;
}
if (egg(12, 14, 7, 0) !== 'M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z') throw new Error('egg drift');
