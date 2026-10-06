import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Package, ShieldAlert, CheckCircle, AlertOctagon, Layers } from 'lucide-react';

const COLORS = {
  OPTIMAL: '#10b981',      // Emerald
  ALERT: '#f59e0b',        // Amber
  OUT_OF_STOCK: '#ef4444', // Rose/Red
  OVERSTOCK: '#6366f1',    // Indigo
};

function DonutTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur text-xs">
      <p className="font-semibold text-slate-800">{data.name}</p>
      <p className="text-slate-600 mt-0.5">
        <strong className="text-slate-900">{data.value}</strong> référence{data.value > 1 ? 's' : ''} (
        {data.payload.percent}%)
      </p>
    </div>
  );
}

/**
 * Donut chart showing overall warehouse stock health distribution
 * @param {{
 *   summary?: {
 *     totalProducts: number,
 *     outOfStockCount: number,
 *     alertCount: number,
 *     optimalCount: number,
 *     overStockCount: number
 *   }
 * }} props
 */
export function StockHealthDonut({ summary }) {
  const total = summary?.totalProducts || 0;
  const outOfStock = summary?.outOfStockCount || 0;
  const alert = summary?.alertCount || 0;
  const optimal = summary?.optimalCount || 0;
  const overstock = summary?.overStockCount || 0;

  const data = [
    {
      name: 'Niveau optimal',
      value: optimal,
      key: 'OPTIMAL',
      percent: total > 0 ? Math.round((optimal / total) * 100) : 0,
      icon: CheckCircle,
      color: COLORS.OPTIMAL,
    },
    {
      name: 'Sous le seuil d’alerte',
      value: alert,
      key: 'ALERT',
      percent: total > 0 ? Math.round((alert / total) * 100) : 0,
      icon: ShieldAlert,
      color: COLORS.ALERT,
    },
    {
      name: 'En rupture de stock',
      value: outOfStock,
      key: 'OUT_OF_STOCK',
      percent: total > 0 ? Math.round((outOfStock / total) * 100) : 0,
      icon: AlertOctagon,
      color: COLORS.OUT_OF_STOCK,
    },
    {
      name: 'En sur-stockage',
      value: overstock,
      key: 'OVERSTOCK',
      percent: total > 0 ? Math.round((overstock / total) * 100) : 0,
      icon: Layers,
      color: COLORS.OVERSTOCK,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="border-b pb-3">
        <h3 className="font-semibold text-slate-900 text-base">Santé Globale du Stock</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Répartition des {total} références selon leur état critique.
        </p>
      </div>

      <div className="relative h-[210px] w-full flex items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-xs text-slate-400">
            <Package className="size-8 mx-auto stroke-1 text-slate-300 mb-1" />
            Aucun produit répertorié.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Produits
              </span>
            </div>
          </>
        )}
      </div>

      {/* Legend list */}
      <div className="space-y-1.5 pt-1">
        {data.map((item) => (
          <div key={item.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600">{item.name}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium tabular-nums">
              <span className="text-slate-900 font-bold">{item.value}</span>
              <span className="text-slate-400 text-[11px]">({item.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
