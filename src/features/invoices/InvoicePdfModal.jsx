import { useEffect, useState } from 'react';
import { getInvoicePdfData } from '@/services/invoiceService';
import { FiscalDocument } from '@/components/print/FiscalDocument';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import { formatDate, missingMentions } from '@/lib/fiscal';

const TITLES = {
  SALE: 'Facture',
  CREDIT_NOTE: "Facture d'avoir",
  PROFORMA: 'Facture pro forma',
};

function InvoiceDocument({ data }) {
  const { company, client, invoiceDetails: d, fiscalSummary: f, items } = data;
  const isCreditNote = d.invoice_type === 'CREDIT_NOTE';

  const notices = [];
  if (isCreditNote && d.original_invoice) {
    notices.push(
      `Avoir sur la facture N° ${d.original_invoice.reference} du ${formatDate(d.original_invoice.date)}`
    );
  }
  if (d.is_suspended) {
    notices.push(
      `Vente en suspension de TVA — Attestation d'achat en suspension N° ${d.attestation_ref || '—'}`
    );
  }

  const totals = [
    { label: 'Total HT', value: f.total_ht },
    { label: 'Total TVA', value: f.tva_amount },
  ];
  if (f.timbre_fiscal > 0) totals.push({ label: 'Droit de timbre', value: f.timbre_fiscal });
  totals.push({ label: 'Total TTC', value: f.total_ttc, emphasis: f.apply_rs ? 'total' : 'net' });
  if (f.apply_rs) {
    totals.push({ label: `Retenue à la source ${f.rs_rate} %`, value: -f.rs_amount });
    totals.push({ label: 'Net à payer', value: f.net_payable, emphasis: 'net' });
  }

  return (
    <FiscalDocument
      title={TITLES[d.invoice_type] ?? 'Facture'}
      reference={d.reference}
      date={d.date}
      meta={[
        { label: 'Bon de commande', value: d.purchase_order_ref },
        { label: 'Bon de livraison', value: d.movement_reference },
      ]}
      seller={company}
      party={client ? { label: 'Client', ...client } : null}
      lines={items.map((it) => ({
        code: it.productCode,
        name: it.productName,
        unit: it.unitOfMeasure,
        quantity: it.quantity,
        unitPriceHT: it.unitPriceHT,
        tvaRate: d.is_suspended ? null : it.tvaRate,
        totalHT: it.totalLineHT,
      }))}
      tvaBreakdown={d.is_suspended ? [] : f.tva_breakdown}
      totals={totals}
      amountInWords={
        f.net_payable < 0
          ? `Moins ${f.amountInWords.charAt(0).toLowerCase()}${f.amountInWords.slice(1)}`
          : f.amountInWords
      }
      wordsLabel={
        isCreditNote
          ? "Arrêtée la présente facture d'avoir à la somme de"
          : 'Arrêtée la présente facture à la somme de'
      }
      notices={notices}
      footnotes={[
        { label: 'Conditions de paiement', value: d.payment_terms },
        { label: isCreditNote ? 'Motif' : 'Observations', value: d.notes },
      ]}
      signatures={['Cachet et signature du vendeur', 'Cachet et signature du client']}
      watermark={d.status === 'CANCELLED' ? 'ANNULÉE' : undefined}
    />
  );
}

export function InvoicePdfModal({ invoiceId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !invoiceId) return;
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);
    getInvoicePdfData(invoiceId)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId]);

  const reference = data?.invoiceDetails?.reference;
  const issues = data
    ? missingMentions({ seller: data.company, party: data.client, requirePartyMf: true })
    : [];

  return (
    <PrintPreviewModal
      open={open}
      onClose={onClose}
      title={reference ? `Aperçu — ${reference}` : 'Aperçu de la facture'}
      fileName={reference}
      loading={loading}
      error={error}
      issues={issues}
      document={data && <InvoiceDocument data={data} />}
    />
  );
}
