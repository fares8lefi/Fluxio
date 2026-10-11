import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { MarginByCategoryChart } from '@/components/charts/manager/MarginByCategoryChart';
import { StockValueChart } from '@/components/charts/manager/StockValueChart';
import { formatInt, formatMoney, formatPercent } from '@/components/charts/manager/formatters';
import { Boxes, Truck, RotateCcw, CalendarDays, TriangleAlert, PackageX, PackageMinus, Layers } from 'lucide-react';
import { BlockHeader } from './ManagerSalesBlock';

/** Compteur d'anomalie coloré, utilisé par la grille d'anomalies */
function AnomalyTile({ label, value, amount, tone = 'slate' }) {
  const TONES = {
    slate: 'border bg-white',
    rose: 'border-rose-200 bg-rose-50',
    amber: 'border-amber-200 bg-amber-50',
    cyan: 'border-cyan-200 bg-cyan-50',
  };
  const isZero = Number(value) === 0;

  return (
    <div className={`rounded-xl p-3 ${isZero ? TONES.slate : TONES[tone]}`}>
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${isZero ? 'text-slate-400' : 'text-slate-900'}`}>
        {formatInt(value)}
      </p>
      {amount !== undefined && (
        <p className="mt-0.5 text-[11px] text-slate-500">{formatMoney(amount)} TND immobilisés</p>
      )}
    </div>
  );
}

/**
 * Bloc 3 — Stock & achats : valorisation, couverture, retours, anomalies.
 * @param {{ block?: {loading: boolean, error: string|null, data: object|null}, onRetry?: () => void }} props
 */
export function ManagerStockBlock({ block, onRetry }) {
  const loading = block?.loading ?? true;
  const data = block?.data;

  if (block?.error && !data) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Bloc « Stock & achats » indisponible
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

  const valuation = data?.valuation;
  const anomalies = data?.anomalies;
  const hasStock = Number(valuation?.cost_value) !== 0 || Number(data?.purchases?.total) > 0;

  return (
    <section className="space-y-4" aria-label="Stock et achats">
      <BlockHeader
        icon={Boxes}
        tone="emerald"
        title="Stock & achats"
        subtitle="Valorisation du capital stocké, rotation, retours fournisseurs/clients et anomalies de stock."
      />

      {!loading && !hasStock ? (
        <div className="rounded-xl border bg-white shadow-sm">
          <EmptyState
            Icon={Boxes}
            title="Aucune donnée de stock"
            description="Aucun produit en stock et aucun achat enregistré sur cette période."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Boxes}
              tone="slate"
              label="Valeur au coût"
              value={formatMoney(valuation?.cost_value)}
              unit="TND"
              hint="Capital immobilisé"
            />
            <StatCard
              icon={Layers}
              tone="cyan"
              label="Valeur à la vente"
              value={formatMoney(valuation?.sale_value)}
              unit="TND"
              hint="Si tout le stock est écoulé"
            />
            <StatCard
              icon={PackageMinus}
              tone="emerald"
              label="Marge potentielle"
              value={formatMoney(valuation?.potential_margin)}
              unit="TND"
              hint={`Taux ${formatPercent(valuation?.margin_pct)}`}
            />
            <StatCard
              icon={CalendarDays}
              tone="amber"
              label="Couverture"
              value={formatInt(data?.coverage_days)}
              unit="j"
              hint="Stock total / vente journalière (30 j)"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <MarginByCategoryChart byCategory={data?.by_category} isLoading={loading} />
            <StockValueChart
              byCategory={data?.by_category}
              saleValue={valuation?.sale_value}
              isLoading={loading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard
              icon={Truck}
              tone="indigo"
              size="sm"
              label="Achats de la période"
              value={formatMoney(data?.purchases?.total)}
              unit="TND"
              hint={`${formatInt(data?.purchases?.movement_count)} entrée(s) en stock`}
            />
            <StatCard
              icon={RotateCcw}
              tone="rose"
              size="sm"
              label="Retours fournisseurs"
              value={formatMoney(data?.returns?.supplier_total)}
              unit="TND"
              hint={`${formatInt(data?.returns?.supplier_count)} retour(s)`}
            />
            <StatCard
              icon={RotateCcw}
              tone="amber"
              size="sm"
              label="Retours clients"
              value={formatMoney(data?.returns?.client_total)}
              unit="TND"
              hint={`Taux de retour global : ${formatPercent(data?.returns?.return_rate_pct)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Anomalies de stock</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AnomalyTile label="Ruptures" value={anomalies?.out_of_stock_count} tone="rose" />
                <AnomalyTile label="Stocks négatifs" value={anomalies?.negative_stock_count} tone="rose" />
                <AnomalyTile label="Sous le seuil min" value={anomalies?.below_min_count} tone="amber" />
                <AnomalyTile label="Sur-stockage" value={anomalies?.overstock_count} tone="cyan" />
                <AnomalyTile
                  label="Jamais vendus"
                  value={anomalies?.never_sold_count}
                  amount={anomalies?.never_sold_amount}
                  tone="amber"
                />
                <AnomalyTile label="Marge < 10 %" value={anomalies?.low_margin_count} tone="amber" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Top 5 fournisseurs (achats)</h3>
                </div>
                {(data?.top_suppliers ?? []).length === 0 ? (
                  <p className="px-5 py-8 text-center text-xs text-slate-400">
                    Aucun achat fournisseur sur cette période.
                  </p>
                ) : (
                  <ul className="divide-y text-xs">
                    {data.top_suppliers.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-slate-700">{row.name}</span>
                        <span className="shrink-0 text-slate-500">{formatInt(row.movement_count)} achat(s)</span>
                        <span className="w-28 shrink-0 text-right font-semibold tabular-nums text-slate-900">
                          {formatMoney(row.purchased_total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50/50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Produits à faible marge</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Taux de marge inférieur à 10 % sur le prix de vente.</p>
                </div>
                {(data?.low_margin_products ?? []).length === 0 ? (
                  <p className="px-5 py-8 text-center text-xs text-emerald-600">Aucune marge_lt10 détectée. ✓</p>
                ) : (
                  <ul className="divide-y text-xs">
                    {data.low_margin_products.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1 truncate text-slate-700">
                          {row.name}
                          {row.code && <span className="ml-1.5 font-mono text-slate-400">({row.code})</span>}
                        </span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {formatMoney(row.purchase_price)} → {formatMoney(row.selling_price)}
                        </span>
                        <span
                          className={`w-16 shrink-0 text-right font-semibold tabular-nums ${
                            row.margin_pct < 0 ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {formatPercent(row.margin_pct, 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <PackageX className="size-3 shrink-0" aria-hidden="true" />
            La couverture est calculée sur les ventes des 30 derniers jours ; elle vaut 0 si aucune vente n'est enregistrée.
          </p>
        </>
      )}
    </section>
  );
}

export default ManagerStockBlock;