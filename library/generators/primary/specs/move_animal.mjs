// Move animal: the library move-in glyph (library/line/move_in.svg): an arrow entering an enclosure.
// Scene: the enclosure as a light box with its door side open (the library bracket, widened), a green floor strip
// inside (accent on its fill), the library arrow on the tile pointing in, and a solid ink paw print inside, toes
// pointing in (the animal just moved).
// Story: the paw slips out of view and the arrow draws back; then the arrow pushes in through the door and the paw
// slides in with it and settles on the green floor; then rest. Static pose: arrow at the door, paw inside.
import svgpath from 'svgpath';

const ARROW = 'M3 12H15M11 8L15 12L11 16';
const PAD = 'M12 12C9 12 6 16 6 18A3 3 0 0 0 9 21H15A3 3 0 0 0 18 18C18 16 15 12 12 12Z';
const TOES = [[5, 10], [9, 5], [15, 5], [19, 10]];
const r3 = (v) => +v.toFixed(3);
function paw(cx, cy, k, deg) {
  const pad = svgpath(PAD).translate(-12, -15).scale(k).rotate(deg).translate(cx, cy).round(3).toString();
  const a = (deg * Math.PI) / 180;
  const toes = TOES.map(([x, y]) => {
    const [dx, dy] = [k * (x - 12), k * (y - 15)];
    return [r3(cx + dx * Math.cos(a) - dy * Math.sin(a)), r3(cy + dx * Math.sin(a) + dy * Math.cos(a))];
  });
  return { pad, toes };
}
const PAW = paw(30.5, 23.5, 0.55, 90);
const BOX = 'M22 10.5H37A3 3 0 0 1 40 13.5V34.5A3 3 0 0 1 37 37.5H22';

export default {
  name: 'move_animal',
  order: 12,
  label: 'Move animal',
  module: 'Move animal between enclosures',
  baseIcon: 'move_in',
  base: [ARROW, 'M14 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H14'],
  motion: 'Move: the arrow draws back, then pushes in through the door and the paw slides in with it, then rest.',
  loopMs: 3300,
  peaks: [0.16, 0.3], // paw gone, arrow drawn back · arrow pushed in, paw sliding in
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'room', shapes: [{ path: BOX + 'Z' }], fill: 'fill' },
    { id: 'floor', shapes: [{ rect: [25.5, 31, 11, 3.5, 1.75] }], fill: 'accent', on: ['fill'] },
    {
      id: 'paw',
      shapes: [{ path: PAW.pad }, ...PAW.toes.map(([x, y], i) => ({ circle: [x, y, i === 1 || i === 2 ? 1.6 : 1.45] }))],
      fill: 'ink',
      on: ['fill'],
      anim: {
        origin: [30.5, 23.5],
        keys: [
          { t: 0, o: 1, x: 0 }, { t: 0.04, o: 1, x: 0 }, { t: 0.12, o: 0, x: -4 }, { t: 0.18, o: 0, x: -4 },
          { t: 0.32, o: 1, x: 0.8 }, { t: 0.4, o: 1, x: 0 }, { t: 1, o: 1, x: 0 },
        ],
      },
    },
    { id: 'walls', shapes: [{ path: BOX }], stroke: 'ink', on: ['tile', 'fill'] },
    {
      id: 'arrow',
      shapes: [{ path: svgpath(ARROW).scale(1.5).translate(0.5, 6).round(3).toString() }],
      stroke: 'ink',
      on: ['tile', 'fill'],
      anim: {
        keys: [{ t: 0 }, { t: 0.06, x: 0 }, { t: 0.16, x: -3 }, { t: 0.28, x: 3 }, { t: 0.38, x: 0 }, { t: 1 }],
      },
    },
  ],
};
