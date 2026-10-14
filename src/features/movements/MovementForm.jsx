import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

const MOVEMENT_TYPES = [
  {
    id: 'IN',
    label: 'Entrée (Achat)',
    effect: '+ Stock',
    icon: ArrowDownLeft,
    color: 'emerald',
    desc: 'Approvisionnement fournisseur ou achat initial',
    partnerType: 'supplier',
  },
  {
    id: 'OUT',
    label: 'Sortie (Vente)',
    effect: '- Stock',
    icon: ArrowUpRight,
    color: 'rose',
    desc: 'Vente client, expédition ou consommation',
    partnerType: 'client',
  },
  {
    id: 'RETURN_SUPPLIER',
    label: 'Retour Fournisseur',
    effect: '- Stock',
    icon: RotateCcw,
    color: 'amber',
    desc: 'Marchandise défectueuse renvoyée au fournisseur',
    partnerType: 'supplier',
  },
  {
    id: 'RETURN_CLIENT',
    label: 'Retour Client',
    effect: '+ Stock',
    icon: RotateCcw,
    color: 'cyan',
    desc: 'Retour de produit réintégré au stock',
    partnerType: 'client',
  },
];

export function MovementForm({
  open,
  onClose,
  onSubmit,
  products = [],
  suppliers = [],
  clients = [],
  defaultType = 'OUT',
  fixedType = null,
}) {
  const resolvedType = fixedType || defaultType || 'OUT';
  const [type, setType] = useState(resolvedType);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  // Entrée de stock : facture du fournisseur (traçabilité, TVA déductible)
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('CONFIRMED');

  const [items, setItems] = useState([
    { productId: '', quantity: 1, unit_price: 0 },
  ]);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Réinitialiser le formulaire à l'ouverture avec le type par défaut associé à la page active
  useEffect(() => {
    if (open) {
      const initialType = fixedType || defaultType || 'OUT';
      setType(initialType);
      setReference('');
      setNote('');
      setSupplierInvoiceRef('');
      setSupplierInvoiceDate('');
      setSupplierId('');
      setClientId('');
      setStatus('CONFIRMED');
      setItems([{ productId: '', quantity: 1, unit_price: 0 }]);
      setError(null);
      setSubmitting(false);
    }
  }, [open, fixedType, defaultType]);

  const currentTypeConfig = MOVEMENT_TYPES.find((t) => t.id === type) || MOVEMENT_TYPES[0];

  // Gestion des articles dynamiques
  const handleProductChange = (index, prodId) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      const defaultPrice =
        type === 'IN' || type === 'RETURN_SUPPLIER'
          ? prod?.purchase_price ?? 0
          : prod?.selling_price ?? 0;

      copy[index] = {
        ...copy[index],
        productId: prodId,
        unit_price: Number(defaultPrice),
      };
      return copy;
    });
  };

  const handleQuantityChange = (index, qty) => {
    const val = Math.max(1, parseInt(qty, 10) || 1);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: val };
      return copy;
    });
  };

  const handlePriceChange = (index, price) => {
    const val = Math.max(0, parseFloat(price) || 0);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], unit_price: val };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calcul du montant total en direct
  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0);
  }, [items]);

  // Vérification de stock pour les sorties
  const stockErrors = useMemo(() => {
    if (type !== 'OUT' && type !== 'RETURN_SUPPLIER') return [];
    const errs = [];
    items.forEach((item, idx) => {
      if (!item.productId) return;
      const prod = products.find((p) => p.id === item.productId);
      if (prod && prod.stock_quantity < item.quantity) {
        errs.push(
          `Ligne ${idx + 1} (${prod.name}) : Stock insuffisant (${prod.stock_quantity} dispo / ${item.quantity} demandé)`
        );
      }
    });
    return errs;
  }, [items, products, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      setError('Veuillez sélectionner un produit pour chaque ligne d’article.');
      return;
    }

    if (stockErrors.length > 0) {
      setError(stockErrors[0]);
      return;
    }

    const payload = {
      type,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
      ...(type === 'IN' && {
        supplier_invoice_ref: supplierInvoiceRef.trim() || undefined,
        supplier_invoice_date: supplierInvoiceDate || undefined,
      }),
      status,
      supplierId: currentTypeConfig.partnerType === 'supplier' && supplierId ? supplierId : undefined,
      clientId: currentTypeConfig.partnerType === 'client' && clientId ? clientId : undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        type === 'OUT'
          ? 'Nouvelle Vente (Sortie de stock)'
          : type === 'IN'
          ? 'Nouvel Achat (Entrée de stock)'
          : type === 'RETURN_SUPPLIER'
          ? 'Nouveau Retour Fournisseur'
          : 'Nouveau Retour Client'
      }
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-left">
            <span className="text-xs text-slate-400">Total estimé : </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {grandTotal.toFixed(3)} TND
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="movement-form"
              disabled={submitting || stockErrors.length > 0}
              className="bg-cyan-700 hover:bg-cyan-800 text-white"
            >
              {submitting
                ? 'Enregistrement…'
                : type === 'OUT'
                ? 'Enregistrer la vente'
                : type === 'IN'
                ? "Enregistrer l'achat"
                : 'Créer le mouvement'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="movement-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Type de mouvement : fixé selon la section du menu sidebar */}
        {fixedType ? (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              type === 'OUT'
                ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                : type === 'IN'
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                : type === 'RETURN_SUPPLIER'
                ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                : 'border-cyan-200 bg-cyan-50/70 text-cyan-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-8 place-items-center rounded-lg ${
                  type === 'OUT'
                    ? 'bg-rose-100 text-rose-700'
                    : type === 'IN'
                    ? 'bg-emerald-100 text-emerald-700'
                    : type === 'RETURN_SUPPLIER'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-cyan-100 text-cyan-700'
                }`}
              >
                <currentTypeConfig.icon className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type :
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentTypeConfig.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentTypeConfig.desc}</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                currentTypeConfig.effect.startsWith('+')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {currentTypeConfig.effect}
            </span>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Type de mouvement *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.effect})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Informations générales (Référence, Partenaire, Statut) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Référence / N° Pièce
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: BL-2026-001"
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              {currentTypeConfig.partnerType === 'supplier' ? 'Fournisseur' : 'Client'}
            </label>
            {currentTypeConfig.partnerType === 'supplier' ? (
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">— Aucun fournisseur —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">— Aucun client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="CONFIRMED">CONFIRMÉ (Applique le stock)</option>
              <option value="PENDING">EN ATTENTE</option>
            </select>
          </div>
        </div>

        {/* 3. Lignes d'articles */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Articles à déplacer ({items.length}) *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
              className="h-7 text-xs"
            >
              <Plus className="mr-1 size-3" />
              Ajouter un article
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const selectedProd = products.find((p) => p.id === item.productId);
              const lineTotal = (item.unit_price || 0) * (item.quantity || 1);
              const isOverStock =
                (type === 'OUT' || type === 'RETURN_SUPPLIER') &&
                selectedProd &&
                selectedProd.stock_quantity < item.quantity;

              return (
                <div
                  key={idx}
                  className={`flex flex-wrap items-center gap-2 rounded-xl border p-2.5 transition ${
                    isOverStock ? 'border-rose-300 bg-rose-50/30' : 'bg-slate-50/50'
                  }`}
                >
                  {/* Select Produit */}
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">— Choisir un produit —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock_quantity} {p.unit_of_measure})
                        </option>
                      ))}
                    </select>
                    {selectedProd && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Stock dispo: <strong className="text-slate-700">{selectedProd.stock_quantity}</strong> {selectedProd.unit_of_measure}
                      </p>
                    )}
                  </div>

                  {/* Quantité */}
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, e.target.value)}
                      placeholder="Qté"
                      className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold text-right tabular-nums focus:outline-none focus:ring-2 ${
                        isOverStock ? 'border-rose-400 text-rose-700 ring-rose-200' : 'focus:ring-cyan-500'
                      }`}
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400 text-right">Qté</p>
                  </div>

                  {/* Prix Unitaire */}
                  <div className="w-28">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      placeholder="P.U."
                      className="w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400 text-right">Prix Unit. (TND)</p>
                  </div>

                  {/* Total de ligne */}
                  <div className="w-24 text-right">
                    <p className="text-xs font-bold text-slate-900 tabular-nums">
                      {lineTotal.toFixed(3)}
                    </p>
                    <p className="text-[10px] text-slate-400">TND</p>
                  </div>

                  {/* Supprimer la ligne */}
                  <button
                    type="button"
                    title="Supprimer la ligne"
                    disabled={items.length <= 1}
                    onClick={() => removeItemRow(idx)}
                    className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {stockErrors.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-600">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Attention : certains articles dépassent le stock actuellement disponible.</span>
            </div>
          )}
        </div>

        {/* Facture fournisseur (entrées uniquement) */}
        {type === 'IN' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              N° de facture fournisseur
              <input
                value={supplierInvoiceRef}
                onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                placeholder="ex. FA-2026-0142"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Date de la facture
              <input
                type="date"
                value={supplierInvoiceDate}
                onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </label>
          </div>
        )}

        {/* 4. Note / Commentaire */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Observation / Motif (optionnel)
          </label>
          <textarea
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Précisez un motif (ex: livraison fournisseur n°42, casse en entrepôt, inventaire…)"
            className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </form>
    </Modal>
  );
}
