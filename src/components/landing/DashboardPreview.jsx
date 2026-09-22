const WATCH_ITEMS = [
  { label: 'T-shirts coton blanc', color: 'bg-amber-400', stock: 12, max: 80 },
  { label: 'Bouteilles isothermes', color: 'bg-rose-500', stock: 5, max: 40 },
  { label: 'Câbles USB-C 2m', color: 'bg-emerald-500', stock: 34, max: 60 },
  { label: 'Sacs à dos 30L', color: 'bg-cyan-500', stock: 18, max: 50 },
];

const KPI_CARDS = [
  { value: '1 284', label: 'Articles suivis', trend: '+12%', up: true },
  { value: '14', label: 'Alertes stock', trend: 'critique', up: false },
  { value: '8', label: 'À commander', trend: 'ce mois', up: null },
  { value: '36', label: 'Factures actives', trend: '+4 ce mois', up: true },
];

const NAV_ITEMS = ['Tableau de bord', 'Stock', 'Catalogue', 'Clients', 'Facturation'];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl text-left sm:mt-20">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-cyan-300/50 via-emerald-200/30 to-sky-100/50 blur-3xl" />

      {/* Window chrome */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3">
          <span className="size-3 rounded-full bg-rose-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
          <span className="mx-3 flex-1 rounded-md bg-slate-200/70 px-3 py-1 text-[11px] text-slate-400">
            app.fluxio.fr — Tableau de bord
          </span>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 border-r bg-slate-950 px-3 py-4 sm:block">
            <div className="mb-5 flex items-center gap-2 px-2">
              <span className="grid size-6 place-items-center rounded-md bg-cyan-500 text-xs font-bold text-white">
                F
              </span>
              <span className="text-sm font-semibold text-white">Fluxio</span>
            </div>
            {NAV_ITEMS.map((item, i) => (
              <div
                key={item}
                className={`mb-0.5 rounded-lg px-3 py-2 text-xs font-medium ${
                  i === 0
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="flex-1 overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Bonjour, Marianne </p>
                <h3 className="text-base font-semibold">Votre activité du jour</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Tout est synchronisé
              </span>
            </div>

            {/* KPIs */}
            <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {KPI_CARDS.map(({ value, label, trend, up }) => (
                <div className="rounded-xl border bg-slate-50 p-3" key={label}>
                  <p className="text-[10px] text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold">{value}</p>
                  <p
                    className={`mt-0.5 text-[10px] font-medium ${
                      up === true
                        ? 'text-emerald-600'
                        : up === false
                          ? 'text-rose-500'
                          : 'text-slate-400'
                    }`}
                  >
                    {trend}
                  </p>
                </div>
              ))}
            </div>

            {/* Watch list */}
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-slate-700">
                Articles à surveiller
              </p>
              <div className="grid gap-3">
                {WATCH_ITEMS.map(({ label, color, stock, max }) => (
                  <div className="flex items-center gap-3" key={label}>
                    <span className={`size-2 shrink-0 rounded-full ${color}`} />
                    <p className="w-36 truncate text-xs font-medium text-slate-700">
                      {label}
                    </p>
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-1.5">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.round((stock / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[10px] text-slate-400">
                      {stock} / {max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
