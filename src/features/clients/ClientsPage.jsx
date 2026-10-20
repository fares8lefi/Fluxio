import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExportButton } from '@/components/ui/ExportButton';
import { exportClients } from '@/services/exportService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ClientForm } from './ClientForm';
import { PartnerMovementsModal } from '@/features/movements/PartnerMovementsModal';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '@/services/clientService';

export function ClientsPage() {
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null); // id en cours de suppression
  const [movementsPartner, setMovementsPartner] = useState(null);
  const toast   = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients();
      setClients(data.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (c) => { setEditing(c);   setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateClient(editing.id, payload);
    } else {
      await createClient(payload);
    }
    closeModal();
    toast.success(editing ? 'Client mis à jour' : 'Client créé');
    load();
  };

  const handleDelete = async (c) => {
    const ok = await confirm({
      title: 'Supprimer le client',
      description: `« ${c.name} » sera définitivement supprimé. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(c.id);
    try {
      await deleteClient(c.id);
      toast.success('Client supprimé');
      load();
    } catch (e) {
      toast.error(e.message || 'Impossible de supprimer le client');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton onExport={exportClients} />
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Nouveau client
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : clients.length === 0 ? (
        <EmptyState
          Icon={Users}
          title="Aucun client"
          description="Ajoutez vos clients pour les associer à vos factures et mouvements."
          actionLabel="Nouveau client"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Nom</th>
                <th className="px-5 py-3 text-left">Téléphone</th>
                <th className="px-5 py-3 text-left">Matricule Fiscale</th>
                <th className="px-5 py-3 text-left">Code TVA</th>
                <th className="px-5 py-3 text-left">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.phone ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{c.matriculeFiscale ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{c.codeTva ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <Badge variant={c.is_active !== false ? 'active' : 'inactive'}>
                      {c.is_active !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Mouvements */}
                      <button
                        title="Historique des mouvements"
                        onClick={() => setMovementsPartner({ id: c.id, name: c.name, type: 'client' })}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <ArrowLeftRight className="size-3.5" />
                      </button>
                      {/* Modifier */}
                      <button
                        title="Modifier"
                        onClick={() => openEdit(c)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {/* Supprimer */}
                      <button
                        title="Supprimer"
                        onClick={() => handleDelete(c)}
                        disabled={deleting === c.id}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      >
                        {deleting === c.id ? (
                          <Spinner size="xs" tone="danger" label="Suppression…" />
                        ) : (
                          <Trash2 className="size-3.5" />
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

      <ClientForm
        open={modalOpen}
        client={editing}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />

      <PartnerMovementsModal
        open={Boolean(movementsPartner)}
        partner={movementsPartner}
        onClose={() => setMovementsPartner(null)}
      />
    </div>
  );
}
