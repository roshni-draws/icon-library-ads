import type { CheckResult, Level, Report as R } from '../lib/checker';
import { LEVEL_LABEL } from '../lib/checker';
import { Ms } from './Segmented';

export const LEVEL_ICON = { pass: 'check_circle', info: 'info', warn: 'warning', fail: 'cancel' } as const;
const SRC_TITLE = { M3: 'Material 3 icon guidance', ANTZ: 'ANTZ house rule' } as const;

export function LevelChip({ level, children }: { level: Level | 'none'; children?: React.ReactNode }) {
  return <span className={`lvl lvl-${level}`}>{level !== 'none' && <Ms n={LEVEL_ICON[level]} size={14} fill={level !== 'info'} />}{children ?? (level === 'none' ? 'Not drawn' : LEVEL_LABEL[level])}</span>;
}

function Rule({ r, active, onPick }: { r: CheckResult; active?: boolean; onPick?: (r: CheckResult) => void }) {
  const body = (
    <>
      <Ms n={LEVEL_ICON[r.level]} size={18} fill={r.level !== 'info'} />
      <span className="chk-t">
        <span className="chk-h"><strong>{r.title}</strong><span className={`src src-${r.source}`} title={SRC_TITLE[r.source]}>{r.source}</span><span className="sr-only">: {LEVEL_LABEL[r.level]}.</span></span>
        <span className="chk-m">{r.message}</span>
      </span>
    </>
  );
  return (
    <li className={`chk chk-${r.level}${active ? ' chk-on' : ''}`}>
      {onPick ? <button type="button" className="chk-b" aria-pressed={!!active} onClick={() => onPick(r)}>{body}</button> : <div className="chk-b">{body}</div>}
    </li>
  );
}

/** Full rule list. With onPick, each rule is a toggle that highlights its subject on the canvas. */
export function RuleList({ report, active, onPick, pickable }: { report: R; active?: string; onPick?: (r: CheckResult) => void; pickable?: (r: CheckResult) => boolean }) {
  const order: Record<Level, number> = { fail: 0, warn: 1, info: 2, pass: 3 };
  const rows = [...report.results].sort((a, b) => order[a.level] - order[b.level]);
  return <ul className="checks">{rows.map((r, i) => <Rule key={r.id + i} r={r} active={active === r.id + r.title} onPick={onPick && (!pickable || pickable(r)) ? onPick : undefined} />)}</ul>;
}

/** Compact report (detail panel): warnings and failures, plus the keyline. */
export function ReportView({ report, title, compact = false }: { report: R | null; title: string; compact?: boolean }) {
  if (!report) return <div className="report"><h4 className="report-h">{title}<LevelChip level="none" /></h4></div>;
  const rows = compact ? report.results.filter((r) => r.level === 'warn' || r.level === 'fail' || r.id === 'keyline') : report.results;
  return (
    <div className="report">
      <h4 className="report-h">{title}<LevelChip level={report.level} /></h4>
      <ul className="checks">
        {rows.map((r, i) => <Rule key={r.id + i} r={r} />)}
        {compact && rows.length === 1 && <li className="chk chk-pass"><div className="chk-b"><Ms n="check_circle" size={18} fill /><span className="chk-t"><span className="chk-m">All other checks pass.</span></span></div></li>}
      </ul>
    </div>
  );
}
