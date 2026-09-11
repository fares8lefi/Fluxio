import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Package, Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { label: 'Produits en stock', value: '1,248', icon: Package, trend: '+12%' },
    { label: 'Clients actifs', value: '342', icon: Users, trend: '+4%' },
    { label: "Chiffre d'affaires", value: '45,231 €', icon: TrendingUp, trend: '+18%' },
    { label: 'Ruptures de stock', value: '3', icon: AlertCircle, trend: '-2', alert: true },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bonjour, {user?.username} 
        </h1>
        <p className="mt-2 text-slate-600">
          Voici un résumé de l'activité pour {user?.companyName}.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-lg ${stat.alert ? 'bg-rose-100 text-rose-700' : 'bg-cyan-50 text-cyan-700'}`}>
                <stat.icon className="size-5" />
              </span>
              <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-emerald-600' : stat.alert ? 'text-rose-600' : 'text-slate-600'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Activité récente</h2>
        </div>
        <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
          <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400 mb-4">
            <Package className="size-6" />
          </span>
          <p className="font-medium text-slate-950">Le tableau de bord est en cours de construction.</p>
          <p className="text-sm mt-1">Les vraies données de {user?.company_name} apparaîtront ici bientôt.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
