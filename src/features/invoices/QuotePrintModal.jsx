import { FiscalDocument } from '@/components/print/FiscalDocument';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import {
  amountToWords,
  formatDate,
  missingMentions,
  round3,
  tvaBreakdownFromLines,
} from '@/lib/fiscal';

// Même timbre que le moteur fiscal du backend (inclus dans le total TTC du devis)
const TIMBRE_FISCAL = 1;

function parseItems(items) {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || '[]');
  } catch {
    return [];
  }
}

/** Lignes et totaux recalculés depuis les articles figés du devis (remise comprise) */
function buildQuoteDocument(quote) {
  const suspended = Boolean(quote.is_suspended);
  const lines = parseItems(quote.items).map((it) => {
    const discount = Math.min(Math.max(Number(it.discount) || 0, 0), 100);
    return {
      code: null,
      name: it.description && !it.description.startsWith('Unité') ? `${it.name} — ${it.description}` : it.name,
      unit: it.description?.startsWith('Unité : ') ? it.description.slice(8) : null,
      quantity: it.quantity,
      unitPriceHT: it.unit_price,
      discount,
      tvaRate: suspended ? null : Number(it.tva_rate) || 0,
      rate: Number(it.tva_rate) || 0,
      totalHT: round3(Number(it.unit_price) * Number(it.quantity) * (1 - discount / 100)),
    };
  });

  const breakdown = tvaBreakdownFromLines(
    lines.map((l) => ({ totalHT: l.totalHT, tvaRate: l.rate })),
    { suspended }
  );
  const totalHT = round3(lines.reduce((s, l) => s + l.totalHT, 0));
  const totalTVA = round3(breakdown.reduce((s, t) => s + t.tva_amount, 0));
  const timbre = suspended ? 0 : TIMBRE_FISCAL;
  const totalTTC = round3(totalHT + totalTVA + timbre);

  const totals = [
    { label: 'Total HT', value: totalHT },
    { label: 'Total TVA', value: totalTVA },
  ];
  if (timbre) totals.push({ label: 'Droit de timbre', value: timbre });
  totals.push({ label: 'Total TTC', value: totalTTC, emphasis: 'net' });

  return { lines, breakdown: suspended ? [] : breakdown, totals, totalTTC };
}

export function QuotePrintModal({ quote, open, onClose }) {
  if (!quote) return null;

  const { lines, breakdown, totals, totalTTC } = buildQuoteDocument(quote);
  const seller = quote.company ?? {};
  const party = quote.client ? { label: 'Client', ...quote.client } : null;

  const doc = (
    <FiscalDocument
      title="Devis"
      reference={quote.reference}
      date={quote.date}
      meta={[{ label: "Valable jusqu'au", value: quote.valid_until && formatDate(quote.valid_until) }]}
      seller={seller}
      party={party}
      lines={lines}
      tvaBreakdown={breakdown}
      totals={totals}
      amountInWords={amountToWords(totalTTC)}
      wordsLabel="Arrêté le présent devis à la somme de"
      notices={[
        ...(quote.is_suspended ? ['Offre établie en suspension de TVA (sous réserve de l’attestation)'] : []),
        'Ce devis ne constitue pas une facture.',
      ]}
      footnotes={[
        { label: 'Conditions', value: quote.payment_terms },
        { label: 'Observations', value: quote.notes },
      ]}
      signatures={['Cachet et signature du vendeur', 'Bon pour accord — cachet et signature du client']}
      watermark={quote.status === 'REJECTED' ? 'REFUSÉ' : quote.status === 'EXPIRED' ? 'EXPIRÉ' : undefined}
    />
  );

  return (
    <PrintPreviewModal
      open={open}
      onClose={onClose}
      title={`Aperçu — ${quote.reference}`}
      fileName={quote.reference}
      issues={missingMentions({ seller, party })}
      document={doc}
    />
  );
}
