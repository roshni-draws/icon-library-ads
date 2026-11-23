import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegOption<T extends string> { value: T; label: ReactNode; title?: string }

/** Segmented toggle: a group of aria-pressed buttons. Arrow keys move and select (as in the Previewer). */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: SegOption<T>[]; onChange: (v: T) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[n].value);
    ref.current?.querySelectorAll('button')[n]?.focus();
  };
  return (
    <div className="seg" role="group" aria-label={label} ref={ref} onKeyDown={onKey}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} title={o.title} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Material Symbols Rounded font glyph for the app chrome. */
export const Ms = ({ n, size = 18, fill = false }: { n: string; size?: number; fill?: boolean }) => (
  <span className="ms" aria-hidden="true" style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'opsz' ${Math.min(48, Math.max(20, size))}` }}>{n}</span>
);
