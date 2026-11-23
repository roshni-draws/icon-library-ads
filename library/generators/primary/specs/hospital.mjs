// Hospital: the library hospital building (library/line/local_hospital.svg) admitting an elephant.
// Scene: the elephant is the hero, a big light elephant in an ink outline on the left 60% of the tile, side view,
// facing right (rounded back, big rounded ear in an ink outline, trunk hanging down and curling forward, ink eye,
// two chunky leg pairs); the building is a narrow light wing at the right on the same ground line, with the ink
// cross on its face and a green door (accent inside an ink frame).
// Story: the elephant walks toward the door (+4px with a 1px step bob) and lifts its trunk; its head slips behind
// the door frame, then the cross beats once (lub-dub); the elephant steps back to its place, then rest. It never
// fades. Static pose: building, cross, door, elephant fully visible at the left.
import svgpath from 'svgpath';
import { disc } from '../lib/shapes.mjs';

const WALLS = 'M5 21V5A2 2 0 0 1 7 3H17A2 2 0 0 1 19 5V21';
const GROUND = 'M3 21H21';
const CROSS = 'M12 7V13M9 10H15';
// The building: a narrow wing, x 31–42 (11/14×), y 11–39.5 (28.5/18×): 14px wide over its outline.
const BX0 = 31, BX1 = 42, BY0 = 11, GY = 39.5;
const SX = (BX1 - BX0) / 14, SY = (GY - BY0) / 18;
const T = (d) => svgpath(d).scale(SX, SY).translate(BX0 - 5 * SX, GY - 21 * SY).round(3).toString();
const BODY = T(WALLS) + 'Z';
const CX = 36.5, CY = 19.5; // cross centre, on the upper face
const CROSS48 = svgpath(CROSS).translate(-12, -10).scale(0.8).translate(CX, CY).round(3).toString();
const DOOR = 'M34 39.5V34A1.5 1.5 0 0 1 35.5 32.5H37.5A1.5 1.5 0 0 1 39 34V39.5Z';

// The elephant, facing right, drawn directly on the 48 grid with its feet on the ground line (y 38, the top of the
// 3px ground stroke). One silhouette = rounded back, domed head and two chunky leg pairs (light, 2.5px ink
// outline); a big rounded ear over the neck (light, ink outline); a solid ink trunk that hangs down and curls
// forward; an ink eye. At rest its ink ends at x ≈ 28, clear of the wall (ink from x 29).
const EL = {
  body:
    'M5.8 29C5.8 23.2 9 19.8 13.5 19.8C15.2 19.8 16.3 19.5 17.1 18.8C18.3 16.6 20.3 15.2 22.6 15.2' +
    'C25.4 15.2 27.4 17.5 27.4 20.6C27.4 22.6 26.8 24 25.8 25C24.6 26 22.8 26.5 20.6 26.7V36.4' +
    'C20.6 37.3 19.9 38 19 38H17.4C16.5 38 15.8 37.3 15.8 36.4V33H11.4V36.4C11.4 37.3 10.7 38 9.8 38' +
    'H7.8C6.9 38 6.2 37.3 6.2 36.4V32.6C6 31.6 5.8 30.4 5.8 29Z',
  ear: 'M14.6 20.4C16.8 18.2 20.9 18.6 21.1 22.6C21.3 26.4 19.8 29.4 17.3 29.4C15.4 29.4 14.4 27.6 14.4 25.2' +
    'C14.4 23.2 14.3 21.6 14.6 20.4Z',
  trunk: 'M25.6 23C26.8 26.2 26.9 30 26 33C25.6 34.6 26.5 35.6 27.5 34.6',
  eye: disc(23.7, 19.8, 1.15),
};
const TRUNK_BASE = [25.6, 23];

export default {
  name: 'hospital',
  order: 7,
  label: 'Hospital',
  module: 'Hospital admissions',
  baseIcon: 'local_hospital',
  base: [WALLS, GROUND, CROSS],
  motion: 'Admission: an elephant walks up to the door, lifting its trunk, then the cross beats once, then rest.',
  loopMs: 3150,
  peaks: [0.28, 0.36], // elephant at the door, trunk lifted · cross at 1.1
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'elephant',
      anim: {
        origin: [15, 38],
        keys: [
          { t: 0, x: 0, y: 0 },
          { t: 0.04, x: 0, y: 0 },
          { t: 0.1, x: 1, y: -1 },
          { t: 0.16, x: 2, y: 0 },
          { t: 0.22, x: 3, y: -1 },
          { t: 0.28, x: 4, y: 0 },
          { t: 0.5, x: 4, y: 0 },
          { t: 0.58, x: 2, y: -1 },
          { t: 0.66, x: 0, y: 0 },
          { t: 1 },
        ],
      },
      children: [
        { id: 'el', shapes: [{ path: EL.body }], fill: 'fill', stroke: 'ink', strokeWidth: 2.5, on: { stroke: ['tile', 'fill'] } },
        {
          id: 'trunk',
          shapes: [{ path: EL.trunk }],
          stroke: 'ink',
          on: ['tile', 'fill'],
          anim: {
            origin: TRUNK_BASE,
            keys: [{ t: 0 }, { t: 0.06, r: 0 }, { t: 0.2, r: -8 }, { t: 0.5, r: -8 }, { t: 0.62, r: 0 }, { t: 1 }],
          },
        },
        { id: 'ear', shapes: [{ path: EL.ear }], fill: 'fill', stroke: 'ink', strokeWidth: 2.25, on: { stroke: ['fill'] } },
        { id: 'eye', shapes: [{ path: EL.eye }], fill: 'ink', on: ['fill'] },
      ],
    },
    { id: 'building', shapes: [{ path: BODY }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    { id: 'buildingShade', shapes: [{ path: 'M39 13.5H39.2A1.3 1.3 0 0 1 40.5 14.8V38H39Z' }], fill: 'shade' },
    { id: 'door', shapes: [{ path: DOOR }], fill: 'accent', stroke: 'ink', strokeWidth: 2.5, on: { fill: ['fill'], stroke: ['fill'] } },
    { id: 'ground', shapes: [{ path: `M4.5 ${GY}H42` }], stroke: 'ink', on: ['tile', 'fill'] },
    {
      id: 'cross',
      shapes: [{ path: CROSS48 }],
      stroke: 'ink',
      strokeWidth: 2.5,
      on: ['fill'],
      anim: {
        origin: [CX, CY],
        keys: [{ t: 0 }, { t: 0.3, s: 1 }, { t: 0.36, s: 1.1 }, { t: 0.41, s: 1 }, { t: 0.46, s: 1.06 }, { t: 0.52, s: 1 }, { t: 1 }],
      },
    },
  ],
};
