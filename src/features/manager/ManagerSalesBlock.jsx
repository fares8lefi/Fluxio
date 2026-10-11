import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RevenueTrendChart } from '@/components/charts/manager/RevenueTrendChart';
import { CollectionChart } from '@/components/charts/manager/CollectionChart';
import { formatInt, formatMoney, formatPercent } from '@/components/charts/manager/formatters';
import {
  ReceiptText,
  FileText,
  TriangleAlert,
  ListChecks,
  Landmark,
  Percent,
} from 'lucide-react';

/** En-tête de section réutilisable par les 4 blocs */
export function BlockHeader({ icon: Icon, tone = 'cyan', title, subtitle, actions }) {
  const TONES = {
    cyan: 'bg-cyan-50 text-cyan-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONES[tone] ?? TONES.cyan}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Bloc 1 — Ventes & facturation.
 * @param {{ block?: {loading: boolean, error: string|null, data: object|null}, onRetry?: () => void }} props
 */
export function ManagerSalesBlock({ block, onRetry }) {
  const loading = block?.loading ?? true;
  const data = block?.data;

  if (block?.error && !data) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Bloc « Ventes & facturation » indisponible
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

  const totals = data?.totals;
  const hasSales = Number(totals?.billed_ttc) > 0 || Number(totals?.credit_notes_ttc) > 0 || Number(data?.not_invoiced_sales?.count) > 0;

  return (
    <section className="space-y-4" aria-label="Ventes et facturation">
      <BlockHeader
        icon={ReceiptText}
        title="Ventes & facturation"
        subtitle="Montants facturés, encaissements, recouvrement et ventilation de la TVA."
      />

      {!loading && !hasSales ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <EmptyState
            Icon={ReceiptText}
            title="Aucune vente sur cette période"
            description="Aucune facture ni mouvement de sortie n'a été enregistré sur l'intervalle sélectionné."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              tone="cyan"
              label="Facturé TTC"
              value={formatMoney(totals?.billed_ttc)}
              unit="TND"
              hint={`${formatInt(totals?.sale_invoice_count)} facture(s) de vente`}
            />
            <StatCard
              icon={Landmark}
              tone="emerald"
              label="Encaissé TTC"
              value={formatMoney(totals?.collected_ttc)}
              unit="TND"
              hint={`Net à payer : ${formatMoney(totals?.net_payable)} TND`}
            />
            <StatCard
              icon={Percent}
              tone="indigo"
              label="Facturé HT"
              value={formatMoney(totals?.billed_ht)}
              unit="TND"
              hint={`TVA : ${formatMoney(totals?.tva)} TND · timbre : ${formatMoney(totals?.timbre_fiscal)}`}
            />
            <StatCard
              icon={ListChecks}
              tone="amber"
              label="Après avoirs"
              value={formatMoney(totals?.net_after_credit_notes)}
              unit="TND"
              hint={`${formatInt(totals?.credit_note_count)} avoir(s) — ${formatMoney(totals?.credit_notes_ttc)} TND`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueTrendChart trend={data?.trend} isLoading={loading} />
            <CollectionChart collection={data?.collection} isLoading={loading} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Ventilation TVA */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="border-b bg-slate-50/50 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Ventilation de la TVA par taux</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Les factures suspendues (TVA 0) sont exclues de cette ventilation.
                </p>
              </div>
              {(data?.tva_by_rate ?? []).length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-slate-400">
                  Aucune ventilation disponible sur cette période.
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="border-b bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-2.5 text-left">Taux</th>
                      <th className="px-5 py-2.5 text-right">Base HT</th>
                      <th className="px-5 py-2.5 text-right">Montant TVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {data.tva_by_rate.map((row) => (
                      <tr key={row.rate}>
                        <td className="px-5 py-2.5 font-medium text-slate-900">{formatPercent(row.rate, 0)}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums">{formatMoney(row.base_ht)}</td>
                        <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatMoney(row.tva_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Points de vigilance */}
            <div className="space-y-3">
              <div
                className={`rounded-xl border p-4 ${
                  Number(totals?.suspended_ttc) > 0 ? 'border-amber-200 bg-amber-50' : 'bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase">Ventes en suspension de TVA</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {formatMoney(totals?.suspended_ttc)} <span className="text-xs font-normal text-slate-400">TND</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Factures émises à 0 % (non assujetties) — contribution nulle dans la ventilation TVA.
                </p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  Number(data?.not_invoiced_sales?.count) > 0 ? 'border-rose-200 bg-rose-50' : 'bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase">Ventes à facturer</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {formatInt(data?.not_invoiced_sales?.count)}{' '}
                  <span className="text-xs font-normal text-slate-500">mouvement(s) · {formatMoney(data?.not_invoiced_sales?.amount_ht)} TND HT</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Sorties de stock sans facture rattachée : à facturer ou à compléter.
                </p>
              </div>

              {(data?.top_clients ?? []).length > 0 && (
                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <div className="border-b bg-slate-50/50 px-5 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Top 5 clients facturés</h3>
                  </div>
                  <ul className="divide-y text-xs">
                    {data.top_clients.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-slate-700">{row.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatMoney(row.invoiced_ttc)}</span>
                        <span className="w-12 shrink-0 text-right tabular-nums text-slate-500">{formatPercent(row.share_pct, 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ManagerSalesBlock;