# Material Design 3 icon spec: guard rails for the icon editor

Extracted 2026-11-23 from the rendered pages (Chrome, client-side render) of:

- [D] https://m3.material.io/styles/icons/designing-icons
- [A] https://m3.material.io/styles/icons/applying-icons
- [O] https://m3.material.io/styles/icons/overview

The Icons section has only these three tabs. None of them links to a separate page on grid, keylines, stroke or corners: all of that is on [D].

Legend:
- **STATED**: the value or rule appears on the page (body text, caption, image alt text or a diagram).
- **NOT FOUND**: the pages give no value. Nothing has been filled in from other sources.
- *(diagram)* / *(alt text)*: the value comes from a diagram's labels or the image's alt text, not the body copy.

All dimensions are dp on the 24dp standard canvas unless noted.

---

## 1. Canvas, live area and padding

| Rule | Value | Status | Source |
|---|---|---|---|
| Standard (baseline) icon size | 24 x 24 dp | STATED | [D] |
| Design for viewing at 100% scale for pixel-perfect accuracy | 100% | STATED | [D] |
| Additional optical sizes | 20, 40, 48 dp (supported set: 20/24/40/48) | STATED | [D], [A] |
| 20dp use | desktop, dense layouts, small-scale visuals | STATED | [D], [A] |
| 40 and 48dp use | display/headline type, larger screens, highlighted primary actions | STATED | [D], [A] |
| Optical size axis range | 20 to 48 dp | STATED | [A] |
| Live area | 20 x 20 dp, centred | STATED | [D] |
| Padding around the live area | 2 dp on every side | STATED | [D] |
| Trim area | the full graphic size (24 x 24) | STATED | [D] |
| Content should stay inside the live area | rule | STATED | [D] |
| Content **may** extend into the padding if it needs more visual weight (a "Caution" case, so warn rather than block) | rule | STATED | [D] |
| No part of the icon may extend outside the trim area | hard rule | STATED | [D] |
| Touch target for a 24dp symbol | 48 dp (default) | STATED | [A] |
| Touch target for a 20dp symbol (mouse/keyboard UIs) | 40 dp | STATED | [A] |
| Live area or padding for the 20/40/48 sizes | - | NOT FOUND | - |

## 2. Keyline shapes and sizes (24dp grid)

| Keyline | Size | Status | Source |
|---|---|---|---|
| Square | 18 x 18 dp | STATED | [D] |
| Circle | 20 dp diameter | STATED | [D] |
| Vertical rectangle | 16 dp wide x 20 dp high | STATED | [D] |
| Horizontal rectangle | 20 dp wide x 16 dp high | STATED | [D] |
| Keylines are centred on the 24dp grid | - | STATED *(diagram: concentric keylines on the 24dp grid)*; no offset values are given | [D] |
| Corner radius of the keyline shapes themselves | - | NOT FOUND | - |
| Keylines are guides for consistent visual proportion, not hard bounds | rule | STATED | [D] |
| Official template: 24dp keyline template (Adobe Illustrator, ZIP, Apache 2.0) at https://storage.googleapis.com/material-io-design/downloads/gm_icon_template.ai.zip | - | STATED | [D], [O] |

## 3. Stroke weight

| Rule | Value | Status | Source |
|---|---|---|---|
| Recommended stroke weight | 2 dp (= regular weight 400) | STATED | [D] |
| The 2dp applies to curves, angles, and both interior and exterior strokes | rule | STATED | [D] |
| Counter (inner) stroke | 2 dp, linear *(alt text: "linear 2dp inner stroke")* | STATED | [D] |
| Use consistent stroke weights within an icon | rule | STATED | [D] |
| Reduced stroke for complex detail (optical correction) | 1.5 dp (paperclip uses 1.5dp; ramen bowl mixes 1.5dp and 2dp) | STATED | [D] |
| Material Symbols weight axis range | 100 (thin) to 700 (bold) | STATED | [D], [A] |
| Minimum weight at 24dp | 200 (don't use the lightest weight at 24dp) | STATED | [A] |
| Excessive weight at 24dp | Caution, no number given | STATED (no value) | [A] |
| Apply one weight consistently; don't mix weights in a set | rule | STATED | [A] |
| Grade axis: default 0 for a dark icon on a light background, -25 for a light icon on a dark background, positive for emphasis or an active state | values | STATED | [A] |
| Mapping of weights 100 to 700 to dp stroke widths | - | NOT FOUND | - |
| Minimum or maximum stroke in dp | - | NOT FOUND (only 1.5 dp is shown as an allowed reduction) | - |

## 4. Corner radii (outer and inner)

| Rule | Value | Status | Source |
|---|---|---|---|
| Default corner radius (exterior) | 2 dp | STATED | [D] |
| Outlined style: interior corners | square (0 dp), not rounded | STATED | [D] |
| Shapes 2 dp wide or less: stroke corners | not rounded (0 dp) | STATED | [D] |
| Rounded style: exterior and interior corners | both rounded (inner radius value not given) | STATED (rule) / NOT FOUND (inner value) | [D], [A] |
| Sharp style: exterior and interior corners | reduced from 2 dp to 0 dp | STATED | [D], [A] |
| Use consistent corner radii | rule | STATED | [D] |
| Overly round corners reduce legibility | Caution, no maximum given | STATED (no value) | [D] |
| Maximum corner radius | - | NOT FOUND | - |

## 5. Terminals and joins

| Rule | Value | Status | Source |
|---|---|---|---|
| Stroke terminals are squared (butt/square), never rounded | rule | STATED | [D] |
| Arrowhead terminals trimmed to 45 degrees | 45 degrees | STATED *(alt text only)* | [D] |
| Join style (miter/round/bevel) for strokes | - | NOT FOUND (exterior corners follow the 2 dp radius rule above) | - |

## 6. Minimum gaps and counters

| Rule | Value | Status | Source |
|---|---|---|---|
| Anatomy terms: corner, stroke terminal, counter stroke, stroke, counter area, bounding area | definitions only | STATED | [D] |
| Counter stroke width | 2 dp (see section 3) | STATED | [D] |
| Minimum gap between elements | - | NOT FOUND | - |
| Minimum counter size | - | NOT FOUND | - |

## 7. Angles

| Rule | Value | Status | Source |
|---|---|---|---|
| Arrowhead terminal trim | 45 degrees | STATED *(alt text)* | [D] |
| Icons face forward: don't tilt, rotate or make them look three-dimensional | rule | STATED | [D] |
| Rotation of the placed icon in the "Do" example | 0 degrees *(diagram property panel)* | STATED *(diagram)* | [D] |
| Allowed angle set or angle snap increment | - | NOT FOUND | - |

## 8. Pixel alignment

| Rule | Value | Status | Source |
|---|---|---|---|
| Position icons "on pixel" within the icon grid | rule | STATED | [D] |
| "Do" example: X 0, Y 0, W 24, H 24 (whole-number coordinates) | integers | STATED *(diagram)* | [D] |
| "Don't" example: X 0.32, Y 2.1, W 24.5, H 24.5 (fractional) | fractional values fail | STATED *(diagram)* | [D] |
| Grid unit | 1 dp (24 x 24 grid, shown at 1000% scale) | STATED *(diagram: 24dp grid)*; "1dp cell" is read from the grid image, not written in the text | [D] |
| Symbols are "newly drawn to be pixel-crisp" | rule | STATED | [O] |

## 9. Optical adjustments

| Rule | Value | Status | Source |
|---|---|---|---|
| Complex detail may get optical corrections to improve legibility | rule | STATED | [D] |
| Corrections must use the same geometric forms as other icons, with no skewing or distorting | rule | STATED | [D] |
| Allowed reduced stroke | 1.5 dp (of the 2 dp stroke area) | STATED | [D] |
| Optical size axis keeps stroke thickness visually constant as size changes (don't just scale the 24dp vector, which ends up too heavy) | rule | STATED | [A] |
| Grade compensates for visual bleed: 0 on light, -25 on dark | values | STATED | [A] |
| Baseline shift when placed with text | about 11.5% of the text size, downward | STATED | [A] |
| Overshoot values for round shapes | - | NOT FOUND | - |

## 10. Filled and outlined treatment

| Rule | Value | Status | Source |
|---|---|---|---|
| Styles: outlined, rounded, sharp | 3 styles | STATED | [A], [O] |
| Outlined uses stroke plus fill, light and clean, suits dense UIs | rule | STATED | [A] |
| Fill axis | 0 (unfilled) to 1 (fully filled) | STATED | [A] |
| Use fill to show a state change (for example unfilled = unselected, filled = selected in bottom navigation) | rule | STATED | [A] |
| Some symbols should always stay filled (full-body human icons, proprietary icons) | rule | STATED | [A] |
| 2dp outlined icons stay readable across sizes | rule | STATED | [A] |
| Rounded style suits heavier type, curved logos and circular elements; sharp style uses a 0dp radius for rectangular brands | rule | STATED | [A] |
| Geometry for building the filled variant (how counters close, and so on) | - | NOT FOUND | - |

## 11. Consistency and metaphor

| Rule | Status | Source |
|---|---|---|
| Simplify icons for clarity; don't be overly literal; avoid complex icons | STATED | [D] |
| Make icons graphic and bold; no delicate or loose organic shapes | STATED | [D] |
| Keep one visual style across a set; don't mix styles | STATED | [D] |
| Consistent corner radii and stroke weights | STATED | [D] |
| Face forward; no tilt, rotation or 3D | STATED | [D] |
| Match icon size and optical weight to the text beside it | STATED | [A] |
| Below 20dp, complex icons and key-action icons need a text label | STATED | [A] |
| Navigation items must have labels; abstract icons need labels | STATED | [A] |
| Localise metaphors (for example cart, bag or basket); consider cultural meanings of symbols and colours | STATED | [A] |

---

## Machine-readable values

`null` means NOT FOUND on the M3 pages. Units are dp on the 24dp canvas.

```json
{
  "source": [
    "https://m3.material.io/styles/icons/designing-icons",
    "https://m3.material.io/styles/icons/applying-icons",
    "https://m3.material.io/styles/icons/overview"
  ],
  "extracted": "2026-11-23",
  "unit": "dp",
  "canvas": { "width": 24, "height": 24, "opticalSizes": [20, 24, 40, 48] },
  "liveArea": { "x": 2, "y": 2, "width": 20, "height": 20, "severity": "warn" },
  "padding": 2,
  "trimArea": { "x": 0, "y": 0, "width": 24, "height": 24, "severity": "error" },
  "keylines": [
    { "name": "square", "shape": "rect", "width": 18, "height": 18, "centered": true },
    { "name": "circle", "shape": "circle", "diameter": 20, "centered": true },
    { "name": "verticalRectangle", "shape": "rect", "width": 16, "height": 20, "centered": true },
    { "name": "horizontalRectangle", "shape": "rect", "width": 20, "height": 16, "centered": true }
  ],
  "strokeWidth": {
    "default": 2,
    "allowed": [2, 1.5],
    "reducedForComplexDetail": 1.5,
    "min": null,
    "max": null,
    "consistentWithinIcon": true,
    "variableWeight": { "default": 400, "min": 100, "max": 700, "minAt24dp": 200 }
  },
  "strokeTerminal": { "cap": "square", "roundedAllowed": false, "arrowheadTrimDeg": 45 },
  "strokeJoin": null,
  "cornerRadius": {
    "outlined": { "outer": 2, "inner": 0 },
    "rounded": { "outer": 2, "inner": null },
    "sharp": { "outer": 0, "inner": 0 },
    "shapesWidthLte2dp": 0,
    "max": null,
    "consistentWithinIcon": true
  },
  "minGap": null,
  "minCounter": null,
  "angleSnap": null,
  "noRotationOrPerspective": true,
  "pixelGrid": { "unit": 1, "snapCoordinates": "integer" },
  "fill": { "min": 0, "max": 1 },
  "grade": { "onLight": 0, "onDark": -25, "emphasis": "positive" },
  "targetSize": { "icon24": 48, "icon20": 40 },
  "textBaselineShiftPct": 11.5
}
```
