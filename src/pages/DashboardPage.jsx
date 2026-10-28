import { navigate as navigateTo, usePathname } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductsPage } from '@/features/products/ProductsPage';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import {
  MovementsPage,
  MovementsInPage,
  MovementsOutPage,
  MovementsReturnSupPage,
  MovementsReturnCliPage,
} from '@/features/movements/MovementsPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { ManagerDashboard } from '@/features/manager/ManagerDashboard';
import { InvoicesPage } from '@/features/invoices/InvoicesPage';
import { QuotesPage } from '@/features/invoices/QuotesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { CompanyCompletenessBanner } from '@/features/settings/CompanyCompletenessBanner';
import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { formatTND } from '@/lib/fiscal';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { StockAlertsLineChart } from '@/components/charts/StockAlertsLineChart';
import { StockHealthDonut } from '@/components/charts/StockHealthDonut';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { getDashboardSummary, getStockHealth } from '@/services/dashboardService';
import { getProducts } from '@/services/productService';
import { getAllMouvment } from '@/services/mouvmentService';

/** Extract sub-route from path: '/dashboard/products' → 'products' */
function useSubRoute() {
  const path = usePathname();
  const parts = path.replace('/dashboard', '').replace(/^\//, '');
  return parts; // '' | 'products' | 'categories' | 'suppliers' | ...
}

function HomePage({ navigate }) {
  const { user, can } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [stockHealth, setStockHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movementsError, setMovementsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, healthRes, prodRes, movRes] = await Promise.allSettled([
        getDashboardSummary(),
        getStockHealth(),
        getProducts({ limit: 100 }),
        // Journal : les 5 derniers mouvements, déjà triés du plus récent au
        // plus ancien par l'API (`orderBy: { created_at: 'desc' }`).
        getAllMouvment({ page: 1, limit: 5 }),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value?.data ?? null);
      if (healthRes.status === 'fulfilled') setStockHealth(healthRes.value?.data ?? null);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value?.products ?? []);

      if (movRes.status === 'fulfilled') {
        setMovements((movRes.value?.mouvments ?? []).slice(0, 5));
        setMovementsError(null);
      } else {
        setMovementsError(movRes.reason?.message || 'Impossible de charger les derniers mouvements.');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalProducts = stockHealth?.summary?.totalProducts ?? products.length;
  const alertCount = stockHealth?.summary?.alertCount ?? 0;
  const outOfStockCount = stockHealth?.summary?.outOfStockCount ?? 0;
  const criticalProducts = stockHealth?.criticalProducts ?? [];
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalSales = summary?.totalSales ?? 0;

  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const today = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className="space-y-8">
      <CompanyCompletenessBanner onNavigate={navigate} />

      {/* Ouverture : la phrase est l'indicateur */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={loading ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE_OUT }}
        className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-3xl">
          <p className="text-sm text-slate-500">
            {today}, {user?.company_name}
          </p>
          <h1 className="mt-2 text-3xl leading-[1.1] font-semibold text-slate-900 sm:text-4xl">
            <StockHeadline outOfStock={outOfStockCount} alerts={alertCount} />
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Bonjour {user?.username}.{' '}
            {outOfStockCount + alertCount > 0
              ? 'Commencez par la liste ci-dessous, triée par urgence.'
              : 'Aucun réapprovisionnement à prévoir pour le moment.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Actualiser les données"
            title="Actualiser les données"
            className="text-slate-500"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => navigate('movements/in')} hidden={!can('stock.write')} size="lg">
            <ArrowDownLeft className="size-4" />
            Réceptionner du stock
          </Button>
        </div>
      </motion.header>

      {/* À commander : la liste de travail passe avant les graphiques */}
      <ReorderList
        products={criticalProducts}
        loading={loading}
        onReceive={() => navigate('movements/in')}
        onSeeAll={() => navigate('products')}
        canWrite={can('stock.write')}
      />

      {/* Registre : les chiffres de fond, dans un seul bandeau */}
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-white lg:grid-cols-4">
        <LedgerFigure label="Références suivies" loading={loading} value={totalProducts} />
        <LedgerFigure
          label="Sous le seuil d'alerte"
          loading={loading}
          value={alertCount}
          tone={alertCount > 0 ? 'text-amber-700' : undefined}
        />
        <LedgerFigure
          label="En rupture"
          loading={loading}
          value={outOfStockCount}
          tone={outOfStockCount > 0 ? 'text-rose-600' : undefined}
        />
        <LedgerFigure
          label={`Facturé, ${totalSales} ventes`}
          loading={loading}
          value={formatTND(totalRevenue)}
          unit="TND"
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StockEvolutionChart products={products} />
        </div>
        <div className="lg:col-span-1">
          <StockHealthDonut summary={stockHealth?.summary} />
        </div>
      </div>

      <StockAlertsLineChart products={products} />

      <RecentMovements
        movements={movements}
        isLoading={loading}
        error={movementsError}
        onSeeAll={() => navigate('movements')}
      />
    </div>
  );
}

// Thick coloured underline: the status reads like a highlighter on the ledger
const MARK = 'underline decoration-[0.14em] underline-offset-[0.16em] [text-decoration-skip-ink:none]';

/** « 2 produits en rupture, 9 sous le seuil d'alerte. » */
function StockHeadline({ outOfStock, alerts }) {
  const products = (n) => `${n} ${n > 1 ? 'produits' : 'produit'}`;
  if (outOfStock === 0 && alerts === 0) return 'Tout le stock est au-dessus du seuil.';
  if (alerts === 0) return `${products(outOfStock)} en rupture.`;
  if (outOfStock === 0) return `${products(alerts)} sous le seuil d'alerte.`;
  return (
    <>
      <span className={MARK} style={{ textDecorationColor: 'var(--color-rose-500)' }}>
        {products(outOfStock)} en rupture
      </span>
      ,{' '}
      <span className={MARK} style={{ textDecorationColor: 'var(--color-amber-400)' }}>
        {alerts} sous le seuil d'alerte
      </span>
      .
    </>
  );
}

function LedgerFigure({ label, value, unit, tone = 'text-slate-900', loading }) {
  return (
    <div className="border-slate-100 p-5 max-lg:nth-[-n+2]:border-b max-lg:odd:border-r lg:not-last:border-r">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`figure mt-1 text-2xl font-semibold ${tone}`}>
        {loading ? '—' : <AnimatedNumber value={value} />}
        {unit && <span className="ml-1.5 text-sm font-normal text-slate-400">{unit}</span>}
      </dd>
    </div>
  );
}

/**
 * Jauge segmentée façon étiquette de rayon : 10 crans = le seuil d'alerte.
 * Les crans pleins montrent la part du seuil encore couverte par le stock.
 */
function StockGauge({ percent, out }) {
  const filled = Math.max(0, Math.min(10, Math.round(percent / 10)));
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-3.5 w-1.5 rounded-[2px] ${
            i < filled ? (out ? 'bg-rose-500' : 'bg-amber-500') : 'bg-slate-200'
          }`}
        />
      ))}
    </span>
  );
}

function ReorderList({ products, loading, onReceive, onSeeAll, canWrite }) {
  if (loading) {
    return <div className="skeleton-shimmer h-48 rounded-xl border bg-white" />;
  }

  if (products.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        Aucun produit sous son seuil d'alerte : rien à commander.
      </section>
    );
  }

  return (
    <section aria-labelledby="reorder-title" className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 id="reorder-title" className="text-lg font-semibold text-slate-900">
            À commander
          </h2>
          <p className="text-sm text-slate-500">Les ruptures d'abord, puis les produits les moins couverts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onSeeAll}>
          Voir tous les produits
        </Button>
      </div>

      <ul className="divide-y divide-slate-100">
        {products.map((p) => {
          const out = p.stock_quantity <= 0;
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {out ? (
                    <span className="font-medium text-rose-600">Rupture</span>
                  ) : (
                    <>
                      <span className="figure font-medium text-amber-700">{p.stock_quantity}</span> en stock
                    </>
                  )}
                  , seuil {p.stock_min} {p.unit_of_measure}
                  {p.code && <span className="text-slate-400">, réf. {p.code}</span>}
                </p>
              </div>

              <div
                className="hidden items-center gap-2 sm:flex"
                title={`${p.alertCoveragePercent} % du seuil couvert`}
              >
                <StockGauge percent={p.alertCoveragePercent} out={out} />
                <span className="figure text-xs text-slate-500">{p.alertCoveragePercent}%</span>
              </div>

              <p className="hidden text-right sm:block" title="Quantité manquante pour atteindre le seuil">
                <span className="figure font-semibold text-slate-900">+{p.deficit}</span>{' '}
                <span className="text-sm text-slate-500">{p.unit_of_measure}</span>
              </p>

              {canWrite ? (
                <Button size="sm" variant="secondary" onClick={onReceive}>
                  Réceptionner
                </Button>
              ) : (
                <span className="figure text-right font-semibold sm:hidden">+{p.deficit}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Sub-router: renders the right page based on the dashboard sub-path */
function SubRouter({ sub, navigate }) {
  if (sub === 'products')                  return <ProductsPage />;
  if (sub === 'categories')                return <CategoriesPage />;
  if (sub === 'inventory')                 return <InventoryPage />;
  if (sub === 'suppliers')                 return <SuppliersPage />;
  if (sub === 'movements')                                     return <MovementsPage />;
  if (sub === 'movements/in' || sub === 'achats')              return <MovementsInPage />;
  if (sub === 'movements/out' || sub === 'ventes')             return <MovementsOutPage />;
  if (sub === 'movements/return-supplier')                     return <MovementsReturnSupPage />;
  if (sub === 'movements/return-client')                       return <MovementsReturnCliPage />;
  if (sub === 'clients')                   return <ClientsPage />;
  if (sub === 'manager')                   return <ManagerDashboard />;
  if (sub === 'invoices')              return <InvoicesPage />;
  if (sub === 'invoices/quotes')       return <QuotesPage />;
  if (sub === 'invoices/credit-notes') return <InvoicesPage initialType="CREDIT_NOTE" />;
  if (sub === 'settings')              return <SettingsPage />;
  if (sub === 'settings/company')      return <SettingsPage initialTab="company" />;
  return <HomePage navigate={navigate} />;
}

export default function DashboardPage() {
  const sub = useSubRoute();

  const navigate = (id) => {
    navigateTo(id ? `/dashboard/${id}` : '/dashboard');
  };

  return (
    <DashboardLayout currentSub={sub} onNavigate={navigate}>
      <SubRouter sub={sub} navigate={navigate} />
    </DashboardLayout>
  );
}
