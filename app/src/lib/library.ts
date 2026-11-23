/**
 * ANTZ colour library. The source of truth is the Design System Previewer's ANTZ_colour_library.json;
 * a copy is vendored at src/data/ANTZ_colour_library.json so this repo builds on its own (see src/data/README.md).
 * Same approach as the Previewer's
 * src/theme/library.ts and css.ts: every scheme becomes a [data-scheme="<key>"] block of --antz-<role> variables.
 */
import raw from '../data/ANTZ_colour_library.json';

export type SchemeKey = keyof typeof raw.schemes;
export const SCHEME_KEYS = Object.keys(raw.schemes) as SchemeKey[];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
export const varName = (role: string) => `--antz-${kebab(role)}`;

/** Short scheme labels for the switch: Light, Light MC, Light HC, Dark, Dark MC, Dark HC. */
export function schemeShort(k: SchemeKey): string {
  const [mode, contrast] = k.split(/-(.*)/s);
  return cap(mode) + (contrast ? (contrast.startsWith('medium') ? ' MC' : ' HC') : '');
}
export function schemeLong(k: SchemeKey): string {
  const [mode, contrast] = k.split(/-(.*)/s);
  return `${cap(mode)}, ${contrast ? contrast.replace('-contrast', '') + ' contrast' : 'standard contrast'}`;
}

/** All roles of a scheme, flattened: base roles plus extended (success, warning, caution, info) and their on/container roles. */
function flat(k: SchemeKey): Record<string, string> {
  const out: Record<string, string> = { ...raw.schemes[k] };
  const ext = raw.extendedSchemes[k] as Record<string, { color: string; onColor: string; colorContainer: string; onColorContainer: string }>;
  for (const [name, e] of Object.entries(ext)) {
    out[name] = e.color;
    out[`on${cap(name)}`] = e.onColor;
    out[`${name}Container`] = e.colorContainer;
    out[`on${cap(name)}Container`] = e.onColorContainer;
  }
  return out;
}
export const COLORS = Object.fromEntries(SCHEME_KEYS.map((k) => [k, flat(k)])) as Record<SchemeKey, Record<string, string>>;
export const ALL_ROLES = Object.keys(COLORS.light);

/** ANTZ deep teal: the default icon colour from the proposed icon set. */
export const DEEP_TEAL = '#1F515B';

/** Icon colour choices: deep teal plus the roles that make sense for icons, then every other role. */
const ICON_ROLES = ['primary', 'onSurface', 'onSurfaceVariant', 'secondary', 'tertiary', 'error', 'success', 'warning', 'caution', 'info', 'onPrimaryContainer', 'onSecondaryContainer', 'onTertiaryContainer', 'inverseOnSurface', 'onPrimary'];
export const COLOUR_OPTIONS: { value: string; label: string }[] = [
  { value: 'teal', label: `Deep teal ${DEEP_TEAL}` },
  ...[...ICON_ROLES.filter((r) => ALL_ROLES.includes(r)), ...ALL_ROLES.filter((r) => !ICON_ROLES.includes(r))].map((r) => ({ value: r, label: r })),
];
export const colourValue = (c: string) => (c === 'teal' || !ALL_ROLES.includes(c) ? DEEP_TEAL : `var(${varName(c)})`);

/** Writes the [data-scheme] stylesheet once. */
export function applyThemeCss() {
  if (typeof document === 'undefined') return;
  const css = SCHEME_KEYS.map((k) => {
    const lines = ALL_ROLES.map((r) => `  ${varName(r)}: ${COLORS[k][r]};`);
    return `[data-scheme="${k}"] {\n  color-scheme: ${k.startsWith('dark') ? 'dark' : 'light'};\n${lines.join('\n')}\n}`;
  }).join('\n\n');
  let el = document.getElementById('antz-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'antz-theme';
    document.head.appendChild(el);
  }
  el.textContent = css;
}
