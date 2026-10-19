import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Handshake, Clock } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, axisTick, formatCompact, formatMoney, formatPercent, gridStroke } from './formatters';

const AGEING = [
  { key: 'lt_30', label: 'Moins de 30 j', color: CHART_COLORS.emerald },
  { key: '30_60', label: '30 à 60 j', color: CHART_COLORS.amber },
  { key: 'gt_60', label: 'Plus de 60 j', color: CHART_COLORS.rose },
];

function AgeingTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, payload: point } = payload[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-800">{point.label}</p>
      <p className="mt-1 text-slate-500">
        <span className="size-2.5 mr-1.5 inline-block rounded-full" style={{ backgroundColor: point.color }} />
        {name} : <strong className="text-slate-900">{formatMoney(value)}</strong> TND
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{formatMoney(point.share)} % de l'encours</p>
    </div>
  );
}

/**
 * Recouvrement : taux d'encaissement + ventilation de l'encours par ancienneté.
 * @param {{ collection?: { rate_pct: number, outstanding_ttc: number, outstanding_invoice_count: number, ageing: { lt_30: number, '30_60': number, gt_60: number } } }} props
 */
export function CollectionChart({ collection, isLoading = false }) {
  const ageing = collection?.ageing ?? { lt_30: 0, '30_60': 0, gt_60: 0 };
  const outstanding = Number(collection?.outstanding_ttc) || 0;
  const rate = Number(collection?.rate_pct) || 0;

  const data = AGEING.map((bucket) => {
    const value = Number(ageing[bucket.key]) || 0;
    return {
      label: bucket.label,
      color: bucket.color,
      amount: value,
      share: outstanding > 0 ? (value / outstanding) * 100 : 0,
    };
  });

  const hasData = outstanding > 0;

  return (
    <ChartFrame
      icon={Handshake}
      title="Recouvrement & ancienneté des impayés"
      subtitle={`Factures de la période réglées à ${formatPercent(rate)}. Encours à ce jour : ${formatMoney(outstanding)} TND sur ${collection?.outstanding_invoice_count ?? 0} facture(s)`}
      isLoading={isLoading}
      isEmpty={!hasData}
      emptyLabel="Aucun impayé à ce jour : tout est encaissé."
      height={260}
    >
      {/* Jauge de recouvrement */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span>Encaissé</span>
          <span>Facturé</span>
        </div>
        <div
          className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`Taux de recouvrement : ${formatMoney(rate)} pour cent du net à payer des factures de la période a été réglé`}
        >
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600">
          <strong className="font-bold text-emerald-700">{formatMoney(rate)} %</strong>{' '}
          du chiffre d'affaires facturé a été encaissé
          {rate > 0 && rate < 100 && (
            <span className="ml-1 text-amber-700">
              — {formatMoney(100 - rate)} % restent à recouvrer
            </span>
          )}
        </p>
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
            <CartesianGrid {...gridStroke} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d8dfe0' }} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={52} />
            <Tooltip content={<AgeingTooltip />} cursor={{ fill: '#f4f6f6' }} />
            <Bar dataKey="amount" name="Encours" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Clock className="size-3" aria-hidden="true" />
        Ancienneté calculée depuis la date d'émission des factures non réglées.
      </p>
    </ChartFrame>
  );
}

export default CollectionChart;