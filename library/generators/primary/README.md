# Primary icon generator (v2.1)

Builds the ANTZ **Primary** icons (illustrated tile scenes with a short animated story) into `library/primary/`.
Style rules, colour roles with measured contrast, the accent rule, the motion rules, the loop registry and the
spec-writing recipe: `library/primary/STYLE-PRIMARY.md` (the style is locked at v2.1).

```
specs/<name>.mjs   one declarative spec per icon (layers, roles, keyframes, peaks); format documented in lib/model.mjs
lib/geo.mjs        24-grid → 48-tile scaling (L, P, D) and the shared egg() base
lib/shapes.mjs     rrect() / disc(): rounded rects and circles as explicit cubic paths (SVG = Lottie pixels)
lib/model.mjs      roles, motion limits, motion lint, contrast + accent-rule lint, scheme flattening
lib/svg.mjs        spec → animated SVG (CSS keyframes, --antz-* variables with light fallbacks, trim via dasharray)
lib/lottie.mjs     spec → Lottie JSON (own minimal emitter: shape + null layers, parenting, groups, sh/rc/el,
                   fl/st, tm trim paths, eased transforms, static or moving masks)
lib/review.mjs     review.html (lottie-web inlined, works offline, 6 schemes, scrubber)
build.mjs          node build.mjs [--out <dir>] [--names a,b] [--dry-run]
validate.mjs       node validate.mjs [--out <dir>] [--names a,b] [--png <strip.png>] [--report <report.json>]
```

## Setup

Node 18+. Install the pinned dependencies in this folder (`node_modules` is not checked in):

```
npm ci
```

| Package | Version | Used for |
| --- | --- | --- |
| `svgpath` | 2.6.0 | scaling path data; normalising paths (abs, unarc, unshort) before converting to Lottie beziers |
| `lottie-web` | 5.12.2 | `lottie_light.min.js` (svg renderer) inlined into review.html and used by validate.mjs |
| `puppeteer-core` | 25.16.0 | driving the installed Google Chrome for validation (no bundled browser) |
| `pngjs` | 7.0.0 | decoding screenshots for the pixel diff |

Paths: the colour library defaults to the vendored copy at `app/src/data/ANTZ_colour_library.json` and the icon
library to `library/` (both relative to the repo root); override with `ANTZ_COLOURS` / `ANTZ_LIBRARY`. Validation needs
`/Applications/Google Chrome.app`.

## Run (from this folder)

```
node build.mjs                                      # all icons into library/primary (+ index.json, contrast.json, review.html)
node build.mjs --names eggs                         # rebuild one icon; index.json/contrast.json are merged, not replaced
node build.mjs --names ward --dry-run               # lint only
node build.mjs --out /tmp/primary-ward --names ward # build into a private folder (parallel agents)
node validate.mjs --out /tmp/primary-ward --names ward --png /tmp/primary-ward/frames.png --report /tmp/primary-ward/report.json
node validate.mjs --png /tmp/primary-frames.png     # everything in library/primary
```

`--out` defaults to `library/primary` for both scripts. `index.json` and `contrast.json` are read-modify-write: built
icons replace their own entry (a hand-set `status` is kept) or are appended, and every other entry is kept. The v2
positional forms (`build.mjs <outDir> [names...]`, `validate.mjs <dir> <png> [report]`) still work.

Outputs per icon: `svg/<name>.svg` and `lottie/<name>.<scheme>.json` for the 6 scheme keys `light`,
`light-medium-contrast`, `light-high-contrast`, `dark`, `dark-medium-contrast` and `dark-high-contrast`.

`build.mjs` fails (writes nothing) if a spec breaks:

- **motion rules**: loop 3000–4500 ms in 100 ms steps and unique (other spec files, the `--out` index and
  `library/primary/index.json`); seamless keys; every change done by t = 0.72;
  translate ≤ 4px (particles ≤ 8px, invisible at rest); rotate ≤ 12°; scale 0.9–1.1; ≤ 4 animated elements;
  tile static; two `peaks` and a `restAt`;
- **contrast**: every painted leaf against the roles it declares in `on`, < 3:1 in any of the 6 schemes;
- **accent rule**: an accent paint whose `on` isn't exactly `['fill']` (or that is `decorative`);
- **structure**: a clip too deep for a Lottie layer mask; trim on something that isn't a stroke leaf;
- **families**: a `base` path string that is no longer in `library/line/<baseIcon>.svg`.

`validate.mjs` renders SVG and Lottie at 0, the two peaks and the rest pose, in all 6 schemes, at 48 CSS px 2×. It
fails on a structural SVG/Lottie difference (> 0.1%, 3×3-block metric that ignores 1px anti-aliasing seams), a raw
difference > 1.5%, rest ≠ frame 0, reduced-motion SVG ≠ Lottie frame 0, a peak that differs from rest by < 2% of
pixels, or an accent pixel within 1 CSS px of a tile pixel (rendered with accent #FF00FF and tile #00FFFF at all four
story times). It forces `prefers-reduced-motion: no-preference` for the timed frames. It bakes each frame's
browser-computed CSS values (transform, opacity, stroke-dasharray/dashoffset) into inline styles, because headless
Chrome does not repaint paused SVG CSS animations. The strip shows light, dark and light high contrast.

## Emitter notes

- Layer order in specs is bottom → top; Lottie layers/items are emitted top-first as the format expects.
- `clip` is static (content moves inside it) unless `clipMoves: true`, which moves it with the layer's anim
  (SVG: clip inside the animated group; Lottie: anim on the layer `ks`, so the mask moves with the layer).
- `layerize` (top-level group): Lottie null layer for the group's anim, children as parented layers so each can
  carry its own mask. SVG: a plain nested `<g>`.
- Trim: SVG `pathLength="1"` + `stroke-dasharray: (te−ts) 2; stroke-dashoffset: −ts`; Lottie `tm` before the
  stroke. Keep opacity 0 whenever `ts = te` (round caps paint a dot on an empty dash in some renderers).
- Lottie positions are unsplit with zero spatial tangents; all keyed values carry the same bezier easing as the CSS
  `cubic-bezier(.45,0,.55,1)`.
- Lottie layer and group names are the spec layer ids (`cross`, `liquid`, …) so the app can address them with
  value callbacks.
