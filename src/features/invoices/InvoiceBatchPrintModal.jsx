import { useEffect, useState } from 'react';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import { missingMentions } from '@/lib/fiscal';
import { InvoiceDocument } from './InvoicePdfModal';
import { loadInvoiceDocuments } from './load-invoice-documents';

/**
 * Aperçu et impression de toutes les factures listées, une par page :
 * « Enregistrer en PDF » dans la boîte d'impression produit un seul fichier.
 * @param {{ id: string }[]} invoices — dans l'ordre d'impression
 * @param {string} periodText — ex. « du 01/10/2026 au 16/10/2026 »
 */
export function InvoiceBatchPrintModal({ invoices, periodText, open, onClose }) {
  const [docs, setDocs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || invoices.length === 0) return;
    let cancelled = false;
    setDocs([]);
    setProgress(0);
    setError(null);
    setLoading(true);
    loadInvoiceDocuments(
      invoices.map((inv) => inv.id),
      (n) => !cancelled && setProgress(n)
    )
      .then((data) => !cancelled && setDocs(data))
      .catch((err) => !cancelled && setError(err.message || 'Impossible de charger les factures'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, invoices]);

  // Les mentions de l'entreprise sont communes à toutes les factures
  const issues = docs[0] ? missingMentions({ seller: docs[0].company }) : [];
  const count = invoices.length;

  return (
    <PrintPreviewModal
      open={open}
      onClose={onClose}
      title={`${count} facture${count > 1 ? 's' : ''} ${periodText}`}
      fileName={`Factures ${periodText}`.replaceAll('/', '-')}
      printLabel="Tout imprimer / PDF"
      loading={loading}
      loadingLabel={`Préparation des factures : ${progress} sur ${count}…`}
      error={error}
      issues={issues}
      document={loading ? null : docs.map((d) => <InvoiceDocument key={d.invoiceDetails.reference} data={d} />)}
    />
  );
}
