import { useHashRoute } from '@/hooks/useHashRoute';
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
import {
  Package,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ShieldAlert,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import { formatTND } from '@/lib/fiscal';
import { Badge } from '@/components/ui/Badge';
import { StockEvolutionChart } from '@/components/charts/StockEvolutionChart';
import { StockAlertsLineChart } from '@/components/charts/StockAlertsLineChart';
import { StockHealthDonut } from '@/components/charts/StockHealthDonut';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { getDashboardSummary, getStockHealth } from '@/services/dashboardService';
import { getProducts } from '@/services/productService';
import { getAllMouvment } from '@/services/mouvmentService';

/** Extract sub-route from hash: '#dashboard/products' → 'products' */
function useSubRoute() {
  const hash = useHashRoute();
  const parts = hash.replace('#dashboard', '').replace(/^\//, '');
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

  return (
    <div className="space-y-6">
      <CompanyCompletenessBanner onNavigate={navigate} />

      {/* ── Top Welcome & Actions ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bonjour, {user?.username} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Supervision en temps réel du stock, des alertes de réapprovisionnement et des flux pour{' '}
            <strong className="text-slate-700">{user?.company_name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl text-xs h-9"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => navigate('movements/in')}
            hidden={!can('stock.write')}
            className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs h-9 shadow-xs"
          >
            <ArrowDownLeft className="mr-1.5 size-4" />
            Réceptionner du stock
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {/* Moment clé : cascade + compteurs à l'ouverture du tableau de bord */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate={loading ? 'hidden' : 'show'}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Produits */}
        <motion.div variants={fadeUpItem} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <Package className="size-5" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catalogue</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{loading ? '—' : <AnimatedNumber value={totalProducts} />}</p>
          <p className="mt-0.5 text-xs text-slate-500">Références suivies</p>
        </motion.div>

        {/* Alertes Seuil Minimum */}
        <motion.div variants={fadeUpItem} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldAlert className="size-5" />
            </span>
            {alertCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                Action requise
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-semibold">Stock sain</span>
            )}
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-amber-600">{loading ? '—' : <AnimatedNumber value={alertCount} />}</p>
          <p className="mt-0.5 text-xs text-slate-500">Sous le seuil d'alerte (Min)</p>
        </motion.div>

        {/* Ruptures de stock */}
        <motion.div variants={fadeUpItem} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-rose-50 text-rose-700">
              <AlertCircle className="size-5" />
            </span>
            {outOfStockCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                Critique
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-semibold">Aucune rupture</span>
            )}
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-rose-600">{loading ? '—' : <AnimatedNumber value={outOfStockCount} />}</p>
          <p className="mt-0.5 text-xs text-slate-500">Ruptures immédiates (0 stock)</p>
        </motion.div>

        {/* Chiffre d'affaires facturé */}
        <motion.div variants={fadeUpItem} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="size-5" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{totalSales} ventes</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {loading ? '—' : <AnimatedNumber value={formatTND(totalRevenue)} />} <span className="text-xs font-normal">TND</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Chiffre d'affaires facturé</p>
        </motion.div>
      </motion.div>

      {/* ── ROW 1: Courbe d'évolution temporelle + Jauge Donut ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StockEvolutionChart products={products} />
        </div>
        <div className="lg:col-span-1">
          <StockHealthDonut summary={stockHealth?.summary} />
        </div>
      </div>

      {/* ── ROW 2: Courbes Stock Réel vs Seuil Min ── */}
      <div>
        <StockAlertsLineChart products={products} />
      </div>

      {/* ── ROW 3: Journal des 5 derniers mouvements ── */}
      <RecentMovements
        movements={movements}
        isLoading={loading}
        error={movementsError}
        onSeeAll={() => navigate('movements')}
      />

      {/* ── ROW 4: Tableau des Produits Urgents à Commander ── */}
      {criticalProducts.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-rose-100 text-rose-700">
                <AlertCircle className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  Plan de réapprovisionnement urgent ({criticalProducts.length} articles)
                </h3>
                <p className="text-xs text-slate-500">
                  Articles ayant franchi le seuil d'alerte, classés par priorité.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('products')}
              className="text-xs rounded-xl"
            >
              Voir tous les produits <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-slate-50/80 font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Produit</th>
                  <th className="px-5 py-3 text-right">Stock Réel</th>
                  <th className="px-5 py-3 text-right">Seuil d'Alerte</th>
                  <th className="px-5 py-3 text-right">Déficit (À commander)</th>
                  <th className="px-5 py-3 text-center">Couverture</th>
                  <th className="px-5 py-3 text-center">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {criticalProducts.map((p) => {
                  const isZero = p.stock_quantity <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {p.name}
                        {p.code && <span className="font-mono text-slate-400 ml-1.5 font-normal">({p.code})</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">
                        <span className={isZero ? 'text-rose-600' : 'text-amber-600'}>
                          {p.stock_quantity}
                        </span>{' '}
                        <span className="text-slate-400 font-normal">{p.unit_of_measure}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">
                        {p.stock_min} <span className="text-slate-400 font-normal">{p.unit_of_measure}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-rose-600">
                        +{p.deficit} {p.unit_of_measure}
                      </td>
                      <td className="px-5 py-3 text-center tabular-nums">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isZero ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, p.alertCoveragePercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {p.alertCoveragePercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={isZero ? 'danger' : 'alert'}>
                          {isZero ? 'Rupture' : 'Alerte'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('movements/in')}
                          className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700 hover:bg-cyan-100 text-xs transition"
                        >
                          <ArrowDownLeft className="size-3" />
                          Commander
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sub-router: renders the right page based on the hash sub-route */
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
    window.location.hash = id ? `#dashboard/${id}` : '#dashboard';
  };

  return (
    <DashboardLayout currentSub={sub} onNavigate={navigate}>
      <SubRouter sub={sub} navigate={navigate} />
    </DashboardLayout>
  );
}
