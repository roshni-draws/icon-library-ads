// Housing: an animal shelter behind a low version of the library enclosure fence (library/line/enclosure.svg).
// Scene: a light shelter (barn gable) in an ink outline with a round green window (accent on its fill), behind a
// low, light fence: one ink rail and three slim ink pickets.
// Story: the three pickets are hammered in one after another (each lifts 4px and thumps down), while the window is
// dark; when the fence is done the window lights up with a small pop; then rest. Static pose: shelter behind the
// fence, window green.
const RAIL = 'M3 16H21'; // the library's lower rail
const POSTS = [15, 24, 33];

const post = (i) => {
  const t0 = 0.06 + i * 0.07;
  return {
    id: `post${i + 1}`,
    animSibling: i > 0,
    shapes: [{ path: `M${POSTS[i]} 40V31` }],
    stroke: 'ink',
    on: ['tile', 'fill'],
    anim: {
      origin: [POSTS[i], 40],
      keys: [
        { t: 0 }, { t: t0, y: 0 }, { t: t0 + 0.08, y: -4 }, { t: t0 + 0.13, y: 0.6 }, { t: t0 + 0.17, y: 0 }, { t: 1 },
      ],
    },
  };
};

export default {
  name: 'housing',
  order: 11,
  label: 'Housing',
  module: 'Housing: site, section, enclosure',
  baseIcon: 'enclosure',
  base: [RAIL],
  motion: 'Enclosure: the fence pickets are hammered in one after another, then the shelter window lights up green, then rest.',
  loopMs: 3250,
  peaks: [0.14, 0.28], // first picket lifted · last picket lifted
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'shelter', shapes: [{ path: 'M11 19L24 8.5L37 19V36H11Z' }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
    {
      id: 'window',
      shapes: [{ circle: [24, 21, 3.6] }],
      fill: 'accent',
      on: ['fill'],
      anim: { origin: [24, 21], keys: [{ t: 0 }, { t: 0.04, s: 1, o: 1 }, { t: 0.1, s: 0.9, o: 0 }, { t: 0.42, s: 0.9, o: 0 }, { t: 0.52, s: 1.1, o: 1 }, { t: 0.6, s: 1 }, { t: 1 }] },
    },
    // one rail (the library's lower rail), low across the shelter's foot
    { id: 'rail', shapes: [{ path: 'M8 35H40' }], stroke: 'ink', on: ['tile', 'fill'] },
    post(0), post(1), post(2),
  ],
};
