/** Liste de factures → fichier CSV pour Excel (séparateur « ; », virgule décimale, BOM UTF-8) */

const TYPE_LABELS = { SALE: 'Facture', CREDIT_NOTE: 'Avoir', PROFORMA: 'Pro forma' };
const STATUS_LABELS = {
  PENDING: 'En attente',
  PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

const money = (v) => (Number(v) || 0).toFixed(3).replace('.', ',');
const cell = (v) => {
  let s = String(v ?? '');
  // Neutralise les formules Excel (=, +, -, @…) injectées via un nom de client
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export function downloadInvoicesCsv(invoices, fileName) {
  const header = [
    'Référence', 'Type', 'Date', 'Client', 'Statut',
    'Total HT', 'TVA', 'Timbre', 'Total TTC', 'Retenue à la source', 'Net à payer', 'Réglé',
  ];
  const rows = invoices.map((inv) => [
    inv.reference,
    TYPE_LABELS[inv.invoice_type] ?? inv.invoice_type,
    new Date(inv.date).toLocaleDateString('fr-FR'),
    inv.client?.name ?? '',
    STATUS_LABELS[inv.status] ?? inv.status,
    money(inv.total_ht),
    money(inv.tva_amount),
    money(inv.timbre_fiscal),
    money(inv.total_ttc),
    money(inv.rs_amount),
    money(inv.net_payable ?? inv.total_ttc),
    money(inv.amount_paid),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');

  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
