import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const I = {};
const TB = [[4, 15], [8, 10], [12, 5]];
I.pcrit4 = badged('alert', TB.map(([x, t]) => P(`M${x} ${t}V19`)), TB.map(([x, t]) => WS(P(`M${x} ${t}V19`))), { box: [2, 2, 22, 22] });
// 4px bars, left two intact, third bar behind the badge at slot 10-14
const B4 = [[2, 14], [8, 9]];
I.pcrit5 = badged('alert', [...B4.map(([x, t]) => R(x + 1, t + 1, 2, 19 - t - 1, 1)), R(15, 5, 2, 14, 1)], [...B4.map(([x, t]) => WF(R(x, t, 4, 20 - t, 2))), WF(R(14, 4, 4, 16, 2))], { box: [2, 2, 22, 22] });
// fetus silhouettes
{ const S5 = 'M17 12A5 5 0 1 0 9 8C7 11 4 14 5 17C6 21 12 22 15 20C18 18 18 15 15 15C14 15 15 13 17 12Z';
  I.f5 = { line: line([P(S5)]), filled: masked([W(P(S5))]) };
  const H = C(14, 7, 4), BD = 'M9 12C4 15 5 21 11 21C15 21 18 19 18 16C18 14 16 13 14 14';
  I.f6 = { line: line([H, P(BD)]), filled: masked([WF(C(14, 7, 5)), WS(P(BD))]) };
  const BD7 = 'M8 13C4 16 5 21 11 21C16 21 19 18 17 15C16 13 13 14 13 16';
  I.f7 = { line: line([C(14, 7, 4), P(BD7)]), filled: masked([WF(C(14, 7, 5)), WS(P(BD7))]) };
  // head + solid curled body (closed bean, knee notch toward chin)
  const BD8 = 'M8 13C4 15 4 21 10 21H14A4 4 0 0 0 18 17C18 15 16 14 14 15C12 16 11 15 10 14Z';
  I.f8 = { line: line([C(14, 7, 4), P(BD8)]), filled: masked([WF(C(14, 7, 5)), W(P(BD8))]) };
}
{ const EO = 'M6 11A6 6 0 0 1 18 11C18 15 14 16 14 18A3 3 0 0 1 8 18';
  const ED = EO + 'Q11 14 6 11Z';
  for (const [l, [x, y]] of [['h', [12, 5]], ['m', [18, 12]], ['l', [8, 18]]]) I['eD' + l] = { line: line([C(x, y, 2)], { cut: [C(x, y, 5)], behind: [P(ED)] }), filled: masked([W(P(ED)), KF(C(x, y, 5)), WF(C(x, y, 3))]) }; }
{ const RIM = 'M4 12H20', BIN = 'M6 12V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V12';
  const LEAF = 'M7 12C7 6 12 3 19 3C19 9 14 12 8 12Z', hide = 'M3 9H21V24H3Z';
  I.c5 = { line: line([P(RIM), P(BIN)], { cut: [P(hide)], behind: [P(LEAF)] }), filled: masked([W(P(LEAF)), KF(P(hide)), WS(P(RIM)), W(P(BIN + 'Z'))], [3, 2, 21, 22]) };
  const L6 = 'M10 12C10 7 13 4 18 3C19 8 16 11 11 12Z';
  I.c6 = { line: line([P(RIM), P(BIN)], { cut: [P(hide)], behind: [P(L6)] }), filled: masked([W(P(L6)), KF(P(hide)), WS(P(RIM)), W(P(BIN + 'Z'))], [3, 2, 21, 22]) }; }
{ const DOC = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z', FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
  for (const [k, r] of [['r5', 'M9 13H15V17H9L13 21'], ['r7', 'M9 13H15M15 13V17H9L12 20'], ['r8', 'M9 13H15M12 13A2 2 0 0 1 12 17H9L13 21']])
    I[k] = { line: line([P(DOC), P(FOLD), P(r)]), filled: masked([W(P(DOC)), K(P(FOLD)), K(P(r))]) }; }
emit(I, process.argv[2]);
