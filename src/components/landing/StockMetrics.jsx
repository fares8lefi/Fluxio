import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const STOCK_BARS = [35, 48, 41, 62, 58, 76, 92, 72, 100, 88, 110, 104];
const MAX = Math.max(...STOCK_BARS);

const METRIC_CARDS = [
  { label: 'Articles', value: '1 284', Icon: Package },
  { label: 'Alertes', value: '14', Icon: AlertTriangle },
  { label: 'À commander', value: '8', Icon: ShoppingCart },
];

const RECENT = [
  { name: 'Câbles USB-C', action: 'Sortie', qty: '-20', color: 'text-rose-400' },
  { name: 'Bouteilles', action: 'Entrée', qty: '+50', color: 'text-emerald-400' },
  { name: 'T-shirts', action: 'Ajustement', qty: '-3', color: 'text-amber-400' },
];

export function StockMetrics() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] p-6 shadow-2xl shadow-cyan-950/50 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Stock
          </p>
          <p className="mt-0.5 text-lg font-semibold text-white">Cette semaine</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          ↑ Stable
        </span>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-3 gap-3">
        {METRIC_CARDS.map(({ label, value, Icon }) => (
          <div className="rounded-xl bg-white/[.07] p-3 text-center" key={label}>
            <span className="mx-auto grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-300 ring-1 ring-white/10">
              <Icon className="size-4" />
            </span>
            <p className="mt-2 text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      {(() => {
        const W = 280;
        const H = 80;
        const PAD = { top: 8, right: 8, bottom: 18, left: 4 };
        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top - PAD.bottom;
        const MIN = Math.min(...STOCK_BARS);
        const scaleX = (i) => PAD.left + (i / (STOCK_BARS.length - 1)) * innerW;
        const scaleY = (v) => PAD.top + innerH - ((v - MIN) / (MAX - MIN)) * innerH;

        // Build smooth cubic bezier path
        const points = STOCK_BARS.map((v, i) => [scaleX(i), scaleY(v)]);
        const smooth = (pts) => {
          let d = `M ${pts[0][0]},${pts[0][1]}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const cpX = (pts[i][0] + pts[i + 1][0]) / 2;
            d += ` C ${cpX},${pts[i][1]} ${cpX},${pts[i + 1][1]} ${pts[i + 1][0]},${pts[i + 1][1]}`;
          }
          return d;
        };
        const linePath = smooth(points);
        const areaPath =
          linePath +
          ` L ${points[points.length - 1][0]},${H - PAD.bottom} L ${points[0][0]},${H - PAD.bottom} Z`;

        const labelIdxs = [0, 2, 5, 8, 11];

        return (
          <div className="rounded-xl bg-white/[.07] p-4">
            <p className="mb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Mouvements (12 mois)
            </p>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((t) => (
                <line
                  key={t}
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={PAD.top + innerH * (1 - t)}
                  y2={PAD.top + innerH * (1 - t)}
                  stroke="white"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Stroke */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              {/* Dots */}
              {points.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i === points.length - 1 ? 3.5 : 2}
                  fill={i === points.length - 1 ? '#34d399' : '#22d3ee'}
                  fillOpacity={i === points.length - 1 ? 1 : 0.6}
                />
              ))}

              {/* Month labels */}
              {labelIdxs.map((i) => (
                <text
                  key={i}
                  x={scaleX(i)}
                  y={H - 2}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#64748b"
                >
                  {MONTHS[i]}
                </text>
              ))}
            </svg>
          </div>
        );
      })()}


      {/* Recent movements */}
      <div className="rounded-xl bg-white/[.07] p-4">
        <p className="mb-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          Derniers mouvements
        </p>
        <div className="space-y-2">
          {RECENT.map(({ name, action, qty, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-200">{name}</p>
                <p className="text-[10px] text-slate-500">{action}</p>
              </div>
              <span className={`text-sm font-bold ${color}`}>{qty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
