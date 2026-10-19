import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { getProducts } from '@/services/productService';
import { adjustStock } from '@/services/mouvmentService';
import { formatTND } from '@/lib/fiscal';

const REASONS = [
  { value: 'INVENTORY', label: 'Inventaire physique' },
  { value: 'BREAKAGE', label: 'Casse' },
  { value: 'LOSS', label: 'Perte / vol' },
  { value: 'EXPIRED', label: 'Péremption' },
  { value: 'OTHER', label: 'Autre (préciser)' },
];

/** Tout le catalogue, page par page */
async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const res = await getProducts({ page, limit: 200 });
    all.push(...(res.products ?? []));
    if (page >= (res.pagination?.pages ?? 1)) break;
  }
  return all;
}

function DiffCell({ diff, unit }) {
  if (diff === null) return <span className="text-slate-300">—</span>;
  if (diff === 0) return <span className="text-slate-500">0</span>;
  return (
    <span className={`font-semibold tabular-nums ${diff > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
      {diff > 0 ? '+' : ''}
      {diff} {unit}
    </span>
  );
}

/**
 * Inventaire physique et corrections de stock.
 * On saisit les quantités comptées (les lignes vides ne sont pas modifiées) ;
 * chaque écart devient une ligne d'ajustement signée, exclue des ventes et achats.
 */
export function InventoryPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({}); // productId → saisie (string)
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('INVENTORY');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await fetchAllProducts());
    } catch (err) {
      if (!/trouvé|404/.test(err.message ?? '')) toast.error(err.message || 'Impossible de charger les produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.code ?? '').includes(q))
      .map((p) => {
        const raw = counts[p.id];
        const counted = raw === undefined || raw === '' ? null : Number(raw);
        const diff = counted === null || !Number.isInteger(counted) || counted < 0 ? null : counted - p.stock_quantity;
        return { ...p, raw: raw ?? '', diff };
      });
  }, [products, counts, search]);

  // Synthèse sur TOUT le catalogue (pas seulement les lignes filtrées)
  const summary = useMemo(() => {
    let counted = 0;
    let changed = 0;
    let value = 0;
    let invalid = 0;
    for (const p of products) {
      const raw = counts[p.id];
      if (raw === undefined || raw === '') continue;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        invalid += 1;
        continue;
      }
      counted += 1;
      const diff = n - p.stock_quantity;
      if (diff !== 0) {
        changed += 1;
        value += diff * (Number(p.purchase_price) || 0);
      }
    }
    return { counted, changed, value, invalid };
  }, [products, counts]);

  const setCount = (id, value) => setCounts((c) => ({ ...c, [id]: value.replace(/[^\d]/g, '') }));

  const handleSubmit = async () => {
    if (summary.invalid > 0) return toast.error('Corrigez les quantités invalides');
    if (reason === 'OTHER' && !note.trim()) return toast.error('Précisez le motif de l’ajustement');
    const payload = Object.entries(counts)
      .filter(([, raw]) => raw !== '')
      .map(([productId, raw]) => ({ productId, counted: Number(raw) }));

    const ok = await confirm({
      title: 'Valider l’inventaire',
      description: `${summary.counted} produit(s) compté(s), ${summary.changed} écart(s).\nValeur des écarts : ${formatTND(summary.value)} TND (prix d’achat).\nLe stock sera remplacé par les quantités comptées.`,
      confirmLabel: 'Valider',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await adjustStock({ reason, note: note.trim() || undefined, counts: payload });
      toast.success(res.message, {
        description: res.adjusted > 0 ? `Écart valorisé : ${formatTND(res.value)} TND` : undefined,
      });
      setCounts({});
      setNote('');
      load();
    } catch (err) {
      toast.error(err.message || "L'ajustement a échoué");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventaire</h1>
          <p className="mt-1 text-sm text-slate-500">
            Saisissez les quantités comptées : les lignes laissées vides ne sont pas modifiées.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit ou un code"
            aria-label="Rechercher un produit"
            className="w-full rounded-xl border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 focus:outline-none sm:w-72"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton columns={6} />
      ) : products.length === 0 ? (
        <EmptyState Icon={ClipboardCheck} title="Aucun produit" description="Créez des produits avant de faire un inventaire." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Produit</th>
                <th className="px-4 py-3 text-right">Stock système</th>
                <th className="px-4 py-3 text-right">Quantité comptée</th>
                <th className="px-4 py-3 text-right">Écart</th>
                <th className="px-4 py-3 text-right">Valeur de l’écart</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((p) => {
                const invalid = p.raw !== '' && p.diff === null;
                return (
                  <tr key={p.id} className={p.diff ? 'bg-amber-50/40' : ''}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.code ?? '—'}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                      {p.stock_quantity} <span className="text-xs text-slate-400">{p.unit_of_measure}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        inputMode="numeric"
                        value={p.raw}
                        onChange={(e) => setCount(p.id, e.target.value)}
                        aria-label={`Quantité comptée pour ${p.name}`}
                        aria-invalid={invalid ? 'true' : 'false'}
                        placeholder="—"
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right tabular-nums focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700 focus:outline-none aria-[invalid=true]:border-rose-400"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <DiffCell diff={p.diff} unit={p.unit_of_measure} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                      {p.diff ? formatTND(p.diff * (Number(p.purchase_price) || 0)) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Barre de validation */}
      {summary.counted + summary.invalid > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-5 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-700">
              <strong>{summary.counted}</strong> compté(s) · <strong>{summary.changed}</strong> écart(s) ·{' '}
              <span className={summary.value < 0 ? 'text-rose-700' : 'text-emerald-700'}>
                {formatTND(summary.value)} TND
              </span>
              {summary.invalid > 0 && <span className="ml-2 text-rose-600">· {summary.invalid} invalide(s)</span>}
            </p>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label="Motif de l’ajustement"
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={reason === 'OTHER' ? 'Motif (obligatoire)' : 'Observation (facultatif)'}
                aria-label="Observation"
                className="w-48 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <Button variant="ghost" onClick={() => setCounts({})} disabled={saving}>
                <RotateCcw className="mr-1.5 size-4" /> Effacer
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="rounded-xl">
                <ClipboardCheck className="mr-2 size-4" />
                {saving ? 'Validation…' : 'Valider l’inventaire'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
