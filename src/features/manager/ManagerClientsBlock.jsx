import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { TopClientsChart } from '@/components/charts/manager/TopClientsChart';
import { formatDate, formatInt, formatMoney, formatPercent } from '@/components/charts/manager/formatters';
import { Users, UserCheck, UserX, Sparkles, Layers, TriangleAlert } from 'lucide-react';
import { BlockHeader } from './ManagerSalesBlock';

/**
 * Bloc 2 — Clients : volumétrie, concentration, impayés critiques.
 * @param {{ block?: {loading: boolean, error: string|null, data: object|null}, onRetry?: () => void }} props
 */
export function ManagerClientsBlock({ block, onRetry }) {
  const loading = block?.loading ?? true;
  const data = block?.data;
  const counts = data?.counts;

  if (block?.error && !data) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Bloc « Clients » indisponible
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

  const hasClients = Number(counts?.total) > 0;

  return (
    <section className="space-y-4" aria-label="Clients">
      <BlockHeader
        icon={Users}
        tone="indigo"
        title="Clients"
        subtitle="Volumétrie du portefeuille, concentration du chiffre d'affaires et impayés critiques."
      />

      {!loading && !hasClients ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <EmptyState
            Icon={Users}
            title="Aucun client enregistré"
            description="Créez vos clients puis enregistrez des ventes pour alimenter cet indicateur."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} tone="indigo" label="Clients" value={formatInt(counts?.total)} hint="Comptes enregistrés" />
            <StatCard icon={UserCheck} tone="emerald" label="Actifs" value={formatInt(counts?.active)} hint="is_active = true" />
            <StatCard icon={UserX} tone="slate" label="Inactifs" value={formatInt(counts?.inactive)} hint="Aucune activité récente" />
            <StatCard
              icon={Sparkles}
              tone="cyan"
              label="Nouveaux"
              value={formatInt(counts?.new_in_period)}
              hint="1re vente sur la période"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <TopClientsChart topClients={data?.top_clients} isLoading={loading} />

            <div className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  icon={Layers}
                  tone="amber"
                  size="sm"
                  label="Top 5 du CA"
                  value={formatPercent(data?.concentration?.top5_share_pct, 0)}
                  hint="Part du CA portée par les 5 premiers clients"
                />
                <StatCard
                  icon={Layers}
                  tone="amber"
                  size="sm"
                  label="Top 10 du CA"
                  value={formatPercent(data?.concentration?.top10_share_pct, 0)}
                  hint="Part du CA portée par les 10 premiers clients"
                />
                <StatCard
                  icon={Users}
                  tone="cyan"
                  size="sm"
                  label="Panier moyen"
                  value={formatMoney(data?.avg_basket_per_client)}
                  unit="TND"
                  hint="Par client facturé sur la période"
                />
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Clients à risque</h3>
                  <span className="text-[11px] font-medium text-slate-500">
                    Facture PENDING de plus de 60 jours
                  </span>
                </div>

                {(data?.at_risk ?? []).length === 0 ? (
                  <p className="px-5 py-8 text-center text-xs text-emerald-600">
                    Aucun impayé de plus de 60 jours. ✓
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
                        <tr>
                          <th className="px-5 py-2.5 text-left">Client</th>
                          <th className="px-5 py-2.5 text-right">Encours TTC</th>
                          <th className="px-5 py-2.5 text-left">Facture la plus ancienne</th>
                          <th className="px-5 py-2.5 text-right">Retard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {data.at_risk.map((row) => (
                          <tr key={row.id}>
                            <td className="px-5 py-2.5 font-medium text-slate-900">{row.name}</td>
                            <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-rose-600">
                              {formatMoney(row.outstanding_ttc)}
                            </td>
                            <td className="px-5 py-2.5 text-slate-600">{formatDate(row.oldest_invoice_date)}</td>
                            <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-rose-600">
                              {formatInt(row.days_overdue)} j
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ManagerClientsBlock;