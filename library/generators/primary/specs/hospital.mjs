// Hospital: the library hospital building (library/line/local_hospital.svg) admitting an animal.
// Scene: the light building in an ink outline on its ground line, the ink cross on its face, and a green door
// (accent inside a light door frame). The building is shifted 3.5px right of centre to leave a path on the left.
// Story: a small ink paw print walks up the ground line and in through the wall (it is drawn behind the building),
// then the cross beats once (lub-dub) as the patient is admitted; then rest. Static pose: building, cross, green
// door, no paw.
import svgpath from 'svgpath';

const WALLS = 'M5 21V5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21';
const GROUND = 'M3 21H21';
const CROSS = 'M12 7V13M9 10H15';
const T = (d) => svgpath(d).scale(1.5).translate(9.5, 4.5).round(3).toString(); // x 17–38, ground y 36
const BODY = T(WALLS) + 'Z';
const DOOR = 'M23.5 36V30.5A1.5 1.5 0 0 1 25 29H30A1.5 1.5 0 0 1 31.5 30.5V36Z'; // a square double door

// The library paw (line/animal.svg), solid ink, turned 90° so its toes point right (walking toward the door).
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
const PAW = paw(9.5, 29, 0.7, 90);

export default {
  name: 'hospital',
  order: 7,
  label: 'Hospital',
  module: 'Hospital admissions',
  baseIcon: 'local_hospital',
  base: [WALLS, GROUND, CROSS],
  motion: 'Admission: a paw print walks up and in through the door, then the cross beats once, then rest.',
  loopMs: 3150,
  peaks: [0.18, 0.44], // paw on the path · cross at 1.1
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'paw',
      particle: true,
      shapes: [{ path: PAW.pad }, ...PAW.toes.map(([x, y], i) => ({ circle: [x, y, i === 1 || i === 2 ? 1.9 : 1.75] }))],
      fill: 'ink',
      on: ['tile'],
      anim: {
        origin: [9.5, 29],
        keys: [
          { t: 0, o: 0, x: -1 }, { t: 0.04, o: 0, x: -1 }, { t: 0.1, o: 1, x: 0 }, { t: 0.18, o: 1, x: 2.5, y: -1 },
          { t: 0.26, o: 1, x: 5, y: 0 }, { t: 0.34, o: 0, x: 7.5 }, { t: 0.35, o: 0, x: -1 }, { t: 1, o: 0, x: -1 },
        ],
      },
    },
    { id: 'building', shapes: [{ path: BODY }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'buildingShade', shapes: [{ path: 'M33 12.5H34.5A1.5 1.5 0 0 1 36 14V34.5H33Z' }], fill: 'shade' },
    { id: 'door', shapes: [{ path: DOOR }], fill: 'accent', stroke: 'ink', on: { fill: ['fill'], stroke: ['fill'] } },
    { id: 'ground', shapes: [{ path: 'M6 36H41.5' }], stroke: 'ink', on: ['tile', 'fill'] },
    {
      id: 'cross',
      shapes: [{ path: T(CROSS) }],
      stroke: 'ink',
      strokeWidth: 3.5,
      on: ['fill'],
      anim: {
        origin: [27.5, 19.5],
        keys: [{ t: 0 }, { t: 0.36, s: 1 }, { t: 0.42, s: 1.1 }, { t: 0.47, s: 1 }, { t: 0.52, s: 1.06 }, { t: 0.58, s: 1 }, { t: 1 }],
      },
    },
  ],
};
