import { cn } from '@/lib/utils';

const VARIANTS = {
  active:   'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  alert:    'bg-amber-100 text-amber-700',
  danger:   'bg-rose-100 text-rose-700',
  info:     'bg-cyan-100 text-cyan-700',
};

/**
 * Badge pill
 * @param {'active'|'inactive'|'alert'|'danger'|'info'} variant
 */
export function Badge({ variant = 'info', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
