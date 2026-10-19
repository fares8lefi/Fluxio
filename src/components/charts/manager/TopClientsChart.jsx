import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users } from 'lucide-react';
import { ChartFrame } from './ChartFrame';
import { CHART_COLORS, formatMoney, formatPercent, truncateLabel } from './formatters';

function ClientsTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="min-w-[200px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-800">{point.name}</p>
      {point.matriculeFiscale && (
        <p className="mt-0.5 font-mono text-[11px] text-slate-400">{point.matriculeFiscale}</p>
      )}
      <div className="mt-1.5 space-y-1 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Facturé TTC</span>
          <strong className="text-slate-900">{formatMoney(point.invoiced_ttc)}</strong>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Factures</span>
          <strong className="text-slate-900">{point.invoice_count}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-1 text-[11px] text-slate-500">
          <span>Part du CA</span>
          <span>{formatPercent(point.share_pct)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Classement des clients par chiffre d'affaires facturé.
 * @param {{ top_clients?: Array<{id: string, name: string, matriculeFiscale: string|null, invoiced_ttc: number, invoice_count: number, share_pct: number}> }} props
 */
export function TopClientsChart({ topClients = [], isLoading = false }) {
  const data = [...topClients]
    .filter((row) => Number(row.invoiced_ttc) > 0)
    .slice(0, 10)
    .reverse() // BarChart horizontal : du plus petit en haut
    .map((row) => ({ ...row, short: truncateLabel(row.name, 20) }));

  return (
    <ChartFrame
      icon={Users}
      title="Meilleurs clients (CA facturé TTC)"
      subtitle="Classement des 10 premiers clients de la période, par montant facturé."
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyLabel="Aucune facture client sur cette période."
      height={Math.max(240, data.length * 38 + 40)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 25, left: 5, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9eded" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#637477', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="short"
            tickLine={false}
            axisLine={{ stroke: '#d8dfe0' }}
            tick={{ fill: '#637477', fontSize: 11 }}
            width={140}
          />
          <Tooltip content={<ClientsTooltip />} cursor={{ fill: '#f4f6f6' }} />
          <Bar dataKey="invoiced_ttc" name="Facturé TTC" fill={CHART_COLORS.cyan} radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export default TopClientsChart;