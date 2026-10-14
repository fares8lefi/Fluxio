import { cn } from '@/lib/utils';

const SIZE_CLS = {
  xs: 'size-3.5 border-2',
  sm: 'size-6 border-2',
  md: 'size-8 border-4',
};

/**
 * Spinner — circular loading indicator
 * @param {'xs'|'sm'|'md'} [size='md']
 * @param {string} [label] — accessible label (screen readers)
 */
export function Spinner({ size = 'md', label = 'Chargement…', className }) {
  return (
    <span role="status" className="inline-flex">
      <span
        aria-hidden="true"
        className={cn(
          'animate-spin rounded-full border-slate-200 border-t-cyan-700',
          SIZE_CLS[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * PageLoader — centered spinner filling a content area
 * @param {boolean} [fullScreen] — fill the whole viewport (app boot)
 */
export function PageLoader({ fullScreen = false, label }) {
  return (
    <div
      className={cn(
        'grid place-items-center',
        fullScreen ? 'min-h-screen bg-slate-50' : 'py-20'
      )}
    >
      <Spinner label={label} />
    </div>
  );
}
