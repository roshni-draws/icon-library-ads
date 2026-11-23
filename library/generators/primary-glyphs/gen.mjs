// Library glyphs added for the Primary set: bell (Notifications), settings_gear (Settings), cooking_pot (Kitchen).
//   node gen.mjs <libraryDir>
// ANTZ Rounded: 24 grid, 2px round strokes, whole-pixel endpoints, ≥ 2px gaps, filled = one white mask.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LIB = process.argv[2];
const ST = 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const HEAD_L = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${ST}>`;
const HEAD_F = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">';
const P = (d) => `<path d="${d}"/>`;
const W = (d) => `<path d="${d}" fill="white" stroke="white" ${ST}/>`;   // closed path, solid, pushed out 1px
const WS = (d) => `<path d="${d}" fill="none" stroke="white" ${ST}/>`;   // open path, solid 2px
const BF = (el) => el.replace('/>', ' fill="black"/>');                 // hole
const wrap = (head, body) => `${head}\n${body.map((l) => '  ' + l).join('\n')}\n</svg>\n`;
const filled = (parts) => wrap(HEAD_F, ['<mask id="cut">', ...parts.map((p) => '  ' + p), '</mask>', '<rect x="2" y="2" width="20" height="20" rx="2" mask="url(#cut)"/>']);

const icons = {};

/* Bell: dome r6 about (12,11), straight sides to y 14, flared lip to y 17; knob stub above; flat clapper 2px below. */
{
  const BODY = 'M12 5A6 6 0 0 0 6 11V14L4 17H20L18 14V11A6 6 0 0 0 12 5Z';
  const KNOB = 'M12 3V5';
  const CLAPPER = 'M10 21H14';
  icons.bell = { line: wrap(HEAD_L, [P(BODY), P(KNOB), P(CLAPPER)]), filled: filled([W(BODY), WS(KNOB), WS(CLAPPER)]) };
}

/* Settings gear: rim r6 with eight block teeth (closed 2×1 / 1×1 rects stroked 2px, so each tooth is a solid rounded
   block on whole pixels: 4×3 on the axes, 3×3 on the diagonals), and an axle r2. */
{
  const RIM = '<circle cx="12" cy="12" r="6"/>';
  const TEETH = 'M11 4H13V5H11ZM11 19H13V20H11ZM4 11H5V13H4ZM19 11H20V13H19Z'
    + 'M17 6H18V7H17ZM6 6H7V7H6ZM6 17H7V18H6ZM17 17H18V18H17Z';
  const AXLE = '<circle cx="12" cy="12" r="2"/>';
  icons.settings_gear = {
    line: wrap(HEAD_L, [RIM, P(TEETH), AXLE]),
    filled: filled(['<circle cx="12" cy="12" r="7" fill="white"/>', W(TEETH), BF('<circle cx="12" cy="12" r="3"/>')]),
  };
}

/* Cooking pot: body with rounded base, side handles at y 13, lid line with a knob above. */
{
  const BODY = 'M5 10H19V17A3 3 0 0 1 16 20H8A3 3 0 0 1 5 17Z';
  const HANDLES = 'M3 13H5M19 13H21';
  const LID = 'M4 6H20M12 4V6';
  icons.cooking_pot = { line: wrap(HEAD_L, [P(BODY), P(HANDLES), P(LID)]), filled: filled([W(BODY), WS(HANDLES), WS(LID)]) };
}

for (const [name, { line, filled: f }] of Object.entries(icons)) {
  writeFileSync(join(LIB, 'line', `${name}.svg`), line);
  writeFileSync(join(LIB, 'filled', `${name}.svg`), f);
  console.log(`wrote ${name}`);
}
