// Family tree: a pedigree (parentage) diagram in the family of library/line/breeding_pair.svg (two parents).
// Scene: the sire as a light square and the dam as a light circle (pedigree convention), joined by an ink mating
// line with a descent line down to their offspring, a light circle carrying a green core (accent on its fill).
// Story: the pair leans together, the descent line draws down from them and the offspring pops in at its end;
// then rest. Static pose: both parents, both lines, the offspring.
export default {
  name: 'family_tree',
  order: 5,
  label: 'Family tree',
  module: 'Family tree / parentage',
  baseIcon: 'breeding_pair',
  base: [],
  motion: 'Parentage: the pair leans together, a line drops from them and their offspring pops in at its end, then rest.',
  loopMs: 3100,
  peaks: [0.14, 0.42], // pair together, line and offspring gone · offspring popping at 1.1
  restAt: 0.85,
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    { id: 'mate', shapes: [{ path: 'M19 15.5H29' }], stroke: 'ink', on: ['tile'] },
    {
      id: 'descent',
      shapes: [{ path: 'M24 15.5V27' }],
      stroke: 'ink',
      on: ['tile'],
      anim: {
        keys: [
          { t: 0, o: 1, te: 1 }, { t: 0.04, o: 1, te: 1 }, { t: 0.1, o: 0, te: 1 }, { t: 0.11, o: 0, te: 0 },
          { t: 0.18, o: 1, te: 0.05 }, { t: 0.32, o: 1, te: 1 }, { t: 1, o: 1, te: 1 },
        ],
      },
    },
    {
      id: 'sire',
      shapes: [{ rect: [8, 10, 11, 11, 2.5] }],
      fill: 'fill',
      stroke: 'ink',
      on: { stroke: ['tile', 'fill'] },
      anim: { origin: [13.5, 15.5], keys: [{ t: 0 }, { t: 0.04, x: 0 }, { t: 0.14, x: 2.5 }, { t: 0.26, x: 0 }, { t: 1 }] },
    },
    {
      id: 'dam',
      animSibling: true,
      shapes: [{ circle: [34.5, 15.5, 6] }],
      fill: 'fill',
      stroke: 'ink',
      on: { stroke: ['tile', 'fill'] },
      anim: { origin: [34.5, 15.5], keys: [{ t: 0 }, { t: 0.04, x: 0 }, { t: 0.14, x: -2.5 }, { t: 0.26, x: 0 }, { t: 1 }] },
    },
    {
      id: 'offspring',
      anim: {
        origin: [24, 38],
        keys: [
          { t: 0, o: 1, s: 1 }, { t: 0.04, o: 1, s: 1 }, { t: 0.1, o: 0, s: 0.9 }, { t: 0.3, o: 0, s: 0.9 },
          { t: 0.42, o: 1, s: 1.1 }, { t: 0.52, o: 1, s: 1 }, { t: 1, o: 1, s: 1 },
        ],
      },
      children: [
        { id: 'child', shapes: [{ circle: [24, 32.5, 6] }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'core', shapes: [{ circle: [24, 32.5, 2.5] }], fill: 'accent', on: ['fill'] },
      ],
    },
  ],
};
