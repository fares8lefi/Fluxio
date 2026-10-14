import { Spinner } from '@/components/ui/Spinner';
import { useState, useEffect, useCallback } from 'react';
import {
  getPlatformStats,
  getAllCompanies,
  toggleCompanyStatus,
} from '@/services/adminService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  Building2,
  Users,
  ShieldAlert,
  CalendarPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Power,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function AdminOverview({ onSelectCompany }) {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const loadData = useCallback(async () => {
    try {
      const [statsRes, compRes] = await Promise.allSettled([
        getPlatformStats(),
        getAllCompanies({ page, limit: 10, search }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }

      if (compRes.status === 'fulfilled' && compRes.value) {
        setCompanies(compRes.value.companies || []);
        setTotalCompanies(compRes.value.total || 0);
        setTotalPages(compRes.value.totalPages || 1);
      }
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const confirm = useConfirm();

  const handleToggleStatus = async (company) => {
    const nextState = !company.is_active;
    const confirmMsg = nextState
      ? `Réactiver l'entreprise ${company.name} ?`
      : `Suspendre l'entreprise ${company.name} ? Les utilisateurs de cette entreprise ne pourront plus se connecter.`;
    if (!(await confirm({ title: nextState ? 'Confirmer la réactivation' : 'Confirmer la suspension', description: confirmMsg, confirmLabel: nextState ? 'Réactiver' : 'Suspendre', destructive: !nextState }))) return;

    try {
      const res = await toggleCompanyStatus(company.id, nextState);
      setFeedback({ type: 'success', text: res.message || 'Statut mis à jour.' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Supervision de la Plateforme
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Vue d'ensemble multi-entreprises, métriques globales et gestion des accès.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl text-xs h-9 w-fit"
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Feedback notification */}
      {feedback.text && (
        <div
          className={`flex items-start gap-2.5 rounded-lg p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Cartes KPI Globales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Entreprises */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <Building2 className="size-5" />
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {stats?.activeCompanies ?? 0} actives
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {stats?.totalCompanies ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Entreprises inscrites ({stats?.suspendedCompanies ?? 0} suspendues)
          </p>
        </div>

        {/* Utilisateurs */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
              <Users className="size-5" />
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {stats?.activeUsers ?? 0} actifs
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {stats?.totalUsers ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Utilisateurs totaux ({stats?.suspendedUsers ?? 0} suspendus)
          </p>
        </div>

        {/* Nouvelles entreprises ce mois */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <CalendarPlus className="size-5" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ce mois</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-emerald-600">
            +{stats?.newCompaniesThisMonth ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Nouvelles entreprises créées</p>
        </div>

        {/* Nouveaux utilisateurs ce mois */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-purple-50 text-purple-700">
              <CalendarPlus className="size-5" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ce mois</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-purple-600">
            +{stats?.newUsersThisMonth ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Nouveaux comptes créés</p>
        </div>
      </div>

      {/* Tableau des Entreprises */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Barre de recherche */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b px-5 py-4 bg-slate-50/50">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">
              Entreprises clientes ({totalCompanies})
            </h2>
            <p className="text-xs text-slate-500">
              Gérez les accès, consultez l'activité et modifiez les coordonnées.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs focus:border-cyan-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Entreprise</th>
                <th className="px-5 py-3 text-left">Matricule Fiscale</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-center">Utilisateurs</th>
                <th className="px-5 py-3 text-center">Produits</th>
                <th className="px-5 py-3 text-center">Mouvements</th>
                <th className="px-5 py-3 text-center">Factures</th>
                <th className="px-5 py-3 text-left">Date Inscription</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <Spinner size="sm" />
                  </td>
                </tr>
              ) : companies.length > 0 ? (
                companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => onSelectCompany(c.id)}
                        className="font-semibold text-cyan-800 hover:underline hover:text-cyan-900 text-left"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">
                      {c.matriculeFiscale || '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={c.is_active ? 'success' : 'danger'}>
                        {c.is_active ? 'Active' : 'Suspendue'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center font-medium tabular-nums">
                      {c._count?.users ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center tabular-nums text-slate-600">
                      {c._count?.products ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center tabular-nums text-slate-600">
                      {c._count?.movements ?? 0}
                    </td>
                    <td className="px-5 py-3 text-center tabular-nums text-slate-600">
                      {c._count?.invoices ?? 0}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectCompany(c.id)}
                          className="h-7 px-2 text-xs text-slate-700 hover:text-cyan-800"
                        >
                          <Eye className="mr-1 size-3" />
                          Détails
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                            c.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="size-3" />
                          {c.is_active ? 'Suspendre' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    Aucune entreprise trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-600 bg-slate-50/50">
            <span>
              Page {page} sur {totalPages} ({totalCompanies} résultats)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-2.5 rounded-lg"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5 rounded-lg"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
