# Vendored data

- `ANTZ_colour_library.json`: a copy of `ANTZ_colour_library.json` from the ANTZ **Design System Previewer**
  project (`Design System Previewer /ANTZ_colour_library.json`), which remains the source of truth for the
  ANTZ M3 colour schemes. It is vendored here so the icon builder builds from a fresh clone. When the
  Previewer's colour library changes, copy the new file over this one. The primary-icon generators
  (`library/generators/primary/`) read this copy too, unless `ANTZ_COLOURS` points elsewhere.
- `inventory.json`, `custom.json`: the app's own data.
