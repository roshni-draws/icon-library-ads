# ANTZ Icon Builder

A workspace for the **ANTZ Rounded** icon set. Every icon is drawn from scratch with a **line** version (2px round
strokes) and a **filled** version (solid, details cut out at 2px). Material Symbols are only a reference and a
source of guard rails.

The app follows one path: **Library** (Line icons, Filled icons, Primary icons) and **Icon builder** (build, check against the
Material 3 guard rails, name and add to the library).

- **Sidebar (always there):** Library: *Line icons* and *Filled icons*, each with the number drawn, and *Primary
  icons* (animated tile badges) with their count. Icon builder:
  *New icon* and *Drafts* (the unsaved work in this browser, if any). At the bottom: live/snapshot status, *Display*
  (scheme, icon colour, references on empty slots) and *Export*. Under 1100px the sidebar becomes an icon rail;
  under 720px it is a drawer behind a menu button.
- **Routes (URL hash):** `#/library/line`, `#/library/filled` (with `module`, `status`, `q`, `size`, `sel`),
  `#/library/primary` (with `q`, `cols`, `pv`, `fmt`, `pgroup`, `wall`, `sel`), `#/builder` and `#/builder?slot=egg_nest`. `scheme`, `colour` and `refs` ride along on any route.

The icon files in `../library/` are the source of truth. The style spec is in `../library/STYLE.md`.

Same stack as the Design System Previewer: Vite + React 18 + TypeScript, with the state in the URL hash.

## Run

```sh
npm install
npm run dev            # http://localhost:5181 (read and write ../library through the dev server)
npm run build          # type-check + production build into dist/ (a read-only snapshot of the library)
npm run check          # node scripts/check-library.mjs: guard-rail report for every library SVG (exits 1 on a fail)
npm run validate       # index.json: names, statuses, Material references, sources
npm run seed-library   # one-off seed of ../library/index.json from the inventory (refuses to overwrite; --force to reseed)
```

`check-library.mjs` options: icon names to check only those, `--quiet` (problems only), `--json`.

## Library (`../library/`)

```
index.json          { version: 1, style: "antz-rounded", icons: [ { name, label, module, status, sources, reference, tags, notes } ] }
line/<name>.svg     line version
filled/<name>.svg   filled version
merge-log.csv       source_file,library_name,section,original_label,suggested_material
STYLE.md            the ANTZ Rounded spec and guard rails
```

### How it was seeded

`scripts/seed-library.mjs` read `src/data/inventory.json` (451 mobile SVGs) and made one icon per distinct
meaning:

- It left out the 73 unused files and the 3 brand logos (ANTZ, Vantara, WhatsApp). That leaves 375 source files.
- Files that mapped to the same Material name or custom draft were merged. This covers state variants (selected,
  active, focused, `_white`, `_filled`, grey, inactive, colour roles), alternates and exact duplicates.
- Files that share a Material name but mean different things were split into separate icons. Examples:
  `keyboard_arrow_up` became `expand_less` and `priority_high`; `ambulance` became `hospital_transfer` and
  `carcass_pickup`; `sort_by_alpha` became `sort_a_to_z` and `sort_z_to_a`.
- Result: **210 icons** from 375 sources. 165 files were merged into another icon, and 88 icons have more than one
  source. Every merge is listed in `merge-log.csv`.
- `module` is the PDF section. `reference` is the earlier suggested Material name (`null` for custom concepts).
  Every icon started as `to_design`.

Three example icons (`egg`, `done`, `location`) are drawn in both styles, set to `draft` and pass every check.
They prove the pipeline.

### Primary icons (`../library/primary/`)

Illustrative, animated "tile badge" icons for module navigation: a 48 x 48 rounded tinted tile with a glyph and a
gentle loop. They are written by the design agent; the app reads them and only changes `status` (and `label` /
`module`) in `index.json`.

```
index.json                    { version: 1, style, schemes, icons: [ { name, label, module, status, baseIcon, loopMs,
                                order, motion, svg, lottie: { <scheme>: path }, variants: ["filled","stroke"],
                                lottieStroke: { <scheme>: path } } ] }
svg/<name>.svg                self-contained animated SVG: CSS keyframes inside, class names prefixed per icon,
                              colours as var(--antz-<role>, #fallback), and a prefers-reduced-motion rule
lottie/<name>.<scheme>.json   Lottie with that scheme's colours baked in, 6 per icon: light, light-medium-contrast,
                              light-high-contrast, dark, dark-medium-contrast, dark-high-contrast
svg-stroke/<name>.svg         optional stroke variant (outlined glyph) of the SVG, same rules
lottie-stroke/<name>.<scheme>.json   optional stroke variant of the Lottie files, same 6 schemes
```

Filled (`svg/`, `lottie/`) is the default variant. The stroke files are optional per icon: the app finds them on disk
the same way, and an icon without any shows a dashed "No stroke version" cell when Stroke is selected.

The app finds the Lottie files by that file-name pattern on disk (the `lottie` map in `index.json` lists the same
paths). Tiles are sorted by `order` (1–30); an entry without one keeps its place in the file, after the ordered ones.

A missing folder, an empty or half-written `index.json`, or a missing file per icon is shown calmly in the UI (an
empty state or a dashed "No SVG / No Lottie" cell), never as an error page.

To try the page without touching `library/`, point the dev server at another folder with the same layout:
`ANTZ_PRIMARY_DIR=/path/to/fixture npm run dev`.

## Library section

- One page per style: **Line icons** or **Filled icons**. The header has the title and counts, search (name, label,
  old file, module, reference), a module filter, a status filter (All, To design, Draft, Approved) and the size (16
  to 48).
- A grid grouped by module. Arrow keys move between tiles (up and down go to the nearest tile in the next row),
  Home and End jump to the first and last.
- An icon with no SVG in this style is a dashed slot, with faint references (the old mobile SVG and the Material
  reference or earlier draft; turn them off under Display). Hovering or focusing a slot shows **Build**, which opens
  the builder linked to that slot (`#/builder?slot=<name>`).
- **Detail panel** (click a tile, Esc closes):
  - a large preview in the page's style on the 24 grid with keylines, and a Line / Filled toggle to peek at the other
  - Edit in builder, Copy name, Copy SVG (of the style shown)
  - status (Mark draft, Approve, Reset), which writes `index.json`
  - guard rails for the style shown (both styles' results as chips)
  - the Material reference and earlier draft, the old sources (old SVG, what it indicates, where it is used, old
    mapping), tags, notes and file paths
- **Display** (sidebar): the 6 ANTZ schemes for the whole app (light by default) or "Compare all 6" on the library
  grid; the icon colour (any ANTZ role).
- **Live reload:** the dev server watches `../library/`. When an SVG or `index.json` changes on disk, it sends the
  HMR event `antz:library-changed`, and the page reloads the library. It also reloads when the window regains focus.

## Primary icons section

- **Header:** title and count, search (name, label, module, base icon), **Variant** (Filled | Stroke, in the hash as
  `pv=stroke`; Filled is the default and is left out), **Format** (SVG | Lottie), **Motion**
  (Play | Pause | Reduced), **Layout** (Tiles | Wall), **Group by module** and the size (48, 64 or 96). Motion starts
  on Reduced when the OS asks for reduced motion, and follows the OS setting if it changes. Layout and grouping ride
  in the hash (`wall=1`, `pgroup=1`).
- **Grid:** one flat grid in `order` by default; with **Group by module** on, one section per module (in the order
  each module first appears). Slightly larger cells, each tile playing its loop.
- **Wall:** every icon at 48px in a tight grid with no labels or cards, to judge the set together. It is always flat
  and 48px (the size and grouping controls are disabled); hover shows the order and label, click opens the detail.
  - SVG mode inlines the SVG, so its `--antz-*` roles follow the scheme chosen under Display (all 6). Ids are made
    unique per tile, and the icon's own `prefers-reduced-motion` rules are moved under the page's Reduced switch.
  - Lottie mode plays `<name>.<scheme>.json` for the scheme chosen under Display (all 6). If that file is missing it
    falls back to `<name>.light.json` or `<name>.dark.json` of the same mode (then the other mode). It uses
    `lottie-web` 5.13.0 (the `lottie_light` SVG-only build), loaded only when Lottie is first used. Each player's
    element carries `data-src` (the file it plays), which makes the scheme easy to check.
  - Off-screen work stops (one shared IntersectionObserver, 120px margin): SVG tiles pause their CSS animations, and
    Lottie players are created only when a tile comes into view and destroyed when it leaves, so 30 icons keep only
    the visible players alive.
- **Variant** applies to the tiles, the wall and the detail panel, in SVG and Lottie: Stroke inlines
  `svg-stroke/<name>.svg` or plays `lottie-stroke/<name>.<scheme>.json` (same scheme fallback as filled). Icons with no
  stroke files show a dashed "No stroke version" cell.
- **Detail panel** (click a tile, Esc closes): SVG and Lottie side by side at 192px (in the chosen variant), a compare
  row with Filled and Stroke at 96px in the chosen format (click one to switch the page's variant), a scrubber (0–100% of the loop,
  for both formats; the play button returns to the Motion setting), the loop duration (index `loopMs`, plus the
  Lottie's frames and fps), the `motion` description and `order`, status (Mark draft, Approve), Copy SVG, Download SVG,
  **Lottie (all schemes, ZIP)** (`lottie/<scheme>/<name>.json`) or one scheme file (Light … Dark HC), the base icon
  (`baseIcon`) in line and filled, linking to its detail, and the 7 file paths (the Lottie being played is marked).
  A **Stroke** download row adds the stroke SVG, the stroke Lottie for the current scheme and the stroke **Lottie (all
  schemes, ZIP)** (`lottie-stroke/<scheme>/<name>.json`); the stroke file paths are listed too.
- The line and filled detail panels show a small **Primary version** preview when an icon is some Primary icon's
  `baseIcon`, linking to it.

## Icon builder section

One screen in three numbered steps, with a stepper at the top that shows each step's state (click to jump). On wide
screens the three steps sit side by side; on narrower ones Build and Check stay side by side and Name and add moves
below.

1. **Build**
   - Mode tabs: **Upload or paste** (file, drag and drop or pasted code, separately for line and filled), **From
     parts** (a base, a drawn library icon or any Material Symbol, plus a badge: add, check, close, clock, alert or
     dot, bottom-right with a 2px cut-out gap; a Material base is flagged "Material base, redraw recommended") and
     **Draw** (Select/move V, Line L, Pen P, Rectangle R, Circle C, Ellipse E; 1px snap, 0.5 optional; 45° angles;
     arrow keys nudge, Delete removes; in filled, "Draw as 2px cut-out" draws into a `<mask>`). Outside Draw the
     canvas only selects and nudges.
   - **Line | Filled** tabs above the canvas, each with its guard-rail result. Next to the canvas: the other style
     (click to switch), live previews at 16, 20, 24 and 48, "Line to filled" and Clear. Undo/redo:
     Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z.
   - Overlays: grid, live area and padding, the 4 keylines, and a 2px gap preview.
   - Uploads are normalised (`src/lib/normalize.ts`): viewBox scaled to 24 (including Material's `0 -960 960 960`),
     transforms and groups baked in, colours to `currentColor` (masks keep white and black), ids, classes, styles and
     metadata stripped (the mask id is kept), numbers rounded to 3 decimals. The notes list what changed.
   - **SVG code** (collapsed, two-way): edit the markup of the active style and the canvas follows.
2. **Check: Guard rails · Material Design 3** (the title links to
   https://m3.material.io/styles/icons/designing-icons in a new tab). Every rule for the active style, fails first,
   with pass, info, warn or fail and its source (M3 or ANTZ). Rules marked with a target highlight on the canvas when
   selected: live area against the ink box, the keyline used, the pixel grid, the 2px gap preview and the 24 canvas.
3. **Name and add to library:** name (snake_case, unique), label, module (existing or new), tags and, optionally, a
   "To design" slot to fill (or a draft to replace). A summary of both styles' guard rails sits above **Add to
   library**, which writes both SVGs and updates `index.json` as a Draft. If only one style is drawn, or a guard rail
   fails, it asks first. On success a toast offers **View in library**.

Unsaved builder work is autosaved to localStorage (`antz-icon-builder:builder-draft:v1`) and listed under Drafts in
the sidebar. *New icon* clears it (after asking; Undo brings the drawing back).

## Dev-server API (`vite.config.ts`, dev only)

| Method | Path | Body | Does |
| --- | --- | --- | --- |
| GET | `/api/library` | | `{ index, svgs: { line: {name: svg}, filled: {name: svg} } }` |
| PUT | `/api/library/icon` | `{ entry, line?, filled?, replaces?, overwrite? }` | writes the SVGs, then `index.json` (each through a temp file + rename). The default status is `draft`. Returns 409 if the name already exists and is neither `replaces` nor `overwrite: true`. |
| PATCH | `/api/library/icon/:name` | `{ status?, label?, module?, tags?, notes?, reference? }` | updates one entry |
| GET | `/api/primary` | | `{ present, error, index, svgs: {name: svg}, lottie: {name: {<scheme>: true}}, svgsStroke: {name: svg}, lottieStroke: {name: {<scheme>: true}} }` (stroke maps empty when the folders are missing), icons sorted by `order`; `present: false` when the folder is missing |
| PATCH | `/api/primary/icon/:name` | `{ status?: "draft" \| "approved", label?, module? }` | updates one Primary entry; every other key in `index.json` is kept |
| GET | `/primary/lottie/<name>.<scheme>.json`, `/primary/svg/<name>.svg`, `/primary/lottie-stroke/<name>.<scheme>.json`, `/primary/svg-stroke/<name>.svg` | | the files as they are (404 if missing) |

Safety rules:

- Names must match `^[a-z0-9_]+$`, and every path is resolved and confirmed to sit inside `library/`.
- SVGs must parse, stay under 200 kB, and contain no script or event handlers.
- Writes are serialised, so two saves never interleave on `index.json`.
- Primary SVGs with script or event handlers are left out of `/api/primary`; the page also strips them before inlining.
- The middleware only runs in dev (`configureServer`). The production build bundles a read-only snapshot
  (`virtual:library`, `virtual:primary`) and copies the Primary files into `dist/primary/`.
- The watcher on `../library/` also covers `primary/` (and `ANTZ_PRIMARY_DIR` when set), with the same
  `antz:library-changed` event.

## Exports (Export in the sidebar, built from the library)

- **Library (.zip):** `line/`, `filled/`, `index.json`, both sprites, `antz-icons.css` and a README.
- **antz-icons-line.svg / antz-icons-filled.svg:** sprites with one `<symbol id="antz-<name>" viewBox="0 0 24 24">`
  per drawn icon. Mask ids get the icon name added, so they never clash. Use them as
  `<svg class="antz-icon"><use href="antz-icons-line.svg#antz-egg"/></svg>`.
- **index.json** and **antz-icons.css** (size and colour-role classes, with no icon font).
- **Primary icons (ZIP):** `svg/`, `lottie/<scheme>/`, and for icons that have one the stroke variant in `svg-stroke/`
  and `lottie-stroke/<scheme>/` (one folder per scheme: `light`, `light-medium-contrast`,
  `light-high-contrast`, `dark`, `dark-medium-contrast`, `dark-high-contrast`), `index.json` (sorted by `order`) and a
  README. The README explains how to pick the scheme file (load `lottie/dark/<name>.json` when the app is in dark mode,
  `lottie/dark-high-contrast/` when contrast is also raised, and so on), with usage for the web (inline SVG, `<img>`,
  lottie-web), React Native (`lottie-react-native`, a map of the six `require(...)`s per icon) and Flutter (`lottie`
  package, `Lottie.asset('assets/primary/lottie/$scheme/<name>.json')`).

## Guard rails

All the numbers are in `src/lib/guardrails.ts`. The checker (`src/lib/checker.ts`) uses them in the builder, the
library drawer and `scripts/check-library.mjs`. The values follow `../guardrails/m3-icon-spec.md` where M3 states
them. ANTZ house rules are labelled as such. See `../library/STYLE.md`.

## Files

```
vite.config.ts                  Material Symbols plugin, library API + watcher, virtual:library snapshot,
                                Primary API + file serving + virtual:primary snapshot
src/App.tsx                     shell (sidebar + page), hash routes
src/components/                 Sidebar (nav, drafts, display settings, export), Library (page header, filters, tile grid),
                                IconDrawer (detail panel), Primary (Primary icons page, detail, SvgArt, LottieArt), Report
                                (rule lists), Overlay, Icon, Segmented
src/builder/                    Builder (3-step screen, save, autosave), Canvas (draw tools), doc (document model, pen paths, snapping)
src/parts/parts.ts              badge parts (line and filled snippets)
src/lib/                        primary (Primary data, inlining, Lottie loader, off-screen observer), guardrails, checker, svg (parser, paths, sampling), normalize, compose, iconLibrary (API + live reload),
                                exporters, symbols (Material), library (colours), hash, data (inventory reference), custom (earlier drafts)
src/data/inventory.json         the 451 mobile SVGs with what they indicate (reference for sources)
src/custom/, src/data/custom.json  the earlier first-pass custom drafts (shown as references only)
scripts/                        check-library.mjs, seed-library.mjs, validate-names.mjs, draw-custom.mjs (old drafts)
public/current/                 the current mobile SVGs (old references)
```
