const TONES = {
  cyan: { icon: 'bg-cyan-50 text-cyan-700', value: 'text-slate-900' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700', value: 'text-emerald-700' },
  amber: { icon: 'bg-amber-50 text-amber-700', value: 'text-amber-700' },
  rose: { icon: 'bg-rose-50 text-rose-700', value: 'text-rose-700' },
  indigo: { icon: 'bg-indigo-50 text-indigo-700', value: 'text-indigo-700' },
  slate: { icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
};

/**
 * Tuile d'indicateur partagée (dashboard « Pilotage » et facturation).
 *
 * Rendu volontairement identique à l'ancienne tuile locale
 * `features/invoices/InvoiceStats.jsx` : le rendu ne doit pas changer.
 * @param {LucideIcon} icon
 * @param {'cyan'|'emerald'|'amber'|'rose'|'indigo'|'slate'} tone
 * @param {string} label  — libellé court affiché en haut
 * @param {string|number} value
 * @param {string} [unit] — suffixe d'unité (ex : TND)
 * @param {string} [hint] — précision sous la valeur
 * @param {React.ReactNode} [trailing] — contenu aligné à droite de l'en-tête (variation…)
 * @param {'sm'|'md'} size
 */
export function StatCard({
  icon: Icon,
  tone = 'cyan',
  label,
  value,
  unit,
  hint,
  trailing,
  size = 'md',
}) {
  const palette = TONES[tone] ?? TONES.cyan;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div
        className={`flex items-center gap-2.5 ${size === 'sm' ? 'p-3' : 'p-5 pb-3'}`}
      >
        <span
          className={`grid shrink-0 place-items-center rounded-lg ${palette.icon} ${size === 'sm' ? 'size-8' : 'size-9'}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="truncate text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {label}
        </span>
        {trailing && <span className="ml-auto shrink-0">{trailing}</span>}
      </div>
      <div className={size === 'sm' ? 'px-3 pb-3' : 'px-5 pb-4'}>
        <p
          className={`font-bold tabular-nums ${palette.value} ${size === 'sm' ? 'text-lg' : 'text-xl'}`}
        >
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export default StatCard;