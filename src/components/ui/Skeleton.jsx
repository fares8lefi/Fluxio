import { cn } from '@/lib/utils';

/** Skeleton — grey placeholder block shown while content loads */
export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-md bg-slate-200/70', className)}
    />
  );
}

/**
 * TableSkeleton — placeholder for a data table card
 * @param {number} [rows=6]
 * @param {number} [columns=5]
 */
export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div
      role="status"
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      <span className="sr-only">Chargement…</span>
      <div className="flex gap-6 border-b bg-slate-50 px-5 py-3.5">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex items-center gap-6 px-5 py-4">
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton
                key={c}
                className={cn('h-4 flex-1', c === 0 && 'max-w-[40%] flex-[2]')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
