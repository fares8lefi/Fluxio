import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tag, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CategoryForm } from './CategoryForm';
import { getCategories, createCategory, updateCategory, toggleCategory } from '@/services/categoryService';

export function CategoriesPage() {
  const { can } = useAuth();
  const canWrite = can('stock.write');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null); // null = create mode

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data.categories ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (cat) => { setEditing(cat); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const toast = useToast();

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateCategory(editing.id, payload);
    } else {
      await createCategory(payload);
    }
    closeModal();
    toast.success(editing ? 'Catégorie mise à jour' : 'Catégorie créée');
    load();
  };

  const handleToggle = async (cat) => {
    try {
      await toggleCategory(cat.id, !cat.is_active);
      toast.success(cat.is_active ? 'Catégorie désactivée' : 'Catégorie activée');
      load();
    } catch (err) {
      toast.error(err.message || 'Impossible de modifier le statut');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catégories</h1>
          <p className="mt-1 text-sm text-slate-500">
            {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="rounded-xl" onClick={openCreate} hidden={!canWrite}>
          <Plus className="mr-2 size-4" /> Nouvelle catégorie
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton columns={4} />
      ) : categories.length === 0 ? (
        <EmptyState
          Icon={Tag}
          title="Aucune catégorie"
          description="Créez votre première catégorie pour organiser votre catalogue produits."
          actionLabel={canWrite ? 'Nouvelle catégorie' : undefined}
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Statut</th>
                <th className="px-5 py-3 text-left">Produits</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-slate-500">{cat.code}</td>
                  <td className="px-5 py-3 font-medium">{cat.name}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-slate-500">
                    {cat.description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={cat.is_active ? 'active' : 'inactive'}>
                      {cat.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {cat._count?.products ?? cat.products?.length ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        hidden={!canWrite}
                        title="Modifier"
                        onClick={() => openEdit(cat)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        hidden={!canWrite}
                        title={cat.is_active ? 'Désactiver' : 'Activer'}
                        onClick={() => handleToggle(cat)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {cat.is_active ? (
                          <ToggleRight className="size-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="size-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryForm
        open={modalOpen}
        category={editing}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
