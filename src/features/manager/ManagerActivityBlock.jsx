import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { MovementFlowChart } from '@/components/charts/manager/MovementFlowChart';
import { formatInt, formatMoney, formatPercent } from '@/components/charts/manager/formatters';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Ban,
  FileInput,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import { BlockHeader } from './ManagerSalesBlock';

const COMPLIANCE_ROWS = [
  {
    key: 'sales_without_client_count',
    amountKey: 'sales_without_client_amount',
    label: 'Ventes (OUT) sans client',
    advice: 'Complétez le client sur ces mouvements avant facturation.',
  },
  {
    key: 'invoices_without_client_count',
    label: 'Factures sans client',
    advice: 'Ces factures ne sont rattachées à aucun tiers.',
  },
  {
    key: 'clients_missing_matricule_count',
    label: 'Clients sans matricule fiscal',
    advice: 'Matricule obligatoire pour la facturation et les déclarations fiscales.',
  },
  {
    key: 'products_invalid_tva_rate_count',
    label: 'Produits à taux de TVA invalide',
    advice: 'Taux attendu : 0, 7, 13 ou 19 %.',
  },
];

/**
 * Bloc 4 — Activité & conformité.
 * @param {{ block?: {loading: boolean, error: string|null, data: object|null}, onRetry?: () => void }} props
 */
export function ManagerActivityBlock({ block, onRetry }) {
  const loading = block?.loading ?? true;
  const data = block?.data;
  const movements = data?.movements;

  if (block?.error && !data) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Bloc « Activité & conformité » indisponible
        </p>
        <p className="mt-1 text-xs text-rose-700">{block.error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  const hasActivity = Number(movements?.total) > 0 || Number(data?.quotes?.count) > 0;
  const complianceIssues = COMPLIANCE_ROWS.reduce(
    (acc, row) => acc + (Number(data?.compliance?.[row.key]) || 0),
    0
  );

  return (
    <section className="space-y-4" aria-label="Activité et conformité">
      <BlockHeader
        icon={ArrowLeftRight}
        tone="amber"
        title="Activité & conformité"
        subtitle="Flux de mouvements, production commerciale et points de contrôle à corriger."
      />

      {!loading && !hasActivity ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <EmptyState
            Icon={ArrowLeftRight}
            title="Aucune activité sur cette période"
            description="Aucun mouvement de stock ni devis n'a été enregistré sur l'intervalle sélectionné."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ArrowDownLeft}
              tone="indigo"
              label="Entrées"
              value={formatInt(movements?.by_type?.IN)}
              hint="Réceptions fournisseurs"
            />
            <StatCard
              icon={ArrowUpRight}
              tone="cyan"
              label="Sorties"
              value={formatInt(movements?.by_type?.OUT)}
              hint="Ventes clients"
            />
            <StatCard
              icon={RotateCcw}
              tone="amber"
              label="Retours"
              value={formatInt((movements?.by_type?.RETURN_SUPPLIER || 0) + (movements?.by_type?.RETURN_CLIENT || 0))}
              hint={`${formatInt(movements?.by_type?.RETURN_SUPPLIER)} fournisseur · ${formatInt(movements?.by_type?.RETURN_CLIENT)} client`}
            />
            <StatCard
              icon={Ban}
              tone="rose"
              label="Annulés"
              value={formatInt(movements?.cancelled)}
              hint="Exclus de tous les chiffres"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MovementFlowChart monthlyActivity={data?.monthly_activity} isLoading={loading} />
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Devis & pro forma</h3>
                </div>
                <dl className="divide-y text-xs">
                  <div className="flex items-center justify-between px-5 py-2.5">
                    <dt className="text-slate-500">Devis émis</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{formatInt(data?.quotes?.count)}</dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-2.5">
                    <dt className="text-slate-500">Montant TTC</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{formatMoney(data?.quotes?.amount)}</dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-2.5">
                    <dt className="text-slate-500">Convertis</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{formatInt(data?.quotes?.converted_count)}</dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-2.5">
                    <dt className="text-slate-500">Taux de conversion</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">
                      {formatPercent(data?.quotes?.conversion_rate_pct)}
                    </dd>
                  </div>
                </dl>
                <p className="border-t px-5 py-2.5 text-[11px] text-slate-500">
                  Le taux repose sur le statut « converti » des devis.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Produits les plus vendus</h3>
                </div>
                {(data?.top_products ?? []).length === 0 ? (
                  <p className="px-5 py-8 text-center text-xs text-slate-400">Aucune vente sur cette période.</p>
                ) : (
                  <ul className="divide-y text-xs">
                    {data.top_products.map((row, index) => (
                      <li key={`${row.name}-${index}`} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-slate-700">{row.name}</span>
                        <span className="shrink-0 text-slate-500">{formatInt(row.quantity)} u.</span>
                        <span className="w-28 shrink-0 text-right font-semibold tabular-nums text-slate-900">
                          {formatMoney(row.revenue_ht)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-5 ${
              complianceIssues > 0 ? 'border-rose-200 bg-rose-50' : 'bg-white'
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                  complianceIssues > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {complianceIssues > 0 ? (
                  <ShieldAlert className="size-4" aria-hidden="true" />
                ) : (
                  <FileInput className="size-4" aria-hidden="true" />
                )}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900">Points de conformité</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {complianceIssues > 0
                    ? `${complianceIssues} anomalie(s) à corriger avant la prochaine facturation.`
                    : 'Aucune anomalie détectée sur cette période. ✓'}
                </p>
              </div>
            </div>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {COMPLIANCE_ROWS.map((row) => {
                const value = Number(data?.compliance?.[row.key]) || 0;
                return (
                  <li
                    key={row.key}
                    className={`rounded-lg border px-3 py-2 ${value > 0 ? 'border-rose-200 bg-white' : 'border-slate-200 bg-slate-50/60'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">{row.label}</span>
                      <span
                        className={`text-sm font-bold tabular-nums ${value > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        {formatInt(value)}
                      </span>
                    </div>
                    {value > 0 && row.amountKey && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {formatMoney(data.compliance[row.amountKey])} TND HT concernés
                      </p>
                    )}
                    {value > 0 && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{row.advice}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

export default ManagerActivityBlock;