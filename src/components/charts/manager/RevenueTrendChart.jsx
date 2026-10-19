import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, axisTick, formatCompact, formatMoney, gridStroke } from './formatters';

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[190px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-slate-800">{label}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full bg-cyan-600" />
            Facturé TTC
          </span>
          <strong className="text-slate-900">{formatMoney(point.billed_ttc)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full bg-emerald-600" />
            Encaissé TTC
          </span>
          <strong className="text-slate-900">{formatMoney(point.collected_ttc)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 text-[11px] text-slate-500">
          <span>Facturé HT</span>
          <span>{formatMoney(point.billed_ht)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>TVA</span>
          <span>{formatMoney(point.tva)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Série 12 mois glissants : CA facturé vs CA encaissé.
 * @param {{ trend?: Array<{month: string, label: string, billed_ttc: number, collected_ttc: number, billed_ht: number, tva: number}> }} props
 */
export function RevenueTrendChart({ trend = [], isLoading = false }) {
  const hasData = trend.some((row) => Number(row.billed_ttc) > 0 || Number(row.collected_ttc) > 0);

  return (
    <ChartFrame
      icon={TrendingUp}
      title="Évolution du chiffre d'affaires (12 mois)"
      subtitle="Facturé TTC net des avoirs (date de facture) et encaissé (date de règlement), par mois."
      isLoading={isLoading}
      isEmpty={!hasData}
      emptyLabel="Aucune facture sur les 12 derniers mois."
      height={300}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend} margin={{ top: 5, right: 15, left: -5, bottom: 0 }}>
          <defs>
            <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid {...gridStroke} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d8dfe0' }} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={52} />
          <Tooltip content={<TrendTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#637477' }}
          />

          <Area
            type="monotone"
            dataKey="billed_ttc"
            name="Facturé TTC"
            stroke={CHART_COLORS.cyan}
            strokeWidth={2.5}
            fill="url(#billedGradient)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="collected_ttc"
            name="Encaissé TTC"
            stroke={CHART_COLORS.emerald}
            strokeWidth={2.5}
            fill="url(#collectedGradient)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default RevenueTrendChart;