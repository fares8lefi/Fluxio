import { round3 } from '@/lib/fiscal';

/*
 * Relevé des avoirs d'un client. Les avoirs sont enregistrés en négatif ; sur le
 * relevé, tout est exprimé en montants positifs, en faveur du client.
 */

const abs = (v) => Math.abs(Number(v) || 0);

/**
 * @param {object[]} docs — données PDF des avoirs (getInvoicePdfData), triées par date
 */
export function buildCreditNoteStatement(docs) {
  const notes = docs.map((doc) => {
    const d = doc.invoiceDetails;
    const f = doc.fiscalSummary;
    return {
      reference: d.reference,
      date: d.date,
      original: d.original_invoice,
      reason: d.notes,
      isSuspended: d.is_suspended,
      lines: (doc.items ?? []).map((it) => ({
        code: it.productCode,
        name: it.productName,
        unit: it.unitOfMeasure,
        quantity: abs(it.quantity),
        unitPriceHT: abs(it.unitPriceHT),
        tvaRate: d.is_suspended ? null : it.tvaRate,
        totalHT: abs(it.totalLineHT),
      })),
      tvaBreakdown: (f.tva_breakdown ?? []).map((t) => ({
        rate: Number(t.rate),
        base_ht: abs(t.base_ht),
        tva_amount: abs(t.tva_amount),
      })),
      ht: abs(f.total_ht),
      tva: abs(f.tva_amount),
      ttc: abs(f.total_ttc),
      rs: f.apply_rs ? abs(f.rs_amount) : 0,
      net: abs(f.net_payable),
    };
  });

  // Récapitulatif TVA : les avoirs en suspension forment une ligne à part
  const byRate = new Map();
  let suspendedBase = 0;
  notes.forEach((note) => {
    if (note.isSuspended) {
      suspendedBase += note.ht;
      return;
    }
    note.tvaBreakdown.forEach((t) => {
      const row = byRate.get(t.rate) ?? { rate: t.rate, base_ht: 0, tva_amount: 0 };
      row.base_ht += t.base_ht;
      row.tva_amount += t.tva_amount;
      byRate.set(t.rate, row);
    });
  });
  const tvaByRate = [...byRate.values()]
    .sort((a, b) => a.rate - b.rate)
    .map((r) => ({ ...r, base_ht: round3(r.base_ht), tva_amount: round3(r.tva_amount) }));
  if (suspendedBase > 0) tvaByRate.push({ rate: null, base_ht: round3(suspendedBase), tva_amount: 0 });

  const total = (key) => round3(notes.reduce((acc, n) => acc + n[key], 0));
  return {
    notes,
    tvaByRate,
    totals: {
      count: notes.length,
      quantity: notes.reduce((acc, n) => acc + n.lines.reduce((s, l) => s + l.quantity, 0), 0),
      ht: total('ht'),
      tva: total('tva'),
      ttc: total('ttc'),
      rs: total('rs'),
      net: total('net'),
    },
  };
}

const num = (v) => (Number(v) || 0).toFixed(3).replace('.', ',');
const cell = (v) => {
  const s = String(v ?? '');
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** Une ligne par article crédité, pour Excel (séparateur « ; », BOM UTF-8) */
export function downloadCreditNoteStatementCsv(statement, fileName) {
  const header = [
    'Avoir', 'Date', 'Facture d\'origine', 'Motif', 'Code', 'Désignation', 'Unité',
    'Quantité', 'P.U. HT', 'TVA %', 'Total HT',
  ];
  const rows = statement.notes.flatMap((note) =>
    note.lines.map((l) => [
      note.reference,
      new Date(note.date).toLocaleDateString('fr-FR'),
      note.original?.reference ?? '',
      note.reason ?? '',
      l.code ?? '',
      l.name,
      l.unit ?? '',
      String(l.quantity).replace('.', ','),
      num(l.unitPriceHT),
      l.tvaRate === null ? 'Suspension' : l.tvaRate,
      num(l.totalHT),
    ])
  );
  const csv = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');

  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
