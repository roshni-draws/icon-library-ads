import { GUARDRAILS as G } from '../lib/guardrails';

export interface OverlayOpts { grid: boolean; live: boolean; keylines: boolean }
export const ALL_OVERLAYS: OverlayOpts = { grid: true, live: true, keylines: true };

/** 24 x 24 pixel grid, live area (2–22) and the four M3 keylines, drawn over a canvas. Values from guardrails.ts. */
export function GridOverlay({ opts = ALL_OVERLAYS, fine = false }: { opts?: OverlayOpts; fine?: boolean }) {
  const n = G.canvas;
  const step = fine ? 0.5 : 1;
  const lines: number[] = [];
  for (let i = 0; i <= n; i += step) lines.push(i);
  return (
    <svg className="grid-ov" viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
      {opts.grid && lines.map((i) => (
        <g key={i}>
          <line x1={i} y1={0} x2={i} y2={n} className={i % 4 === 0 ? 'g-major' : Number.isInteger(i) ? 'g-minor' : 'g-half'} />
          <line x1={0} y1={i} x2={n} y2={i} className={i % 4 === 0 ? 'g-major' : Number.isInteger(i) ? 'g-minor' : 'g-half'} />
        </g>
      ))}
      {opts.live && <>
        <path className="g-pad" fillRule="evenodd" d={`M0 0H${n}V${n}H0Z M${G.live.min} ${G.live.min}V${G.live.max}H${G.live.max}V${G.live.min}Z`} />
        <rect x={G.live.min} y={G.live.min} width={G.live.max - G.live.min} height={G.live.max - G.live.min} className="g-safe" />
      </>}
      {opts.keylines && G.keylines.map((k) => k.kind === 'circle'
        ? <circle key={k.id} cx={n / 2} cy={n / 2} r={k.w / 2} className="g-key" />
        : <rect key={k.id} x={(n - k.w) / 2} y={(n - k.h) / 2} width={k.w} height={k.h} rx={2} className="g-key" />)}
      {opts.keylines && <>
        <line x1={n / 2} y1={0} x2={n / 2} y2={n} className="g-axis" />
        <line x1={0} y1={n / 2} x2={n} y2={n / 2} className="g-axis" />
      </>}
    </svg>
  );
}
