import { writeFileSync } from 'node:fs';
const EAR = 'M6 9A6 6 0 0 1 18 9C18 13 14 14 14 17A3 3 0 0 1 8 17';
const IN = 'M10 9A2 2 0 0 1 14 9';
const mk = (tx, ty, extra='') => `<mask id='cut'><rect width='24' height='24' fill='white' stroke='none'/><circle cx='${tx}' cy='${ty}' r='4' fill='black' stroke='none'/></mask><g mask='url(#cut)'><path d='${EAR}'/><path d='${IN}'/></g><circle cx='${tx}' cy='${ty}' r='1'/>${extra}`;
const mir = (s) => `<g transform='matrix(-1 0 0 1 24 0)'>${s}</g>`;
const items = [
 ['R high', mk(16,5)], ['R mod', mk(18,10)], ['R low', mk(11,20)],
 ['L high', mir(mk(16,5))], ['L mod', mir(mk(18,10))], ['L low', mir(mk(11,20))],
 ['fetus1', "<circle cx='14' cy='7' r='4'/><path d='M10 10C6 12 5 17 8 20C10 22 15 21 17 18C18 16 16 14 14 15'/>"],
 ['fetus2', "<circle cx='13' cy='7' r='4'/><path d='M9 10A7 7 0 1 0 19 13'/><path d='M14 17H15'/>"],
 ['fetus3', "<circle cx='14' cy='8' r='4'/><path d='M10 11C6 13 5 19 10 21C14 22 18 20 19 16'/>"],
 ['ovo3', "<path d='M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z'/><circle cx='13' cy='11' r='1'/><path d='M10 12A3 3 0 0 0 15 16'/>"],
 ['ovo4', "<path d='M12 3C8.5 3 5 9 5 14A7 7 0 0 0 19 14C19 9 15.5 3 12 3Z'/><path d='M14 11A3 3 0 1 0 15 15'/>"],
 ['apple2', "<path d='M12 9C10 7 4 7 4 13C4 18 8 21 12 21C16 21 20 18 20 13C20 7 14 7 12 9Z'/><path d='M12 9V6'/><path d='M14 5Q14 2 17 2Q17 5 14 5Z'/>"],
];
writeFileSync(new URL('./p2.json', import.meta.url), JSON.stringify(items));
