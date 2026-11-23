// Chat: the library speech bubble (library/line/chat.svg) with its three dots as a typing indicator.
// Scene: light bubble in an ink outline with its tail at the lower left, three green typing dots (accent, on the
// bubble).
// Story: the dots hop one after another in a wave, twice, then the bubble pops (scale 1.06) as the message is
// sent; then rest. Static pose: bubble with three dots in a row.
import { L } from '../lib/geo.mjs';

const BUBBLE = 'M5 3H19A2 2 0 0 1 21 5V15A2 2 0 0 1 19 17H7L3 21V5A2 2 0 0 1 5 3Z';
const DOTS = 'M8 10V10M12 10V10M16 10V10';

const hop = (t) => [{ t, y: 0 }, { t: t + 0.06, y: -3.5 }, { t: t + 0.12, y: 0 }];
const dot = (i, cx, t0) => ({
  id: `dot${i}`,
  animSibling: i > 1,
  shapes: [{ circle: [cx, 21, 2.5] }],
  fill: 'accent',
  on: ['fill'],
  anim: { origin: [cx, 21], keys: [{ t: 0, y: 0 }, ...hop(t0), ...hop(t0 + 0.2), { t: 1, y: 0 }] },
});

export default {
  name: 'chat',
  order: 23,
  label: 'Chat',
  module: 'Chat',
  baseIcon: 'chat',
  base: [BUBBLE, DOTS],
  motion: 'Typing: the three dots hop in a wave, twice, then the bubble pops as the message is sent, then rest.',
  loopMs: 3950,
  peaks: [0.14, 0.6], // dots mid-wave · bubble popped
  restAt: 0.85,
  // Stroke variant: the typing dots stay solid ink (outlined, three small rings read as "ooo" at 48px).
  stroke: { patch: Object.fromEntries([1, 2, 3].map((i) => [`dot${i}`, { fill: 'ink', stroke: null, strokeWidth: null }])) },
  layers: [
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },
    {
      id: 'message',
      anim: {
        origin: [12, 36],
        keys: [{ t: 0 }, { t: 0.5, s: 1, r: 0 }, { t: 0.6, s: 1.06, r: -2 }, { t: 0.68, s: 1, r: 0 }, { t: 1 }],
      },
      children: [
        { id: 'bubble', shapes: [{ path: L(BUBBLE) }], fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },
        { id: 'bubbleShade', shapes: [{ path: 'M15 28.5H33' }], stroke: 'shade', strokeWidth: 2 },
        dot(1, 18, 0.04),
        dot(2, 24, 0.09),
        dot(3, 30, 0.14),
      ],
    },
  ],
};
