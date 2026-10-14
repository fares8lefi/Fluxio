import { useEffect, useState } from 'react';
import { FiscalDocument } from '@/components/print/FiscalDocument';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import { getMyCompany } from '@/services/companyService';
import { formatDate, missingMentions, round3, tvaBreakdownFromLines } from '@/lib/fiscal';

/** Document de traçabilité correspondant à chaque type de mouvement */
const DOCUMENTS = {
  OUT: {
    title: 'Bon de livraison',
    partyLabel: 'Client / Destinataire',
    signatures: ['Livré par — cachet et signature', 'Reçu par — nom, date et signature'],
  },
  IN: {
    title: 'Bon de réception',
    partyLabel: 'Fournisseur',
    signatures: ['Livré par (fournisseur)', 'Réceptionné par — nom, date et signature'],
  },
  RETURN_SUPPLIER: {
    title: 'Bon de retour fournisseur',
    partyLabel: 'Fournisseur',
    signatures: ['Remis par — cachet et signature', 'Reçu par le fournisseur'],
  },
  RETURN_CLIENT: {
    title: 'Bon de retour client',
    partyLabel: 'Client',
    signatures: ['Retourné par le client', 'Réceptionné par — cachet et signature'],
  },
  ADJUSTMENT: {
    title: "Bon d'ajustement de stock",
    partyLabel: null, // pas de tiers : document interne
    signatures: ['Établi par — nom et signature', 'Validé par le responsable'],
  },
};

const ADJUSTMENT_REASONS = {
  INVENTORY: 'Inventaire physique',
  BREAKAGE: 'Casse',
  LOSS: 'Perte / vol',
  EXPIRED: 'Péremption',
  OTHER: 'Autre',
};

function toParty(movement, label) {
  const p = movement.client ?? movement.supplier;
  if (!p) return null;
  return {
    label,
    name: p.name,
    address: p.address,
    phone: p.phone,
    matriculeFiscale: p.matriculeFiscale,
    ...(movement.client ? { codeTva: p.codeTva } : {}),
  };
}

export function MovementPrintModal({ movement, open, onClose }) {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || company) return;
    let cancelled = false;
    getMyCompany()
      .then((res) => !cancelled && setCompany(res.company))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [open, company]);

  if (!movement) return null;

  const config = DOCUMENTS[movement.type] ?? DOCUMENTS.OUT;
  const isAdjustment = movement.type === 'ADJUSTMENT';
  const party = isAdjustment ? undefined : toParty(movement, config.partyLabel);
  const reference = movement.reference || movement.id.slice(-8).toUpperCase();

  const lines = (movement.items ?? []).map((it) => ({
    code: it.product?.code ?? null,
    name: it.product?.name ?? 'Produit',
    unit: it.product?.unit_of_measure ?? null,
    quantity: it.quantity,
    unitPriceHT: it.unit_price ?? 0,
    tvaRate: it.product?.tva_rate ?? 19,
    totalHT: round3((it.unit_price ?? 0) * it.quantity),
  }));
  const totalHT = round3(lines.reduce((s, l) => s + l.totalHT, 0));
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

  const doc = company && (
    <FiscalDocument
      title={config.title}
      reference={reference}
      date={movement.created_at}
      meta={[
        { label: 'Facture', value: movement.invoice?.reference },
        {
          label: 'Facture fournisseur',
          value:
            movement.supplier_invoice_ref &&
            `${movement.supplier_invoice_ref}${movement.supplier_invoice_date ? ` du ${formatDate(movement.supplier_invoice_date)}` : ''}`,
        },
        { label: 'Établi par', value: movement.created_by?.username },
      ]}
      seller={company}
      party={party}
      lines={lines}
      tvaBreakdown={isAdjustment ? [] : tvaBreakdownFromLines(lines)}
      totals={[
        { label: isAdjustment ? 'Écart net (quantité)' : 'Quantité totale', value: totalQty, raw: true },
        { label: isAdjustment ? 'Écart valorisé (HT)' : 'Total HT (valorisation)', value: totalHT, emphasis: 'total' },
      ]}
      notices={[
        ...(isAdjustment
          ? [`Motif : ${ADJUSTMENT_REASONS[movement.adjustment_reason] ?? '—'} — quantités signées (+ excédent / − manquant), valorisées au prix d'achat`]
          : []),
        ...(movement.status === 'CANCELLED'
          ? ['Mouvement annulé — les quantités ont été réintégrées en stock.']
          : []),
      ]}
      footnotes={[{ label: 'Observations', value: movement.note }]}
      signatures={config.signatures}
      watermark={movement.status === 'CANCELLED' ? 'ANNULÉ' : undefined}
    />
  );

  return (
    <PrintPreviewModal
      open={open}
      onClose={onClose}
      title={`Aperçu — ${config.title}`}
      fileName={`${config.title} ${reference}`}
      loading={open && !company && !error}
      error={error}
      issues={company ? missingMentions(isAdjustment ? { seller: company } : { seller: company, party }) : []}
      document={doc}
    />
  );
}
