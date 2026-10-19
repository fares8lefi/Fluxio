import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Filter, CheckCircle2 } from 'lucide-react';

const STATUS = {
  ok: '#059669', // Emerald — stock au-dessus du seuil
  alert: '#f59e0b', // Amber — sous le seuil d'alerte
  rupture: '#b9342b', // Rose — rupture (stock ≤ 0)
};

/** Couleur du point selon l'état du stock (jamais la couleur seule : la ligne
 *  reste continue, la pastille d'état et le tableau de légende complètent). */
const statusColor = (product) => {
  if (product.stock_quantity <= 0) return STATUS.rupture;
  if (product.stock_quantity <= product.stock_min) return STATUS.alert;
  return STATUS.ok;
};

/**
 * Infobulle du graphique en courbes
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;
  const difference = item.stock_quantity - item.stock_min;

  return (
    <div className="min-w-[210px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: statusColor(item) }} />
        <p className="font-bold text-slate-900">{item.name}</p>
      </div>
      <div className="space-y-1 text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Stock réel :</span>
          <strong className="text-slate-900">
            {item.stock_quantity} {item.unit_of_measure}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-medium text-rose-600">Seuil d'alerte :</span>
          <strong className="text-rose-600">
            {item.stock_min} {item.unit_of_measure}
          </strong>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t pt-1 font-semibold">
          <span>Écart :</span>
          <span className={difference < 0 ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>
            {difference > 0 ? `+${difference}` : difference} {item.unit_of_measure}
          </span>
        </div>
        {difference < 0 && (
          <p className="pt-0.5 text-[10px] font-medium text-rose-500">
            Commander au moins {Math.abs(difference)} {item.unit_of_measure} pour repasser le seuil.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Courbes comparatives par produit : stock réel vs seuil d'alerte minimum.
 * @param {{
 *   products: Array<{ id: string, name: string, stock_quantity: number, stock_min: number, unit_of_measure: string }>
 * }} props
 */
export function StockAlertsLineChart({ products = [] }) {
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);

  const chartData = useMemo(() => {
    let list = [...products];
    if (filterAlertsOnly) {
      list = list.filter((p) => p.stock_quantity <= p.stock_min);
    }
    // Limité à 12 produits pour la lisibilité de l'axe
    return list.slice(0, 12).map((p) => ({
      ...p,
      shortName: p.name.length > 14 ? `${p.name.substring(0, 12)}…` : p.name,
      alertThreshold: p.stock_min,
      stockValue: p.stock_quantity,
      statusColor: statusColor(p),
    }));
  }, [products, filterAlertsOnly]);

  const alertCount = products.filter((p) => p.stock_quantity <= p.stock_min).length;

  // Bornes de l'axe Y : le seuil le plus haut doit rester lisible
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 10];
    const max = Math.max(
      ...chartData.map((p) => Number(p.stock_quantity) || 0),
      ...chartData.map((p) => Number(p.stock_min) || 0)
    );
    return [0, Math.ceil(max * 1.2) || 10];
  }, [chartData]);

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Stock et seuil, produit par produit
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Chaque point est un produit : sous la ligne pointillée, il faut commander.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFilterAlertsOnly((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filterAlertsOnly
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="size-3.5" />
          {filterAlertsOnly ? 'Afficher tous' : `Seulement en alerte (${alertCount})`}
        </button>
      </div>

      <div className="h-[280px] w-full pt-1">
        {chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
            <CheckCircle2 className="mb-2 size-8 stroke-1 text-emerald-500" />
            Aucun produit en dessous du seuil d'alerte actuellement.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9eded" vertical={false} />

              <XAxis
                dataKey="shortName"
                tickLine={false}
                axisLine={{ stroke: '#d8dfe0' }}
                tick={{ fill: '#4a5a5e', fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={58}
              />
              <YAxis
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#637477', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d8dfe0', strokeDasharray: '3 3' }} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="plainline"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />

              {/* Courbe du seuil d'alerte (référence, une seule valeur par produit) */}
              <Line
                type="stepAfter"
                dataKey="alertThreshold"
                name="Seuil d'Alerte (Min)"
                stroke="#8d9c9f"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: '#8d9c9f' }}
                activeDot={{ r: 4 }}
              />

              {/* Courbe du stock réel, colorée point par point */}
              <Line
                type="monotone"
                dataKey="stockValue"
                name="Stock Réel"
                stroke="#0f5a63"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, index, payload } = props;
                  if (cx === undefined || cy === undefined) return null;
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.statusColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />

              {/* Repère horizontal sur le seuil le plus bas : sous cette ligne, alerte */}
              <ReferenceLine
                y={Math.min(...chartData.map((p) => Number(p.stock_min) || 0))}
                stroke="#f59e0b"
                strokeDasharray="2 4"
                strokeWidth={1}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between border-t pt-2.5 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-600 inline-block" />
            Stock OK
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500 inline-block" />
            Alerte sous le seuil
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-600 inline-block" />
            Rupture
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-slate-400 inline-block" />
            Seuil min requis
          </span>
        </div>
        <span>
          {chartData.length} produit{chartData.length > 1 ? 's' : ''} affiché{chartData.length > 1 ? 's' : ''}
          {filterAlertsOnly ? ' (filtre alerte)' : ''}
        </span>
      </div>
    </div>
  );
}

export default StockAlertsLineChart;