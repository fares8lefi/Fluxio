import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Plus, Eye, Wallet, XCircle, RotateCcw, Search, Download, ChevronDown, Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { InvoicePdfModal } from './InvoicePdfModal';
import { GenerateInvoiceModal } from './GenerateInvoiceModal';
import { PaymentModal } from './PaymentModal';
import { AccountantExportModal } from './AccountantExportModal';
import { InvoiceBatchPrintModal } from './InvoiceBatchPrintModal';
import { CreditNoteStatementModal } from './CreditNoteStatementModal';
import { downloadInvoicesCsv } from './invoice-csv';
import { INVOICE_PERIODS, isValidRange, periodRange, rangeLabel } from './invoice-period';
import { BillingSummary, Money, SalesPipelineSummary } from './InvoiceStats';
import {
  CompanyInfoAlert,
  InvoiceableMovementsTable,
} from './InvoiceableMovements';
import { useInvoiceableMovements } from './use-invoiceable-movements';
import {
  getInvoicesInRange, updateInvoiceStatus, createCreditNote,
} from '@/services/invoiceService';
import { getClients } from '@/services/clientService';

const STATUS_CONFIG = {
  PENDING:  { label: 'En attente', variant: 'alert' },
  PARTIALLY_PAID: { label: 'Partiellement payée', variant: 'info' },
  PAID:     { label: 'Payée',      variant: 'active' },
  CANCELLED:{ label: 'Annulée',    variant: 'inactive' },
};

const TYPE_CONFIG = {
  SALE:        { label: 'Facture de vente' },
  CREDIT_NOTE: { label: 'Avoir' },
  PROFORMA:    { label: 'Pro forma' },
};

/** Reste à payer d'une facture (net à payer moins les règlements reçus) */
const remainingOf = (inv) =>
  Math.max((inv.net_payable ?? inv.total_ttc ?? 0) - (inv.amount_paid || 0), 0);

/** Statut + avancement du règlement : une barre fine pour les paiements partiels */
function PaymentState({ invoice, statusMeta }) {
  // Compensée par un avoir : plus rien n'est dû, quel que soit le statut de règlement
  if (invoice.credit_note_reference) {
    return (
      <div>
        <Badge variant="inactive">Avoir émis</Badge>
        <p className="mt-1 text-xs text-slate-500">{invoice.credit_note_reference}</p>
      </div>
    );
  }
  if (invoice.status !== 'PARTIALLY_PAID') {
    return <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>;
  }
  const total = invoice.net_payable ?? invoice.total_ttc ?? 0;
  const paid = Math.min(100, total > 0 ? ((invoice.amount_paid || 0) / total) * 100 : 0);
  return (
    <div className="w-40">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-amber-100" aria-hidden="true">
        <span className="bg-emerald-600" style={{ width: `${paid}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Reste <Money value={remainingOf(invoice)} className="font-medium text-slate-900" />
      </p>
    </div>
  );
}

/** Action secondaire de ligne : icône seule, nom accessible + infobulle */
function IconAction({ label, onClick, disabled, danger = false, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none disabled:opacity-40 ${
        danger ? 'hover:text-rose-600' : 'hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

const LIMIT_PER_PAGE = 10;

export function InvoicesPage({ initialType = 'ALL' }) {
  const { can } = useAuth();
  const canWriteBilling = can('billing.write');
  const [invoices, setInvoices]       = useState([]);
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filterType, setFilterType]   = useState(initialType);
  const [filterStatus, setFilterStatus] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState('');
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);

  // ── Période des factures émises ──
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState(() => periodRange('month'));
  const range = useMemo(() => periodRange(period, customRange), [period, customRange]);
  const rangeValid = isValidRange(range);
  const periodText = rangeValid ? rangeLabel(range) : '';
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
    if (!rangeValid) {
      setInvoices([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterType !== 'ALL') filters.invoice_type = filterType;
      if (filterStatus) filters.status = filterStatus;

      const [invRes, clientsRes] = await Promise.allSettled([
        getInvoicesInRange(range, filters),
        getClients(),
      ]);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value?.invoices ?? []);
      else setError(invRes.reason?.message || 'Impossible de charger les factures');
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value?.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, range, rangeValid]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setFilterType(initialType); }, [initialType]);

  const toast   = useToast();
  const confirm = useConfirm();

  const handleStatusUpdate = async (inv, status) => {
    const ok = await confirm({
      title: status === 'CANCELLED' ? 'Annuler la facture' : 'Changer le statut',
      description:
        status === 'CANCELLED'
          ? `La facture ${inv.reference} sera annulée. Elle restera visible dans la liste, barrée.`
          : `La facture ${inv.reference} passera au statut « ${STATUS_CONFIG[status]?.label ?? status} ».`,
      confirmLabel: status === 'CANCELLED' ? 'Annuler la facture' : undefined,
      destructive: status === 'CANCELLED',
    });
    if (!ok) return;
    setActionLoading(inv.id);
    try {
      await updateInvoiceStatus(inv.id, status);
      toast.success(`Facture ${inv.reference} mise à jour`);
      load();
    } catch (e) {
      toast.error(e.message || 'Impossible de modifier le statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreditNote = async (inv) => {
    const reason = await confirm({
      title: 'Émettre un avoir',
      description: `Un avoir sera créé sur la facture ${inv.reference}.`,
      confirmLabel: "Créer l'avoir",
      input: { label: "Motif de l'avoir", placeholder: 'Ex. : retour de marchandise, erreur de prix…' },
    });
    if (reason === null) return;
    setActionLoading(inv.id);
    try {
      await createCreditNote(inv.id, reason);
      toast.success(`Avoir créé sur la facture ${inv.reference}`);
      load();
    } catch (e) {
      toast.error(e.message || "Impossible de créer l'avoir");
    } finally {
      setActionLoading(null);
    }
  };

  // Indicateurs
  const totalTTC = invoices
    .filter(i => i.status !== 'CANCELLED' && i.invoice_type !== 'CREDIT_NOTE')
    .reduce((s, i) => s + (i.total_ttc || 0), 0);
  // Encaissé = règlements reçus ; reste = reste à payer des factures ouvertes
  const totalPaid = invoices
    .filter(i => i.invoice_type === 'SALE' && i.status !== 'CANCELLED')
    .reduce((s, i) => s + (i.amount_paid || 0), 0);
  // Une facture compensée par un avoir n'est plus due
  const openInvoices = invoices.filter(
    i =>
      (i.status === 'PENDING' || i.status === 'PARTIALLY_PAID') &&
      i.invoice_type === 'SALE' &&
      !i.credit_note_reference
  );
  const totalPending = openInvoices.reduce((s, i) => s + remainingOf(i), 0);
  const creditNoteCount = invoices.filter(i => i.invoice_type === 'CREDIT_NOTE').length;

  const tabs = [
    { key: 'ALL', label: 'Toutes' },
    { key: 'SALE', label: 'Ventes' },
    { key: 'CREDIT_NOTE', label: 'Avoirs' },
  ];

  return (
    <div className="space-y-10">
      {/* ── En-tête ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {initialType === 'CREDIT_NOTE' ? 'Avoirs' : 'Factures'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Factures de vente et avoirs, avec les mentions fiscales tunisiennes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setStatementOpen(true)}>
            <RotateCcw className="size-4" /> Relevé des avoirs
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="size-4" /> Exporter pour le comptable
          </Button>
          <Button onClick={() => openGenerate()} hidden={!canWriteBilling}>
            <Plus className="size-4" /> Nouvelle facture
          </Button>
        </div>
      </div>

      <BillingSummary
        loading={loading}
        totalTTC={totalTTC}
        totalPaid={totalPaid}
        totalPending={totalPending}
        openCount={openInvoices.length}
        creditNoteCount={creditNoteCount}
      />

      {/* ── Alertes ── */}
      <CompanyInfoAlert fields={sales.company_missing_fields} />
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* ── Ventes à facturer ── */}
      <section aria-labelledby="sales-title" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5">
            <h2 id="sales-title" className="text-lg font-semibold text-slate-900">
              Ventes à facturer
            </h2>
            <SalesPipelineSummary summary={sales.summary} />
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
                placeholder="Client ou référence…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pr-3 pl-9 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none sm:w-64"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowSales((v) => !v)}
              aria-expanded={showSales}
              className="text-slate-600"
            >
              {showSales ? 'Replier' : 'Déplier'}
              <ChevronDown className={`size-4 transition-transform ${showSales ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {showSales && (
          <>
            {sales.error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
              canGenerate={canWriteBilling}
            />
          </>
        )}
      </section>

      {/* ── Factures émises ── */}
      <section aria-labelledby="issued-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="issued-title" className="text-lg font-semibold text-slate-900">
            Factures émises
            <span className="figure ml-2 text-base font-normal text-slate-400">{invoices.length}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Type de document" className="flex rounded-lg bg-slate-100 p-0.5 text-sm">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={filterType === tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`rounded-md px-3.5 py-1.5 font-medium transition ${
                    filterType === tab.key
                      ? 'bg-white text-slate-900 shadow-sm'
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
              className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PARTIALLY_PAID">Partiellement payées</option>
              <option value="PAID">Payées</option>
              <option value="CANCELLED">Annulées</option>
            </select>
          </div>
        </div>

        {/* ── Période : toutes les factures de la plage, sans pagination ── */}
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Période
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                {INVOICE_PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>
            {period === 'custom' ? (
              <>
                <label className="grid gap-1 text-xs font-medium text-slate-500">
                  Du
                  <input
                    type="date"
                    value={customRange.from}
                    max={customRange.to || undefined}
                    onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
                    className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-500">
                  Au
                  <input
                    type="date"
                    value={customRange.to}
                    min={customRange.from || undefined}
                    onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
                    className="h-9 rounded-md border bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </label>
              </>
            ) : (
              <p className="pb-2 text-sm text-slate-600">{periodText}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setBatchOpen(true)}
              disabled={loading || !rangeValid || invoices.length === 0}
            >
              <Printer className="size-4" /> Tout imprimer / PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadInvoicesCsv(invoices, `factures ${periodText}.csv`.replaceAll('/', '-'))}
              disabled={loading || !rangeValid || invoices.length === 0}
            >
              <FileSpreadsheet className="size-4" /> Liste (CSV)
            </Button>
          </div>
        </div>

        {!rangeValid && (
          <p role="alert" className="text-sm text-rose-600">
            Choisissez une date de début et une date de fin, la première avant la seconde.
          </p>
        )}

        {loading ? (
          <TableSkeleton columns={6} />
        ) : invoices.length === 0 ? (
          <EmptyState
            Icon={FileText}
            title="Aucune facture sur cette période"
            description={`Aucune facture ${periodText}. Changez de période ou choisissez une vente ci-dessus pour la facturer.`}
            actionLabel={canWriteBilling ? 'Nouvelle facture' : undefined}
            onAction={() => openGenerate()}
          />
        ) : (
          <div className="relative overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b text-left text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Facture</th>
                  <th scope="col" className="px-5 py-3 font-medium">Client</th>
                  <th scope="col" className="px-5 py-3 font-medium">Règlement</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Net à payer</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => {
                  const typeMeta = TYPE_CONFIG[inv.invoice_type] || TYPE_CONFIG.SALE;
                  const statusMeta = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
                  const isLoading = actionLoading === inv.id;
                  const isCredited = Boolean(inv.credit_note_reference);
                  const isOpen =
                    inv.invoice_type === 'SALE' &&
                    !isCredited &&
                    (inv.status === 'PENDING' || inv.status === 'PARTIALLY_PAID');
                  const isSale = inv.invoice_type === 'SALE' && inv.status !== 'CANCELLED';
                  return (
                    <tr
                      key={inv.id}
                      className={`transition hover:bg-slate-50 ${inv.status === 'CANCELLED' ? 'text-slate-400' : ''}`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className={`figure font-semibold ${inv.status === 'CANCELLED' ? 'line-through' : 'text-slate-900'}`}>
                          {inv.reference}
                        </p>
                        <p className="text-xs text-slate-500">
                          {inv.invoice_type !== 'SALE' && <span className="text-amber-700">{typeMeta.label}, </span>}
                          {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {inv.client?.name ?? <span className="text-slate-400">Sans client</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentState invoice={inv} statusMeta={statusMeta} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                        <Money value={inv.net_payable ?? inv.total_ttc} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {isOpen && canWriteBilling && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPaymentInvoice(inv)}
                              disabled={isLoading}
                              className="mr-1"
                            >
                              <Wallet className="size-3.5" /> Encaisser
                            </Button>
                          )}
                          <IconAction label={`Voir la facture ${inv.reference}`} onClick={() => setPdfInvoiceId(inv.id)}>
                            <Eye className="size-4" />
                          </IconAction>
                          {isSale && !(isOpen && canWriteBilling) && (
                            <IconAction
                              label={`Règlements de la facture ${inv.reference}`}
                              onClick={() => setPaymentInvoice(inv)}
                              disabled={isLoading}
                            >
                              <Wallet className="size-4" />
                            </IconAction>
                          )}
                          {isSale && !isCredited && canWriteBilling ? (
                            <IconAction
                              label={`Émettre un avoir sur la facture ${inv.reference}`}
                              onClick={() => handleCreditNote(inv)}
                              disabled={isLoading}
                            >
                              <RotateCcw className="size-4" />
                            </IconAction>
                          ) : (
                            canWriteBilling && <span className="size-8" aria-hidden="true" />
                          )}
                          {inv.status === 'PENDING' && !(inv.amount_paid > 0) && !isCredited && canWriteBilling ? (
                            <IconAction
                              label={`Annuler la facture ${inv.reference}`}
                              onClick={() => handleStatusUpdate(inv, 'CANCELLED')}
                              disabled={isLoading}
                              danger
                            >
                              <XCircle className="size-4" />
                            </IconAction>
                          ) : (
                            canWriteBilling && <span className="size-8" aria-hidden="true" />
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

      <AccountantExportModal open={exportOpen} onClose={() => setExportOpen(false)} />

      <CreditNoteStatementModal
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        clients={clients}
      />

      <InvoiceBatchPrintModal
        invoices={invoices}
        periodText={periodText}
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
      />

      <PaymentModal
        invoice={paymentInvoice}
        open={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onChanged={load}
      />

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