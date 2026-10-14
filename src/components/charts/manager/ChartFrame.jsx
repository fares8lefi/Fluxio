import { Spinner } from '@/components/ui/Spinner';

/**
 * Cadre commun des graphiques « Pilotage » : conteneur blanc `rounded-xl
 * border`, en-tête (icône + titre + précision) et état de chargement / vide.
 * Reprend exactement la structure des graphiques existants de
 * `components/charts/` (thème clair par défaut).
 */
export function ChartFrame({
  icon: Icon,
  title,
  subtitle,
  tone = 'cyan',
  actions,
  isLoading = false,
  isEmpty = false,
  emptyLabel = 'Aucune donnée sur cette période.',
  emptyIcon: EmptyIcon,
  height = 280,
  children,
}) {
  const ICONS = { cyan: 'bg-cyan-50 text-cyan-700', indigo: 'bg-indigo-50 text-indigo-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          {Icon && (
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${ICONS[tone] ?? ICONS.cyan}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="pt-4" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <Spinner />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center text-xs text-slate-400" style={{ height }}>
            {EmptyIcon && <EmptyIcon className="mb-2 size-8 stroke-1 text-slate-300" />}
            {emptyLabel}
          </div>
        ) : (
          <div style={{ height }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartFrame;