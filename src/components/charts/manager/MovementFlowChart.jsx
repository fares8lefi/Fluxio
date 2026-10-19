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
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.cyan }} />
            Entrées (achats)
          </span>
          <strong className="text-slate-900">{formatMoney(point.in_amount)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.emerald }} />
            Sorties (ventes)
          </span>
          <strong className="text-slate-900">{formatMoney(point.out_amount)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1">
          <span className="text-slate-500">Mouvements, tous types</span>
          <strong className="text-slate-900">{point.movements}</strong>
        </div>
      </div>
    </div>
  );
}

/**
 * Valeur HT des entrées et des sorties de stock sur 12 mois. Le nombre de
 * mouvements n'est que dans l'infobulle : il ne partage pas l'échelle des dinars.
 * @param {{ monthlyActivity?: Array<{month, label, movements, in_amount, out_amount}> }} props
 */
export function MovementFlowChart({ monthlyActivity = [], isLoading = false }) {
  const hasData = monthlyActivity.some((row) => Number(row.movements) > 0);

  return (
    <ChartFrame
      icon={ArrowLeftRight}
      tone="emerald"
      title="Entrées et sorties de stock (12 mois)"
      subtitle="Valeur HT des réceptions et des sorties, mouvements annulés exclus."
      isLoading={isLoading}
      isEmpty={!hasData}
      emptyLabel="Aucun mouvement de stock sur les 12 derniers mois."
      height={280}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyActivity} margin={{ top: 5, right: 15, left: -5, bottom: 0 }}>
          <CartesianGrid {...gridStroke} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#d8dfe0' }} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} tick={axisTick} tickFormatter={formatCompact} width={46} />
          <Tooltip content={<FlowTooltip />} cursor={{ fill: '#f4f6f6' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#637477' }}
          />
          <Bar dataKey="in_amount" name="Entrées (achats)" fill={CHART_COLORS.cyan} radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="out_amount" name="Sorties (ventes)" fill={CHART_COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default MovementFlowChart;