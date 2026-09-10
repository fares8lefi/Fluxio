const WATCH_ITEMS = [
  { label: 'T-shirts coton blanc', color: 'bg-amber-400', percent: 36 },
  { label: 'Bouteilles isothermes', color: 'bg-rose-500', percent: 18 },
  { label: 'Câbles USB-C', color: 'bg-cyan-500', percent: 52 },
];

const KPI_CARDS = [
  ['1 284', 'Articles suivis'],
  ['14', 'Alertes stock bas'],
  ['8', 'À commander'],
];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl text-left sm:mt-20">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-cyan-300/60 via-emerald-200/40 to-sky-100/60 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-white p-5 shadow-2xl shadow-slate-900/10">
        <p className="text-xs text-slate-400">Bonjour, Marianne</p>
        <h3 className="mt-1 text-xl font-semibold">
          Votre stock est sous contrôle.
        </h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {KPI_CARDS.map(([value, label]) => (
            <div className="rounded-lg border p-3" key={label}>
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border p-4">
          <p className="text-xs font-semibold">Articles à surveiller</p>
          {WATCH_ITEMS.map(({ label, color, percent }) => (
            <div className="mt-4 flex items-center gap-3" key={label}>
              <span className={`size-2 rounded-full ${color}`} />
              <p className="flex-1 text-xs font-medium">{label}</p>
              <div className="h-1.5 w-16 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-800"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
