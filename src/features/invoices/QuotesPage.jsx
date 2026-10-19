import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileInput, Plus, CheckCircle2, ArrowRightCircle, Package, Printer, Send, Trash2, TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatTND } from '@/lib/fiscal';
import { QuotePrintModal } from './QuotePrintModal';
import {
  getAllQuotes, updateQuoteStatus, createQuote, convertQuoteToInvoice,
} from '@/services/invoiceService';
import { InvoicePdfModal } from './InvoicePdfModal';
import { getClients } from '@/services/clientService';
import { getProducts } from '@/services/productService';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:     { label: 'Brouillon', plural: 'Brouillons', variant: 'inactive' },
  SENT:      { label: 'Envoyé',    plural: 'Envoyés',    variant: 'info' },
  ACCEPTED:  { label: 'Accepté',   plural: 'Acceptés',   variant: 'active' },
  REJECTED:  { label: 'Refusé',    plural: 'Refusés',    variant: 'danger' },
  EXPIRED:   { label: 'Expiré',    plural: 'Expirés',    variant: 'alert' },
  CONVERTED: { label: 'Facturé',   plural: 'Facturés',   variant: 'inactive' },
};

// The life of a quote, in order. Refused and expired quotes leave the track.
const TRACK = ['DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED'];
const OFF_TRACK = ['REJECTED', 'EXPIRED'];

/** « valable 5 j » / « expire aujourd'hui » for open quotes, null otherwise */
function validityOf(quote) {
  if (!quote.valid_until || !['DRAFT', 'SENT', 'ACCEPTED'].includes(quote.status)) return null;
  const days = Math.ceil((new Date(quote.valid_until) - Date.now()) / 86400000);
  if (days < 0) return { text: 'validité dépassée', soon: true };
  if (days === 0) return { text: "expire aujourd'hui", soon: true };
  return { text: `valable ${days} j`, soon: days <= 3 };
}

/**
 * Quote track: Brouillon → Envoyé → Accepté → Facturé, with count and amount
 * per step. Each step is a toggle that filters the list below.
 */
function QuoteTrack({ quotes, loading, active, onSelect }) {
  const stats = (status) => {
    const list = quotes.filter((q) => q.status === status);
    return { count: list.length, total: list.reduce((s, q) => s + (q.total_ttc || 0), 0) };
  };

  return (
    <nav aria-label="Étapes des devis" className="space-y-3">
      <ol className="grid overflow-hidden rounded-xl border bg-white sm:grid-cols-4">
        {TRACK.map((status, i) => {
          const { count, total } = stats(status);
          const selected = active === status;
          return (
            <li key={status} className="relative border-slate-100 not-last:border-b sm:not-last:border-r sm:not-last:border-b-0">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(status)}
                className={`group relative flex h-full w-full flex-col items-start px-5 py-4 text-left transition focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none focus-visible:ring-inset ${
                  selected ? 'bg-cyan-50' : 'hover:bg-slate-50'
                }`}
              >
                {/* Step marker: filled once a quote has reached this step */}
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <span
                    className={`figure grid size-5 place-items-center rounded-full text-[11px] font-semibold ${
                      selected ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  {STATUS_CONFIG[status].plural}
                </span>
                <span className="figure mt-2 text-2xl font-semibold text-slate-900">
                  {loading ? '—' : count}
                </span>
                <span className="figure text-sm text-slate-500">
                  {loading ? '' : `${formatTND(total)} TND`}
                </span>
                {selected && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-700" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
        {OFF_TRACK.map((status) => {
          const { count } = stats(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active === status}
              onClick={() => onSelect(status)}
              className={`rounded underline-offset-4 hover:text-slate-900 hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                active === status ? 'font-medium text-slate-900 underline' : ''
              }`}
            >
              <span className="figure">{loading ? '—' : count}</span>{' '}
              {(count > 1 ? STATUS_CONFIG[status].plural : STATUS_CONFIG[status].label).toLowerCase()}
            </button>
          );
        })}
      </p>
    </nav>
  );
}

/** The one action that moves a quote to its next step */
function NextStep({ quote, disabled, onStatus, onConvert }) {
  if (quote.status === 'DRAFT') {
    return (
      <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onStatus('SENT')}>
        <Send className="size-3.5" /> Marquer envoyé
      </Button>
    );
  }
  if (quote.status === 'SENT') {
    return (
      <>
        <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onStatus('ACCEPTED')}>
          <CheckCircle2 className="size-3.5" /> Accepté
        </Button>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onStatus('REJECTED')} className="text-slate-600">
          Refusé
        </Button>
      </>
    );
  }
  if (quote.status === 'ACCEPTED') {
    return (
      <Button size="sm" disabled={disabled} onClick={onConvert}>
        <ArrowRightCircle className="size-3.5" /> Convertir en facture
      </Button>
    );
  }
  return null;
}

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
  const inp = 'h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

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

  // Only lines the user has actually filled in count as off-catalogue
  const freeLines = items.filter((it) => !it.productId && it.name.trim()).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">
          Articles <span className="font-normal text-slate-400">({items.length} ligne{items.length > 1 ? 's' : ''})</span>
        </p>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
          Ajoutez au moins une ligne pour établir le devis.
        </p>
      )}

      {/* Rows */}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <div className="min-w-[760px]">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1.4fr_0.7fr_1.1fr_0.7fr_0.7fr_1fr_2rem] gap-2 border-b bg-slate-50 px-3 py-2 text-xs text-slate-500" aria-hidden="true">
            <span>Produit</span>
            <span>Description</span>
            <span className="text-center">Qté</span>
            <span className="text-center">P.U. HT</span>
            <span className="text-center">TVA %</span>
            <span className="text-center">Remise %</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>

          {items.map((item, idx) => {
            const selectedProd = products.find((p) => p.id === item.productId);
            const ht = item.unit_price * item.quantity * (1 - (item.discount || 0) / 100);

            return (
              <div
                key={idx}
                className="grid grid-cols-[2fr_1.4fr_0.7fr_1.1fr_0.7fr_0.7fr_1fr_2rem] items-start gap-2 border-slate-100 px-3 py-2.5 not-last:border-b"
              >
                {/* Sélecteur produit + nom libre */}
                <div className="space-y-1">
                  <select
                    className={inp}
                    aria-label={`Produit, ligne ${idx + 1}`}
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                  >
                    <option value="">Article hors catalogue</option>
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
                      aria-label={`Nom de l'article, ligne ${idx + 1}`}
                      value={item.name}
                      onChange={(e) => setField(idx, 'name', e.target.value)}
                    />
                  )}
                  {/* Badge stock si produit sélectionné */}
                  {selectedProd && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Package className="size-3" aria-hidden="true" />
                      Stock : <strong className="text-slate-700">{selectedProd.stock_quantity}</strong> {selectedProd.unit_of_measure}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <input
                    className={inp}
                    placeholder="Facultatif"
                    aria-label={`Description, ligne ${idx + 1}`}
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
                    aria-label={`Quantité, ligne ${idx + 1}`}
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
                    aria-label={`Prix unitaire HT, ligne ${idx + 1}`}
                    value={item.unit_price}
                    onChange={(e) =>
                      setField(idx, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* TVA % */}
                <div>
                  {/* Barème tunisien uniquement : un autre taux serait refusé par le serveur */}
                  <select
                    className={`${inp} text-center`}
                    aria-label={`Taux de TVA, ligne ${idx + 1}`}
                    value={item.tva_rate}
                    onChange={(e) => setField(idx, 'tva_rate', Number(e.target.value))}
                  >
                    {[0, 7, 13, 19].map((rate) => (
                      <option key={rate} value={rate}>{rate} %</option>
                    ))}
                  </select>
                </div>

                {/* Remise % */}
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`${inp} text-center`}
                    aria-label={`Remise, ligne ${idx + 1}`}
                    value={item.discount}
                    onChange={(e) =>
                      setField(idx, 'discount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Total HT */}
                <div className="flex h-9 items-center justify-end">
                  <span className="figure text-sm font-semibold text-slate-900">{formatTND(ht)}</span>
                </div>

                {/* Supprimer */}
                <div className="flex h-9 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    title="Retirer la ligne"
                    aria-label={`Retirer la ligne ${idx + 1}`}
                    className="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Ajout de ligne + récapitulatif */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" /> Ajouter une ligne
          </Button>
          {/* Le backend refuse de convertir un devis qui contient des lignes hors catalogue */}
          {freeLines > 0 && (
            <p className="flex max-w-sm items-start gap-2 text-xs text-amber-800">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {freeLines > 1 ? `${freeLines} lignes sont hors catalogue` : 'Une ligne est hors catalogue'} : le
              devis pourra être imprimé, mais pas converti en facture.
            </p>
          )}
        </div>

        {items.length > 0 && (
          <dl className="min-w-[240px] space-y-1.5 text-sm">
            <div className="flex justify-between gap-8 text-slate-600">
              <dt>Total HT</dt>
              <dd className="figure">{formatTND(totalHT)} TND</dd>
            </div>
            <div className="flex justify-between gap-8 text-slate-600">
              <dt>TVA</dt>
              <dd className="figure">{formatTND(totalTVA)} TND</dd>
            </div>
            <div className="flex justify-between gap-8 border-t pt-2 text-base font-semibold text-slate-900">
              <dt>Total TTC</dt>
              <dd className="figure">{formatTND(totalHT + totalTVA)} TND</dd>
            </div>
            <p className="text-right text-xs text-slate-500">Hors droit de timbre</p>
          </dl>
        )}
      </div>
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
    if (!form.clientId) { setError('Choisissez un client pour ce devis.'); return; }
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
      title="Nouveau devis"
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
          >
            {loading ? 'Création…' : 'Créer le devis'}
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

        {/* En-tête du devis : à qui, jusqu'à quand */}
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="quote-client" className="mb-1.5 block text-sm font-medium text-slate-700">
              Client
            </label>
            <select
              id="quote-client"
              className={inputClass}
              value={form.clientId}
              onChange={(e) => set('clientId', e.target.value)}
              required
            >
              <option value="">Choisir un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quote-valid" className="mb-1.5 block text-sm font-medium text-slate-700">
              Valable jusqu'au
            </label>
            <input
              id="quote-valid"
              type="date"
              className={inputClass}
              value={form.valid_until}
              onChange={(e) => set('valid_until', e.target.value)}
            />
          </div>
        </div>

        {/* Articles */}
        {productsLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <Spinner size="xs" />
            Chargement des produits…
          </div>
        ) : (
          <ItemsTable items={items} onChange={setItems} products={products} />
        )}

        {/* Conditions : imprimées en bas du devis */}
        <div className="grid gap-3 border-t pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-terms" className="mb-1.5 block text-sm font-medium text-slate-700">
              Conditions de paiement
            </label>
            <input
              id="quote-terms"
              className={inputClass}
              placeholder="Ex. : 30 jours net"
              value={form.payment_terms}
              onChange={(e) => set('payment_terms', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quote-notes" className="mb-1.5 block text-sm font-medium text-slate-700">
              Observations <span className="font-normal text-slate-400">(facultatif)</span>
            </label>
            <input
              id="quote-notes"
              className={inputClass}
              placeholder="Délai de livraison, conditions particulières…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={form.is_suspended}
            onChange={(e) => set('is_suspended', e.target.checked)}
            className="mt-0.5 size-4 accent-cyan-700"
          />
          <span className="text-sm text-slate-700">
            <span className="font-medium text-slate-900">Vente en suspension de TVA</span>
            <span className="block text-slate-500">
              Le numéro d'attestation du client sera demandé au moment de facturer.
            </span>
          </span>
        </label>
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
      // Tous les devis : la piste compte chaque étape, le filtre est local
      const [quotesRes, clientsRes] = await Promise.allSettled([
        getAllQuotes(),
        getClients(),
      ]);
      if (quotesRes.status === 'fulfilled') setQuotes(quotesRes.value?.quotes ?? []);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value?.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
        description: `À partir du devis ${quote.reference}. Le stock a été mis à jour.`,
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
      title: `Devis ${STATUS_CONFIG[status]?.label.toLowerCase() ?? status}`,
      description: `Le devis ${quote.reference} passera au statut « ${STATUS_CONFIG[status]?.label ?? status} ».`,
      confirmLabel: `Marquer ${STATUS_CONFIG[status]?.label.toLowerCase() ?? status}`,
      destructive: status === 'REJECTED',
    });
    if (!ok) return;
    setActionLoading(quote.id);
    try {
      await updateQuoteStatus(quote.id, status);
      toast.success(`Devis ${quote.reference} : ${STATUS_CONFIG[status]?.label.toLowerCase() ?? status}`);
      load();
    } catch (e) {
      toast.error(e.message || 'Impossible de modifier le statut');
    } finally {
      setActionLoading(null);
    }
  };

  const visibleQuotes =
    filterStatus === 'ALL' ? quotes : quotes.filter((q) => q.status === filterStatus);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Devis et pro forma</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Vos propositions commerciales, de l'envoi jusqu'à la facture.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} hidden={!canWriteBilling}>
          <Plus className="size-4" /> Nouveau devis
        </Button>
      </div>

      {/* Piste : chaque étape filtre la liste */}
      <QuoteTrack
        quotes={quotes}
        loading={loading}
        active={filterStatus}
        onSelect={(key) => setFilterStatus((current) => (current === key ? 'ALL' : key))}
      />

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <section aria-labelledby="quotes-title" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="quotes-title" className="text-lg font-semibold text-slate-900">
            {filterStatus === 'ALL' ? 'Tous les devis' : STATUS_CONFIG[filterStatus]?.plural}
            <span className="figure ml-2 text-base font-normal text-slate-400">{visibleQuotes.length}</span>
          </h2>
          {filterStatus !== 'ALL' && (
            <Button variant="ghost" size="sm" onClick={() => setFilterStatus('ALL')} className="text-slate-600">
              Afficher tous les devis
            </Button>
          )}
        </div>

        {loading ? (
          <TableSkeleton columns={5} />
        ) : visibleQuotes.length === 0 ? (
          <EmptyState
            Icon={FileInput}
            title={filterStatus === 'ALL' ? 'Aucun devis' : `Aucun devis ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()}`}
            description={
              filterStatus === 'ALL'
                ? 'Créez une proposition pour un client : vous pourrez la convertir en facture une fois acceptée.'
                : 'Choisissez une autre étape ou affichez tous les devis.'
            }
            actionLabel={canWriteBilling && filterStatus === 'ALL' ? 'Nouveau devis' : undefined}
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="relative overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Devis</th>
                  <th scope="col" className="px-5 py-3 font-medium">Client</th>
                  <th scope="col" className="px-5 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Total TTC</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleQuotes.map((quote) => {
                  const statusMeta = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
                  const isLoading = actionLoading === quote.id;
                  const closed = ['REJECTED', 'EXPIRED', 'CONVERTED'].includes(quote.status);
                  const validity = validityOf(quote);

                  return (
                    <tr key={quote.id} className={`transition hover:bg-slate-50 ${closed ? 'text-slate-400' : ''}`}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className={`figure font-semibold ${closed ? '' : 'text-slate-900'}`}>{quote.reference}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(quote.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {validity && (
                            <span className={validity.soon ? 'text-amber-700' : ''}>, {validity.text}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {quote.client?.name ?? <span className="text-slate-400">Sans client</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </td>
                      <td className={`figure px-5 py-3.5 text-right font-semibold whitespace-nowrap ${closed ? '' : 'text-slate-900'}`}>
                        {formatTND(quote.total_ttc)} <span className="text-[0.8em] font-normal text-slate-400">TND</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {canWriteBilling && (
                            <NextStep
                              quote={quote}
                              disabled={isLoading}
                              onStatus={(status) => handleStatusUpdate(quote, status)}
                              onConvert={() => handleConvert(quote)}
                            />
                          )}
                          <button
                            type="button"
                            title="Aperçu et impression"
                            aria-label={`Aperçu et impression du devis ${quote.reference}`}
                            onClick={() => setPrintQuote(quote)}
                            className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
                          >
                            <Printer className="size-4" />
                          </button>
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
