# ANTZ Rounded: icon style spec

This folder is the source of truth for ANTZ icons. Each icon has a **line** (stroked) and a **filled** (solid)
version, drawn from scratch. Material Symbols are a reference and a source of guard rails only.

All guard-rail numbers live in one file, `app/src/lib/guardrails.ts`. The builder, the library drawer and
`node app/scripts/check-library.mjs` all use the same checker (`app/src/lib/checker.ts`). Each rule below says
where it comes from:

- **M3**: stated in `../guardrails/m3-icon-spec.md` (the Material 3 icon design guidance).
- **ANTZ**: an ANTZ house rule. Either M3 gives no value, or ANTZ departs from M3 on purpose.

## Files

```
library/
  index.json          { version, style: "antz-rounded", icons: [ { name, label, module, status, sources, reference, tags, notes } ] }
  line/<name>.svg     line version
  filled/<name>.svg   filled version
  merge-log.csv       source_file → library name (how the 375 mobile SVGs were merged)
  STYLE.md            this file
```

- `name` is snake_case (`^[a-z0-9_]+$`) and unique. It is the file name and the sprite id (`antz-<name>`).
- `status` is one of `to_design`, `draft` or `approved`. A drafted icon needs both SVGs.
- `module` is the section of "Icon inventory — mobile app.pdf".
- `sources` lists the old mobile SVG files this icon replaces. Their state variants (selected, active, `_white`,
  grey, colour roles) and duplicates are merged into one icon. State is shown with line or filled plus a colour role,
  not with separate icons.
- `reference` is the Material Symbols name used as a reference, or `null`.

## Canvas and keylines

| Rule | Value | Check | Source |
| --- | --- | --- | --- |
| Canvas | `viewBox="0 0 24 24"`, `width="24" height="24"` | fail if the viewBox is wrong, warn if width/height are missing | M3 |
| Live area | 2–22 (2px padding on every side) | content outside 0–24 **fails**. Content in the padding **warns** (M3 "Caution": only for extra visual weight). | M3 |
| Keylines, all centred | square 18 × 18, circle Ø20, portrait 16 w × 20 h, landscape 20 w × 16 h | info: which keyline the icon fits | M3 |
| Pixel grid | whole pixels (1px) for endpoints, centres, radii and sizes. Curve control points are not checked. | off-grid values **warn** | M3 ("position on pixel") |

With a centred 2px stroke, integer coordinates give crisp edges (edge = coordinate ± 1). The builder snaps to
1px by default. A 0.5px snap is an optional toggle.

## Line SVG

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="…"/> <circle …/> <rect … rx="2"/> <line …/> <polyline …/> <ellipse …/>
</svg>
```

| Rule | Value | Check | Source |
| --- | --- | --- | --- |
| Elements | `path`, `circle`, `rect`, `line`, `polyline`, `ellipse`. One `<mask>` and a `<g mask>` are allowed for badge cut-outs. | other elements, `transform`, `style`, `class`, or ids other than the mask id **fail** | ANTZ |
| Colours | `currentColor` only | anything else **fails** | ANTZ |
| Stroke width | 2 | 2 passes. 1.5 is **info** (allowed by M3 as an optical correction for complex detail). Anything else **fails**. | M3 |
| Caps and joins | round caps, round joins | anything else **fails** | **ANTZ rule.** M3 outlined uses squared terminals and square inner corners. ANTZ Rounded uses round caps, round joins and rounded inner corners on purpose ("rounded edges"). |
| Corner radius | outer corners ≥ 2 (`rect rx ≥ 2`, or arcs in paths). Shapes 2px wide or less need no rounding. | rect rx < 2 **warns**. Path corners are checked by eye. | M3 |
| Gap | at least 2px of clear space between separate strokes | closer **warns** | ANTZ rule (M3 gives no value) |
| Complexity | at most 12 shapes, 60 commands in one path, 120 in all | more **warns** | ANTZ |
| Fills | none: line icons are strokes only | filled shapes **warn** (often a Material or traced base) | ANTZ |

## Filled SVG

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="…outer silhouette…  …inner detail…"/>
</svg>
```

- The same silhouette as the line version, solid. The outer edge of the filled version is the outer edge of the
  line version's stroke (the line centre line pushed out by 1px).
- Inner details are cut out at 2px width, either with `fill-rule="evenodd"` or with **one** `<mask>`: a white
  shape, plus black `stroke-width="2"` round details (`stroke-linecap="round" stroke-linejoin="round"`).
- No visible strokes outside the mask (**fails**).
- The mask id is the only id allowed. Exports add the icon name to it (`antz-<name>-cut`), so sprites never clash.

Example (`done`):

```svg
<svg … fill="currentColor">
  <mask id="cut">
    <circle cx="12" cy="12" r="10" fill="white"/>
    <path d="M8 12L11 15L16 9" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </mask>
  <circle cx="12" cy="12" r="10" mask="url(#cut)"/>
</svg>
```

## Badges (build from parts)

Badges (add, check, close, clock, alert, dot) sit in the bottom-right corner, centred on (17, 17). Their ink
radius is 5, so the ink reaches 22 at most. The base is cut away by a mask circle of the badge radius + 2, which
gives a 2px gap (ANTZ rule). In line icons the badge is the stroked glyph. In filled icons it is a solid disc with
the glyph cut out at 2px. The parts are in `app/src/parts/parts.ts`.

## Builder draw tools

The draw tools snap to 1px by default (0.5px is optional) and snap lines and pen segments to 45° steps (ANTZ
rule, M3 gives no value). The pen draws straight segments with rounded (quadratic) corners. Its corner radius is
2 by default.

## How the checker measures

- **Extent and keylines:** each shape outline (curves and arcs included) is sampled every 0.25px. Stroked shapes
  grow by half the stroke width. This is exact for round caps and joins.
- **Gap:** each subpath is one stroke. For every pair of strokes, the clear space is the smallest distance between
  their sampled centre lines, minus both half widths. Clear ≤ 0 means the strokes touch or cross, so they count as
  joined. Points that a mask cut-out clips are ignored.
  - Limit: gaps inside one stroke (for example a U whose arms come close) are not measured.
  - Limit: two strokes that touch at one point but run close elsewhere are not flagged.
- **Corners:** only `rect` radii are measured. Check path corners on the canvas.

## Changing the rules

Edit `app/src/lib/guardrails.ts`. The checker, the overlays, the draw tools and `check-library.mjs` all follow
it. Update the tables above to match.

Values taken from `guardrails/m3-icon-spec.md`: canvas 24, live area 2–22 (padding warns), the four keylines,
stroke 2 (1.5 allowed), exterior radius 2 (shapes ≤ 2px exempt) and the whole-pixel grid. ANTZ choices: round
caps and joins, the 2px minimum gap, 45° angle snap, the complexity limits, currentColor only, and the line/filled
file format.

## Semantic grammar

One visual device means one thing across the whole library. Reuse the device before you invent a new one.

| Visual | Meaning | Examples |
| --- | --- | --- |
| Slash (45°, (4,4)–(20,20), base cut 2px either side) | not viable / not allowed | `egg_infertile`, `fetal_death`, `visibility_off`, `person_off` |
| ✕ badge | removed / discarded | `egg_discarded`, `delete_forever`, `deworming` |
| ✓ badge | done / confirmed | `egg_collected`, `task_alt`, `bookmark_added` |
| Clock badge | pending / scheduled | `pending`, `event_upcoming` |
| + badge | add / create | `egg_add`, `note_add`, `calendar_add_on`, `assignment_add`, `add_photo` |
| Arrow badge | transfer / move | `carcass_transfer`, `hospital_transfer`, `moved_location` |
| Letter in the badge spot | file type (P = PDF, W = Word, X = Excel) | `file_pdf`, `file_word`, `file_excel` |
| Open vs closed padlock | public vs private | `tag_public` (shackle lifted, open on the right) vs `tag_private` (closed); same padlock in `controlled_substance` |
| Signal bars, filled count | priority level | `priority_low` (1 bar), `priority_medium` (2), `priority_high` (3), `priority_critical` (4). Inactive slots are a single 2px dot on the baseline, never a thin bar. |

### Filled for active state

The active, selected or "on" state of an icon is its **filled** version, with a colour role if needed. Never draw a
separate "selected" icon. Old mobile assets with `_selected`, `_active`, `_white` or colour variants are merged into
one icon (see `sources`).

### Badge position

Every badge sits at the same place: centre **(17, 17)**, ink radius **r5** (reaches 22 at most), and the base is cut
away by a mask circle **r7**, which leaves a 2px gap. In filled icons the badge is a solid r5 disc with the glyph cut
out at 2px. If a badge glyph pokes past r5 (the padlock body corners and shackle do), add one more cut circle round
that part (r = part ink radius + 2) so the base stays 2px clear: see `tag_public` and `controlled_substance`.

### Shared bases

Draw these from the shared geometry, not by hand, so every icon on a base stays identical. Generators live in
`library/generators/`; paths below are relative to that folder. `library/generators/README.md` says which generator
owns which icons, how to re-run one, and why re-running an early generator without names overwrites later redraws.

| Base | Geometry (line) | Generator |
| --- | --- | --- |
| Document | `GEO.DOC` + `GEO.DOC_FOLD` (+ `DOC_LINES`) | `draft-shared/gen.mjs` (`GEO`); badge/letter variants in `redraw-b/gen.mjs` (`DOCL`, `DOCF`) |
| Clipboard | board path + tab `rect 9,3 6×4 rx2`; filled `rect 4,4 16×18 r3` | `draft-pharm-lab/gen.mjs` (`CLIP_*`), reused in `redraw-b/gen.mjs` (`CLIP_L`, `CLIP_F`) |
| Calendar | `GEO.CAL`: `rect 3,5 18×16 rx2`, rings, header `M3 9H21` | `draft-shared/gen.mjs` (`GEO.CAL`); `redraw-b/gen.mjs` (`CAL_L`, `CAL_F`) |
| Speech bubble | `GEO.BUBBLE` (x 3–21, tail to (3,21)) | `draft-shared/gen.mjs` (`GEO.BUBBLE`); `redraw-b/gen.mjs` (`BUBBLE`) |
| Shield | `GEO.SHIELD` (flat top, rounded corners) | `draft-shared/gen.mjs` (`GEO.SHIELD`); `redraw-b/gen.mjs` (`SHIELD`) |
| Person | `GEO.HEAD` (circle 12,7 r4) + `GEO.SHOULDERS` | `draft-shared/gen.mjs` (`GEO`); `redraw-b/gen.mjs` (`PERSON`, `personBody`) |
| Small person | head r3, shoulders 12 wide, for groups and secondary figures | `redraw-b/gen.mjs` (`SMALL`) |
| Bin | `GEO.TRASH_LID`, `TRASH_HANDLE`, `TRASH_BODY` (+ `TRASH_LINES`) | `draft-shared/gen.mjs` (`GEO`); `compost` variant in `redraw-c/gen.mjs` |
| Paw | pad `M12 12C9 12 6 16 6 18…` + four toes r1 | `redraw-c/gen.mjs` (`PAD`, `TOES`) |
| Egg | `egg(12, 14, 7, d)` (d = 0 line, 1 filled) | `eggs/gen.mjs` (`egg`, `EGG_L`, `EGG_F`) |
| Van | cargo box + rounded cab + wheels r2 at (8,19), (17,19) | `redraw-a/gen.mjs` (section 4, `vanL`, `vanF`) |
| Tag | `M3 10L8 5H19…H8Z` + hole r1 (badged tags); `sell` uses the same outline 2px lower | `redraw-c/gen.mjs` (`TAG`); `draft-medical/gen.mjs` (`TAG_L`) |
| Flask | `M10 3V9L5 19…L14 9V3` + rim + liquid; badge size in `BADGE.flask` | `draft-medical/gen.mjs` (`FL`, `lab_request`); `redraw-b/gen.mjs` (`BADGE.flask`) |
| Bottle | cap `rect 4,3 16×4 rx2` + body `M6 7V19…V7` | `draft-medical/gen.mjs` (`BOTTLE_*`); `redraw-b/gen.mjs`, `final/gen.mjs` |

Badge parts: `app/src/parts/parts.ts`, plus `BADGE` tables in `redraw-b/gen.mjs` (close, check, add, letters, lock,
flask, pill, repeat) and `redraw-c/lib.mjs` (alert, arrow, globe, lock; `lock` is the `tag_private` padlock).
The final-pass icons (priority family, `deworming`, `controlled_substance`) are in `final/gen.mjs`.
