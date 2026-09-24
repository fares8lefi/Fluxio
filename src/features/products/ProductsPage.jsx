import { useState, useEffect, useCallback } from 'react';
import { Package2, Plus, Pencil, Trash2, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductForm } from './ProductForm';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByFiltres,
  getProductsBelowStockMin,
  getOutOfStockProducts,
} from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getSuppliers } from '@/services/supplierService';

/** Stock badge variant */
function stockVariant(p) {
  if (p.stock_quantity === 0) return 'danger';
  if (p.stock_quantity <= p.stock_min) return 'alert';
  return 'active';
}
function stockLabel(p) {
  if (p.stock_quantity === 0) return 'Rupture';
  if (p.stock_quantity <= p.stock_min) return 'Alerte';
  return 'OK';
}

const EMPTY_FILTERS = { name: '', categoryId: '', supplierId: '', minPrice: '', maxPrice: '' };

export function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Stock alerts from API
  const [belowMin, setBelowMin]     = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);

  // UI state
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [view, setView]             = useState('all'); // 'all' | 'belowMin' | 'outOfStock'

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadBase = useCallback(async () => {
    try {
      const [cd, sd] = await Promise.allSettled([getCategories(), getSuppliers()]);
      if (cd.status === 'fulfilled') setCategories(cd.value?.categories ?? []);
      if (sd.status === 'fulfilled') setSuppliers(sd.value?.suppliers ?? []);
    } catch { /* non-blocking */ }
  }, []);

  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage]             = useState(1);
  const LIMIT = 50;

  const loadProducts = useCallback(async (f = EMPTY_FILTERS, p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const hasFilter = Object.values(f).some((v) => v !== '');
      let pd;
      if (hasFilter) {
        // getProductByFiltres returns 404 when empty → treat as []
        try {
          pd = await getProductByFiltres(f);
        } catch (e) {
          if (e.message?.includes('trouvé') || e.message?.includes('404')) {
            pd = { products: [] };
          } else throw e;
        }
        setProducts(pd.products ?? []);
        setPagination({ total: pd.products?.length ?? 0, page: 1, pages: 1 });
      } else {
        pd = await getProducts({ page: p, limit: LIMIT });
        setProducts(pd.products ?? []);
        setPagination(pd.pagination ?? { total: 0, page: p, pages: 1 });
      }
    } catch (e) {
      // Backend returns 404 when list is empty — treat as empty, not error
      if (e.message?.includes('trouvé') || e.message?.includes('404')) {
        setProducts([]);
        setPagination({ total: 0, page: 1, pages: 1 });
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const [bm, oos] = await Promise.allSettled([
        getProductsBelowStockMin(),
        getOutOfStockProducts(),
      ]);
      if (bm.status === 'fulfilled') setBelowMin(bm.value?.products ?? []);
      if (oos.status === 'fulfilled') setOutOfStock(oos.value?.products ?? []);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    loadBase();
    loadAlerts();
  }, [loadBase, loadAlerts]);

  useEffect(() => {
    if (view === 'all') loadProducts(activeFilters, page);
  }, [view, activeFilters, page, loadProducts]);

  // ── Displayed list ─────────────────────────────────────────────────────────

  const displayed =
    view === 'belowMin'  ? belowMin  :
    view === 'outOfStock' ? outOfStock :
    products;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const reload = () => {
    loadProducts(activeFilters);
    loadAlerts();
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (p) => { setEditing(p);   setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (payload) => {
    if (editing) await updateProduct(editing.id, payload);
    else         await createProduct(payload);
    closeModal();
    reload();
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ? Cette action est irréversible.`)) return;
    await deleteProduct(p.id);
    reload();
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setView('all');
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setView('all');
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== '');

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} produit{products.length !== 1 ? 's' : ''}
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
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Nouveau produit
          </Button>
        </div>
      </div>

      {/* ── Stock alert tabs ── */}
      {(belowMin.length > 0 || outOfStock.length > 0) && (
        <div className="mb-5 flex flex-wrap gap-3">
          <button
            onClick={() => setView('all')}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              view === 'all' ? 'border-slate-300 bg-white shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-100'
            }`}
          >
            Tous les produits
          </button>
          {outOfStock.length > 0 && (
            <button
              onClick={() => setView('outOfStock')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                view === 'outOfStock'
                  ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
                  : 'border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-50'
              }`}
            >
              <span className="font-bold">{outOfStock.length}</span>
              rupture{outOfStock.length > 1 ? 's' : ''}
            </button>
          )}
          {belowMin.length > 0 && (
            <button
              onClick={() => setView('belowMin')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                view === 'belowMin'
                  ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border-amber-100 bg-amber-50/50 text-amber-600 hover:bg-amber-50'
              }`}
            >
              <span className="font-bold">{belowMin.length}</span>
              stock bas
            </button>
          )}
        </div>
      )}

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Filtres</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
                <X className="size-3" /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={filters.name}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nom du produit"
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filters.supplierId}
              onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))}
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Tous fournisseurs</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
              placeholder="Prix min"
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
              placeholder="Prix max"
              className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button className="rounded-xl" onClick={applyFilters}>
              Appliquer
            </Button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          Icon={Package2}
          title={view !== 'all' ? 'Aucun produit dans cette catégorie' : 'Aucun produit'}
          description={
            view !== 'all'
              ? 'Bonne nouvelle — pas de problème de stock ici.'
              : 'Créez votre premier produit pour commencer à gérer votre stock.'
          }
          actionLabel={view === 'all' ? 'Nouveau produit' : undefined}
          onAction={view === 'all' ? openCreate : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Catégorie</th>
                <th className="px-5 py-3 text-left">Fournisseur</th>
                <th className="px-5 py-3 text-right">Prix achat</th>
                <th className="px-5 py-3 text-right">Prix vente</th>
                <th className="px-5 py-3 text-right">Stock / Min</th>
                <th className="px-5 py-3 text-left">TVA</th>
                <th className="px-5 py-3 text-left">État</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayed.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                  <td className="px-5 py-3 font-medium">
                    <div>{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.unit_of_measure}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {p.category?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {p.supplier?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                    {Number(p.purchase_price).toFixed(3)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {Number(p.selling_price).toFixed(3)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className={
                      p.stock_quantity === 0 ? 'font-bold text-rose-600' :
                      p.stock_quantity <= p.stock_min ? 'font-semibold text-amber-600' :
                      'text-slate-700'
                    }>
                      {p.stock_quantity}
                    </span>
                    <span className="text-xs text-slate-400"> / {p.stock_min}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.tva_rate}%</td>
                  <td className="px-5 py-3">
                    <Badge variant={stockVariant(p)}>{stockLabel(p)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Modifier"
                        onClick={() => openEdit(p)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => handleDelete(p)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500">
            <span>
              {view === 'all'
                ? `${pagination.total} produit${pagination.total !== 1 ? 's' : ''} au total`
                : `${displayed.length} résultat${displayed.length !== 1 ? 's' : ''}`}
              {view === 'belowMin' && ' · Stock en-dessous du seuil minimum'}
              {view === 'outOfStock' && ' · Produits en rupture totale'}
            </span>
            {view === 'all' && pagination.pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                <span className="font-medium">
                  Page {pagination.page} / {pagination.pages}
                </span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ProductForm
        open={modalOpen}
        product={editing}
        categories={categories}
        suppliers={suppliers}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
