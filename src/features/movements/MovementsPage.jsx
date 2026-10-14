import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Plus,
  Eye,
  Ban,
  Filter,
  X,
  TrendingUp,
  PackageCheck,
  Clock,
  Receipt,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MovementForm } from './MovementForm';
import { MovementDetailModal } from './MovementDetailModal';
import { GenerateInvoiceModal } from '@/features/invoices/GenerateInvoiceModal';
import {
  getAllMouvment,
  createMouvment,
  cancelMouvment,
} from '@/services/mouvmentService';
import { getProducts } from '@/services/productService';
import { getSuppliers } from '@/services/supplierService';
import { getClients } from '@/services/clientService';

/* ─────────────────────────── configs ─────────────────────────── */

const TYPE_CONFIG = {
  IN: {
    label: 'Entrée (Achat)',
    fullLabel: 'Entrée (Achat / Réception)',
    variant: 'active',
    icon: ArrowDownLeft,
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  OUT: {
    label: 'Sortie (Vente)',
    fullLabel: 'Sortie (Vente / Expédition)',
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
  ADJUSTMENT: {
    label: 'Ajustement',
    fullLabel: 'Ajustement de stock',
    variant: 'alert',
    icon: ClipboardCheck,
    badgeClass: 'bg-violet-100 text-violet-800',
  },
};

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmé',   variant: 'active' },
  PENDING:   { label: 'En attente', variant: 'alert'  },
  CANCELLED: { label: 'Annulé',     variant: 'danger' },
};

/**
 * Per-type hero / page config.
 * Key is the typeFilter prop value (null for "all").
 */
const TYPE_PAGES = {
  null: {
    label: 'Mouvements de Stock',
    description: 'Historique et traçabilité des entrées, sorties et retours de marchandises.',
    Icon: ArrowLeftRight,
    heroBg: 'from-slate-700 to-slate-900',
    iconBg: 'bg-slate-600',
    accentText: 'text-slate-200',
    tabLabel: 'Tous',
    hash: 'movements',
  },
  IN: {
    label: 'Entrées de stock (Achats)',
    description: 'Réceptions et approvisionnements fournisseur.',
    Icon: ArrowDownLeft,
    heroBg: 'from-emerald-600 to-emerald-800',
    iconBg: 'bg-emerald-500',
    accentText: 'text-emerald-100',
    tabLabel: 'Entrées (Achats)',
    hash: 'movements/in',
  },
  OUT: {
    label: 'Sorties de stock (Ventes)',
    description: 'Expéditions, ventes clients et consommations.',
    Icon: ArrowUpRight,
    heroBg: 'from-rose-600 to-rose-800',
    iconBg: 'bg-rose-500',
    accentText: 'text-rose-100',
    tabLabel: 'Sorties (Ventes)',
    hash: 'movements/out',
  },
  RETURN_SUPPLIER: {
    label: 'Retours Fournisseur',
    description: 'Marchandises renvoyées au fournisseur.',
    Icon: RotateCcw,
    heroBg: 'from-amber-500 to-amber-700',
    iconBg: 'bg-amber-400',
    accentText: 'text-amber-100',
    tabLabel: 'Retour Fournisseur',
    hash: 'movements/return-supplier',
  },
  RETURN_CLIENT: {
    label: 'Retours Client',
    description: 'Produits retournés réintégrés en stock.',
    Icon: RotateCcw,
    heroBg: 'from-cyan-600 to-cyan-800',
    iconBg: 'bg-cyan-500',
    accentText: 'text-cyan-100',
    tabLabel: 'Retour Client',
    hash: 'movements/return-client',
  },
};

/** Order of tabs */
const TAB_KEYS = [null, 'IN', 'OUT', 'RETURN_SUPPLIER', 'RETURN_CLIENT'];

/* ─────────────────────── MovementTabs ─────────────────────────── */

function MovementTabs({ currentType }) {
  const navigate = (hash) => {
    window.location.hash = `#dashboard/${hash}`;
  };

  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border bg-white p-1.5 shadow-sm">
      {TAB_KEYS.map((key) => {
        const cfg = TYPE_PAGES[key];
        const isActive = currentType === key;
        return (
          <button
            key={String(key)}
            type="button"
            onClick={() => navigate(cfg.hash)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <cfg.Icon className="size-3.5" />
            {cfg.tabLabel}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────── HeroBanner ────────────────────────────── */

function HeroBanner({ typeCfg, onNew }) {
  const { can } = useAuth();
  const { Icon } = typeCfg;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${typeCfg.heroBg} p-6 text-white shadow-md`}
    >
      {/* Decorative circle */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 -right-4 size-28 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`inline-grid size-12 shrink-0 place-items-center rounded-xl ${typeCfg.iconBg} shadow`}
          >
            <Icon className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{typeCfg.label}</h1>
            <p className={`mt-0.5 text-sm ${typeCfg.accentText}`}>
              {typeCfg.description}
            </p>
          </div>
        </div>
        <Button
          onClick={onNew}
          hidden={!can('stock.write')}
          className="shrink-0 rounded-xl bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <Plus className="mr-2 size-4" />
          Nouveau mouvement
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────── StatsCards ───────────────────────────── */

function StatsCards({ movements, count, typeFilter }) {
  const stats = useMemo(() => {
    let typeCount = 0;
    let totalAmount = 0;
    let pendingCount = 0;

    movements.forEach((m) => {
      if (typeFilter === null || m.type === typeFilter) {
        if (m.status !== 'CANCELLED') typeCount += 1;
        if (m.status === 'PENDING') pendingCount += 1;
        if (m.status !== 'CANCELLED') totalAmount += m.total_amount ?? 0;
      }
    });

    return { typeCount, totalAmount, pendingCount };
  }, [movements, typeFilter]);

  const isFiltered = typeFilter !== null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Card 1 — total */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
            <ArrowLeftRight className="size-5" />
          </span>
          <span className="text-xs text-slate-400">
            {isFiltered ? TYPE_PAGES[typeFilter]?.tabLabel : 'Total'}
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{count}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {isFiltered
            ? `${TYPE_PAGES[typeFilter]?.label} enregistrées`
            : 'Mouvements enregistrés'}
        </p>
      </div>

      {/* Card 2 — montant */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
            <TrendingUp className="size-5" />
          </span>
          <span className="text-xs text-slate-400">Valeur flux</span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
          {stats.totalAmount.toFixed(3)}{' '}
          <span className="text-xs font-normal">TND</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Montant sur la page</p>
      </div>

      {/* Card 3 — en attente */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
            <Clock className="size-5" />
          </span>
          <span className="text-xs font-semibold text-amber-600">En attente</span>
        </div>
        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
          {stats.pendingCount}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">À traiter</p>
      </div>
    </div>
  );
}

/* ──────────────────── MovementTypeView ────────────────────────── */

/**
 * Core view component.
 * @param {string|null} typeFilter  — null = all, 'IN' | 'OUT' | 'RETURN_SUPPLIER' | 'RETURN_CLIENT'
 */
function MovementTypeView({ typeFilter }) {
  const { can } = useAuth();
  const canWriteStock = can('stock.write');
  const typeCfg = TYPE_PAGES[typeFilter] ?? TYPE_PAGES[null];

  const [movements, setMovements]         = useState([]);
  const [count, setCount]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // Reference data
  const [products, setProducts]           = useState([]);
  const [suppliers, setSuppliers]         = useState([]);
  const [clients, setClients]             = useState([]);

  // Pagination & filters
  const [page, setPage]                   = useState(1);
  const [statusFilter, setStatusFilter]   = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [showFilters, setShowFilters]     = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [invoiceMovementId, setInvoiceMovementId] = useState(null);

  /* ── Reference data ── */
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
      // non-blocking
    }
  }, []);

  /* ── Movements ── */
  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        page,
        ...(typeFilter   ? { type: typeFilter }   : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(startDate    ? { startDate }           : {}),
        ...(endDate      ? { endDate }             : {}),
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

  useEffect(() => { loadReferences(); }, [loadReferences]);
  useEffect(() => { loadMovements();  }, [loadMovements]);

  // Reset page when typeFilter changes (parent mounts a new component instance anyway,
  // but keep this for safety if ever reused inline)
  useEffect(() => { setPage(1); }, [typeFilter]);

  /* ── Actions ── */
  const toast   = useToast();
  const confirm = useConfirm();

  const handleCreate = async (payload) => {
    await createMouvment(payload);
    toast.success('Mouvement enregistré', { description: 'Le stock a été mis à jour.' });
    loadMovements();
    loadReferences();
  };

  const handleCancelMovement = async (mvt) => {
    const ok = await confirm({
      title: 'Annuler le mouvement',
      description: `Le mouvement « ${mvt.reference || mvt.id} » sera annulé.\nLes quantités des articles seront automatiquement réajustées en stock.`,
      confirmLabel: 'Annuler le mouvement',
      cancelLabel: 'Retour',
      destructive: true,
    });
    if (!ok) return;

    try {
      await cancelMouvment(mvt.id);
      setSelectedMovement(null);
      toast.success('Mouvement annulé', { description: 'Le stock a été réajusté.' });
      loadMovements();
      loadReferences();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'annulation du mouvement");
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(statusFilter || startDate || endDate);

  /* ── On type-specific pages the Type column is hidden ── */
  const showTypeCol = typeFilter === null;

  const limitPerPage = 10;
  const totalPages   = Math.ceil(count / limitPerPage) || 1;

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="space-y-6">

      {/* Hero banner */}
      <HeroBanner typeCfg={typeCfg} onNew={() => setCreateModalOpen(true)} />

      {/* Sub-tab navigation */}
      <MovementTabs currentType={typeFilter} />

      {/* Stats */}
      <StatsCards movements={movements} count={count} typeFilter={typeFilter} />

      {/* Filter bar toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {count} mouvement{count !== 1 ? 's' : ''} au total
        </p>
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
      </div>

      {/* Filter panel */}
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Tous les statuts</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="PENDING">En attente</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Date début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600">
                Date fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton columns={6} />
      ) : movements.length === 0 ? (
        <EmptyState
          Icon={typeCfg.Icon}
          title={hasActiveFilters ? 'Aucun mouvement trouvé' : `Aucun mouvement${typeFilter ? ` de type "${typeCfg.label}"` : ''} pour le moment`}
          description={
            hasActiveFilters
              ? 'Aucun mouvement ne correspond aux filtres appliqués.'
              : 'Enregistrez votre première entrée ou sortie pour commencer à suivre votre stock en temps réel.'
          }
          actionLabel={hasActiveFilters || !canWriteStock ? undefined : 'Nouveau mouvement'}
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
                  {showTypeCol && <th className="px-5 py-3 text-left">Type</th>}
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
                    badgeClass: 'bg-slate-100 text-slate-700',
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

                      {/* Type (hidden on type-specific views) */}
                      {showTypeCol && (
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta.badgeClass}`}
                          >
                            <TypeIcon className="size-3" />
                            {typeMeta.label}
                          </span>
                        </td>
                      )}

                      {/* Partenaire */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-800 font-medium">
                        {partnerName}
                      </td>

                      {/* Articles */}
                      <td className="px-5 py-3 max-w-[200px] truncate text-slate-600">
                        <span className="font-semibold text-slate-800">{totalItemsCount}</span>{' '}
                        article{totalItemsCount > 1 ? 's' : ''}
                        {m.items && m.items.length > 0 && (
                          <span className="text-slate-400 text-[11px] block truncate">
                            {m.items.map((i) => i.product?.name || 'Article').join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Montant */}
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
                          {m.type === 'OUT' && !isCancelled && (
                            <button
                              type="button"
                              title="Générer une facture"
                              hidden={!can('billing.write')}
                              onClick={() => setInvoiceMovementId(m.id)}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              <Receipt className="size-4" />
                            </button>
                          )}
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

          {/* Pagination footer */}
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

      {/* Floating action button (type-specific pages) */}
      {typeFilter !== null && canWriteStock && (
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className={`fixed bottom-8 right-8 flex items-center gap-2 rounded-2xl bg-gradient-to-br ${typeCfg.heroBg} px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95 z-30`}
        >
          <Plus className="size-5" />
          Nouveau
        </button>
      )}

      {/* Creation modal */}
      <MovementForm
        open={createModalOpen}
        defaultType={typeFilter || 'OUT'}
        fixedType={typeFilter}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        products={products}
        suppliers={suppliers}
        clients={clients}
      />

      {/* Detail modal */}
      <MovementDetailModal
        movement={selectedMovement}
        open={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        onCancelMovement={canWriteStock ? handleCancelMovement : undefined}
      />

      {/* Invoice generation modal for OUT movements */}
      <GenerateInvoiceModal
        open={Boolean(invoiceMovementId)}
        initialMovementId={invoiceMovementId || ''}
        clients={clients}
        onClose={() => setInvoiceMovementId(null)}
        onSuccess={() => {
          setInvoiceMovementId(null);
          window.location.hash = '#dashboard/invoices';
        }}
      />
    </div>
  );
}

/* ────────────────── Named page exports ────────────────────────── */

export function MovementsPage()          { return <MovementTypeView typeFilter={null} />; }
export function MovementsInPage()        { return <MovementTypeView typeFilter="IN" />; }
export function MovementsOutPage()       { return <MovementTypeView typeFilter="OUT" />; }
export function MovementsReturnSupPage() { return <MovementTypeView typeFilter="RETURN_SUPPLIER" />; }
export function MovementsReturnCliPage() { return <MovementTypeView typeFilter="RETURN_CLIENT" />; }
