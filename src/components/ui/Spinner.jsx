import { cn } from '@/lib/utils';

const SIZE_CLS = {
  xs: 'size-3.5',
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-14',
};

/* Bars of the Fluxio mark (see Logo.jsx), drawn at full height: the CSS
   animation drains and restocks them (.stock-spinner in index.css). */
const BARS = [1, 7.75, 14.5];

/**
 * Spinner — the Fluxio mark in motion: its three stock bars drain and
 * restock in a wave, flashing amber as each one dips under its threshold.
 * @param {'xs'|'sm'|'md'|'lg'} [size='md']
 * @param {'brand'|'danger'|'current'} [tone='brand'] — `current` follows the text color
 * @param {string} [label] — accessible label (screen readers)
 */
export function Spinner({ size = 'md', tone = 'brand', label = 'Chargement…', className }) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        data-tone={tone}
        className={cn('stock-spinner', SIZE_CLS[size])}
      >
        {BARS.map((x, i) => (
          <rect key={x} x={x} y="3" width="4.5" height="15" rx="1" style={{ '--i': i }} />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * PageLoader — centered spinner filling a content area
 * @param {boolean} [fullScreen] — fill the whole viewport (app boot); the label is shown
 */
export function PageLoader({ fullScreen = false, label }) {
  return (
    <div
      className={cn(
        'grid place-items-center',
        fullScreen ? 'min-h-screen bg-slate-50' : 'py-20'
      )}
    >
      {fullScreen ? (
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" label={label} />
          <p aria-hidden="true" className="text-sm text-slate-500">
            {label ?? 'Chargement…'}
          </p>
        </div>
      ) : (
        <Spinner label={label} />
      )}
    </div>
  );
}
