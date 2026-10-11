import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { getInvoicePdfData } from '@/services/invoiceService';

const TVA_RATE_LABELS = { 0: 'Exonéré', 7: 'Taux 7%', 13: 'Taux 13%', 19: 'Taux standard 19%' };

function InvoiceDocument({ data }) {
  const { company, client, invoiceDetails, fiscalSummary, items } = data;
  const isAvoir = invoiceDetails.invoice_type === 'CREDIT_NOTE';
  const isProforma = invoiceDetails.invoice_type === 'PROFORMA';

  const titleLabel = isAvoir ? 'FACTURE D\'AVOIR' : isProforma ? 'DEVIS / PRO FORMA' : 'FACTURE DE VENTE';

  return (
    <div className="bg-white font-sans text-slate-900 text-sm p-8 max-w-3xl mx-auto" id="invoice-print-area">
      {/* Bande top colorée */}
      <div className={`h-1.5 w-full rounded mb-6 ${isAvoir ? 'bg-amber-500' : isProforma ? 'bg-indigo-500' : 'bg-cyan-700'}`} />

      {/* En-tête */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{company.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            MF : <strong className="font-mono">{company.matriculeFiscale}</strong>
          </p>
          <p className="text-xs text-slate-500">{company.address}</p>
          <p className="text-xs text-slate-500">Tél. : {company.phone}</p>
        </div>
        <div className="text-right">
          <div className={`inline-block rounded-xl px-4 py-2 text-white text-center ${
            isAvoir ? 'bg-amber-500' : isProforma ? 'bg-indigo-500' : 'bg-cyan-700'
          }`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{titleLabel}</div>
            <div className="text-xl font-bold mt-0.5 font-mono">{invoiceDetails.reference}</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Date : <strong>{new Date(invoiceDetails.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
          </p>
          {invoiceDetails.purchase_order_ref && (
            <p className="text-xs text-slate-500">Réf. BC : {invoiceDetails.purchase_order_ref}</p>
          )}
        </div>
      </div>

      {/* Bloc Client */}
      {client ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Facturé à</p>
          <p className="font-bold text-slate-900">{client.name}</p>
          <p className="text-xs text-slate-600">
            MF : <span className="font-mono font-semibold">{client.matriculeFiscale}</span>
          </p>
          {client.address && <p className="text-xs text-slate-500">{client.address}</p>}
          {client.phone && <p className="text-xs text-slate-500">Tél. : {client.phone}</p>}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
          Client non renseigné
        </div>
      )}

      {/* Régime suspensif */}
      {invoiceDetails.is_suspended && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚡ <strong>Vente en Suspension de TVA</strong> — Attestation N° : {invoiceDetails.attestation_ref || 'N/A'}
        </div>
      )}

      {/* Table Articles */}
      <table className="w-full text-xs border-collapse mb-6">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-200 px-3 py-2 text-left font-semibold uppercase text-slate-600">Désignation</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-semibold uppercase text-slate-600 w-16">Qté</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-semibold uppercase text-slate-600 w-24">P.U HT (TND)</th>
            <th className="border border-slate-200 px-3 py-2 text-center font-semibold uppercase text-slate-600 w-16">TVA</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-semibold uppercase text-slate-600 w-24">Total HT (TND)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="border border-slate-200 px-3 py-2 font-medium">{item.productName}</td>
              <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="border border-slate-200 px-3 py-2 text-right tabular-nums">{Number(item.unitPriceHT).toFixed(3)}</td>
              <td className="border border-slate-200 px-3 py-2 text-center">
                {invoiceDetails.is_suspended ? <span className="text-amber-700 font-semibold">Susp.</span> : `${item.tvaRate}%`}
              </td>
              <td className="border border-slate-200 px-3 py-2 text-right tabular-nums font-semibold">{Number(item.totalLineHT).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Récapitulatif Fiscal Tunisien */}
      <div className="flex justify-end mb-6">
        <div className="min-w-[320px] rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2 text-slate-600">Total HT</td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{Number(fiscalSummary.total_ht).toFixed(3)} TND</td>
              </tr>

              {/* Ventilation TVA par taux */}
              {fiscalSummary.tva_breakdown && fiscalSummary.tva_breakdown.map((t, i) => (
                <tr key={i} className="border-b bg-slate-50/50">
                  <td className="px-4 py-1.5 text-slate-500 pl-6">
                    TVA {t.rate}% (Base : {Number(t.base_ht).toFixed(3)} TND)
                  </td>
                  <td className="px-4 py-1.5 text-right tabular-nums text-slate-600">
                    {Number(t.tva_amount).toFixed(3)} TND
                  </td>
                </tr>
              ))}

              <tr className="border-b">
                <td className="px-4 py-2 text-slate-600">Total TVA</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">{Number(fiscalSummary.tva_amount).toFixed(3)} TND</td>
              </tr>

              {fiscalSummary.timbre_fiscal > 0 && (
                <tr className="border-b">
                  <td className="px-4 py-2 text-slate-600">Timbre Fiscal</td>
                  <td className="px-4 py-2 text-right tabular-nums">{Number(fiscalSummary.timbre_fiscal).toFixed(3)} TND</td>
                </tr>
              )}

              <tr className="border-b bg-cyan-50">
                <td className="px-4 py-2.5 font-bold text-cyan-900">Total TTC</td>
                <td className="px-4 py-2.5 text-right font-bold tabular-nums text-cyan-900">{Number(fiscalSummary.total_ttc).toFixed(3)} TND</td>
              </tr>

              {fiscalSummary.apply_rs && (
                <tr className="border-b">
                  <td className="px-4 py-2 text-indigo-700">
                    Retenue à la Source ({fiscalSummary.rs_rate}%)
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-indigo-700">- {Number(fiscalSummary.rs_amount).toFixed(3)} TND</td>
                </tr>
              )}

              <tr className="bg-slate-900">
                <td className="px-4 py-3 font-bold text-white">Net à Payer</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-white text-base">
                  {Number(fiscalSummary.net_payable).toFixed(3)} TND
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Montant en toutes lettres */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Arrêtée la présente facture à la somme de :</p>
        <p className="text-sm font-semibold text-slate-900 italic">
          {fiscalSummary.amountInWords}
        </p>
      </div>

      {/* Conditions de paiement */}
      {invoiceDetails.payment_terms && (
        <p className="text-xs text-slate-500 mb-2">
          <strong>Conditions de paiement :</strong> {invoiceDetails.payment_terms}
        </p>
      )}
      {invoiceDetails.notes && (
        <p className="text-xs text-slate-500 mb-4">
          <strong>Notes :</strong> {invoiceDetails.notes}
        </p>
      )}

      {/* Zone Signature */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="border-t border-slate-300 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cachet & Signature Vendeur</p>
          <div className="mt-6 h-16" />
        </div>
        <div className="border-t border-slate-300 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Signature Client</p>
          <div className="mt-6 h-16" />
        </div>
      </div>

      {/* Pied de page légal */}
      <div className="mt-8 border-t pt-3 text-[10px] text-slate-400 text-center">
        Document généré selon les normes fiscales tunisiennes — La facture électronique est en cours de déploiement conformément à la réglementation 2026.
      </div>
    </div>
  );
}

export function InvoicePdfModal({ invoiceId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !invoiceId) { setData(null); return; }
    setLoading(true);
    setError(null);
    getInvoicePdfData(invoiceId)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, invoiceId]);

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-area');
    if (!printContent) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Facture</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
            th { background: #f8fafc; font-weight: 700; text-transform: uppercase; }
            .text-right { text-align: right; }
            .bg-dark { background: #0f172a; color: white; font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Modal
      open={open}
      title={data ? `Aperçu — ${data.invoiceDetails?.reference}` : 'Aperçu de la Facture'}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={onClose}><X className="mr-1 size-4" /> Fermer</Button>
          {data && (
            <Button onClick={handlePrint} className="bg-cyan-700 hover:bg-cyan-800 text-white">
              <Printer className="mr-2 size-4" /> Imprimer / PDF
            </Button>
          )}
        </div>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="size-7 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}
        {data && <InvoiceDocument data={data} />}
      </div>
    </Modal>
  );
}
