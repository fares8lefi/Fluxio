import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowLeftRight } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, axisTick, formatCompact, formatMoney, gridStroke } from './formatters';

function FlowTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[190px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold text-slate-800">{label}</p>
      <div className="space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.emerald }} />
            Mouvements
          </span>
          <strong className="text-slate-900">{point.movements}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1">
          <span className="text-slate-500">Montant total</span>
          <strong className="text-slate-900">{formatMoney(point.amount)}</strong>
        </div>
      </div>
    </div>
  );
}

/**
 * Flux de mouvements sur 12 mois (nombre + montant).
 * @param {{ monthly_activity?: Array<{month: string, label: string, movements: number, amount: number}> }} props
 */
export function MovementFlowChart({ monthlyActivity = [], isLoading = false }) {
  const hasData = monthlyActivity.some((row) => Number(row.movements) > 0);

  return (
    <ChartFrame
      icon={ArrowLeftRight}
      tone="emerald"
      title="Flux de mouvements de stock (12 mois)"
      subtitle="Nombre de mouvements et montant associé, mouvements annulés exclus."
      isLoading={isLoading}
      isEmpty={!hasData}
      emptyLabel="Aucun mouvement de stock sur les 12 derniers mois."
      height={280}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyActivity} margin={{ top: 5, right: 15, left: -5, bottom: 0 }}>
          <CartesianGrid {...gridStroke} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={46} allowDecimals={false} />
          <Tooltip content={<FlowTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#64748b' }}
          />
          <Bar dataKey="movements" name="Mouvements" fill={CHART_COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="amount" name="Montant" fill={CHART_COLORS.cyan} radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default MovementFlowChart;