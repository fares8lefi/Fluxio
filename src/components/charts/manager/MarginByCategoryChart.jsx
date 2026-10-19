import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Scale } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, axisTick, formatCompact, formatMoney, formatPercent, gridStroke, truncateLabel } from './formatters';

function MarginTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[200px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-slate-800">{point.category}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.cyan }} />
            Ventes HT
          </span>
          <strong className="text-slate-900">{formatMoney(point.sales_ht)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.emerald }} />
            Marge estimée
          </span>
          <strong className="text-slate-900">{formatMoney(point.margin)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 text-[11px] text-slate-500">
          <span>Taux de marge</span>
          <span>{formatPercent(point.margin_pct)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px] text-slate-500">
          <span>Références</span>
          <span>{point.product_count}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Ventes HT et marge estimée par catégorie.
 * Marge ESTIMÉE : `MovementItem` ne fige pas le prix d'achat (limite du modèle).
 * @param {{ by_category?: Array<{category: string, stock_cost_value: number, sales_ht: number, margin: number, margin_pct: number, product_count: number}> }} props
 */
export function MarginByCategoryChart({ byCategory = [], isLoading = false }) {
  const data = [...byCategory]
    .filter((row) => Number(row.sales_ht) > 0)
    .sort((a, b) => Number(b.sales_ht) - Number(a.sales_ht))
    .slice(0, 10)
    .map((row) => ({ ...row, short: truncateLabel(row.category, 14) }));

  return (
    <ChartFrame
      icon={Scale}
      tone="indigo"
      title="Ventes & marge estimée par catégorie"
      subtitle="Marge calculée sur le prix d'achat en vigueur au moment de chaque vente."
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyLabel="Aucune vente sur cette période."
      height={290}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 15, left: -5, bottom: 0 }}>
          <CartesianGrid {...gridStroke} />
          <XAxis dataKey="short" tickLine={false} axisLine={{ stroke: '#d8dfe0' }} tick={axisTick} interval={0} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={52} />
          <Tooltip content={<MarginTooltip />} cursor={{ fill: '#f4f6f6' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#637477' }}
          />
          <Bar dataKey="sales_ht" name="Ventes HT" fill={CHART_COLORS.cyan} radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="margin" name="Marge estimée" fill={CHART_COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default MarginByCategoryChart;