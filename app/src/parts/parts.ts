/**
 * Badge parts for "Build from parts", drawn in ANTZ Rounded on the 24 grid.
 * Every badge sits in the bottom-right corner, centred on (cx, cy), inside the live area (ink ≤ 22).
 * The base icon is cut away inside `cut` (badge ink radius + the 2px gap), so the gap is always 2px.
 *
 *  line:   stroked snippet (inherits stroke 2, round caps/joins from the line <svg>)
 *  filled: `disc` = radius of the solid badge disc (0 = no disc, the glyph itself is solid);
 *          `knock` = strokes knocked out of the disc (2px, round), drawn black inside the mask
 */
export interface Part {
  id: string;
  label: string;
  cx: number;
  cy: number;
  /** radius of the badge's ink (line and filled), used for the cut-out */
  ink: number;
  line: string;
  filled: { disc: number; knock: string; solid?: string };
}

const C = 17; // badge centre: ink 12–22 for a radius-5 badge

export const PARTS: Part[] = [
  {
    id: 'add', label: 'Add', cx: C, cy: C, ink: 5,
    line: '<path d="M17 13V21M13 17H21"/>',
    filled: { disc: 5, knock: '<path d="M17 14V20M14 17H20"/>' },
  },
  {
    id: 'check', label: 'Check', cx: C, cy: C, ink: 5,
    line: '<path d="M13 17L16 20L21 14"/>',
    filled: { disc: 5, knock: '<path d="M14 17L16 19L19 16"/>' },
  },
  {
    id: 'close', label: 'Close', cx: C, cy: C, ink: 5,
    line: '<path d="M14 14L20 20M20 14L14 20"/>',
    filled: { disc: 5, knock: '<path d="M15 15L19 19M19 15L15 19"/>' },
  },
  {
    id: 'clock', label: 'Clock', cx: C, cy: C, ink: 5,
    line: '<circle cx="17" cy="17" r="4"/><path d="M17 15V17L18 18"/>',
    filled: { disc: 5, knock: '<path d="M17 14V17L19 18"/>' },
  },
  {
    id: 'alert', label: 'Alert', cx: C, cy: C, ink: 5,
    line: '<path d="M17 13V17M17 21V21"/>',
    filled: { disc: 5, knock: '<path d="M17 14V17M17 20V20"/>' },
  },
  {
    id: 'dot', label: 'Circle badge (dot)', cx: 18, cy: 18, ink: 3,
    line: '<circle cx="18" cy="18" r="2"/>',
    filled: { disc: 3, knock: '' },
  },
];

export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]));
