import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal';
import { CreditNoteStatementDocument } from '@/components/print/CreditNoteStatementDocument';
import { getInvoicesInRange } from '@/services/invoiceService';
import { missingMentions } from '@/lib/fiscal';
import { loadInvoiceDocuments } from './load-invoice-documents';
import { buildCreditNoteStatement, downloadCreditNoteStatementCsv } from './credit-note-statement';
import { STATEMENT_PERIODS, isValidRange, periodRange, rangeLabel } from './invoice-period';

const FIELD_CLS =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 focus:outline-none';

/**
 * Relevé des avoirs d'un client sur une période : choix du client et de la
 * période, puis aperçu A4 imprimable (une ligne par article crédité) et export CSV.
 * @param {{ id: string, name: string }[]} clients
 */
export function CreditNoteStatementModal({ open, onClose, clients }) {
  const [clientId, setClientId] = useState('');
  const [period, setPeriod] = useState('all');
  const [customRange, setCustomRange] = useState(() => periodRange('year'));
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState(null);

  // Étape 2 : aperçu du relevé
  const [noteIds, setNoteIds] = useState(null);
  const [docs, setDocs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(null);

  const range = useMemo(() => periodRange(period, customRange), [period, customRange]);
  const periodText = isValidRange(range) ? rangeLabel(range) : '';
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [clients]
  );

  useEffect(() => {
    if (!noteIds) return;
    let cancelled = false;
    setDocs([]);
    setProgress(0);
    setLoadError(null);
    loadInvoiceDocuments(noteIds, (n) => !cancelled && setProgress(n))
      .then((data) => !cancelled && setDocs(data))
      .catch((err) => !cancelled && setLoadError(err.message || 'Impossible de charger les avoirs'));
    return () => {
      cancelled = true;
    };
  }, [noteIds]);

  const statement = useMemo(() => (docs.length ? buildCreditNoteStatement(docs) : null), [docs]);
  const clientName = clients.find((c) => c.id === clientId)?.name ?? '';
  const fileBase = `Relevé des avoirs ${clientName} ${periodText}`.replaceAll('/', '-');

  const closeAll = () => {
    setNoteIds(null);
    setDocs([]);
    setFormError(null);
    onClose();
  };

  const prepare = async (e) => {
    e.preventDefault();
    if (!clientId) return setFormError('Choisissez un client.');
    if (!isValidRange(range)) return setFormError('Choisissez une date de début antérieure à la date de fin.');
    setChecking(true);
    setFormError(null);
    try {
      const { invoices } = await getInvoicesInRange(range, { invoice_type: 'CREDIT_NOTE', clientId });
      if (invoices.length === 0) {
        setFormError(`Aucun avoir pour ${clientName} ${periodText}.`);
        return;
      }
      // Ordre chronologique : le relevé se lit du plus ancien au plus récent
      const ids = [...invoices].sort((a, b) => new Date(a.date) - new Date(b.date)).map((inv) => inv.id);
      setNoteIds(ids);
    } catch (err) {
      setFormError(err.message || 'Impossible de rechercher les avoirs');
    } finally {
      setChecking(false);
    }
  };

  if (noteIds) {
    const loading = !statement && !loadError;
    return (
      <PrintPreviewModal
        open={open}
        onClose={closeAll}
        title={`Relevé des avoirs, ${clientName}`}
        fileName={fileBase}
        loading={loading}
        loadingLabel={`Préparation des avoirs : ${progress} sur ${noteIds.length}…`}
        error={loadError}
        issues={docs[0] ? missingMentions({ seller: docs[0].company }) : []}
        actions={
          statement && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => downloadCreditNoteStatementCsv(statement, `${fileBase}.csv`)}
            >
              <FileSpreadsheet className="mr-2 size-4" /> Lignes (CSV)
            </Button>
          )
        }
        document={
          statement && (
            <CreditNoteStatementDocument
              seller={docs[0].company}
              client={docs[0].client}
              periodText={periodText}
              statement={statement}
            />
          )
        }
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={closeAll}
      title="Relevé des avoirs d'un client"
      size="md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={closeAll}>
            Annuler
          </Button>
          <Button type="submit" form="credit-statement-form" className="rounded-xl" disabled={checking}>
            <FileText className="mr-2 size-4" />
            {checking ? 'Recherche des avoirs…' : 'Préparer le relevé'}
          </Button>
        </div>
      }
    >
      <form id="credit-statement-form" onSubmit={prepare} className="space-y-4">
        <p className="text-sm text-slate-600">
          Le relevé liste chaque avoir du client avec ses articles, quantités et prix, puis les totaux
          HT, TVA et TTC en sa faveur.
        </p>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={FIELD_CLS}>
            <option value="">Choisir un client…</option>
            {sortedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Période
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={FIELD_CLS}>
            {STATEMENT_PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {period === 'custom' ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Du
              <input
                type="date"
                value={customRange.from}
                max={customRange.to || undefined}
                onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                className={FIELD_CLS}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Au
              <input
                type="date"
                value={customRange.to}
                min={customRange.from || undefined}
                onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                className={FIELD_CLS}
              />
            </label>
          </div>
        ) : (
          periodText && <p className="-mt-2 text-xs text-slate-500">Avoirs émis {periodText}</p>
        )}

        {formError && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
