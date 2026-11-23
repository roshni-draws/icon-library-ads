import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const I = {};
{ const B10 = 'M8 9C4 13 4 20 10 21C15 22 19 19 18 16C17 14 14 15 14 17';
  I.f10 = { line: line([C(13, 8, 5), P(B10)]), filled: masked([WF(C(13, 8, 6)), WS(P(B10))]) };
  const B11 = 'M8 10C4 14 5 21 11 21C16 21 19 18 18 15';
  I.f11 = { line: line([C(13, 8, 5), P(B11)]), filled: masked([WF(C(13, 8, 6)), WS(P(B11))]) };
  // head r5 + curled body; filled keeps a 2px cut between head and body start
  const B12 = 'M8 10C3 14 5 21 11 21C15 21 18 19 18 16C18 14 16 13 14 15';
  I.f12 = { line: line([C(13, 7, 5), P(B12)]), filled: masked([WF(C(13, 7, 6)), WS(P(B12))]) };
}
{ const EO = 'M6 11A6 6 0 0 1 18 11C18 15 14 16 14 18A3 3 0 0 1 8 18';
  for (const [l, [x, y]] of [['h', [15, 6]], ['h2', [9, 6]]]) I['eO' + l] = { line: line([C(x, y, 2)], { cut: [C(x, y, 5)], behind: [P(EO)] }), filled: masked([WS(P(EO)), KF(C(x, y, 5)), WF(C(x, y, 3))]) }; }
{ const RIM = 'M4 12H20', BIN = 'M6 12V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V12', hide = 'M3 8H21V24H3Z';
  const L6 = 'M10 12C10 7 13 4 18 3C19 8 16 11 11 12Z';
  I.c6 = { line: line([P(RIM), P(BIN)], { cut: [P(hide)], behind: [P(L6)] }), filled: masked([W(P(L6)), KF(P(hide)), WS(P(RIM)), W(P(BIN + 'Z'))], [3, 2, 21, 22]) };
  const L7 = 'M8 11C8 6 12 3 18 3C18 8 14 11 9 11Z';
  I.c7 = { line: line([P(RIM), P(BIN)], { cut: [P(hide)], behind: [P(L7)] }), filled: masked([W(P(L7)), KF(P(hide)), WS(P(RIM)), W(P(BIN + 'Z'))], [3, 2, 21, 22]) }; }
{ const DOC = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z', FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
  for (const [k, r] of [['r8', 'M9 13H15M12 13A2 2 0 0 1 12 17H9L13 21'], ['r9', 'M9 13H15M13 13V17H9L13 21']])
    I[k] = { line: line([P(DOC), P(FOLD), P(r)]), filled: masked([W(P(DOC)), K(P(FOLD)), K(P(r))]) }; }
emit(I, process.argv[2]);
