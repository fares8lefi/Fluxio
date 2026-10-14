import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileInput, Plus, CheckCircle2, XCircle, ArrowRightCircle,
  FileText, TrendingUp, AlertCircle, Package, Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { QuotePrintModal } from './QuotePrintModal';
import {
  getAllQuotes, updateQuoteStatus, createQuote, convertQuoteToInvoice,
} from '@/services/invoiceService';
import { InvoicePdfModal } from './InvoicePdfModal';
import { getClients } from '@/services/clientService';
import { getProducts } from '@/services/productService';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:     { label: 'Brouillon', badgeClass: 'bg-slate-100 text-slate-700' },
  SENT:      { label: 'Envoyé',    badgeClass: 'bg-cyan-100 text-cyan-700' },
  ACCEPTED:  { label: 'Accepté',   badgeClass: 'bg-emerald-100 text-emerald-700' },
  REJECTED:  { label: 'Rejeté',    badgeClass: 'bg-rose-100 text-rose-700' },
  EXPIRED:   { label: 'Expiré',    badgeClass: 'bg-amber-100 text-amber-700' },
  CONVERTED: { label: 'Converti',  badgeClass: 'bg-indigo-100 text-indigo-700' },
};

// ── Line-item table ──────────────────────────────────────────────────────────

const EMPTY_ITEM = () => ({
  productId: '',   // '' = saisie libre
  name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  tva_rate: 19,
  discount: 0,
});

function ItemsTable({ items, onChange, products = [] }) {
  const inp = 'w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500';

  const setField = (idx, field, value) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  // Quand on choisit un produit → pré-remplir nom, prix de vente, TVA
  const handleProductSelect = (idx, productId) => {
    if (!productId) {
      // Retour en mode libre
      onChange(items.map((it, i) =>
        i === idx ? { ...EMPTY_ITEM(), quantity: it.quantity } : it
      ));
      return;
    }
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    onChange(items.map((it, i) =>
      i === idx
        ? {
            ...it,
            productId,
            name: prod.name,
            description: prod.unit_of_measure ? `Unité : ${prod.unit_of_measure}` : '',
            unit_price: Number(prod.selling_price ?? 0),
            tva_rate: Number(prod.tva_rate ?? 19),
          }
        : it
    ));
  };

  const addRow = () => onChange([...items, EMPTY_ITEM()]);
  const removeRow = (idx) => onChange(items.filter((_, i) => i !== idx));

  // Totals
  const totalHT = items.reduce(
    (s, it) => s + it.unit_price * it.quantity * (1 - (it.discount || 0) / 100),
    0,
  );
  const totalTVA = items.reduce((s, it) => {
    const ht = it.unit_price * it.quantity * (1 - (it.discount || 0) / 100);
    return s + ht * (it.tva_rate || 0) / 100;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">
          Articles * <span className="font-normal text-slate-400">({items.length} ligne{items.length > 1 ? 's' : ''})</span>
        </label>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 rounded-lg border border-dashed border-cyan-400 px-2.5 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50 transition"
        >
          <Plus className="size-3" /> Ajouter une ligne
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
          Aucun article — cliquez sur « Ajouter une ligne »
        </p>
      )}

      {/* Rows */}
      {items.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1.4fr_0.7fr_1.1fr_0.7fr_0.7fr_1fr_auto] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Produit</span>
            <span>Description</span>
            <span className="text-center">Qté</span>
            <span className="text-center">P.U. HT</span>
            <span className="text-center">TVA %</span>
            <span className="text-center">Rem. %</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>

          {items.map((item, idx) => {
            const selectedProd = products.find((p) => p.id === item.productId);
            const ht = item.unit_price * item.quantity * (1 - (item.discount || 0) / 100);

            return (
              <div
                key={idx}
                className="grid grid-cols-[2fr_1.4fr_0.7fr_1.1fr_0.7fr_0.7fr_1fr_auto] gap-2 items-start rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-2.5 hover:bg-white transition"
              >
                {/* Sélecteur produit + nom libre */}
                <div className="space-y-1">
                  <select
                    className={`${inp} bg-white`}
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                  >
                    <option value="">✏️ Saisie libre…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {/* Si saisie libre → champ texte pour le nom */}
                  {!item.productId && (
                    <input
                      className={inp}
                      placeholder="Nom de l'article"
                      value={item.name}
                      onChange={(e) => setField(idx, 'name', e.target.value)}
                    />
                  )}
                  {/* Badge stock si produit sélectionné */}
                  {selectedProd && (
                    <p className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Package className="size-2.5" />
                      Stock : <strong className="text-slate-700">{selectedProd.stock_quantity}</strong> {selectedProd.unit_of_measure}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <input
                    className={inp}
                    placeholder="Description…"
                    value={item.description}
                    onChange={(e) => setField(idx, 'description', e.target.value)}
                  />
                </div>

                {/* Quantité */}
                <div>
                  <input
                    type="number"
                    min="1"
                    className={`${inp} text-center`}
                    value={item.quantity}
                    onChange={(e) =>
                      setField(idx, 'quantity', parseFloat(e.target.value) || 1)
                    }
                  />
                </div>

                {/* Prix unitaire HT */}
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className={`${inp} text-right tabular-nums`}
                    value={item.unit_price}
                    onChange={(e) =>
                      setField(idx, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* TVA % */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`${inp} text-center`}
                    value={item.tva_rate}
                    onChange={(e) =>
                      setField(idx, 'tva_rate', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Remise % */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`${inp} text-center`}
                    value={item.discount}
                    onChange={(e) =>
                      setField(idx, 'discount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Total HT */}
                <div className="flex items-center justify-end pt-1.5">
                  <span className="text-sm font-bold tabular-nums text-slate-800">
                    {ht.toFixed(3)}
                  </span>
                </div>

                {/* Supprimer */}
                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    title="Supprimer"
                    className="grid size-6 place-items-center rounded text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Récapitulatif totaux */}
      {items.length > 0 && (
        <div className="flex justify-end pt-1">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs space-y-1.5 min-w-[220px] shadow-sm">
            <div className="flex justify-between gap-8 text-slate-600">
              <span>Total HT</span>
              <span className="font-semibold tabular-nums">{totalHT.toFixed(3)} TND</span>
            </div>
            <div className="flex justify-between gap-8 text-slate-600">
              <span>TVA</span>
              <span className="font-semibold tabular-nums">{totalTVA.toFixed(3)} TND</span>
            </div>
            <div className="flex justify-between gap-8 border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
              <span>Total TTC</span>
              <span className="tabular-nums">{(totalHT + totalTVA).toFixed(3)} TND</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal création de devis ──────────────────────────────────────────────────

function CreateQuoteModal({ open, clients, onClose, onSuccess }) {
  const [form, setForm] = useState({
    clientId: '',
    notes: '',
    payment_terms: '',
    valid_until: '',
    is_suspended: false,
  });
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les produits + réinitialiser à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setForm({ clientId: '', notes: '', payment_terms: '', valid_until: '', is_suspended: false });
    setItems([EMPTY_ITEM()]);
    setError(null);

    // Chargement des produits
    setProductsLoading(true);
    getProducts({ limit: 500 })
      .then((res) => setProducts(res?.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) { setError('Veuillez sélectionner un client'); return; }
    if (items.length === 0) { setError('Ajoutez au moins un article'); return; }

    // Validation : chaque ligne doit avoir un nom (via produit sélectionné ou saisie libre)
    const invalid = items.find((it) => !it.name.trim());
    if (invalid) {
      setError('Chaque article doit avoir un nom (sélectionnez un produit ou saisissez un nom)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Envoyer uniquement les champs utiles au backend
      const payload = {
        ...form,
        items: items.map(({ productId, name, description, quantity, unit_price, tva_rate, discount }) => ({
          ...(productId ? { productId } : {}),
          name,
          description,
          quantity,
          unit_price,
          tva_rate,
          discount,
        })),
      };
      await createQuote(payload);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <Modal
      open={open}
      title="Nouveau Devis"
      onClose={onClose}
      size="2xl"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button
            form="quote-form"
            type="submit"
            disabled={loading}
            className="bg-cyan-700 hover:bg-cyan-800 text-white"
          >
            {loading ? 'Création...' : 'Créer le devis'}
          </Button>
        </div>
      }
    >
      <form id="quote-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Client */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
          <select
            className={inputClass}
            value={form.clientId}
            onChange={(e) => set('clientId', e.target.value)}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Articles */}
        {productsLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
            <Spinner size="xs" />
            Chargement des produits…
          </div>
        ) : (
          <ItemsTable items={items} onChange={setItems} products={products} />
        )}

        {/* Date de validité + Conditions de paiement */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valide jusqu'au
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.valid_until}
              onChange={(e) => set('valid_until', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conditions de paiement
            </label>
            <input
              className={inputClass}
              placeholder="Ex : 30 jours net"
              value={form.payment_terms}
              onChange={(e) => set('payment_terms', e.target.value)}
            />
          </div>
        </div>

        {/* Suspension de TVA */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_suspended}
            onChange={(e) => set('is_suspended', e.target.checked)}
            className="mt-0.5 accent-cyan-600"
          />
          <span className="text-sm font-semibold text-slate-900">
            Vente en suspension de TVA
          </span>
        </label>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes (optionnel)
          </label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            placeholder="Remarques, conditions particulières…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export function QuotesPage() {
  const { can } = useAuth();
  const canWriteBilling = can('billing.write');
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterStatus !== 'ALL') filters.status = filterStatus;

      const [quotesRes, clientsRes] = await Promise.allSettled([
        getAllQuotes(filters),
        getClients(),
      ]);
      if (quotesRes.status === 'fulfilled') setQuotes(quotesRes.value?.quotes ?? []);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value?.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const toast   = useToast();
  const confirm = useConfirm();
  const [printQuote, setPrintQuote] = useState(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Devis accepté → sortie de stock + facture (le backend fait les deux)
  const handleConvert = async (quote) => {
    let attestation;
    if (quote.is_suspended) {
      attestation = await confirm({
        title: 'Convertir en facture',
        description: `Le devis ${quote.reference} est en suspension de TVA : le numéro d'attestation est obligatoire sur la facture.`,
        confirmLabel: 'Créer la facture',
        input: { label: "N° d'attestation d'achat en suspension", required: true },
      });
      if (attestation === null) return;
    } else {
      const ok = await confirm({
        title: 'Convertir en facture',
        description: `Une facture sera créée pour le devis ${quote.reference}.
Les quantités seront retirées du stock (bon de livraison créé automatiquement).`,
        confirmLabel: 'Créer la facture',
      });
      if (!ok) return;
    }

    setActionLoading(quote.id);
    try {
      const res = await convertQuoteToInvoice(quote.id, attestation ? { attestation_ref: attestation } : {});
      toast.success(`Facture ${res.invoice.reference} créée`, {
        description: `À partir du devis ${quote.reference} — stock mis à jour.`,
      });
      setCreatedInvoiceId(res.invoice.id);
      load();
    } catch (e) {
      const missing = e.payload?.missing_fields?.map((f) => f.label).join(', ');
      toast.error(e.message || 'Conversion impossible', missing ? { description: `À compléter : ${missing}` } : undefined);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (quote, status) => {
    const ok = await confirm({
      title: 'Changer le statut',
      description: `Le devis ${quote.reference} passera au statut « ${status} ».`,
      destructive: status === 'REJECTED' || status === 'CANCELLED',
    });
    if (!ok) return;
    setActionLoading(quote.id);
    try {
      await updateQuoteStatus(quote.id, status);
      toast.success(`Devis ${quote.reference} mis à jour`);
      load();
    } catch (e) {
      toast.error(e.message || 'Impossible de modifier le statut');
    } finally {
      setActionLoading(null);
    }
  };

  // KPIs
  const totalTTC = quotes.reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalAccepted = quotes
    .filter((q) => q.status === 'ACCEPTED' || q.status === 'CONVERTED')
    .reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalPending = quotes
    .filter((q) => q.status === 'SENT')
    .reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalExpired = quotes.filter((q) => q.status === 'EXPIRED').length;

  const tabs = [
    { key: 'ALL',      label: 'Tous' },
    { key: 'DRAFT',    label: 'Brouillons' },
    { key: 'SENT',     label: 'Envoyés' },
    { key: 'ACCEPTED', label: 'Acceptés' },
    { key: 'REJECTED', label: 'Rejetés' },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Devis &amp; Pro Forma</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Gérez vos propositions commerciales avant facturation.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          hidden={!canWriteBilling}
          className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white"
        >
          <Plus className="mr-2 size-4" /> Nouveau Devis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <FileText className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Devis</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-slate-900">
            {totalTTC.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Valeur totale</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Acceptés</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-emerald-700">
            {totalAccepted.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Devis validés</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">En cours</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-blue-700">
            {totalPending.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">En attente de réponse</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Expirés</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-amber-700">{totalExpired}</p>
          <p className="text-xs text-slate-500 mt-0.5">Devis obsolètes</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border bg-slate-50 p-0.5 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-lg px-4 py-1.5 transition ${
                filterStatus === tab.key
                  ? 'bg-white font-semibold text-cyan-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton columns={6} />
      ) : quotes.length === 0 ? (
        <EmptyState
          Icon={FileInput}
          title="Aucun devis"
          description="Créez votre première proposition commerciale."
          actionLabel={canWriteBilling ? 'Nouveau Devis' : undefined}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Référence</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Validité</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-right">Total TTC</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map((quote) => {
                const statusMeta = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
                const isLoading = actionLoading === quote.id;

                return (
                  <tr key={quote.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                      {quote.reference}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(quote.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {quote.valid_until
                        ? new Date(quote.valid_until).toLocaleDateString('fr-FR')
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {quote.client?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                      {Number(quote.total_ttc || 0).toFixed(3)}{' '}
                      <span className="text-xs font-normal text-slate-400">TND</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Imprimer le devis"
                          aria-label={`Imprimer le devis ${quote.reference}`}
                          onClick={() => setPrintQuote(quote)}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-cyan-50 hover:text-cyan-700"
                        >
                          <Printer className="size-3.5" />
                        </button>
                        {quote.status === 'SENT' && (
                          <>
                            <button
                              title="Marquer comme accepté"
                              hidden={!canWriteBilling}
                              onClick={() => handleStatusUpdate(quote, 'ACCEPTED')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                            >
                              <CheckCircle2 className="size-3.5" />
                            </button>
                            <button
                              title="Marquer comme rejeté"
                              hidden={!canWriteBilling}
                              onClick={() => handleStatusUpdate(quote, 'REJECTED')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <XCircle className="size-3.5" />
                            </button>
                          </>
                        )}
                        {quote.status === 'ACCEPTED' && (
                          <button
                            title="Convertir en facture"
                            hidden={!canWriteBilling}
                            onClick={() => handleConvert(quote)}
                            disabled={isLoading}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                          >
                            <ArrowRightCircle className="size-3.5" />
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

      <InvoicePdfModal
        invoiceId={createdInvoiceId}
        open={!!createdInvoiceId}
        onClose={() => setCreatedInvoiceId(null)}
      />

      <QuotePrintModal
        quote={printQuote}
        open={!!printQuote}
        onClose={() => setPrintQuote(null)}
      />

      <CreateQuoteModal
        open={createOpen}
        clients={clients}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); load(); }}
      />
    </div>
  );
}
