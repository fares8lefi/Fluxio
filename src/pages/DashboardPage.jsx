import { useHashRoute } from '@/hooks/useHashRoute';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductsPage } from '@/features/products/ProductsPage';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { Package, Users, TrendingUp, AlertCircle } from 'lucide-react';

/** Extract sub-route from hash: '#dashboard/products' → 'products' */
function useSubRoute() {
  const hash = useHashRoute();
  const parts = hash.replace('#dashboard', '').replace(/^\//, '');
  return parts; // '' | 'products' | 'categories' | 'suppliers' | ...
}

function HomePage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Produits en stock',     value: '1 248', icon: Package,     trend: '+12%' },
    { label: 'Clients actifs',        value: '342',   icon: Users,       trend: '+4%' },
    { label: "Chiffre d'affaires",    value: '45 231 TND', icon: TrendingUp, trend: '+18%' },
    { label: 'Ruptures de stock',     value: '3',     icon: AlertCircle, trend: '-2', alert: true },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour, {user?.username} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Voici un résumé de l'activité pour {user?.company_name}.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className={`grid size-10 place-items-center rounded-lg ${
                  stat.alert ? 'bg-rose-100 text-rose-700' : 'bg-cyan-50 text-cyan-700'
                }`}
              >
                <stat.icon className="size-5" />
              </span>
              <span
                className={`text-sm font-medium ${
                  stat.trend.startsWith('+')
                    ? 'text-emerald-600'
                    : stat.alert
                      ? 'text-rose-600'
                      : 'text-slate-500'
                }`}
              >
                {stat.trend}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Activité récente</h2>
        </div>
        <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center text-slate-500">
          <span className="mb-4 grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
            <Package className="size-6" />
          </span>
          <p className="font-medium text-slate-800">Tableau de bord en construction</p>
          <p className="mt-1 text-sm">Les vraies données apparaîtront ici bientôt.</p>
        </div>
      </div>
    </div>
  );
}

/** Sub-router: renders the right page based on the hash sub-route */
function SubRouter({ sub, navigate }) {
  if (sub === 'products')   return <ProductsPage />;
  if (sub === 'categories') return <CategoriesPage />;
  if (sub === 'suppliers')  return <SuppliersPage />;
  return <HomePage />;
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
