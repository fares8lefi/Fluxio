import { TrendingUp, CheckCircle2, Clock, RotateCcw, ListChecks, BadgeCheck, AlertTriangle, FileCheck2 } from 'lucide-react';

const TONES = {
  cyan:    { icon: 'bg-cyan-50 text-cyan-700',     value: 'text-slate-900' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700', value: 'text-emerald-700' },
  amber:   { icon: 'bg-amber-50 text-amber-700',   value: 'text-amber-700' },
  rose:    { icon: 'bg-rose-50 text-rose-700',     value: 'text-rose-700' },
  slate:   { icon: 'bg-slate-100 text-slate-600',  value: 'text-slate-900' },
};

/**
 * Tuile d'indicateur
 * @param {LucideIcon} icon
 * @param {'cyan'|'emerald'|'amber'|'rose'|'slate'} tone
 * @param {string} label  — libellé court affiché en haut
 * @param {string|number} value
 * @param {string} [unit] — suffixe d'unité (ex : TND)
 * @param {string} [hint] — précision sous la valeur
 * @param {'sm'|'md'} size
 */
export function StatCard({ icon: Icon, tone = 'cyan', label, value, unit, hint, size = 'md' }) {
  const palette = TONES[tone] ?? TONES.cyan;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className={`flex items-center gap-2.5 ${size === 'sm' ? 'p-3' : 'p-5 pb-3'}`}>
        <span className={`grid shrink-0 place-items-center rounded-lg ${palette.icon} ${size === 'sm' ? 'size-8' : 'size-9'}`}>
          <Icon className={size === 'sm' ? 'size-4' : 'size-4'} aria-hidden="true" />
        </span>
        <span className="truncate text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {label}
        </span>
      </div>
      <div className={size === 'sm' ? 'px-3 pb-3' : 'px-5 pb-4'}>
        <p className={`font-bold tabular-nums ${palette.value} ${size === 'sm' ? 'text-lg' : 'text-xl'}`}>
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>}
        </p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Indicateurs de facturation (montants émis / encaissés)
 */
export function InvoicingStats({ totalTTC, totalPaid, totalPending, creditNoteCount }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={TrendingUp}
        tone="cyan"
        label="Facturé"
        value={Number(totalTTC ?? 0).toFixed(3)}
        unit="TND"
        hint="Total TTC émis"
      />
      <StatCard
        icon={CheckCircle2}
        tone="emerald"
        label="Encaissé"
        value={Number(totalPaid ?? 0).toFixed(3)}
        unit="TND"
        hint="Factures payées"
      />
      <StatCard
        icon={Clock}
        tone="amber"
        label="En attente"
        value={Number(totalPending ?? 0).toFixed(3)}
        unit="TND"
        hint="À encaisser"
      />
      <StatCard
        icon={RotateCcw}
        tone="rose"
        label="Avoirs"
        value={creditNoteCount ?? 0}
        hint="Factures d'avoir émises"
      />
    </div>
  );
}

/**
 * Indicateurs du pipeline de facturation (mouvements de type OUT)
 * @param {object} summary — { total, pending, ready, missing_info, already_invoiced }
 */
export function SalesPipelineStats({ summary }) {
  const toFacturer = (summary?.pending ?? 0) + (summary?.already_invoiced ?? 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={ListChecks}
        tone="slate"
        label="Ventes (OUT)"
        value={summary?.total ?? 0}
        hint={`${toFacturer} sur cette page`}
        size="sm"
      />
      <StatCard
        icon={BadgeCheck}
        tone="emerald"
        label="Prêtes à facturer"
        value={summary?.ready ?? 0}
        hint="Informations complètes"
        size="sm"
      />
      <StatCard
        icon={AlertTriangle}
        tone="amber"
        label="À compléter"
        value={summary?.missing_info ?? 0}
        hint="Informations manquantes"
        size="sm"
      />
      <StatCard
        icon={FileCheck2}
        tone="cyan"
        label="Déjà facturées"
        value={summary?.already_invoiced ?? 0}
        hint="Facture émise"
        size="sm"
      />
    </div>
  );
}