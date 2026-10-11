import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Plus, Eye, CheckCircle2, XCircle, RotateCcw, Search, ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InvoicePdfModal } from './InvoicePdfModal';
import { GenerateInvoiceModal } from './GenerateInvoiceModal';
import { InvoicingStats, SalesPipelineStats } from './InvoiceStats';
import {
  CompanyInfoAlert,
  InvoiceableMovementsTable,
} from './InvoiceableMovements';
import { useInvoiceableMovements } from './use-invoiceable-movements';
import {
  getAllInvoices, updateInvoiceStatus, createCreditNote,
} from '@/services/invoiceService';
import { getClients } from '@/services/clientService';

const STATUS_CONFIG = {
  PENDING:  { label: 'En attente', variant: 'alert' },
  PAID:     { label: 'Payée',      variant: 'active' },
  CANCELLED:{ label: 'Annulée',    variant: 'inactive' },
};

const TYPE_CONFIG = {
  SALE:        { label: 'Facture Vente', badgeClass: 'bg-cyan-100 text-cyan-800' },
  CREDIT_NOTE: { label: 'Avoir',         badgeClass: 'bg-amber-100 text-amber-800' },
  PROFORMA:    { label: 'Pro Forma',     badgeClass: 'bg-indigo-100 text-indigo-800' },
};

const LIMIT_PER_PAGE = 10;

export function InvoicesPage({ initialType = 'ALL' }) {
  const [invoices, setInvoices]       = useState([]);
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filterType, setFilterType]   = useState(initialType);
  const [filterStatus, setFilterStatus] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState('');
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Ventes (mouvements OUT) disponibles pour la facturation ──
  const [showSales, setShowSales]               = useState(true);
  const [salesSearchInput, setSalesSearchInput] = useState('');
  const [salesSearch, setSalesSearch]           = useState('');
  const [salesPage, setSalesPage]               = useState(1);

  const salesFilters = useMemo(
    () => ({ page: salesPage, search: salesSearch }),
    [salesPage, salesSearch]
  );
  const sales = useInvoiceableMovements(salesFilters);
  const salesPages = Math.max(1, Math.ceil(sales.count / LIMIT_PER_PAGE));

  useEffect(() => {
    const timer = setTimeout(() => {
      setSalesSearch(salesSearchInput);
      setSalesPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [salesSearchInput]);

  const openGenerate = (movement = null) => {
    setSelectedMovementId(movement?.id ?? '');
    setGenerateOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterType !== 'ALL') filters.invoice_type = filterType;
      if (filterStatus) filters.status = filterStatus;

      const [invRes, clientsRes] = await Promise.allSettled([
        getAllInvoices(filters),
        getClients(),
      ]);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value?.invoices ?? []);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value?.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setFilterType(initialType); }, [initialType]);

  const handleStatusUpdate = async (inv, status) => {
    if (!window.confirm(`Changer le statut de la facture ${inv.reference} en "${status}" ?`)) return;
    setActionLoading(inv.id);
    try {
      await updateInvoiceStatus(inv.id, status);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreditNote = async (inv) => {
    const reason = window.prompt(`Motif de l'avoir sur la facture ${inv.reference} :`);
    if (reason === null) return;
    setActionLoading(inv.id);
    try {
      await createCreditNote(inv.id, reason);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // KPIs
  const totalTTC = invoices
    .filter(i => i.status !== 'CANCELLED' && i.invoice_type !== 'CREDIT_NOTE')
    .reduce((s, i) => s + (i.total_ttc || 0), 0);
  const totalPaid = invoices
    .filter(i => i.status === 'PAID')
    .reduce((s, i) => s + (i.total_ttc || 0), 0);
  const totalPending = invoices
    .filter(i => i.status === 'PENDING' && i.invoice_type === 'SALE')
    .reduce((s, i) => s + (i.total_ttc || 0), 0);
  const creditNoteCount = invoices.filter(i => i.invoice_type === 'CREDIT_NOTE').length;

  const tabs = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'SALE', label: 'Ventes' },
    { key: 'CREDIT_NOTE', label: 'Avoirs' },
  ];

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Facturation</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Gestion des factures de vente selon la réglementation fiscale tunisienne.
          </p>
        </div>
        <Button
          onClick={() => openGenerate()}
          className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white"
        >
          <Plus className="mr-2 size-4" /> Générer une facture
        </Button>
      </div>

      {/* ── Indicateurs (en haut) ── */}
      <InvoicingStats
        totalTTC={totalTTC}
        totalPaid={totalPaid}
        totalPending={totalPending}
        creditNoteCount={creditNoteCount}
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks className="size-4 text-rose-600" aria-hidden="true" />
          Pipeline de facturation — ventes (SORTIE / OUT)
        </h2>
        <SalesPipelineStats summary={sales.summary} />
      </section>

      {/* ── Alertes ── */}
      <CompanyInfoAlert fields={sales.company_missing_fields} />
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Lignes : ventes à facturer ── */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Ventes à facturer</h2>
            <p className="text-xs text-slate-500">
              {sales.count} mouvement(s) de type SORTIE (OUT) — sélectionnez une vente pour éditer sa facture.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="sales-search" className="sr-only">
                Rechercher une vente
              </label>
              <input
                id="sales-search"
                value={salesSearchInput}
                onChange={(e) => setSalesSearchInput(e.target.value)}
                placeholder="Rechercher une vente…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:w-64"
              />
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowSales((v) => !v)}>
              {showSales ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </div>

        {showSales && (
          <>
            {sales.error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {sales.error}
              </p>
            )}
            <InvoiceableMovementsTable
              movements={sales.movements}
              loading={sales.loading}
              count={sales.count}
              page={salesPage}
              totalPages={salesPages}
              onPageChange={setSalesPage}
              onGenerate={openGenerate}
            />
          </>
        )}
      </section>

      {/* ── Lignes : factures émises ── */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Factures émises</h2>
            <p className="text-xs text-slate-500">
              {invoices.length} facture(s) affichée(s) sur la page courante.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border bg-slate-50 p-0.5 text-sm font-medium">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  className={`rounded-lg px-4 py-1.5 transition ${
                    filterType === tab.key
                      ? 'bg-white font-semibold text-cyan-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              aria-label="Filtrer les factures par statut"
              className="rounded-lg border bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            Icon={FileText}
            title="Aucune facture"
            description="Générez votre première facture depuis un mouvement de vente (Sortie)."
            actionLabel="Générer une facture"
            onAction={() => openGenerate()}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left">Référence</th>
                  <th scope="col" className="px-5 py-3 text-left">Date</th>
                  <th scope="col" className="px-5 py-3 text-left">Client</th>
                  <th scope="col" className="px-5 py-3 text-center">Type</th>
                  <th scope="col" className="px-5 py-3 text-center">Statut</th>
                  <th scope="col" className="px-5 py-3 text-right">Total TTC</th>
                  <th scope="col" className="px-5 py-3 text-right">Net à payer</th>
                  <th scope="col" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map(inv => {
                  const typeMeta = TYPE_CONFIG[inv.invoice_type] || TYPE_CONFIG.SALE;
                  const statusMeta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
                  const isLoading = actionLoading === inv.id;
                  return (
                    <tr key={inv.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">{inv.reference}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(inv.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {inv.client?.name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeMeta.badgeClass}`}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                        {Number(inv.total_ttc || 0).toFixed(3)}{' '}
                        <span className="text-xs font-normal text-slate-400">TND</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-cyan-700">
                        {Number(inv.net_payable ?? inv.total_ttc ?? 0).toFixed(3)}{' '}
                        <span className="text-xs font-normal text-slate-400">TND</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Voir PDF */}
                          <button
                            type="button"
                            title="Aperçu PDF"
                            aria-label={`Aperçu PDF de la facture ${inv.reference}`}
                            onClick={() => setPdfInvoiceId(inv.id)}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          {/* Marquer payée */}
                          {inv.status === 'PENDING' && inv.invoice_type !== 'CREDIT_NOTE' && (
                            <button
                              type="button"
                              title="Marquer comme payée"
                              aria-label={`Marquer la facture ${inv.reference} comme payée`}
                              onClick={() => handleStatusUpdate(inv, 'PAID')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                            >
                              <CheckCircle2 className="size-3.5" />
                            </button>
                          )}
                          {/* Émettre un avoir */}
                          {inv.status !== 'CANCELLED' && inv.invoice_type === 'SALE' && (
                            <button
                              type="button"
                              title="Émettre un avoir"
                              aria-label={`Émettre un avoir sur la facture ${inv.reference}`}
                              onClick={() => handleCreditNote(inv)}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          )}
                          {/* Annuler */}
                          {inv.status === 'PENDING' && (
                            <button
                              type="button"
                              title="Annuler la facture"
                              aria-label={`Annuler la facture ${inv.reference}`}
                              onClick={() => handleStatusUpdate(inv, 'CANCELLED')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <XCircle className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <GenerateInvoiceModal
        open={generateOpen}
        clients={clients}
        initialMovementId={selectedMovementId}
        onClose={() => { setGenerateOpen(false); setSelectedMovementId(''); }}
        onSuccess={(invoice) => {
          setGenerateOpen(false);
          setSelectedMovementId('');
          load();
          sales.reload();
          if (invoice?.id) setPdfInvoiceId(invoice.id);
        }}
      />

      <InvoicePdfModal
        invoiceId={pdfInvoiceId}
        open={Boolean(pdfInvoiceId)}
        onClose={() => setPdfInvoiceId(null)}
      />
    </div>
  );
}