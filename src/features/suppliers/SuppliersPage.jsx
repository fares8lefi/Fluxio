import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SupplierForm } from './SupplierForm';
import { getSuppliers, createSupplier, updateSupplier, toggleSupplier } from '@/services/supplierService';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuppliers();
      setSuppliers(data.suppliers ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (s) => { setEditing(s); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateSupplier(editing.id, payload);
    } else {
      await createSupplier(payload);
    }
    closeModal();
    load();
  };

  const handleToggle = async (s) => {
    await toggleSupplier(s.id, !s.is_active);
    load();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fournisseurs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {suppliers.length} fournisseur{suppliers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="rounded-xl" onClick={openCreate}>
          <Plus className="mr-2 size-4" /> Nouveau fournisseur
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
        <div className="flex justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState
          Icon={Truck}
          title="Aucun fournisseur"
          description="Ajoutez vos fournisseurs pour les associer à vos produits."
          actionLabel="Nouveau fournisseur"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Code</th>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Téléphone</th>
                <th className="px-5 py-3 text-left">Adresse</th>
                <th className="px-5 py-3 text-left">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-slate-500">{s.code ?? '—'}</td>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-slate-500">{s.email ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{s.phone}</td>
                  <td className="max-w-[180px] truncate px-5 py-3 text-slate-500">
                    {s.address ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={s.is_active ? 'active' : 'inactive'}>
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Modifier"
                        onClick={() => openEdit(s)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title={s.is_active ? 'Désactiver' : 'Activer'}
                        onClick={() => handleToggle(s)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {s.is_active ? (
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

      <SupplierForm
        open={modalOpen}
        supplier={editing}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}
