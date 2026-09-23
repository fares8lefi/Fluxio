import { Button } from '@/components/ui/button';

/**
 * EmptyState — shown when a list is empty
 * @param {LucideIcon} Icon
 * @param {string} title
 * @param {string} description
 * @param {string} [actionLabel]
 * @param {() => void} [onAction]
 */
export function EmptyState({ Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-7" />
      </span>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6 rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
