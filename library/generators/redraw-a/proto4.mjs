import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const I = {};
{ const B13 = 'M8 13C4 14 3 19 7 21C11 23 17 21 18 18C19 16 17 14 15 15C13 16 11 14 8 13Z';
  I.f13 = { line: line([C(15, 7, 4), P(B13)]), filled: masked([WF(C(15, 7, 5)), W(P(B13))]) };
  // bigger head r5, bean body curled under-left, knee notch under the chin
  const B14 = 'M7 14C3 16 3 21 8 21H13C17 21 19 19 19 17C19 15 17 15 15 16C12 17 10 15 7 14Z';
  I.f14 = { line: line([C(14, 7, 5), P(B14)]), filled: masked([WF(C(14, 7, 6)), W(P(B14))]) };
  // head + body joined (touching): body hangs from the back of the head, curls under, knees up to the chin
  const B15 = 'M9 10C4 13 4 20 9 21C13 22 17 20 18 17C18 15 16 14 14 15';
  I.f15 = { line: line([C(14, 7, 4), P(B15)]), filled: masked([WF(C(14, 7, 5)), WS(P(B15))]) };
}
{ const RIM = 'M4 12H20', BIN = 'M6 12V19A2 2 0 0 0 8 21H16A2 2 0 0 0 18 19V12', L8 = 'M10 12C10 7 13 4 18 3C19 8 16 11 11 12Z';
  I.c8 = { line: line([P(RIM), P(BIN), P(L8)]), filled: masked([W(P(L8)), WS(P(RIM)), W(P(BIN + 'Z'))]) };
  const L9 = 'M9 12C9 7 12 4 18 3C18 9 15 12 10 12Z';
  I.c9 = { line: line([P(RIM), P(BIN), P(L9)]), filled: masked([W(P(L9)), WS(P(RIM)), W(P(BIN + 'Z'))]) }; }
emit(I, process.argv[2]);
