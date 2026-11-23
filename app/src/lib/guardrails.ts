/**
 * ANTZ Rounded guard rails: every number the checker, the builder overlays and library/STYLE.md use.
 * Change a value here and the builder, the library drawer and scripts/check-library.mjs all follow.
 *
 * Source of each value: "M3" = stated in guardrails/m3-icon-spec.md (Material 3 icon design page),
 * "ANTZ" = ANTZ house rule (either M3 gives no value, or ANTZ departs from M3 on purpose).
 */
export type Source = 'M3' | 'ANTZ';

export const GUARDRAILS = {
  /** M3: 24 x 24 canvas. Content outside 0–24 fails. */
  canvas: 24,
  /** M3: 2px padding, live area 2–22. Content in the padding is a "Caution" in M3, so it warns. */
  padding: 2,
  live: { min: 2, max: 22 },
  /** Small tolerance for floating point / curve sampling when testing extents. */
  epsilon: 0.05,

  /** M3: keylines, all centred on the 24 grid. */
  keylines: [
    { id: 'square', label: 'Square 18 × 18', kind: 'rect', w: 18, h: 18 },
    { id: 'circle', label: 'Circle Ø20', kind: 'circle', w: 20, h: 20 },
    { id: 'portrait', label: 'Portrait 16 × 20', kind: 'rect', w: 16, h: 20 },
    { id: 'landscape', label: 'Landscape 20 × 16', kind: 'rect', w: 20, h: 16 },
  ] as const,

  /** M3: stroke 2 (weight 400). 1.5 is allowed as an optical correction for complex detail (info). Anything else fails. */
  strokeWidth: 2,
  strokeWidthAllowed: [1.5],

  /** ANTZ rule (departs from M3, which uses square terminals and square inner corners): round caps and joins. */
  linecap: 'round',
  linejoin: 'round',

  /** M3: exterior corner radius 2 (rect rx >= 2). Shapes 2px wide or less need no rounding. Below = warn. */
  minCornerRadius: 2,
  cornerExemptSize: 2,

  /** M3: position on pixel. Coordinates on whole pixels pass; on 0.5 or other values warn. */
  grid: 1,
  /** Builder snap: 1px by default (M3 shows integer X/Y/W/H); 0.5 is an optional toggle. */
  snapDefault: 1,
  snapFine: 0.5,
  /** ANTZ rule (M3 gives no value): angle snap in the builder's draw tools. */
  angleSnapDeg: 45,

  /** ANTZ rule (M3 gives no value): clear space between separate strokes/shapes. */
  minGap: 2,
  /** Sampling step (px) along every shape outline for the gap, extent and keyline checks. */
  sampleStep: 0.25,

  /** ANTZ rule: complexity limits (warn). */
  maxElements: 12,
  maxPathCommands: 60,
  maxPathsTotalCommands: 120,

  /** Size of the 2px cut-out gap around a badge (ANTZ rule, same as minGap). */
  badgeGap: 2,
} as const;

/** Where each check's rule comes from, shown next to every message. */
export const RULE_SOURCE: Record<string, { source: Source; note?: string }> = {
  viewBox: { source: 'M3' },
  format: { source: 'ANTZ' },
  elements: { source: 'ANTZ' },
  colours: { source: 'ANTZ' },
  extent: { source: 'M3' },
  strokeWidth: { source: 'M3' },
  capsJoins: { source: 'ANTZ', note: 'ANTZ rule: M3 outlined uses square terminals; ANTZ Rounded uses round caps and joins' },
  corners: { source: 'M3' },
  grid: { source: 'M3' },
  gap: { source: 'ANTZ', note: 'ANTZ rule (M3 gives no value)' },
  keyline: { source: 'M3' },
  complexity: { source: 'ANTZ' },
  outerStroke: { source: 'ANTZ' },
};
