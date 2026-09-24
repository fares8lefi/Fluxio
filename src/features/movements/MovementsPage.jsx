import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Plus,
  Eye,
  Ban,
  Calendar,
  Filter,
  X,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MovementForm } from './MovementForm';
import { MovementDetailModal } from './MovementDetailModal';
import {
  getAllMouvment,
  createMouvment,
  cancelMouvment,
} from '@/services/mouvmentService';
import { getProducts } from '@/services/productService';
import { getSuppliers } from '@/services/supplierService';
import { getClients } from '@/services/clientService';

const TYPE_CONFIG = {
  IN: {
    label: 'Entrée',
    fullLabel: 'Entrée (Réception)',
    variant: 'active',
    icon: ArrowDownLeft,
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  OUT: {
    label: 'Sortie',
    fullLabel: 'Sortie (Expédition)',
    variant: 'danger',
    icon: ArrowUpRight,
    badgeClass: 'bg-rose-100 text-rose-800',
  },
  RETURN_SUPPLIER: {
    label: 'Retour Frn',
    fullLabel: 'Retour Fournisseur',
    variant: 'alert',
    icon: RotateCcw,
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  RETURN_CLIENT: {
    label: 'Retour Client',
    fullLabel: 'Retour Client',
    variant: 'info',
    icon: RotateCcw,
    badgeClass: 'bg-cyan-100 text-cyan-800',
  },
};

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmé', variant: 'active' },
  PENDING: { label: 'En attente', variant: 'alert' },
  CANCELLED: { label: 'Annulé', variant: 'danger' },
};

export function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ressources associées
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [clients, setClients] = useState([]);

  // Pagination & Filtres
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);

  // Charger les données de référence (produits, fournisseurs, clients)
  const loadReferences = useCallback(async () => {
    try {
      const [pd, sd, cd] = await Promise.allSettled([
        getProducts({ limit: 100 }),
        getSuppliers(),
        getClients(),
      ]);
      if (pd.status === 'fulfilled') setProducts(pd.value?.products ?? []);
      if (sd.status === 'fulfilled') setSuppliers(sd.value?.suppliers ?? []);
      if (cd.status === 'fulfilled') setClients(cd.value?.clients ?? []);
    } catch {
      // non-bloquant
    }
  }, []);

  // Charger les mouvements
  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };
      const data = await getAllMouvment(filters);
      setMovements(data.mouvments ?? []);
      setCount(data.count ?? 0);
    } catch (err) {
      setError(err.message || 'Impossible de récupérer les mouvements');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // Actions
  const handleCreate = async (payload) => {
    await createMouvment(payload);
    loadMovements();
    loadReferences(); // met à jour les stocks dans la liste locale des produits
  };

  const handleCancelMovement = async (mvt) => {
    if (
      !window.confirm(
        `Annuler le mouvement "${mvt.reference || mvt.id}" ?\nLes quantités des articles seront automatiquement réajustées en stock.`
      )
    ) {
      return;
    }

    try {
      await cancelMouvment(mvt.id);
      setSelectedMovement(null);
      loadMovements();
      loadReferences();
    } catch (err) {
      alert(err.message || "Erreur lors de l'annulation du mouvement");
    }
  };

  const resetFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(typeFilter || statusFilter || startDate || endDate);

  // Statistiques calculées
  const stats = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let totalVol = 0;

    movements.forEach((m) => {
      if (m.status !== 'CANCELLED') {
        if (m.type === 'IN' || m.type === 'RETURN_CLIENT') inCount += 1;
        if (m.type === 'OUT' || m.type === 'RETURN_SUPPLIER') outCount += 1;
        totalVol += m.total_amount ?? 0;
      }
    });

    return { inCount, outCount, totalVol };
  }, [movements]);

  const limitPerPage = 10;
  const totalPages = Math.ceil(count / limitPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mouvements de Stock</h1>
          <p className="mt-1 text-sm text-slate-500">
            Historique et traçabilité des entrées, sorties et retours de marchandises.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className="mr-2 size-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 grid size-4 place-items-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </Button>
          <Button
            className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-2 size-4" /> Nouveau mouvement
          </Button>
        </div>
      </div>

      {/* ── Cartes de statistiques ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <ArrowLeftRight className="size-5" />
            </span>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{count}</p>
          <p className="text-xs text-slate-500 mt-0.5">Mouvements enregistrés</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowDownLeft className="size-5" />
            </span>
            <span className="text-xs font-semibold text-emerald-600">+ Entrées</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{stats.inCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Réceptions & retours clients</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-rose-50 text-rose-700">
              <ArrowUpRight className="size-5" />
            </span>
            <span className="text-xs font-semibold text-rose-600">- Sorties</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{stats.outCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Expéditions & sorties</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="size-5" />
            </span>
            <span className="text-xs text-slate-400">Valeur flux</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
            {stats.totalVol.toFixed(3)} <span className="text-xs font-normal">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Montant sur la page</p>
        </div>
      </div>

      {/* ── Barre de filtres rétractable ── */}
      {showFilters && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filtrer les mouvements
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <X className="size-3" /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Tous les types</option>
                <option value="IN">Entrée (Réception)</option>
                <option value="OUT">Sortie (Expédition)</option>
                <option value="RETURN_SUPPLIER">Retour Fournisseur</option>
                <option value="RETURN_CLIENT">Retour Client</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Tous les statuts</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="PENDING">En attente</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">Date début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">Date fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Message d'erreur ── */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Tableau des mouvements ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          Icon={ArrowLeftRight}
          title={hasActiveFilters ? 'Aucun mouvement trouvé' : 'Aucun mouvement pour le moment'}
          description={
            hasActiveFilters
              ? 'Aucun mouvement ne correspond aux filtres appliqués.'
              : 'Enregistrez votre première entrée ou sortie pour commencer à suivre votre stock en temps réel.'
          }
          actionLabel={hasActiveFilters ? undefined : 'Nouveau mouvement'}
          onAction={hasActiveFilters ? undefined : () => setCreateModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Réf.</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Tiers / Partenaire</th>
                  <th className="px-5 py-3 text-left">Articles</th>
                  <th className="px-5 py-3 text-right">Montant Total</th>
                  <th className="px-5 py-3 text-center">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {movements.map((m) => {
                  const typeMeta = TYPE_CONFIG[m.type] || {
                    label: m.type,
                    variant: 'info',
                    icon: ArrowLeftRight,
                  };
                  const statusMeta = STATUS_CONFIG[m.status] || {
                    label: m.status,
                    variant: 'info',
                  };
                  const TypeIcon = typeMeta.icon;

                  const partnerName =
                    m.supplier?.name ||
                    m.client?.name ||
                    (m.supplierId ? 'Fournisseur' : m.clientId ? 'Client' : '—');

                  const totalItemsCount = m.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;
                  const isCancelled = m.status === 'CANCELLED';

                  return (
                    <tr
                      key={m.id}
                      className={`transition hover:bg-slate-50/70 ${isCancelled ? 'opacity-60 bg-slate-50/30' : ''}`}
                    >
                      {/* Date */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      {/* Référence */}
                      <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-700">
                        {m.reference ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800">
                            {m.reference}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Type avec icône */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                        >
                          <TypeIcon className="size-3" />
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Partenaire */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-800 font-medium">
                        {partnerName}
                      </td>

                      {/* Résumé articles */}
                      <td className="px-5 py-3 max-w-[200px] truncate text-slate-600">
                        <span className="font-semibold text-slate-800">{totalItemsCount}</span>{' '}
                        article{totalItemsCount > 1 ? 's' : ''}
                        {m.items && m.items.length > 0 && (
                          <span className="text-slate-400 text-[11px] block truncate">
                            {m.items.map((i) => i.product?.name || 'Article').join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Montant total */}
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900 whitespace-nowrap">
                        {Number(m.total_amount ?? 0).toFixed(3)} TND
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => setSelectedMovement(m)}
                            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-cyan-700"
                          >
                            <Eye className="size-4" />
                          </button>
                          {!isCancelled && (
                            <button
                              type="button"
                              title="Annuler ce mouvement"
                              onClick={() => handleCancelMovement(m)}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Ban className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer Pagination ── */}
          <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500">
            <span>
              {count} mouvement{count !== 1 ? 's' : ''} au total
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <span className="font-medium">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de création ── */}
      <MovementForm
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        products={products}
        suppliers={suppliers}
        clients={clients}
      />

      {/* ── Modal de détails ── */}
      <MovementDetailModal
        movement={selectedMovement}
        open={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        onCancelMovement={handleCancelMovement}
      />
    </div>
  );
}
