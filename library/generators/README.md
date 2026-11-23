# Icon generators

The scripts that drew the SVGs in `library/line/` and `library/filled/`. They were copied here from the session
scratchpad (only the `.mjs` and `.json` files; PNGs, HTML proof sheets, backups and `before/` folders were left behind).
Shared geometry for each base is listed in `../STYLE.md` (section "Shared bases").

Paths are resolved relative to the repo (`library/`, `app/`), so the scripts run from any clone. Some of them
still expect files that were not copied here (proof-sheet PNGs, `before/` folders), shell out to tools on the
author's machine (e.g. Google Chrome for screenshots), or use `app/node_modules` (run `npm ci` in `app/` first).

## Rounds and override order

Icons were drawn in rounds, and a later round replaces what an earlier one wrote:

```
eggs  →  draft-* (shared, pharm-lab, animals, requests, medical)  →  redraw-a / redraw-b  →  redraw-c  →  final
```

Several generators still emit icons that a later round redrew. **Re-running an early generator without names
overwrites those later redraws** (for example, `draft-shared` without names rewrites `fetal_death`, `transfer` and the
priority family; `draft-medical` rewrites `controlled_substance`, `deworming` and `pill`). Always pass the names you
mean to regenerate, and re-run the later rounds afterwards if you do run an early one in full.

Some generators also still emit icons that were later **merged away** and are not in `index.json`:
`sms` (draft-shared), `pending_actions` (draft-pharm-lab), `assignment_turned_in`, `repro_oviparous`,
`repro_viviparous` (draft-animals), `urgent` (draft-medical), `repro_viviparous` (redraw-a, redraw-c).
A full run recreates those files; delete them again or `check-library` will report icons that are not in the index.

## Who owns which icon

"Owner" = the generator whose output currently matches the file in `library/` (checked byte for byte on line and
filled, 204 icons). Edit an icon in its owner, not in an earlier round.

| Generator | Icons it owns now |
| --- | --- |
| `eggs` (12) | chick_hatched egg_add egg_clutch egg_collected egg_discarded egg_golden egg_hatched egg_infertile egg_nest egg_nursery select_all site |
| `draft-shared` (45) | add add_circle add_column_right arrow_forward arrow_right_alt article calendar checkbox_checked checkbox_partial checkbox_unchecked delete document encrypted filter fingerprint folder gallery image line_end_circle line_end_square line_start_circle local_hospital lock logout monitoring note_alt person person_off person_pin_circle play_circle priority_flag qr_code_scanner redo search sort sort_a_to_z sort_newest_first sort_oldest_first sort_z_to_a swap time unfold_more verified visibility visibility_off |
| `draft-pharm-lab` (15) | add_photo archive assignment_add block cancelled download emergency event_available expand_less fish_bones hourglass_bottom lab_sample refresh request timeline |
| `draft-animals` (26) | account_tree arrow_shape_up_stack bar_chart beenhere breeding_pair close close_fullscreen dietitian edit enclosure family_history format_list_numbered grid_view hard_drive health_and_safety info list male mortality move_in moved_location open_in_full personal_injury repro_ovoviviparous repro_unknown star |
| `draft-requests` (18) | announcement assignment_ind contact_support content_copy delete_forever do_not_disturb_on emergency_announcement filter_applied fullscreen pending person_remove progress_activity start support_agent task_alt today user videocam |
| `draft-medical` (38) | add_a_photo animal animal_batch assessment attach_file bedtime calendar_add_on category clinical_notes edit_note error event_note event_upcoming expand_more history home_health hospital_transfer lab_microscope lab_request like medical medical_record medication monitor_weight note print repeat report route sell skip stop_circle supplement symptoms vital_signs warning wb_sunny wb_twilight |
| `redraw-a` (7) | carcass_pickup carcass_transfer necropsy request_quote tag_private transfer travel_explore |
| `redraw-b` (25) | add_comment admin_panel_settings bookmark_added call chat chat_bubble chronic comment diagnosis draft event_repeat file_excel file_pdf file_word forum groups lab_profile mail note_add people person_search pill prescription query_stats vaccine |
| `redraw-c` (9) | compost ear_tag_high_left ear_tag_high_right ear_tag_low_left ear_tag_low_right ear_tag_moderate_left ear_tag_moderate_right fetal_death tag_public |
| `final` (6) | controlled_substance deworming priority_critical priority_high priority_low priority_medium |
| none (3) | `done`, `egg`, `location` were drawn outside these scripts (no generator emits them) |

`priority_flag`, `gallery` and `line_end_square` are also emitted by `draft-requests`, but the library has the
`draft-shared` version. The per-folder lists of everything a generator ever drew are in `draft-shared/mine.json`,
`draft-animals/meta.json` (+ `mine.json`), `draft-requests/meta.json` and `draft-medical/meta.json`; for the others,
read the `def(...)` / `icons` entries in `gen.mjs`.

## Running a generator

Run from anywhere with Node 18+. Several scripts load `esbuild` and the checker (`app/src/lib/checker.ts`) through
the hard-coded project path in `BASE`; if the project folder moves, update `BASE` in those files
(`draft-animals`, `draft-medical`, `redraw-a/lib.mjs`, `redraw-b`, `redraw-c/lib.mjs`, and the `sheet`/`render`/`refs`
helpers).

| Generator | Command | Writes to | Notes |
| --- | --- | --- | --- |
| `eggs` | `node eggs/gen.mjs <libDir> [names]` | `<libDir>/line`, `<libDir>/filled` | No guard. |
| `draft-shared` | `node draft-shared/gen.mjs <libDir> [names]` | `<libDir>` | Skips shared bases it does not own (`mine.json`) when the file exists, unless `FORCE=1`. Rewrites `mine.json`. |
| `draft-pharm-lab` | `node draft-pharm-lab/gen.mjs <libDir> [names]` | `<libDir>` | No guard. |
| `draft-requests` | `node draft-requests/gen.mjs <libDir> [names]` | `<libDir>` | Rewrites `meta.json`. |
| `draft-animals` | `node draft-animals/gen.mjs [names]` | `library/` (fixed) | Skips icons whose status is not `to_design` unless in `mine.json`. Rewrites `meta.json`, `mine.json`. |
| `draft-medical` | `node draft-medical/gen.mjs [names]` | `library/` (fixed) | No guard. Rewrites `meta.json`. |
| `redraw-a` | `node redraw-a/gen.mjs <outDir> [names]` | `<outDir>` | Runs the checker and prints warnings. Uses `redraw-a/lib.mjs`. |
| `redraw-b` | `node redraw-b/gen.mjs [names] [--write]` | `redraw-b/out/` (preview); `library/` with `--write` | Names containing `__` are previews only. Rewrites `names.txt`. |
| `redraw-c` | `node redraw-c/gen.mjs <outDir> [names]` | `<outDir>` | Runs the checker. Uses `redraw-c/lib.mjs`. |
| `final` | `node final/gen.mjs <outDir> [names]` | `<outDir>` | Runs the checker. Imports `../redraw-c/lib.mjs`. |

`<libDir>` / `<outDir>` is normally `library` (the folder holding `line/` and `filled/`). Point it at a temp folder to
preview without touching the library, e.g. `node final/gen.mjs /tmp/preview priority_high`. `eggs` and the
`draft-*` `<libDir>` scripts need `line/` and `filled/` to exist in that folder first.

Example, regenerate one icon in place (run from the project root):

```
node library/generators/redraw-c/gen.mjs library fetal_death
node app/scripts/check-library.mjs fetal_death
```

Other files: `render.mjs` / `sheet.mjs` / `refs.mjs` / `old.mjs` build HTML proof sheets (`sheet.mjs` writes into
`library/review/`); `proto*.mjs`, `p*.mjs`/`p*.json`, `try.mjs`, `earfrac.mjs`, `variants.mjs` and `final/chk.mjs`
are prototyping helpers.

## QA page (`library/review/index.html`)

`qa/` holds the QA scripts (`build.mjs`, `raster.mjs`, `dups.mjs` from the final pass; `gen.mjs` + `mine.json` are a
copy of `draft-shared` used for a dry run). Use a scratch folder `<Q>` for their outputs (the raster step keeps a
Chrome profile in `<Q>/chrome`). From the project root:

```
node app/scripts/check-library.mjs > <Q>/check.txt
node library/generators/qa/raster.mjs library <Q>   # needs Google Chrome in /Applications
node library/generators/qa/dups.mjs   library <Q>
node library/generators/qa/build.mjs  library <Q>   # writes library/review/index.html
```
