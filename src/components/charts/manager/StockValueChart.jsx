import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Boxes } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, axisTick, formatCompact, formatMoney, gridStroke, truncateLabel } from './formatters';

function StockTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[200px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-800">{point.category}</p>
      <div className="mt-1.5 space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.indigo }} />
            Valeur au coût
          </span>
          <strong className="text-slate-900">{formatMoney(point.stock_cost_value)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.cyan }} />
            Valeur au prix de vente
          </span>
          <strong className="text-slate-900">{formatMoney(point.potential_sale_value)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 text-[11px] text-slate-500">
          <span>Marge potentielle</span>
          <span>{formatMoney(point.potential_margin)}</span>
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
 * Valorisation du stock par catégorie : coût d'achat vs prix de vente.
 * @param {{ by_category?: Array<{category: string, stock_cost_value: number, sales_ht: number, margin: number, margin_pct: number, product_count: number}>, saleValue?: number }} props
 */
export function StockValueChart({ byCategory = [], saleValue, isLoading = false }) {
  // Répartit la valeur de vente totale au prorata de la valeur au coût : la
  // répartition par catégorie n'est pas fournie par l'API.
  const totalCost = byCategory.reduce((acc, row) => acc + (Number(row.stock_cost_value) || 0), 0);
  const ratio = totalCost > 0 ? (Number(saleValue) || 0) / totalCost : 0;

  const data = byCategory
    .filter((row) => Number(row.stock_cost_value) !== 0)
    .sort((a, b) => Number(b.stock_cost_value) - Number(a.stock_cost_value))
    .slice(0, 10)
    .map((row) => {
      const cost = Number(row.stock_cost_value) || 0;
      const potentialSale = cost * ratio;
      return {
        category: row.category,
        short: truncateLabel(row.category, 14),
        stock_cost_value: cost,
        potential_sale_value: potentialSale,
        potential_margin: potentialSale - cost,
        product_count: row.product_count,
      };
    });

  return (
    <ChartFrame
      icon={Boxes}
      tone="indigo"
      title="Valorisation du stock par catégorie"
      subtitle="Valeur au prix d'achat face à la valeur au prix de vente (marge potentielle si tout est vendu)."
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyLabel="Aucune référence en stock."
      height={290}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 15, left: -5, bottom: 0 }}>
          <CartesianGrid {...gridStroke} />
          <XAxis dataKey="short" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={axisTick} interval={0} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={52} />
          <Tooltip content={<StockTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#64748b' }}
          />
          <Bar dataKey="stock_cost_value" name="Valeur au coût" fill={CHART_COLORS.indigo} radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="potential_sale_value" name="Valeur à la vente" fill={CHART_COLORS.cyan} radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default StockValueChart;