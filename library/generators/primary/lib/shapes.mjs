// Explicit cubic-bezier shapes. Lottie's native rc/el primitives anti-alias slightly differently from SVG
// <rect>/<circle>; drawing the same outline as a cubic path renders identically in both (see STYLE-PRIMARY.md §5).
const r3 = (v) => +v.toFixed(3);
export const K = 0.5523; // quarter-circle cubic constant

/** Rounded rect as a cubic path. */
export function rrect(x, y, w, h, r) {
  const k = r * (1 - K), X = x + w, Y = y + h, n = r3;
  return `M${n(x + r)} ${n(y)}H${n(X - r)}C${n(X - k)} ${n(y)} ${n(X)} ${n(y + k)} ${n(X)} ${n(y + r)}V${n(Y - r)}C${n(X)} ${n(Y - k)} ${n(X - k)} ${n(Y)} ${n(X - r)} ${n(Y)}H${n(x + r)}C${n(x + k)} ${n(Y)} ${n(x)} ${n(Y - k)} ${n(x)} ${n(Y - r)}V${n(y + r)}C${n(x)} ${n(y + k)} ${n(x + k)} ${n(y)} ${n(x + r)} ${n(y)}Z`;
}

/** Circle as a cubic path. */
export function disc(cx, cy, r) {
  const c = r * K, n = r3;
  return `M${n(cx)} ${n(cy - r)}C${n(cx + c)} ${n(cy - r)} ${n(cx + r)} ${n(cy - c)} ${n(cx + r)} ${n(cy)}C${n(cx + r)} ${n(cy + c)} ${n(cx + c)} ${n(cy + r)} ${n(cx)} ${n(cy + r)}C${n(cx - c)} ${n(cy + r)} ${n(cx - r)} ${n(cy + c)} ${n(cx - r)} ${n(cy)}C${n(cx - r)} ${n(cy - c)} ${n(cx - c)} ${n(cy - r)} ${n(cx)} ${n(cy - r)}Z`;
}
