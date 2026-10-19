import { cn } from '@/lib/utils';

const VARIANTS = {
  active:   'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 ring-inset',
  inactive: 'bg-slate-100 text-slate-600',
  alert:    'bg-amber-50 text-amber-800 ring-1 ring-amber-200 ring-inset',
  danger:   'bg-rose-50 text-rose-700 ring-1 ring-rose-200 ring-inset',
  info:     'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 ring-inset',
};

/**
 * Badge pill
 * @param {'active'|'inactive'|'alert'|'danger'|'info'} variant
 */
export function Badge({ variant = 'info', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
