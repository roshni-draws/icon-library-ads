// The ANTZ transport truck (side view, facing right), shared by `transfers` (close-up) and `move_animal` (small,
// on a map), so the family stays consistent. Reference geometry is drawn at the `transfers` size on the 48 tile;
// truck(k, x, y) scales it by k about the reference contact point REF (between the wheels, on the ground) and
// places that point at (x, y).
import svgpath from 'svgpath';
import { rrect, disc } from './shapes.mjs';

const r3 = (v) => +v.toFixed(3);
export const REF = [25.5, 37.5]; // ground contact, between the wheels
const WHEELS = [[16.5, 33.5], [34.5, 33.5]];
const WHEEL_R = 4;
const HUB = 2; // hub mark arm length

const PARTS = {
  // Cargo box (the light load space) and the cab with its sloped windscreen.
  box: rrect(11, 12.5, 19, 19.5, 2.5),
  cab: 'M30 18.5H35C35.9 18.5 36.7 19 37.1 19.8L39.7 24.9C39.9 25.3 40 25.7 40 26.2V30C40 31.1 39.1 32 38 32H30Z',
  // Window inside the cab, kept ≥ 1px clear of the cab outline's inner edge.
  window: 'M32.3 21H34.6L36.8 25.3H32.3Z',
  // Green band across the cargo box (accent, on the fill), clear of the box outline.
  band: rrect(13.5, 19.5, 14, 5, 1.5),
};

const place = (k, x, y) => (d) => svgpath(d).translate(-REF[0], -REF[1]).scale(k).translate(x, y).round(3).toString();
const pt = (k, x, y) => ([px, py]) => [r3((px - REF[0]) * k + x), r3((py - REF[1]) * k + y)];

/** Truck parts as 48-grid path strings, scaled by k with its ground contact at (x, y). */
export function truck(k = 1, x = REF[0], y = REF[1]) {
  const P = place(k, x, y);
  const Q = pt(k, x, y);
  const out = Object.fromEntries(Object.entries(PARTS).map(([n, d]) => [n, P(d)]));
  const wheels = WHEELS.map(Q);
  const r = r3(WHEEL_R * k), a = HUB * k, b = r3(a * Math.SQRT1_2);
  out.wheels = wheels.map(([cx, cy]) => disc(cx, cy, r));
  // Hub marks: "+" at rest; "×" is the same mark turned 45°. Cross-fading the two reads as a turning wheel.
  out.hubPlus = wheels.map(([cx, cy]) => `M${r3(cx - a)} ${cy}H${r3(cx + a)}M${cx} ${r3(cy - a)}V${r3(cy + a)}`).join('');
  out.hubX = wheels.map(([cx, cy]) => `M${r3(cx - b)} ${r3(cy - b)}L${r3(cx + b)} ${r3(cy + b)}M${r3(cx - b)} ${r3(cy + b)}L${r3(cx + b)} ${r3(cy - b)}`).join('');
  out.wheelCentres = wheels;
  out.front = Q([36.5, 37.5]); // front wheel ground contact (tilt origin when braking)
  out.map = Q; // map any reference point
  return out;
}
