# ANTZ Icon Library and Builder

The **ANTZ Rounded** icon set for the ANTZ mobile app, and the tool used to draw, check and export it.

- **Library:** every icon is drawn from scratch in three styles.
  - **Line**: 2px round strokes (`library/line/`).
  - **Filled**: solid, with details cut out at 2px (`library/filled/`).
  - **Primary**: animated tile badges for module navigation, one animated SVG plus one Lottie file per colour
    scheme (`library/primary/`).
- **Icon builder:** a Vite + React app to build an icon, check it against the Material 3 guard rails
  (`guardrails/m3-icon-spec.md`, numbers in `app/src/lib/guardrails.ts`), name it and add it to the library.
  Material Symbols Rounded are used as references only.
- **Exports** (Export in the app sidebar): the library as a ZIP, line and filled SVG sprites, `index.json`,
  `antz-icons.css`, and a Primary icons ZIP (SVG plus Lottie per scheme, with usage notes for web, React Native
  and Flutter).

The files in `library/` are the source of truth. In development the app reads and writes them through the dev
server; a production build bundles a read-only snapshot.

## Run

Needs Node 20 or later.

```sh
cd app && npm ci && npm run dev -- --port 5181
```

Then open http://localhost:5181. Other scripts (run in `app/`):

```sh
npm run build      # type-check + static build into app/dist/ (read-only snapshot of the library)
npm run check      # guard-rail report for every library SVG
npm run validate   # checks library/index.json: names, statuses, references, sources
```

## Folder structure

```
app/                       Icon builder (Vite + React 18 + TypeScript)
  src/data/                inventory, custom drafts, and the vendored ANTZ colour library (see src/data/README.md)
  src/lib/                 checker, guard rails, exporters, colour schemes, SVG tools
  public/current/          the current mobile-app icons (the "old" icons each new icon replaces)
  scripts/                 library check, name validation, seeding
library/
  index.json               the icon index: name, label, module, status, sources, reference, tags, notes
  line/, filled/           one SVG per icon and style
  primary/                 Primary (animated) icons: index.json, svg/, lottie/, review.html
  generators/              the scripts that drew the icons, by round
  review/                  HTML review sheets per module, and QA notes
  merge-log.csv            how the mobile-app source files were merged into library icons
  STYLE.md                 the ANTZ Rounded style spec
guardrails/
  m3-icon-spec.md          Material 3 icon guidance the guard rails are based on
Icon inventory — mobile app.pdf               inventory of the current mobile-app icons
Proposed icons — Material Symbols Rounded.pdf the proposed Material Symbols mapping
```

## Docs

- [library/STYLE.md](library/STYLE.md): ANTZ Rounded style spec (line and filled) and guard rails
- [library/primary/STYLE-PRIMARY.md](library/primary/STYLE-PRIMARY.md): Primary icon style spec and recipe
- [library/generators/README.md](library/generators/README.md): the icon generators and the order they ran in
- [app/README.md](app/README.md): the builder app in detail

## Colours

The colour schemes come from `ANTZ_colour_library.json`, owned by the ANTZ Design System Previewer. A copy is
vendored at `app/src/data/ANTZ_colour_library.json` so this repo builds on its own; update it by copying the
Previewer's file over it.
