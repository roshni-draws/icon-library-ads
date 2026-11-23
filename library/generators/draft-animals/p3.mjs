import { writeFileSync } from 'node:fs';
const EAR = 'M6 9A6 6 0 0 1 18 9C18 13 14 14 14 17A3 3 0 0 1 8 17';
const IN = 'M10 9A2 2 0 0 1 14 9';
const mk = (tx, ty) => `<mask id='cut'><rect width='24' height='24' fill='white' stroke='none'/><circle cx='${tx}' cy='${ty}' r='5' fill='black' stroke='none'/></mask><g mask='url(#cut)'><path d='${EAR}'/><path d='${IN}'/></g><circle cx='${tx}' cy='${ty}' r='2'/>`;
const mir = (s) => `<g transform='matrix(-1 0 0 1 24 0)'>${s}</g>`;
const items = [
 ['R high', mk(16,5)], ['R mod', mk(18,10)], ['R low', mk(9,19)],
 ['L high', mir(mk(16,5))], ['L mod', mir(mk(18,10))], ['L low', mir(mk(9,19))],
 ['viv a', "<circle cx='14' cy='7' r='3'/><path d='M8 9A8 8 0 0 0 19 19'/>"],
 ['viv b', "<circle cx='14' cy='7' r='3'/><path d='M9 8A7 7 0 0 0 17 20A3 3 0 0 0 17 14'/>"],
 ['viv c', "<circle cx='13' cy='7' r='4'/><path d='M8 10A7 7 0 0 0 19 18L15 16'/>"],
 ['ovo5', "<path d='M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z'/><circle cx='13' cy='10' r='1'/><path d='M10 11A4 4 0 0 0 15 16'/>"],
];
writeFileSync(new URL('./p3.json', import.meta.url), JSON.stringify(items));
