import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Banknote, Landmark, CreditCard, FileSignature, ReceiptText, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { addInvoicePayment, deleteInvoicePayment, getInvoicePayments } from '@/services/invoiceService';
import { formatDate, formatTND, toISODate } from '@/lib/fiscal';
import { DURATION, EASE_OUT } from '@/lib/motion';

export const PAYMENT_METHODS = {
  CASH: { label: 'Espèces', Icon: Banknote },
  CHECK: { label: 'Chèque', Icon: ReceiptText, needsReference: 'N° du chèque' },
  TRANSFER: { label: 'Virement', Icon: Landmark, reference: 'Référence du virement' },
  BILL_OF_EXCHANGE: { label: 'Traite', Icon: FileSignature, needsReference: 'N° de la traite' },
  CARD: { label: 'Carte bancaire', Icon: CreditCard },
};

const today = () => toISODate();
const INPUT_CLS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700 aria-[invalid=true]:border-rose-400';

/**
 * Règlements d'une facture : reste à payer, historique, saisie d'un paiement
 * (total ou partiel). Le statut de la facture est mis à jour par le serveur.
 */
export function PaymentModal({ invoice, open, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ amount: '', method: 'CASH', date: today(), reference: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    let cancelled = false;
    setData(null);
    setErrors({});
    getInvoicePayments(invoice.id)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Pré-remplit avec le reste à payer : le cas le plus fréquent
        setForm({ amount: res.invoice.remaining.toFixed(3), method: 'CASH', date: today(), reference: '' });
      })
      .catch((err) => !cancelled && toast.error(err.message || 'Impossible de charger les règlements'));
    return () => {
      cancelled = true;
    };
  }, [open, invoice, toast]);

  const apply = (res, message) => {
    setData(res);
    setForm((f) => ({ ...f, amount: res.invoice.remaining.toFixed(3), reference: '' }));
    onChanged?.();
    toast.success(message, {
      description:
        res.invoice.remaining > 0
          ? `Reste à payer : ${formatTND(res.invoice.remaining)} TND`
          : `Facture ${res.invoice.reference} entièrement réglée`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = PAYMENT_METHODS[form.method];
    const next = {};
    if (!(Number(form.amount) > 0)) next.amount = 'Saisissez un montant';
    if (method.needsReference && !form.reference.trim()) next.reference = `${method.needsReference} est obligatoire`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const res = await addInvoicePayment(invoice.id, { ...form, amount: Number(form.amount) });
      apply(res, 'Règlement enregistré');
    } catch (err) {
      setErrors(err.payload?.errors ?? {});
      toast.error(err.message || "Impossible d'enregistrer le règlement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (payment) => {
    const ok = await confirm({
      title: 'Supprimer ce règlement',
      description: `Le règlement de ${formatTND(payment.amount)} TND du ${formatDate(payment.date)} sera supprimé et le reste à payer recalculé.`,
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    try {
      apply(await deleteInvoicePayment(payment.id), 'Règlement supprimé');
    } catch (err) {
      toast.error(err.message || 'Suppression impossible');
    }
  };

  const summary = data?.invoice;
  const paidPct = summary && summary.amount_due > 0 ? Math.min((summary.amount_paid / summary.amount_due) * 100, 100) : 0;
  const settled = summary && summary.remaining <= 0;
  const method = PAYMENT_METHODS[form.method];
  const referenceLabel = method.needsReference ?? method.reference;

  return (
    <Modal open={open} onClose={onClose} title={`Règlements — ${invoice?.reference ?? ''}`} size="lg">
      {!data ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Synthèse */}
          <section className="rounded-xl border bg-slate-50 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Reste à payer</p>
                <p className={`text-2xl font-bold tabular-nums ${settled ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {formatTND(summary.remaining)} <span className="text-sm font-normal text-slate-400">TND</span>
                </p>
              </div>
              <p className="text-right text-xs text-slate-500">
                Réglé {formatTND(summary.amount_paid)} / {formatTND(summary.amount_due)} TND
                <br />
                <span className="text-[11px]">Net à payer (retenue à la source déduite)</span>
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={Math.round(paidPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Part réglée"
            >
              <motion.div
                className={`h-full rounded-full ${settled ? 'bg-emerald-500' : 'bg-cyan-600'}`}
                initial={{ width: 0 }}
                animate={{ width: `${paidPct}%`, transition: { duration: DURATION.slow, ease: EASE_OUT } }}
              />
            </div>
          </section>

          {/* Historique */}
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Historique</h3>
            {data.payments.length === 0 ? (
              <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-slate-500">
                {summary.amount_paid > 0
                  ? 'Facture marquée payée avant le suivi des règlements (aucun détail).'
                  : 'Aucun règlement enregistré.'}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {data.payments.map((p) => {
                  const meta = PAYMENT_METHODS[p.method] ?? PAYMENT_METHODS.CASH;
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <meta.Icon className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="w-24 shrink-0 text-slate-500">{formatDate(p.date)}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-700">
                        {meta.label}
                        {p.reference && <span className="ml-1.5 font-mono text-xs text-slate-500">n° {p.reference}</span>}
                      </span>
                      <span className="font-semibold tabular-nums">{formatTND(p.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        aria-label={`Supprimer le règlement du ${formatDate(p.date)}`}
                        className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Nouveau règlement */}
          {!settled && summary.status !== 'CANCELLED' && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold text-slate-900">Enregistrer un règlement</h3>

              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-slate-700">Mode de règlement</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PAYMENT_METHODS).map(([key, m]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan-600 ${
                        form.method === key ? 'border-cyan-700 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={key}
                        checked={form.method === key}
                        onChange={() => setForm((f) => ({ ...f, method: key }))}
                        className="sr-only"
                      />
                      <m.Icon className="size-3.5" aria-hidden="true" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                  Montant (TND)
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={summary.remaining}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    aria-invalid={errors.amount ? 'true' : 'false'}
                    className={`${INPUT_CLS} tabular-nums`}
                  />
                  {errors.amount && <span className="font-normal text-rose-600">{errors.amount}</span>}
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                  Date du règlement
                  <input
                    type="date"
                    max={today()}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    aria-invalid={errors.date ? 'true' : 'false'}
                    className={INPUT_CLS}
                  />
                  {errors.date && <span className="font-normal text-rose-600">{errors.date}</span>}
                </label>
                {referenceLabel && (
                  <label className="grid gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
                    {referenceLabel}
                    {method.needsReference ? ' *' : ''}
                    <input
                      value={form.reference}
                      onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                      aria-invalid={errors.reference ? 'true' : 'false'}
                      className={`${INPUT_CLS} font-mono`}
                    />
                    {errors.reference && <span className="font-normal text-rose-600">{errors.reference}</span>}
                  </label>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="rounded-xl">
                  {saving ? 'Enregistrement…' : 'Enregistrer le règlement'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
