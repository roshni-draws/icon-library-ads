# ANTZ Primary: icon style spec (v2.1, locked)

Primary is the third ANTZ icon style, after **line** and **filled** (see `../STYLE.md`). It is for **module
navigation only**: one small illustrated scene per module on a tile, with a short animated story. Status:
**v2.1, style locked** (all 30 built, draft). This file is the recipe for any new one. Follow it as written;
anything it doesn't cover is a question for design review, not a per-icon judgement call.

**v2.1 changes from v2:**

- The accent is the **brand green** (`onPrimaryFixedVariant`). It may sit **only on the light fill**, never on the
  tile. The build enforces this, and the validator checks it in pixels.
- The brown caution accent is retired, and so is the `trail` role (ink at 50%).
- Medical: the ECG stays inside the bag face.
- Lab: the liquid is green, with light bubbles in ink rings.
- Eggs: the nest is the light fill, with green straws.
- Animals: the faint back print is now a solid trail print at the lower left.

## Files (contract)

```
library/primary/
  index.json                      { version: 1, style: "primary-v2.1", schemes, icons: [ { name, label, module,
                                    status, baseIcon, loopMs, motion, svg, lottie: { <scheme>: path },
                                    variants: ["filled","stroke"], svgStroke, lottieStroke: { <scheme>: path } } ] }
  svg/<name>.svg                  Filled variant: animated SVG (web), CSS keyframes inside, themed by --antz-* variables
  lottie/<name>.<scheme>.json     Filled variant: Lottie (mobile), one per colour scheme, colours baked in (6 per icon)
  svg-stroke/<name>.svg           Stroke variant (§8): same contract as svg/
  lottie-stroke/<name>.<scheme>.json  Stroke variant: same contract as lottie/
  contrast.json                   contrast lint output (roles, pairs, every painted element × 6 schemes)
  review.html                     offline review page (not part of the contract)
  STYLE-PRIMARY.md                this file
```

The scheme keys are exactly the colour library's: `light`, `light-medium-contrast`, `light-high-contrast`, `dark`,
`dark-medium-contrast` and `dark-high-contrast`. `index.json` lists the paths under `icons[].lottie[<scheme>]`. The
generator, specs and validator are in `../generators/primary/` (see its `README.md`). Never edit the output by hand:
edit `specs/<name>.mjs` and rebuild.

| order | name | label | baseIcon | loop | story |
| --- | --- | --- | --- | --- | --- |
| 1 | `home` | Home | `home_health` | 4050 ms | Welcome home: the door light switches off and glows back on with a flicker, then a puff of smoke rises from the chimney, then rest. |
| 2 | `dashboard` | Dashboard | `grid_view` | 4100 ms | Dashboard: the widgets refresh one after another, each pulsing as its green mark flashes in, then rest. |
| 3 | `animals` | Animals | `animal` | 3400 ms | Paw trail: the trail print fades in, then the front paw lifts and presses down with a puff of dust, then rest. |
| 4 | `species` | Species | `animal` | 3050 ms | Taxonomy: the stacked level cards fan out, the paw on the front card pops, and the cards settle back, then rest. |
| 5 | `family_tree` | Family tree | `breeding_pair` | 3100 ms | Parentage: the pair leans together, a line drops from them and their offspring pops in at its end, then rest. |
| 6 | `medical` | Medical | `medical` | 3000 ms | Heartbeat: the ECG line re-draws across the bag; the cross beats once (lub-dub) as the spike passes, then rest. |
| 7 | `hospital` | Hospital | `local_hospital` | 3150 ms | Admission: an elephant walks up to the door, lifting its trunk, then the cross beats once, then rest. |
| 8 | `pharmacy` | Pharmacy | `medication` | 3200 ms | Dispense: the cap flips up, a capsule pops out of the bottle and the cap snaps shut, then rest. |
| 9 | `lab` | Lab | `lab_request` | 3800 ms | Experiment: the liquid sloshes and settles while three bubbles rise from it one after another, then rest. |
| 10 | `eggs` | Eggs | `egg` | 4200 ms | Hatching: the egg wobbles in its nest, a crack draws across, the top lifts and a chick peeks out, then it settles closed. |
| 11 | `housing` | Housing | `enclosure` | 3250 ms | Enclosure: the fence pickets are hammered in one after another, then the shelter window lights up green, then rest. |
| 12 | `move_animal` | Move animal | `move_in` | 3300 ms | Move: the route re-draws across the map as the truck drives along it, and the pin pops as the route arrives, then rest. |
| 13 | `diet` | Diet | `dietitian` | 3350 ms | Feeding: the apple lifts out of the bowl and drops back in, and the food bounces as it lands, then rest. |
| 14 | `kitchen` | Kitchen | `cooking_pot` | 3450 ms | Cooking: the pot lid lifts and tilts as steam rises from under it, then the lid settles, then rest. |
| 15 | `mortality` | Mortality | `mortality` | 3500 ms | Remembrance: a single leaf drifts slowly down beside the still skull, swaying, and fades, then rest. |
| 16 | `necropsy` | Necropsy | `necropsy` | 3550 ms | Examination: the scalpel lifts and glides along the tray as its marking line re-draws, then rest. |
| 17 | `assessments` | Assessments | `assessment` | 3600 ms | Checklist: the board is picked up, its two checks tick in one after another, then it settles, then rest. |
| 18 | `transfers` | Transfers | `transfer` | 3650 ms | Hand-off: the truck backs up and rolls in from the left with its wheels turning and speed lines behind it, then brakes with a small tilt and settles, then rest. |
| 19 | `requests` | Requests | `request` | 3700 ms | Approval: the stamp lifts and presses down on the slip, and the check pops in as it springs back, then rest. |
| 20 | `notes` | Notes | `note` | 3750 ms | Journal: the pencil writes the newest line across the note, then lifts off, then rest. |
| 21 | `announcements` | Announcements | `announcement` | 3850 ms | Broadcast: the megaphone draws back and pushes forward as its rays burst out, then rest. |
| 22 | `notifications` | Notifications | `bell` | 3900 ms | Alert: the bell swings and rings, its clapper lagging, with two ring arcs flashing out, then rest. |
| 23 | `chat` | Chat | `chat` | 3950 ms | Typing: the three dots hop in a wave, twice, then the bubble pops as the message is sent, then rest. |
| 24 | `reports` | Reports | `bar_chart` | 4000 ms | Insight: the bars grow up from the baseline one after another, then rest. |
| 25 | `staff` | Staff | `people` | 4150 ms | Team: a colleague ducks behind and steps back up beside the staff member, whose badge flashes, then rest. |
| 26 | `department` | Department | `account_tree` | 4250 ms | Org chart: the teams fold into the head unit, it pulses, and the teams branch back out one after the other, then rest. |
| 27 | `security` | Security | `encrypted` | 4300 ms | Verified: the shield’s check re-draws and the shield seals with one pulse, then rest. |
| 28 | `compliance` | Compliance | `verified` | 4350 ms | Certify: the seal lifts off the page and stamps back down, and its check draws in, then rest. |
| 29 | `activity_log` | Activity log | `history` | 4400 ms | Log: the clock rewinds, then its hands sweep forward as the elapsed arc re-draws round the face, then rest. |
| 30 | `settings` | Settings | `settings_gear` | 4450 ms | Tuning: the big gear winds back and turns forward, driving the small gear the other way, then settles, then rest. |

## 1. Construction rules

| Rule | Value |
| --- | --- |
| Canvas | `viewBox="0 0 48 48"`, `width="48" height="48"` |
| Tile | `rect 0 0 48 48 rx 14`, role **tile**. No outline and no shadow. The tile never moves. It is always the first layer, with id `tile`. |
| Main objects | **solid shapes in the light fill** (role **fill**) inside a **3px ink outline** (role **ink**), with round caps and joins. The outline carries the silhouette on the tile, because fill/tile is only 1.0–1.9:1 by design. |
| Small parts | anything too small to hold a visible fill inside a 3px outline (toes, eyes, a small secondary print) is **solid ink**. An outlined toe leaves about 1.5px of fill and reads as an eye. |
| One shade or highlight per object | either a soft inner shadow in **shade** (ink at 20%: the pad's underside, the bag's right side, a crescent on the egg), or a highlight stroke in **fill** on an accent area (the liquid's shine) |
| Accent | see §2. It is green and sits **only on the fill**. Use it once or twice per icon, on the thing that carries the meaning. |
| Scene | one main object plus one or two supporting things. Use **five distinct shapes at most**, so the scene still reads at 48px. |
| Detail strokes | 2.5px (ECG, crack, chick head) or 2px (straws, shine). Use 1.5px only for particle rings (bubbles). Never go under 1.5px. |
| Live area | ink stays inside about 5–43. Particles may come within 4px of the tile edge. |
| Families | reuse the library's metaphors. Line geometry is scaled ×1.5 about the centre (`L()`, `P()` and `D()` in `lib/geo.mjs`: `x48 = 1.5·x24 + 6`). The paw is the `PAD` and toes from `line/animal.svg`, the egg is `egg()` from `lib/geo.mjs`, and the transport truck is `truck(k, x, y)` from `lib/truck.mjs` (full size in `transfers`, ×0.55 in `move_animal`; the truck never fades out). List every reused 24-grid path string in `base`: the build fails if one is no longer in `library/line/<baseIcon>.svg`. |

Keep the semantic grammar of `../STYLE.md`. Don't put a slash, a ✕/✓/+/clock badge or a sparkle on a module icon
unless you mean that device's meaning (sparkle = golden egg). The Medical cross is **ink**, never red.

## 2. Colour roles and the accent rule

| Role | Library role | CSS variable | Light | Light MC | Light HC | Dark | Dark MC | Dark HC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tile` | `primaryContainer` | `--antz-primary-container` | #36BC69 | #007E3E | #005528 | #36BC69 | #36BC69 | #5ADC84 |
| `ink` (outline, small solid parts) | `onPrimaryContainer` | `--antz-on-primary-container` | #00451F | #FFFFFF | #FFFFFF | #00451F | #00210C | #000E03 |
| `fill` (main objects) | `tertiaryFixed` | `--antz-tertiary-fixed` | #CCE5FF | #50708C | #2B4C67 | #CCE5FF | #CCE5FF | #CCE5FF |
| `shade` (inner shadow) | ink at **20%** | same as ink, opacity 0.2 | | | | | | |
| `accent` (brand green, **on the fill only**) | `onPrimaryFixedVariant` | `--antz-on-primary-fixed-variant` | #005226 | #FFFFFF | #FFFFFF | #005226 | #00401D | #001506 |

These five are the only roles. Don't add one without design review.

### The accent rule

> **An accent element may only sit on the light fill, inside an object. It never touches the tile.**

- In a spec, every accent paint declares `on: ['fill']`, `on: { fill: ['fill'] }` or `on: { stroke: ['fill'] }`.
  It must be exactly that, and it can't be `decorative`. The build fails otherwise.
- The validator renders each icon with the accent painted #FF00FF and the tile painted #00FFFF, at all four story
  times. It fails if any accent pixel lies within 1 CSS px of a tile pixel. So the accent has to be
  **geometrically** inside a filled object in every frame of the motion: clip it to the object, or keep it clear of
  the object's outline.
- Anything on the tile that needs colour (dust, a secondary print, a handle) is **ink**.
- Anything that must read on the accent (bubbles in the liquid, a shine) is **fill**. If it also has to read where
  it leaves the accent, give it a thin ink ring (the Lab bubbles are a fill disc with a 1.5px ink ring).
- In light MC/HC the accent is white, the same as the ink (accent/ink 1.00:1). That is accepted, because the accent
  still separates from the fill (5.2–9:1). Never rely on accent against ink to carry meaning.

### Why `onPrimaryFixedVariant`

WCAG 2 contrast ratio of each candidate against the fill (`tertiaryFixed`):

| Candidate | Light | Light MC | Light HC | Dark | Dark MC | Dark HC | Min | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `primary` | 5.01 | 2.31 | 1.55 | 1.31 | 1.05 | 1.14 | 1.05 | fails: in dark it is a light mint (#5EDF86) on the pale fill |
| **`onPrimaryFixedVariant`** | **7.26** | **5.20** | **9.00** | **7.26** | **9.26** | **14.61** | **5.20** | passes, ≥ 4.5 in all 6 schemes |

Other pairs (from `contrast.json`):

| Pair | Light | Light MC | Light HC | Dark | Dark MC | Dark HC | Min | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ink / tile | 4.57 | 5.18 | 9.01 | 4.57 | 7.00 | 11.28 | **4.57** | ≥ 3, linted |
| ink / fill | 8.67 | 5.20 | 9.00 | 8.67 | 13.26 | 15.24 | **5.20** | ≥ 3, linted |
| accent / fill | 7.26 | 5.20 | 9.00 | 7.26 | 9.26 | 14.61 | **5.20** | ≥ 3, linted (fill on accent has the same values) |
| fill / tile | 1.90 | 1.00 | 1.00 | 1.90 | 1.90 | 1.35 | 1.00 | not linted: the ink outline carries the silhouette |
| accent / ink | 1.19 | 1.00 | 1.00 | 1.19 | 1.43 | 1.04 | | for information: the accent never relies on ink |
| accent / tile | 3.83 | 5.18 | 9.01 | 3.83 | 4.89 | 10.82 | | for information: forbidden by the accent rule |

In light and dark, the green accent is a deep brand green, only slightly lighter than the ink (1.19:1). On the pale
fill it reads as "green ink", not as a second bright colour. Its job is to mark the one meaningful thing inside an
object (the liquid, the ECG, the straws, the beak), not to stand apart from the outline.

**Fill = `tertiaryFixed`** (pale ice blue) is unchanged from v2. It is the only light role that stays light in light,
dark, dark MC and dark HC, and its hue separates it from the green tile. The `surface*` roles and `onPrimary` turn
black in dark, or white under white ink, and `primaryFixed` matches the tile exactly in light MC/HC. **Tile =
`primaryContainer`** is the app's module colour.

**Dark matches light.** In the colour library, `primaryContainer`, `onPrimaryContainer`, `tertiaryFixed` and
`onPrimaryFixedVariant` are identical in `light` and `dark` (it uses the Fidelity variant), so those two Lottie files
differ only in their names. That is correct per the library, not a bug.

**Theming.**

- **Web SVG:** every painted element has the light hex as an attribute and a role class
  `fill: var(--antz-<role>, <light hex>)`. Inline in a themed page, the variables win. As an `<img>`, the light
  fallback applies.
- **Lottie** can't read variables, so the build bakes one file per scheme. Load `lottie/<name>.<scheme>.json` for the
  active scheme. Lottie layer and group names are the spec layer ids.
- Class names, keyframes and clip ids are prefixed `antz-p-<name>-`.

## 3. Motion: a story beat, then rest

| Rule | Value |
| --- | --- |
| Loop | 3.0–4.5 s in **0.1 s steps**, **unique per icon** (see §4). |
| Story | 2–4 beats, and **every key change ends by t = 0.72**. The rest of the loop is still, so a grid of 30 is mostly still, and the different loop lengths keep the icons out of step. |
| Seamless | the first key equals the last key, for every property |
| Static pose | frame 0 = end frame = reduced-motion pose. It must be a **complete illustration**: the ECG fully drawn, both prints down, the egg closed, the liquid level. |
| Easing | `cubic-bezier(.45,0,.55,1)` on every segment (applied automatically) |
| Amplitude | translate ≤ **4px**, rotate ≤ **12°**, scale **0.9–1.1**, opacity 0–1, trim 0–1 |
| Particle exception | short-lived bits (dust, bubbles, sparks) flagged `particle: true` may travel up to **8px**. They must be **invisible (o = 0) at rest**, at frame 0 and at the end. Use the flag for things that appear and vanish, never for the main object. |
| Elements | at most **4 animated elements** per icon. Parts of one element (three bubbles, two dust dots) count as one: mark the extra parts `animSibling: true`. The tile never moves. |
| Visible | in every scheme, at least one peak must differ from the rest pose by 2% or more of the tile's pixels (checked by the validator). |
| Reduced motion | automatic. The SVG drops its animations under `prefers-reduced-motion: reduce` and shows frame 0. For Lottie, call `goToAndStop(0, true)`. |

`build.mjs` enforces these rules by linting the spec, and `validate.mjs` checks them in rendered pixels.

### Story-beat guidance

- **Write one sentence.** Write `motion` first, in the form "<Name>: <beat>, <beat>, then rest." If it needs two
  sentences, cut a beat.
- **Make the beat the module's verb**, acted out by the object. The paw presses (walk), the ECG redraws (monitor),
  the egg hatches (incubate), the liquid sloshes (test). Avoid a generic bounce, spin or pulse.
- **Go from anticipation to action to settle.** For example: lift (scale 0.92, −3.5px), press (1.04), settle (1).
  Overshoot once, and keep it small.
- **Stagger the supporting things** after the main action, so the eye follows one thing at a time. The dust comes
  after the press, the bubbles after the surge, and the cross beats as the ECG spike passes.
- **Use particles as punctuation:** 2–3 of them, each fading in and out within about 0.2 of the loop.
- **Erase, then redraw** (opacity out, then trim back in) to "replay" a line. Keep `o = 0` whenever `ts = te`.
- **Pick the two peaks** that a reviewer should see: the most-changed moment of each beat. Pick a `restAt` in the
  rest phase (0.72–1, usually 0.85). These drive the validator and the frame strip.
- At 48px, motion under about 2px reads as jitter, not as a story. Prefer one bold move to several small ones.

### Pilot story beats

| Icon | Story (share of the loop) | Peaks | Static pose |
| --- | --- | --- | --- |
| Animals | The trail print fades out and back in (3–24%). The front paw lifts, scale 0.92 and −3.5px (20–32%), presses down to 1.04 (42%) and settles (50%). Two ink dust dots puff out sideways and down from under the pad, then fade (40–62%). | 32%, 47% | both prints down, no dust |
| Medical | The ECG line fades (4–12%), then re-draws left → right inside the bag face (15–50%). As the spike passes, the cross beats once: 1 → 1.1 → 1 → 1.06 → 1 (30–52%). | 20%, 35% | line drawn, cross at rest |
| Eggs | The egg wobbles −7° / +6° / −3.5° about its base (4–27%). A crack draws across it (27–38%). The top shell lifts −4px and −12° about its left hinge, and the chick rises 3.5px (40–56%). The shell settles with a 1° bump (56–69%) and the crack fades (62–69%). | 16%, 52% | closed egg, no crack |
| Lab | The green liquid surges and sloshes inside the flask clip: rotate −12° / +10° / −6° / +3°, shift ≤ 3.9px (4–52%). Three light bubbles rise out of it one after another, up to 7.5px, fading in and out (12–53%). | 14%, 32% | level liquid, no bubbles |

## 4. Loop-length registry

Every icon takes an **unused** length between **3000 and 4500 ms, in 50 ms steps** (`LIMITS.loopStep = 50`, 31
slots). The build fails if a length is out of range, isn't a multiple of 50, or is already used by another spec file,
by an entry in the `--out` folder's `index.json`, or by an entry in `library/primary/index.json`.

All 30 are built. One slot is free: **4500**. `order` is the nav position (1–30, unique, by user-facing importance);
`index.json` and the review page list the icons in that order.

| Loop (ms) | Icon | Order |
| --- | --- | --- |
| 3000 | `medical` | 6 |
| 3050 | `species` | 4 |
| 3100 | `family_tree` | 5 |
| 3150 | `hospital` | 7 |
| 3200 | `pharmacy` | 8 |
| 3250 | `housing` | 11 |
| 3300 | `move_animal` | 12 |
| 3350 | `diet` | 13 |
| 3400 | `animals` | 3 |
| 3450 | `kitchen` | 14 |
| 3500 | `mortality` | 15 |
| 3550 | `necropsy` | 16 |
| 3600 | `assessments` | 17 |
| 3650 | `transfers` | 18 |
| 3700 | `requests` | 19 |
| 3750 | `notes` | 20 |
| 3800 | `lab` | 9 |
| 3850 | `announcements` | 21 |
| 3900 | `notifications` | 22 |
| 3950 | `chat` | 23 |
| 4000 | `reports` | 24 |
| 4050 | `home` | 1 |
| 4100 | `dashboard` | 2 |
| 4150 | `staff` | 25 |
| 4200 | `eggs` | 10 |
| 4250 | `department` | 26 |
| 4300 | `security` | 27 |
| 4350 | `compliance` | 28 |
| 4400 | `activity_log` | 29 |
| 4450 | `settings` | 30 |
| 4500 | free | |

A new icon takes 4500, or the range has to widen. The coordinator assigns lengths up front; agents must not pick
their own, because two parallel agents can't see each other's unbuilt specs.

## 5. Writing a spec

Each icon is one file, `generators/primary/specs/<name>.mjs`, that default-exports a plain object. The file name must
equal `name`. The full format is documented at the top of `lib/model.mjs`.

The annotated example below is a "Schedule" icon: the library calendar, with today's cell marked in green, blinking
off and popping back in. It was linted and validated (6 schemes, accent rule) while this file was written, and
then removed from `specs/`. Its loop length is only an example; take the one you are assigned.

```js
// Schedule: the library calendar (library/line/calendar.svg) with today's cell in green.  ← header: scene,
// Story: today's marker blinks off and pops back in (scale 1.1), then rest.                   story and static
// Static pose: calendar with today marked.                                                    pose, in words
import { L, P, D } from '../lib/geo.mjs'; // L(d24) scales a 24-grid path onto the tile; P(x,y) a point; D(v) a length

const PAGE = [3, 5, 18, 16, 2];                       // the calendar's <rect> (24 grid): x y w h rx
const RINGS = 'M8 3V5M16 3V5M3 9H21';                 // copied VERBATIM from library/line/calendar.svg
const DAYS = 'M8 13V13M12 13V13M16 13V13M8 17V17M12 17V17';

export default {
  name: 'schedule',            // = file name = output file names
  order: 5,                    // position in index.json and the review page
  label: 'Schedule',           // aria-label
  module: 'Schedule',          // app module name
  baseIcon: 'calendar',        // library/line/<baseIcon>.svg
  base: [RINGS, DAYS],         // reused 24-grid strings: the build fails if the line icon changes
  motion: 'Booking: today’s marker blinks off and pops back in, then rest.',   // one sentence (§3)
  loopMs: 3100,                // the length ASSIGNED to you in the registry (§4)
  peaks: [0.14, 0.24],         // the two most-changed frames, each in (0, 0.72]: marker gone · marker at 1.1
  restAt: 0.85,                // a frame in the rest phase (0.72, 1)
  layers: [                    // drawn bottom → top
    { id: 'tile', shapes: [{ rect: [0, 0, 48, 48, 14] }], fill: 'tile' },        // always first, never animated
    { id: 'page', shapes: [{ rect: [...P(PAGE[0], PAGE[1]), D(PAGE[2]), D(PAGE[3]), D(PAGE[4])] }],
      fill: 'fill', stroke: 'ink', on: { stroke: ['tile', 'fill'] } },          // main object: fill in a 3px ink outline
    { id: 'rings', shapes: [{ path: L(RINGS) }], stroke: 'ink', on: ['tile', 'fill'] }, // `on` = what this paint sits on
    { id: 'days', shapes: [{ path: L(DAYS) }], stroke: 'ink', on: ['fill'] },
    {
      id: 'today',
      shapes: [{ rect: [26, 27.5, 8, 7, 2] }],         // 48 grid, in the empty 3rd cell of row 2, clear of the outline
      fill: 'accent',
      on: ['fill'],                                    // accent: ON THE FILL ONLY (§2). Even at scale 1.1 it stays
                                                       // ≥ 1px inside the page's inner edge
      anim: {
        origin: [30, 31],                              // transform origin, 48-grid px
        keys: [                                        // unset values carry over; the t=0 key is the static pose
          { t: 0 },
          { t: 0.06, o: 1, s: 1 },
          { t: 0.14, o: 0, s: 0.9 },                   // anticipation: gone
          { t: 0.24, o: 1, s: 1.1 },                   // action: pops back, within 0.9–1.1
          { t: 0.34, s: 1 },                           // settle, well before 0.72
          { t: 1 },                                    // = first key (seamless)
        ],
      },
    },
  ],
};
```

**Keys and flags:**

- Keys: `x`/`y` translate, `r` rotate (degrees), `s` scale, `o` opacity, and `ts`/`te` trim (stroke leaves only).
- `clip` is a static path; the content moves inside it. `clipMoves: true` moves the clip with the content.
- `layerize` goes on a top-level group whose children need their own masks inside a moving parent.
- The other flags are `particle`, `animSibling` and `decorative`. A `decorative` leaf is excluded from the contrast
  lint, which isn't allowed for an accent.
- Groups: `{ id, children, anim? }`.
- Shapes: `path`, `rect [x,y,w,h,rx]`, `circle [cx,cy,r]` and `ellipse [cx,cy,rx,ry]`.
- **Prefer explicit cubic paths to `rect`/`circle`/`ellipse` for anything but the tile.** Lottie draws those as its
  native `rc`/`el` primitives, which anti-alias slightly differently from SVG `<rect>`/`<circle>`. On a small
  rounded box or disc that can push the raw SVG/Lottie difference over its 1.5% budget. Draw the same outline as
  cubic beziers with `rrect(x, y, w, h, r)` and `disc(cx, cy, r)` from `lib/shapes.mjs` (quarter-circle constant
  0.5523). The SVG and the Lottie then rasterise the same curve.
- A static rotation is baked into the geometry, not keyed (see `paw()` in `specs/animals.mjs`).

**Checklist:**

- Every painted leaf has an `on`, except the tile and `shade`.
- Accent paints have `on: ['fill']` only.
- Small parts are solid ink.
- At most 5 shapes and 4 animated elements.
- The static pose is complete.

## 6. Building and validating a subset (parallel agents)

Work from `library/generators/primary/`, and run `npm ci` there once. Each agent builds **only its own names, into its
own folder**, so nothing touches `library/primary/` until the coordinator merges:

```
# 1. Lint only (fast): motion, contrast, accent rule, structure, base paths, loop registry.
node build.mjs --names schedule --dry-run

# 2. Build into a private folder. It is created if needed; its index.json is read-modify-write.
node build.mjs --out /tmp/primary-schedule --names schedule

# 3. Validate those names: SVG = Lottie in 6 schemes, peaks visible, rest = frame 0, reduced motion, accent rule.
node validate.mjs --out /tmp/primary-schedule --names schedule --png /tmp/primary-schedule/frames.png --report /tmp/primary-schedule/report.json

# 4. Look at the strip (and /tmp/primary-schedule/review.html) at 48px, and iterate on the spec.

# 5. Coordinator, once approved: merge into the library. index.json keeps every other icon's entry.
node build.mjs --names schedule
node validate.mjs --names schedule --png /tmp/primary-frames.png
```

| Flag | build.mjs | validate.mjs |
| --- | --- | --- |
| `--out <dir>` | output folder (default `library/primary`) | the folder build wrote to (default `library/primary`) |
| `--names a,b` | build only these specs. Other spec files are still read for the loop registry, and a broken one is skipped with a warning. | validate only these icons from `<dir>/index.json` |
| `--dry-run` | lint only, write nothing | |
| `--png <file>` | | frame strip (default `<tmpdir>/antz-primary-validate/frames.png`) |
| `--report <file>` | | JSON report |
| `--variant <v>` | `both` (default), `filled` or `stroke` | `filled` (default) or `stroke` |

**Merging.** `index.json` and `contrast.json` are **read-modify-write**:

- A built icon replaces its own entry in place, keeping a hand-set `status`, or is appended if it is new.
- Entries for icons that weren't built are never dropped, including icons that have no spec here.
- `review.html` shows every icon in the merged index that has a spec.

The v2 positional forms still work: `node build.mjs <outDir> [names...]` and
`node validate.mjs <dir> <png> [report]`.

## 7. Validation

`validate.mjs` renders every icon at four story times (frame 0, peak A, peak B and rest), in all 6 schemes, at
48 CSS px and 2×, as SVG and as Lottie (lottie-web 5.12.2). It fails on any of these:

- a structural SVG/Lottie difference over 0.1% (3×3-block metric that ignores 1px anti-aliasing seams);
- a raw SVG/Lottie difference over 1.5%;
- a rest pose that differs from frame 0;
- a reduced-motion SVG that differs from frame 0;
- peak motion under 2%;
- an accent pixel touching the tile.

**v2.1 result, all 30 icons, both variants** (re-run after the transfers / hospital / move_animal redraw and the
Stroke variant; per variant 30 icons × 6 schemes × 4 times = 720 cells, 0 failures, 3 pages of 10):

| Check | Filled | Stroke |
| --- | --- | --- |
| Structural SVG/Lottie difference | ≤ 0.098% (trim-path peaks of `medical`, `necropsy`, `assessments`, `kitchen`; 0.000% elsewhere) | ≤ 0.098% (same icons) |
| Raw anti-aliasing difference | ≤ 1.43% (worst: `activity_log`) | ≤ 1.43% (worst: `mortality`) |
| Rest vs frame 0, reduced motion vs frame 0 | 0.000% | 0.000% |
| Accent rule | **0** accent pixels touching the tile | **0** accent and **0** light-fill pixels |
| Ink on tile | | ≥ 4.57:1 in all 6 schemes |
| Peak motion, weakest icon | 2.5% (`lab`), up to 19% | 2.55% (`medical`), up to 18% |

The structural differences on trimmed strokes appeared in this re-run on unchanged filled files (they were 0.000% in
the first v2.1 run), so they are renderer drift on partial trims, still under the 0.1% limit.

**Validate in pages of 10 or fewer.** One page with all 30 icons is taller than headless Chrome can capture, and
the last rows come back garbled. They show up as false SVG/Lottie and rest-pose failures on whichever icons come
last. Run `--names` with 10 names per call:

```
node validate.mjs --names home,dashboard,…,eggs --png frames-1.png   # orders 1–10, then 11–20, 21–30
```

Validate the stroke variant the same way, with `--variant stroke`, also in pages of 10.

## 8. Stroke variant

Every icon ships in two variants. **Filled** is everything above (`svg/`, `lottie/`). **Stroke** (`svg-stroke/`,
`lottie-stroke/`, `index.json` `svgStroke` / `lottieStroke`) is the same tile (48, rx 14, `primaryContainer`), the
same scene, the same motion and the same `loopMs`, drawn **outline only: monochrome ink on the tile**.

| Rule | Value |
| --- | --- |
| Objects | no light fill, a 3px `onPrimaryContainer` (ink) outline with round caps and joins (the filled outline, unchanged) |
| Shade / highlight | none: `shade` paints are removed, and a leaf left with no paint is dropped |
| Accent | none. The green becomes ink: an accent stroke keeps its width in ink; an accent area becomes a 2px ink outline (inner detail) |
| Small solid parts | toes, eyes, wheels, dots and windows stay **solid ink** where an outline would be unreadable at 48px |
| Fill-only shapes | (liquid, food, bars, tags) become outlines, or a single line where an outline would double up (diet food) |
| Contrast | only ink on tile is left: ≥ 4.57:1 in all 6 schemes (rule ≥ 3:1, linted by build and checked by validate) |
| Roles allowed | `tile` and `ink` only. The build fails if `fill`, `accent` or `shade` is left in a stroke spec |

**Derived, not drawn.** The stroke variant is generated from the one spec per icon by `lib/stroke.mjs`
(`toStrokeSpec`). The paint rules, per leaf:

| Filled paint | Stroke paint |
| --- | --- |
| `fill: 'fill'` (a light body) | `fill: 'tile'`: a **knockout**. It is invisible on the tile, so the object reads as "fill none", but an object in front still hides what is behind it (the building hides the elephant, the cab hides the route). Without it, overlapping outlines show through each other. |
| `fill: 'fill'` on the accent (a bubble, an axle) | `fill: 'ink'` |
| `fill: 'accent'` | `fill: 'tile'` knockout plus a 2px ink outline (when it had no stroke) |
| `stroke: 'accent'` | `stroke: 'ink'`, same width |
| `stroke: 'fill'` on the accent (the pharmacy cross) | `stroke: 'ink'` |
| `stroke: 'fill'` elsewhere (a hub mark on an ink wheel) | `stroke: 'tile'`: it stays a cut-out |
| `fill`/`stroke: 'shade'` | removed |
| `ink`, `tile` | unchanged |
| `on` | recomputed: every ink paint sits on the tile |

**Overrides.** A spec may carry a `stroke: { ... }` block for icons that need a hand tweak after the automatic rules:
`drop: [ids]` removes layers, `patch: { <id>: { ...props } }` merges props into a layer (a `null` value deletes a
prop), `add: [{ after: <id>, layer }]` inserts a layer (e.g. hatch lines), and `peaks` / `restAt` replace the
validator times. Overrides never change the filled output. Current overrides (8 of 30):

| Icon | Override | Why |
| --- | --- | --- |
| `home` | the door light stays solid ink | as a 2px outline its flicker moved only 0.7% of the pixels (< 2%) |
| `chat` | the typing dots stay solid ink | three small rings read as "ooo" at 48px |
| `pharmacy` | drop the label box; the cross sits on the bottle in ink | a box round the cross inside the bottle is too busy |
| `lab` | drop the shine; the bubbles stay rings (tile knockout in their ink ring) | the shine only meant something on green; solid ink bubbles read as blobs |
| `eggs` | one straw curve, not three straws | three ink straws under an outlined nest are clutter |
| `diet` | the food is one mound line (2.5px) | an outlined ellipse inside the rim ellipse reads as a double rim |
| `settings` | drop the hub ring; the axle stays a solid ink dot | rings within rings at 48px |
| `mortality` | the eyes are cubic `disc()` paths | native circles pushed the raw SVG/Lottie difference to 1.52% (budget 1.5%) |

**Output.** The SVG classes, keyframes and clip ids are prefixed `antz-p-<name>-stroke-`, so both variants can be
inlined on one page. The Lottie `nm` is `antz-primary-<name>-stroke-<scheme>` with `meta.variant: "stroke"`. Layer
and group names are the same spec ids as in the filled file.

**Validation** (`node validate.mjs --variant stroke --names …`, pages of 10): the same checks as §7 (SVG = Lottie,
6 schemes, frame 0 = rest = reduced motion, peak motion ≥ 2%). The accent-rule probe becomes **no accent and no
light fill at all**: the accent is painted #FF00FF and the fill #FFFF00, and any such pixel fails. Ink on tile is
checked at ≥ 3:1 in all 6 schemes.

