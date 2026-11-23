import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const I = {};
// priority ghost bars
const BARS = [[4, 14], [10, 9], [16, 4]];
const barL = ([x, t]) => R(x + 1, t + 1, 2, 19 - t - 1, 1);
const ghost = ([x, t]) => P(`M${x + 2} ${t + 1}V19`);
for (const k of [1, 2]) I['pA' + k] = { line: line([...BARS.slice(0, k).map(barL), ...BARS.slice(k).map(ghost)]), filled: masked([...BARS.slice(0, k).map(([x, t]) => WF(R(x, t, 4, 20 - t, 2))), ...BARS.slice(k).map((b) => WS(ghost(b)))], [2, 2, 22, 22]) };
I.pcrit1 = badged('alert', BARS.map(barL), BARS.map(([x, t]) => WF(R(x, t, 4, 20 - t, 2))), { box: [2, 2, 22, 22] });
// thin critical: 2px bars at x 3,7,11
const TB = [[3, 15], [7, 10], [11, 5]];
I.pcrit3 = badged('alert', TB.map(([x, t]) => P(`M${x} ${t}V19`)), TB.map(([x, t]) => WS(P(`M${x} ${t}V19`))), { box: [2, 2, 22, 22] });
// necropsy
{ const B = 'M10 14L19 5Q20 12 12 16Z', H = 'M5 21L11 15';
  I.n2 = { line: line([P(B), P(H)]), filled: masked([W(P(B)), WS(P(H))]) };
  const H3 = 'M4 18L8 14L10 16L6 20Z', B3 = 'M11 13L19 5Q20 12 13 15Z';
  I.n3 = { line: line([P(B3), P(H3)]), filled: masked([W(P(B3)), W(P(H3))]) }; }
// fetus
{ const S = 'M9 11A5 5 0 1 1 17 11C19 13 20 17 17 19C15 21 9 21 7 19C4 16 5 13 9 11Z';
  I.f2 = { line: line([P(S)]), filled: masked([W(P(S))]) };
  const D = 'M12 15A3 3 0 0 0 16 17';
  I.f2b = { line: line([P(S), P('M11 14Q13 13 15 14')]), filled: masked([W(P(S)), K(P('M10 14Q13 12 16 14'))]) };
  const BD = 'M8 13C4 16 6 21 11 21C16 21 18 18 16 15C15 13 12 14 12 16';
  I.f3 = { line: line([C(14, 7, 4), P(BD)]), filled: masked([WF(C(14, 7, 5)), WS(P(BD))]) };
  const BD4 = 'M9 12C4 14 4 21 11 21C16 21 19 18 17 14';
  I.f4 = { line: line([C(14, 7, 4), P(BD4)]), filled: masked([WF(C(14, 7, 5)), WS(P(BD4))]) }; }
// ears
{ const EO = 'M6 11A6 6 0 0 1 18 11C18 15 14 16 14 18A3 3 0 0 1 8 18';
  const EC = EO + 'C8 16 6 14 6 11Z';
  for (const [k, e] of [['eO', EO], ['eC', EC]]) for (const [l, [x, y]] of [['h', [12, 5]], ['m', [18, 12]], ['l', [8, 18]]]) {
    I[k + l] = { line: line([C(x, y, 2)], { cut: [C(x, y, 5)], behind: [P(e)] }), filled: masked([e === EC ? W(P(e)) : WS(P(e)), KF(C(x, y, 5)), WF(C(x, y, 3))]) };
  } }
// globe badge solid
{ const TAG = 'M3 10L8 5H19A2 2 0 0 1 21 7V13A2 2 0 0 1 19 15H8Z';
  I.g2 = { line: line([C(17, 17, 4), P('M17 13V21')], { cut: [C(17, 17, 7)], behind: [P(TAG), C(10, 10, 1)] }), filled: masked([W(P(TAG)), KF(C(10, 10, 2)), KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P('M17 14V20'))]) };
  I.g3 = { line: line([C(17, 17, 4), P('M17 13A2 4 0 0 0 17 21A2 4 0 0 0 17 13')], { cut: [C(17, 17, 7)], behind: [P(TAG), C(10, 10, 1)] }), filled: masked([W(P(TAG)), KF(C(10, 10, 2)), KF(C(17, 17, 7)), WF(C(17, 17, 5)), K(P('M17 14A1 3 0 0 0 17 20A1 3 0 0 0 17 14'))]) }; }
// compost
{ const RIM = 'M4 11H20', BIN = 'M6 11V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V11';
  const LEAF = 'M7 14C7 8 12 3 19 3C19 10 14 14 8 14Z';
  const hide = 'M3 8H21V24H3Z';
  I.c3 = { line: line([P(RIM), P(BIN)], { cut: [P(hide)], behind: [P(LEAF)] }), filled: masked([W(P(LEAF)), KF(P(hide)), WS(P(RIM)), W(P(BIN + 'Z'))], [3, 2, 21, 22]) };
  const RIM2 = 'M4 9H20', BIN2 = 'M6 9V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V9', L2 = 'M10 17C10 15 12 13 14 13C14 15 12 17 10 17Z';
  I.c1 = { line: line([P(RIM2), P(BIN2), P(L2)]), filled: masked([WS(P(RIM2)), W(P(BIN2 + 'Z')), K(P(L2))]) };
  const ST = 'M12 11V9', L4 = 'M12 9C12 5 15 3 19 3C19 7 16 9 12 9Z';
  I.c4 = { line: line([P(RIM), P(BIN), P(L4), P(ST)]), filled: masked([WS(P(RIM)), W(P(BIN + 'Z')), W(P(L4)), WS(P(ST))]) }; }
// rupee
{ const DOC = 'M13 3H7A2 2 0 0 0 5 5V19A2 2 0 0 0 7 21H17A2 2 0 0 0 19 19V9Z', FOLD = 'M13 3V7A2 2 0 0 0 15 9H19';
  for (const [k, r] of [['r2', 'M9 9H15V13H9L13 17'], ['r3', 'M9 9H15M9 13H15M12 9A2 2 0 0 1 12 13M9 13L13 17'], ['r4', 'M8 10H16M8 13H16M8 13L13 18']])
    I[k] = { line: line([P(DOC), P(FOLD), P(r)]), filled: masked([W(P(DOC)), K(P(FOLD)), K(P(r))]) }; }
emit(I, process.argv[2]);
console.log(Object.keys(I).join(' '));
