import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MovementPrintModal } from './MovementPrintModal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Calendar,
  User,
  Building2,
  FileText,
  AlertTriangle,
  Ban,
  Printer,
  ClipboardCheck,
} from 'lucide-react';

const TYPE_CONFIG = {
  IN: {
    label: 'Entrée en stock',
    variant: 'active',
    icon: ArrowDownLeft,
    desc: 'Réception / Approvisionnement',
  },
  OUT: {
    label: 'Sortie de stock',
    variant: 'danger',
    icon: ArrowUpRight,
    desc: 'Vente / Expédition',
  },
  RETURN_SUPPLIER: {
    label: 'Retour Fournisseur',
    variant: 'alert',
    icon: RotateCcw,
    desc: 'Renvoi de marchandise au fournisseur',
  },
  RETURN_CLIENT: {
    label: 'Retour Client',
    variant: 'info',
    icon: RotateCcw,
    desc: 'Réintégration de produit retourné par un client',
  },
  ADJUSTMENT: {
    label: 'Ajustement de stock',
    variant: 'alert',
    icon: ClipboardCheck,
    desc: 'Inventaire, casse, perte : écarts signés (+ excédent / − manquant)',
  },
};

const STATUS_CONFIG = {
  CONFIRMED: { label: 'Confirmé', variant: 'active' },
  PENDING: { label: 'En attente', variant: 'alert' },
  CANCELLED: { label: 'Annulé', variant: 'danger' },
};

export function MovementDetailModal({
  movement,
  open,
  onClose,
  onCancelMovement,
}) {
  const [printOpen, setPrintOpen] = useState(false);
  if (!movement) return null;

  const typeMeta = TYPE_CONFIG[movement.type] || {
    label: movement.type,
    variant: 'info',
    icon: ArrowDownLeft,
  };
  const statusMeta = STATUS_CONFIG[movement.status] || {
    label: movement.status,
    variant: 'info',
  };
  const TypeIcon = typeMeta.icon;

  const partnerName =
    movement.supplier?.name ||
    movement.client?.name ||
    (movement.supplierId
      ? 'Fournisseur'
      : movement.clientId
        ? 'Client'
        : 'Aucun partenaire');

  const partnerType = movement.supplier
    ? 'Fournisseur'
    : movement.client
      ? 'Client'
      : 'Tiers';

  const isCancelled = movement.status === 'CANCELLED';

  return (
    <>
      <Modal
        open={open && !printOpen}
        title="Détails du mouvement de stock"
        onClose={onClose}
        footer={
          <div className="flex w-full items-center justify-between">
            <div>
              {!isCancelled && onCancelMovement && (
                <Button
                  variant="outline"
                  type="button"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => onCancelMovement(movement)}
                >
                  <Ban className="mr-2 size-4" />
                  Annuler ce mouvement
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Fermer
              </Button>
              <Button
                type="button"
                className="bg-cyan-700 text-white hover:bg-cyan-800"
                onClick={() => setPrintOpen(true)}
              >
                <Printer className="mr-2 size-4" />
                Imprimer le bon
              </Button>
            </div>
          </div>
        }
      >
        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
          {/* Banner Type & Statut */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid size-11 place-items-center rounded-xl ${
                  movement.type === 'ADJUSTMENT'
                    ? 'bg-violet-100 text-violet-700'
                    : movement.type === 'IN' || movement.type === 'RETURN_CLIENT'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                }`}
              >
                <TypeIcon className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {typeMeta.label}
                  </span>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{typeMeta.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Montant Total
              </p>
              <p className="text-xl font-bold text-slate-900 tabular-nums">
                {Number(movement.total_amount ?? 0).toFixed(3)} TND
              </p>
            </div>
          </div>

          {/* Alerte si annulé */}
          {isCancelled && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Ce mouvement a été annulé. Les stocks associés ont été
                restaurés.
              </span>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <FileText className="size-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-slate-400">Référence</p>
                <p className="font-mono font-semibold text-slate-800">
                  {movement.reference || 'Non renseignée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <Calendar className="size-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-slate-400">Date & Heure</p>
                <p className="font-semibold text-slate-800">
                  {movement.created_at
                    ? new Date(movement.created_at).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <Building2 className="size-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-slate-400">{partnerType}</p>
                <p className="font-semibold text-slate-800">{partnerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2.5">
              <User className="size-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-slate-400">Créé par</p>
                <p className="font-semibold text-slate-800">
                  {movement.created_by?.username || 'Utilisateur'}
                </p>
              </div>
            </div>
          </div>

          {/* Note / Commentaire */}
          {movement.note && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
              <p className="mb-1 font-semibold text-slate-500">
                Observation / Note :
              </p>
              <p className="text-slate-700 italic">{movement.note}</p>
            </div>
          )}

          {/* Tableau des articles */}
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Articles déplacés ({movement.items?.length ?? 0})
            </h3>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-xs">
                <thead className="border-b bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Produit</th>
                    <th className="px-3 py-2 text-right">Quantité</th>
                    <th className="px-3 py-2 text-right">Prix Unitaire</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movement.items?.map((item) => {
                    const lineTotal = (item.unit_price ?? 0) * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">
                            {item.product?.name ?? 'Produit'}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            Code: {item.product?.code ?? '—'} · Barcode:{' '}
                            {item.product?.barcode ?? '—'}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                          {item.quantity}{' '}
                          {item.product?.unit_of_measure ?? 'pièce(s)'}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
                          {Number(item.unit_price ?? 0).toFixed(3)} TND
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 tabular-nums">
                          {Number(lineTotal).toFixed(3)} TND
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <MovementPrintModal
        movement={movement}
        open={open && printOpen}
        onClose={() => setPrintOpen(false)}
      />
    </>
  );
}
