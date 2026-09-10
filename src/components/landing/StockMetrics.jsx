const STOCK_BARS = [35, 48, 41, 62, 58, 76, 92, 72, 100, 88, 110, 104];

const METRIC_CARDS = [
  ['Articles', '1 284'],
  ['Alertes', '14'],
  ['À commander', '8'],
];

export function StockMetrics() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-cyan-950/50">
      <p className="text-sm text-slate-400">État du stock</p>
      <p className="mt-1 text-lg font-semibold">Cette semaine</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {METRIC_CARDS.map(([label, value]) => (
          <div className="rounded-xl bg-white/[.07] p-3" key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-28 items-end gap-2 rounded-xl bg-white/[.07] p-4">
        {STOCK_BARS.map((height, index) => (
          <span
            className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-600 to-emerald-300"
            style={{ height, opacity: 0.45 + index / 20 }}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
