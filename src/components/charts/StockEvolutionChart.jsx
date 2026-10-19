import { Spinner } from '@/components/ui/Spinner';
import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import { getStockHistory } from '@/services/dashboardService';

/**
 * Custom Tooltip for the stock timeline chart
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload;
  const stockReel = dataPoint.stockReel;
  const stockMin = dataPoint.stockMin;
  const stockMax = dataPoint.stockMax;

  let statusText = 'Niveau optimal';
  let statusBadge = 'bg-emerald-100 text-emerald-800';

  if (stockReel <= 0) {
    statusText = 'Rupture de stock !';
    statusBadge = 'bg-rose-100 text-rose-800 font-bold';
  } else if (stockReel <= stockMin) {
    statusText = 'Sous le seuil d’alerte !';
    statusBadge = 'bg-amber-100 text-amber-800 font-bold';
  } else if (stockMax && stockReel >= stockMax) {
    statusText = 'Sur-stockage';
    statusBadge = 'bg-blue-100 text-blue-800';
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur text-xs min-w-[210px]">
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <span className="font-semibold text-slate-800">{dataPoint.label || label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadge}`}>
          {statusText}
        </span>
      </div>

      <div className="space-y-1.5 tabular-nums">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-cyan-600 inline-block" />
            Stock réel :
          </span>
          <strong className="text-slate-900 text-sm font-bold">{stockReel}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500 inline-block" />
            Seuil d'alerte (Min) :
          </span>
          <span className="font-semibold text-rose-600">{stockMin}</span>
        </div>

        {stockMax && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-indigo-400 inline-block" />
              Plafond max :
            </span>
            <span className="font-semibold text-indigo-600">{stockMax}</span>
          </div>
        )}

        {(dataPoint.entree > 0 || dataPoint.sortie > 0) && (
          <div className="border-t pt-1.5 mt-1.5 flex justify-between text-[11px]">
            {dataPoint.entree > 0 && (
              <span className="text-emerald-600 font-medium">+{dataPoint.entree} entrées</span>
            )}
            {dataPoint.sortie > 0 && (
              <span className="text-rose-600 font-medium">-{dataPoint.sortie} sorties</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stock Evolution Chart component
 * @param {{
 *   products?: Array<{ id: string, name: string, stock_quantity: number, stock_min: number, unit_of_measure: string }>,
 *   defaultProductId?: string
 * }} props
 */
export function StockEvolutionChart({ products = [], defaultProductId = '' }) {
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId);
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ product: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync selectedProductId with defaultProductId or first product
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    let isCancelled = false;
    async function fetchChartData() {
      setLoading(true);
      setError(null);
      try {
        const res = await getStockHistory(selectedProductId || undefined, days);
        if (!isCancelled) {
          setData(res.data || { product: null, history: [] });
        }
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchChartData();
    return () => {
      isCancelled = true;
    };
  }, [selectedProductId, days]);

  const history = data.history || [];
  const currentProduct = data.product;

  const isBelowMin = currentProduct && currentProduct.stock_quantity <= currentProduct.stock_min;
  const isOutOfStock = currentProduct && currentProduct.stock_quantity <= 0;

  // Max value for chart Y-axis scale
  const yDomainMax = useMemo(() => {
    if (!history.length) return 10;
    const maxStock = Math.max(...history.map((h) => h.stockReel || 0));
    const stockMin = currentProduct?.stock_min || 0;
    const stockMax = currentProduct?.stock_max || 0;
    const ceiling = Math.max(maxStock, stockMin, stockMax);
    return Math.ceil(ceiling * 1.25);
  }, [history, currentProduct]);

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      {/* Header with Title and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Évolution du stock</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Le stock d'un produit jour après jour, face à son seuil d'alerte.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product selector */}
          {products.length > 0 && (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="rounded-lg border bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock_quantity} / Alerte: {p.stock_min})
                </option>
              ))}
            </select>
          )}

          {/* Time range pills */}
          <div className="flex rounded-lg border bg-slate-50 p-0.5 text-xs font-medium">
            {[7, 15, 30, 60].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-md px-2.5 py-1 transition ${
                  days === d
                    ? 'bg-white font-semibold text-cyan-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI mini-cards for current product */}
      {currentProduct && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border bg-slate-50/70 p-3">
            <span className="text-slate-500">Stock Réel Actuel</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-xl font-bold tabular-nums ${
                  isOutOfStock
                    ? 'text-rose-600'
                    : isBelowMin
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {currentProduct.stock_quantity}
              </span>
              <span className="text-[11px] text-slate-400">{currentProduct.unit_of_measure}</span>
            </div>
          </div>

          <div className="rounded-lg border border-rose-200/60 bg-rose-50/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-rose-700 font-medium">Seuil d'Alerte (Min)</span>
              <span className="size-2 rounded-full bg-rose-500" />
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums text-rose-700">
              {currentProduct.stock_min} <span className="text-[11px] font-normal">{currentProduct.unit_of_measure}</span>
            </p>
          </div>

          <div className="rounded-lg border bg-slate-50/70 p-3">
            <span className="text-slate-500">Plafond Maximum</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-800">
              {currentProduct.stock_max || '—'}
            </p>
          </div>

          <div className="rounded-lg border bg-slate-50/70 p-3">
            <span className="text-slate-500">Statut du stock</span>
            <div className="mt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                  <AlertTriangle className="size-3" /> Rupture
                </span>
              ) : isBelowMin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="size-3" /> Alerte critique
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  ✓ Niveau optimal
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="h-[310px] w-full pt-2">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-xs text-rose-600">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
            <Package className="size-8 stroke-1 text-slate-300 mb-2" />
            Aucun historique de mouvement disponible sur cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                {/* Gradient for stock area */}
                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isBelowMin ? '#f59e0b' : '#136e78'}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={isBelowMin ? '#f59e0b' : '#136e78'}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e9eded" vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#d8dfe0' }}
                tick={{ fill: '#637477', fontSize: 11 }}
              />

              <YAxis
                domain={[0, yDomainMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#637477', fontSize: 11 }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Seuil d'Alerte (Ligne rouge pointillée) */}
              {currentProduct?.stock_min !== undefined && (
                <ReferenceLine
                  y={currentProduct.stock_min}
                  stroke="#d2453b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Alerte (${currentProduct.stock_min})`,
                    fill: '#b9342b',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Seuil Max (Ligne bleue fine) */}
              {currentProduct?.stock_max && (
                <ReferenceLine
                  y={currentProduct.stock_max}
                  stroke="#3f6aa8"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Max (${currentProduct.stock_max})`,
                    fill: '#30548d',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Courbe du Stock Réel */}
              <Area
                type="monotone"
                dataKey="stockReel"
                stroke={isBelowMin ? '#d97706' : '#136e78'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#stockGradient)"
                name="Stock Réel"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Advice */}
      <div className="flex flex-wrap items-center justify-between border-t pt-3 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-cyan-600 inline-block" />
            Stock réel disponible
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 font-medium">
            <span className="h-0.5 w-4 bg-rose-500 border-dashed inline-block" />
            Seuil d'alerte critique (Min)
          </span>
          {currentProduct?.stock_max && (
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="h-0.5 w-4 bg-indigo-400 inline-block" />
              Plafond max
            </span>
          )}
        </div>

        {isBelowMin && (
          <span className="text-rose-600 font-semibold flex items-center gap-1">
            <AlertTriangle className="size-3.5" /> Réapprovisionnement urgent recommandé
          </span>
        )}
      </div>
    </div>
  );
}
