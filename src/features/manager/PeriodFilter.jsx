import { RefreshCw, CalendarDays, TriangleAlert } from 'lucide-react';
import { PERIOD_PRESETS } from './use-manager-period';

/**
 * Sélecteur de période : préréglages + plage de dates personnalisée.
 * @param {{
 *   period: string, startDate: string, endDate: string,
 *   isCustom: boolean, customRangeValid: boolean,
 *   onPreset: (key: string) => void,
 *   onCustomRange: (range: {startDate?: string, endDate?: string}) => void,
 *   onRefresh?: () => void, refreshing?: boolean
 * }} props
 */
export function PeriodFilter({
  period,
  startDate,
  endDate,
  isCustom,
  customRangeValid,
  onPreset,
  onCustomRange,
  onRefresh,
  refreshing = false,
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between"
      aria-label="Période d'analyse"
    >
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Période
        </span>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Préréglages de période">
          {PERIOD_PRESETS.map((preset) => {
            const isActive = preset.key === period;
            return (
              <button
                key={preset.key}
                type="button"
                title={preset.title}
                aria-pressed={isActive}
                onClick={() => onPreset(preset.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'border-cyan-700 bg-cyan-50 text-cyan-800 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        {isCustom && (
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">Du</span>
              <input
                type="date"
                value={startDate || ''}
                max={endDate || undefined}
                onChange={(event) => onCustomRange({ startDate: event.target.value })}
                className="rounded-lg border bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">Au</span>
              <input
                type="date"
                value={endDate || ''}
                min={startDate || undefined}
                onChange={(event) => onCustomRange({ endDate: event.target.value })}
                className="rounded-lg border bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </label>
          </div>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualiser
          </button>
        )}
      </div>

      {isCustom && !customRangeValid && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          Renseignez une date de début et une date de fin (début ≤ fin) pour lancer l'analyse.
        </p>
      )}
    </section>
  );
}

export default PeriodFilter;