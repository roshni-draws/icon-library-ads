import { n, HEAD_L, HEAD_F, wrap, P, C, R, W, WS, WF, K, KF, masked, line, badged, capsule, emit } from './lib.mjs';
const I = {};
const BX = [2, 2, 22, 22];
{ const S16 = 'M17 12A5 5 0 1 0 9 8C8 11 5 13 5 16C5 20 9 21 12 21C16 21 19 19 19 16C19 14 17 13 15 14Z';
  I.f16 = { line: line([P(S16)]), filled: masked([W(P(S16))], BX) };
  I.f17 = { line: line([P(S16), P('M15 14Q12 15 11 13')]), filled: masked([W(P(S16)), K(P('M16 14Q12 15 11 13'))], BX) };
  const CR = 'M7 7A8 8 0 0 0 15 15A2 2 0 0 1 15 19A12 12 0 0 1 3 7A2 2 0 0 1 7 7Z';
  I.f18 = { line: line([C(15, 7, 4), P(CR)]), filled: masked([WF(C(15, 7, 5)), W(P(CR))], BX) };
  // crescent hugging a bigger head, legs end tucked up at the front
  const CR2 = 'M6 9A8 8 0 0 0 18 15A2 2 0 0 1 20 18A12 12 0 0 1 3 7A2 2 0 0 1 6 9Z';
  I.f19 = { line: line([C(14, 7, 4), P(CR2)]), filled: masked([WF(C(14, 7, 5)), W(P(CR2))], BX) };
}
emit(I, process.argv[2]);
