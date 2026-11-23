# ANTZ icon library: QA report

Date: 2026-11-23 (final pass). The visual review page is `library/review/index.html`.

## Changelog: final pass

- **Priority family** (`priority_low`, `priority_medium`, `priority_high`, `priority_critical`): kept the redraw-c
  4-slot layout and the solid 3px active bars. Each inactive slot is now one 2px dot on the baseline (a zero-length
  round-capped stroke at (x, 19), so its ink spans y 18–20, flush with the bar bottoms) instead of a thin ghost bar.
  low = 1 bar + 3 dots, medium = 2 + 2, high = 3 + 1, critical = 4 bars. At 16px and 24px the four now read as
  1, 2, 3 and 4 bars.
- **`deworming`**: redrawn as a worm. The body is three tall half-waves (arcs rx2 ry3 on whole pixels) and a shallower
  r2 neck. A solid head disc r2 at (20,8) joins the neck, and the tail at (3,8) is plain and round. The ✕ badge stays at
  (17,17). There is no ring end and no vertical S, so it no longer reads as `route`.
- **`controlled_substance`**: the padlock badge is now `tag_private`'s padlock (body `rect 13,16 8×5 rx2`, shackle r2;
  filled body `rect 12,15 10×7 r3`). The bottle base is unchanged. That padlock's ink reaches past r5, so two extra
  cut circles keep the bottle 2px clear: r6 at (17,15) and r5 at (15,19). This also clears the old 1.39px gap warning.
- **Merges** (drop → keep). The dropped entry's `sources` moved to the kept entry, a "Merged: …" note was added, the
  SVGs were deleted, and rows were appended to `merge-log.csv`:
  - `urgent` → `emergency`
  - `repro_oviparous` → `egg`
  - `assignment_turned_in` → `assessment`
  - `pending_actions` → `pending`
  - `sms` → `chat`
- **Relabels**: `egg_golden` is now "Special egg" and `request_quote` is now "Price quotation". `fetal_death` and
  `repro_viviparous` got the note "Paw metaphor: viviparous = live-bearing animal; slash = not viable".
- **STYLE.md**: added a "Semantic grammar" section (device → meaning table, filled-for-active, badge position, shared
  bases with their generator paths).
- Generator: `scratchpad/final/gen.mjs`. Backups of the previous index, merge log, STYLE, QA and the changed or deleted
  SVGs are in `scratchpad/final/` (`index.before.json`, `before/`).

## 1. Completeness

- `index.json` has **205 icons** (was 210, minus 5 merges), and all are `draft`.
- `line/` has 205 files and `filled/` has 205, so every entry has both SVGs.
- There are no orphan SVGs and no duplicate names.
- `GET http://localhost:5181/api/library` returns 200 with 205 icons. `urgent` is gone and `egg_golden` reads "Special egg".

| Module | Icons |
|---|---|
| Medical | 58 |
| Pharmacy | 5 |
| Lab | 3 |
| Animals and species | 38 |
| Mortality and necropsy | 10 |
| Eggs | 14 |
| Housing and diet | 7 |
| Assessments | 2 |
| Requests, approvals and transfers | 17 |
| Notes, journal and announcements | 7 |
| Notifications | 2 |
| Chat | 4 |
| Home, navigation and insights | 13 |
| Login, account and staff | 10 |
| Shared controls (filter, sort, media) | 11 |
| Shared across modules | 4 |

## 2. Guard rails (`node app/scripts/check-library.mjs`)

**205 checked: 205 pass, 0 warn, 0 fail.** The six warnings from round 1 (controlled_substance, deworming, diagnosis,
file_pdf, pill, vaccine) are all cleared.

## 3. Duplicates (recomputed on the current files)

Method: the same as round 1. All 410 SVGs were rasterised at 24px in headless Chrome and their alpha channels compared
pairwise (diff % = summed alpha difference ÷ union of ink). The SVG text was also compared after normalising.
Exact = identical text or 0% difference. Near = under 3%.

| Pair | Line | Filled | Verdict |
|---|---|---|---|
| animal = repro_viviparous | identical SVG | identical SVG | **Exact duplicate, new.** redraw-c deliberately drew viviparous as the library paw. Either merge them or give viviparous a distinguishing mark. |
| chat ≈ chat_bubble | 6.3% | 2.7% | Near duplicate (only the three dots differ). Carried over from round 1. |

Resolved since round 1:
- urgent/emergency, repro_oviparous/egg, assessment/assignment_turned_in and pending/pending_actions were merged.
- lab_microscope/necropsy and fetal_death/repro_viviparous no longer match, because necropsy and fetal_death were redrawn.
- carcass_pickup/carcass_transfer, document/file_excel and transfer/swap no longer match after the redraws.

Close calls between 3% and 6% share a base but carry a different badge, which is expected:
- do_not_disturb_on vs pending
- delete_forever vs do_not_disturb_on
- error vs info
- encrypted vs health_and_safety
- assessment vs note_alt
- calendar_add_on vs event_upcoming
- folder vs medical_record
- checkbox_partial vs checkbox_unchecked

## Badges on the review page

Each badge counts icons, not pairs:
- **Checker warn:** 0 icons.
- **Duplicate:** 4 icons, which are the 2 pairs above. Hover the badge to see whether it is exact or near.
- **Weak:** 10 icons. This is round 1's list minus every icon redrawn in rounds A, B and C or this pass, and minus the
  merged icons: `request`, `emergency`, `note_alt`, `swap`, `contact_support`, `progress_activity`, `announcement`,
  `repro_ovoviviparous`, `breeding_pair`, `egg_nursery`.

## Earlier findings (round 1, for reference)

### Round 1: overwrite damage (shared bases)

`scratchpad/draft-shared/gen.mjs` was copied to `scratchpad/qa/gen.mjs` and run with `scratchpad/qa/gen-out` as its library directory, so nothing was written to `library/`. The draft-shared `mine.json` was not touched either.

All 14 icons are byte-identical to the generator output, both line and filled:
- Medical: checkbox_checked, time, add_circle, document, filter, swap, image
- Animals: search, add, delete, calendar, transfer, line_end_circle, checkbox_unchecked

The other 42 icons the generator emits also match the library exactly. **There are no mismatches.**

### Round 1: consistency of shared bases

| Base | Status | Detail |
|---|---|---|
| Tag | Consistent | Medical `sell` and Animals `tag_public` / `tag_private` use the same outline (`L8 … H19 … H8Z` with a hole r1). The Animals version is moved up 2px to make room for the badge. |
| Speech bubble | **3 variants** | (a) GEO.BUBBLE in `sms` (Shared): x 3–21, tail runs diagonally to the corner (3,21). (b) Notes agent in `chat`, `chat_bubble`, `comment`, `add_comment`: x 4–20, tail drops straight down the left edge to (4,20), then to (7,17). (c) `forum` (Shared): its own smaller back bubble (x 3–17, tail to 3,18) and a front bubble with a right-side tail. The Requests module has **no** speech bubble. Its `contact_support` is a clipboard with a "?" badge rather than Material's bubble. |
| Shield | **2 variants** | GEO.SHIELD (flat top, rounded corners) is used by `encrypted` (Shared) and `health_and_safety` (Animals), and both match. `admin_panel_settings` (Chat) draws its own shield, with a pointed top (`M12 3L18 5…`) and shoulders at V7. The Requests module has no shield icon. |
| Person | **Mostly consistent, 3 outliers** | GEO person (head r4, rounded shoulder pill) is reused exactly in `person_off`, shifted in `person_remove`, and as the front figure of `people`. Outliers: `person_search` (Animals) has head r3 and a square-bottomed body (`V21 V17 A3`). `groups` (Requests) has a centre head r3 and a narrower body (x 6–18). `user` (Chat) is an account-circle style. `assignment_ind` and `support_agent` use small heads, which suits their context. |
| Calendar | Consistent | All 7 (`calendar`, `calendar_add_on`, `event_available`, `event_repeat`, `event_upcoming`, `event_note`, `today`) use GEO.CAL in line and the same filled body (rect 2,4,20×18 r3). Minor: `today` marks the date with a 1px square (`M8 15H9V16H8Z`), which is thinner than the stroke weight. `calendar` uses round dots. |
| Clipboard | Consistent | All 14 clipboard icons use the Pharmacy CLIPBOARD path and the same filled body (rect 4,4,16×18 r3). `note` and `clinical_notes` (Medical) use a separate sticky-note base with a folded bottom-right corner. That is intentional but sits close to the document family. |
| Document | **Line consistent, filled 2 variants** | Every line icon uses GEO.DOC and DOC_FOLD. In filled, Shared `document` and `file_excel` use the stroke-pushed DOC, which rounds the fold corners. Medical `draft`, `file_pdf`, `file_word`, `lab_profile` and `note_add` use a hand-offset path (`M7 2H14L20 8…`) with **sharp fold corners**. |

## Files

- Review page: `library/review/index.html` (self-contained, SVGs inlined, light/dark toggle, module nav, filter by flag)
- This report: `library/review/QA.md`
- Final-pass working files: `scratchpad/final/`
  - `gen.mjs`: icon fixes
  - `changed.png`: render of the changed icons
  - `priority16x4.png`: 16px and 24px priority crop, enlarged 4×
  - `qa/`: `check.txt`, `alpha.json`, `dups.json`, `dup-pairs.json`, plus the `raster.mjs`, `dups.mjs` and `build.mjs` scripts
