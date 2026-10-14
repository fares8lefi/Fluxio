import { useState } from 'react';
import { BookOpenText, Download, Percent, ArrowLeftRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';
import { exportMovements, exportSalesJournal, exportVatSummary } from '@/services/exportService';
import { toISODate as iso } from '@/lib/fiscal';

const now = new Date();
const firstOfMonth = iso(new Date(now.getFullYear(), now.getMonth(), 1));
// Le récapitulatif de TVA se prépare en général pour le mois écoulé
const previousMonth = (() => {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
})();

const INPUT_CLS =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700';

function ExportRow({ icon: Icon, title, description, children, onExport, busy }) {
  return (
    <section className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {children}
        <Button type="button" variant="outline" className="ml-auto rounded-xl" onClick={onExport} disabled={busy}>
          <Download className="mr-2 size-4" />
          {busy ? 'Préparation…' : 'Télécharger (CSV)'}
        </Button>
      </div>
    </section>
  );
}

/**
 * Exports pour le comptable : journal des ventes, récapitulatif de TVA
 * (déclaration mensuelle) et mouvements de stock. Fichiers CSV prêts pour Excel.
 */
export function AccountantExportModal({ open, onClose }) {
  const toast = useToast();
  const [range, setRange] = useState({ from: firstOfMonth, to: iso(now) });
  const [month, setMonth] = useState(previousMonth);
  const [busy, setBusy] = useState(null);

  const run = (key, fn) => async () => {
    setBusy(key);
    try {
      const name = await fn();
      toast.success('Export téléchargé', { description: name });
    } catch (err) {
      toast.error(err.message || "L'export a échoué");
    } finally {
      setBusy(null);
    }
  };

  const rangeFields = (
    <>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Du
        <input type="date" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className={INPUT_CLS} />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">
        Au
        <input type="date" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className={INPUT_CLS} />
      </label>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Exporter pour le comptable" size="lg">
      <div className="space-y-4">
        <ExportRow
          icon={BookOpenText}
          title="Journal des ventes"
          description="Factures et avoirs de la période : base HT et TVA par taux, timbre, retenue à la source, statut de règlement."
          onExport={run('journal', () => exportSalesJournal(range.from, range.to))}
          busy={busy === 'journal'}
        >
          {rangeFields}
        </ExportRow>

        <ExportRow
          icon={Percent}
          title="Récapitulatif de TVA"
          description="TVA collectée par taux (factures − avoirs) et droit de timbre, pour la déclaration mensuelle."
          onExport={run('tva', () => exportVatSummary(month))}
          busy={busy === 'tva'}
        >
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Mois
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={INPUT_CLS} />
          </label>
        </ExportRow>

        <ExportRow
          icon={ArrowLeftRight}
          title="Mouvements de stock"
          description="Entrées, sorties et retours de la période, une ligne par article (traçabilité)."
          onExport={run('mvt', () => exportMovements(range.from, range.to))}
          busy={busy === 'mvt'}
        >
          <p className="text-xs text-slate-500">
            Période : la même que le journal des ventes.
          </p>
        </ExportRow>
      </div>
    </Modal>
  );
}
