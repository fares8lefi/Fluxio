import { Spinner } from '@/components/ui/Spinner';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Eye,
  Calendar,
  Package,
  ClipboardCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MovementDetailModal } from './MovementDetailModal';
import {
  getMouvmentsByClient,
  getMouvmentsBySupplier,
} from '@/services/mouvmentService';

const TYPE_CONFIG = {
  IN: {
    label: 'Entrée',
    icon: ArrowDownLeft,
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  OUT: {
    label: 'Sortie',
    icon: ArrowUpRight,
    badgeClass: 'bg-rose-100 text-rose-800',
  },
  RETURN_SUPPLIER: {
    label: 'Retour Fournisseur',
    icon: RotateCcw,
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  RETURN_CLIENT: {
    label: 'Retour Client',
    icon: RotateCcw,
    badgeClass: 'bg-cyan-100 text-cyan-800',
  },
  ADJUSTMENT: {
    label: 'Ajustement',
    icon: ClipboardCheck,
    badgeClass: 'bg-violet-100 text-violet-800',
  },
};

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmé', variant: 'active' },
  PENDING: { label: 'En attente', variant: 'alert' },
  CANCELLED: { label: 'Annulé', variant: 'danger' },
};

/**
 * Modal to display movements associated with a specific client or supplier.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   partner: { id: string, name: string, type: 'client' | 'supplier' } | null
 * }} props
 */
export function PartnerMovementsModal({ open, onClose, partner }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const fetchMovements = useCallback(async () => {
    if (!partner?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data =
        partner.type === 'client'
          ? await getMouvmentsByClient(partner.id)
          : await getMouvmentsBySupplier(partner.id);
      setMovements(data.mouvments ?? []);
    } catch (err) {
      setError(err.message || 'Impossible de récupérer les mouvements.');
    } finally {
      setLoading(false);
    }
  }, [partner]);

  useEffect(() => {
    if (open && partner?.id) {
      fetchMovements();
    } else {
      setMovements([]);
      setError(null);
    }
  }, [open, partner, fetchMovements]);

  if (!partner) return null;

  const isClient = partner.type === 'client';
  const partnerLabel = isClient ? 'Client' : 'Fournisseur';

  const totalAmount = movements.reduce(
    (sum, m) => (m.status !== 'CANCELLED' ? sum + Number(m.total_amount ?? 0) : sum),
    0
  );

  return (
    <>
      <Modal
        open={open}
        title={`Mouvements — ${partnerLabel} : ${partner.name}`}
        onClose={onClose}
        footer={
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-slate-500">
              {movements.length} mouvement{movements.length > 1 ? 's' : ''} au total
            </span>
            <Button variant="outline" type="button" onClick={onClose}>
              Fermer
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-slate-50 p-3.5">
              <span className="text-xs text-slate-500">Total mouvements</span>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {movements.length}
              </p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3.5">
              <span className="text-xs text-slate-500">Montant cumulé</span>
              <p className="mt-1 text-xl font-bold tabular-nums text-cyan-800">
                {totalAmount.toFixed(3)} <span className="text-xs font-normal">TND</span>
              </p>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Table or Empty state */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              Icon={ArrowLeftRight}
              title="Aucun mouvement"
              description={`Aucun mouvement de stock n'a encore été associé à ce ${partnerLabel.toLowerCase()}.`}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="w-full text-xs">
                <thead className="border-b bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left">Date</th>
                    <th className="px-3.5 py-2.5 text-left">Réf.</th>
                    <th className="px-3.5 py-2.5 text-left">Type</th>
                    <th className="px-3.5 py-2.5 text-left">Articles</th>
                    <th className="px-3.5 py-2.5 text-right">Montant</th>
                    <th className="px-3.5 py-2.5 text-center">Statut</th>
                    <th className="px-3.5 py-2.5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {movements.map((m) => {
                    const typeMeta = TYPE_CONFIG[m.type] || {
                      label: m.type,
                      icon: ArrowLeftRight,
                      badgeClass: 'bg-slate-100 text-slate-700',
                    };
                    const statusMeta = STATUS_CONFIG[m.status] || {
                      label: m.status,
                      variant: 'info',
                    };
                    const TypeIcon = typeMeta.icon;
                    const itemsQty =
                      m.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) ?? 0;

                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50/70 transition ${
                          m.status === 'CANCELLED' ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-600">
                          {m.created_at
                            ? new Date(m.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-800">
                          {m.reference ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold">
                              {m.reference}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${typeMeta.badgeClass}`}
                          >
                            <TypeIcon className="size-3" />
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-[140px] truncate text-slate-600">
                          <span className="font-semibold text-slate-800">{itemsQty}</span>{' '}
                          art.
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-slate-900 whitespace-nowrap">
                          {Number(m.total_amount ?? 0).toFixed(3)} TND
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                        </td>
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => setSelectedMovement(m)}
                            className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-cyan-700"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Movement Detail Modal */}
      <MovementDetailModal
        movement={selectedMovement}
        open={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
      />
    </>
  );
}
