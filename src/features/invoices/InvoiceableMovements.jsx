import { Spinner } from '@/components/ui/Spinner';
import { AlertTriangle, CheckCircle2, Receipt, FileCheck2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const tnd = (value) => `${Number(value ?? 0).toFixed(3)} TND`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/**
 * État de la vente vis-à-vis de la facturation
 * @param {object} movement — candidat renvoyé par /getMovementsForInvoice
 */
export function MovementReadinessBadge({ movement }) {
  if (movement.has_invoice) {
    return <Badge variant="inactive">Facturée</Badge>;
  }
  if (movement.readiness?.is_ready) {
    return <Badge variant="active">Prête</Badge>;
  }
  return (
    <Badge variant="alert">
      {movement.readiness?.blocking_fields?.length ?? 0} info manquante
      {(movement.readiness?.blocking_fields?.length ?? 0) > 1 ? 's' : ''}
    </Badge>
  );
}

/**
 * Liste lisible des informations manquantes (client absent, champs à compléter…)
 */
export function MissingFieldsList({ fields = [], max = 4 }) {
  if (!fields.length) return null;
  const visible = fields.slice(0, max);
  const rest = fields.length - visible.length;

  return (
    <ul className="mt-1 space-y-0.5 text-[11px] text-amber-700">
      {visible.map((field, index) => (
        <li key={`${field.scope}-${field.field}-${field.productId ?? index}`} className="flex gap-1">
          <span aria-hidden="true">•</span>
          <span>{field.message ?? field.label}</span>
        </li>
      ))}
      {rest > 0 && <li className="font-semibold">+ {rest} autre(s)</li>}
    </ul>
  );
}

/**
 * Bandeau avertissant que l'entreprise émettrice est incomplète
 */
export function CompanyInfoAlert({ fields = [] }) {
  if (!fields.length) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        Informations de l'entreprise incomplètes
      </p>
      <MissingFieldsList fields={fields} max={3} />
    </div>
  );
}

/**
 * Tableau des ventes (mouvements OUT) facturables
 * @param {object}   props
 * @param {Array}    props.movements
 * @param {boolean}  props.loading
 * @param {number}   props.page
 * @param {number}   props.totalPages
 * @param {number}   props.count
 * @param {() => void} props.onPageChange
 * @param {(movement: object) => void} props.onGenerate
 */
export function InvoiceableMovementsTable({
  movements,
  loading,
  page = 1,
  totalPages = 1,
  count = 0,
  onPageChange,
  onGenerate,
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (!movements.length) {
    return (
      <p role="status" className="py-10 text-center text-sm text-slate-500">
        Aucune vente à facturer pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 text-left">Date</th>
              <th scope="col" className="px-5 py-3 text-left">Réf.</th>
              <th scope="col" className="px-5 py-3 text-left">Client</th>
              <th scope="col" className="px-5 py-3 text-left">Articles</th>
              <th scope="col" className="px-5 py-3 text-right">Total HT</th>
              <th scope="col" className="px-5 py-3 text-right">Net à payer</th>
              <th scope="col" className="px-5 py-3 text-center">État</th>
              <th scope="col" className="px-5 py-3 text-right">Facture</th>
            </tr>
          </thead>
          <tbody className="divide-y text-xs">
            {movements.map((movement) => (
              <tr key={movement.id} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(movement.date)}</td>
                <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-700">
                  {movement.reference ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-800">
                  {movement.client?.name ?? <span className="text-rose-600">Client non renseigné</span>}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  <span className="font-semibold text-slate-800">{movement.items_count}</span> ligne
                  {movement.items_count > 1 ? 's' : ''}
                  <span className="block max-w-[220px] truncate text-[11px] text-slate-400">
                    {movement.items.map((item) => item.productName).join(', ')}
                  </span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                  {tnd(movement.preview?.total_ht)}
                </td>
                <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                  {tnd(movement.preview?.net_payable)}
                </td>
                <td className="px-5 py-3 text-center">
                  <MovementReadinessBadge movement={movement} />
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {movement.has_invoice ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <FileCheck2 className="size-3.5" aria-hidden="true" />
                      {movement.invoice?.reference}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onGenerate(movement)}
                      className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 font-semibold text-cyan-800 transition hover:bg-cyan-100"
                    >
                      <Receipt className="size-3.5" aria-hidden="true" />
                      Générer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500">
        <span>
          {count} vente{count !== 1 ? 's' : ''} au total
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Précédent
            </button>
            <span className="font-medium">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sélecteur compact de ventes à facturer (utilisé dans la modale de génération)
 * @param {object} props
 * @param {string} props.selectedId
 * @param {(movement: object) => void} props.onSelect
 */
export function InvoiceableMovementPicker({ movements, loading, selectedId, onSelect }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!movements.length) {
    return (
      <p role="status" className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500">
        Aucune vente de type SORTIE (OUT) à facturer.
      </p>
    );
  }

  return (
    <ul role="listbox" aria-label="Ventes à facturer" className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
      {movements.map((movement) => {
        const selected = movement.id === selectedId;
        return (
          <li key={movement.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(movement)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                selected
                  ? 'border-cyan-600 bg-cyan-50 ring-1 ring-cyan-600'
                  : 'border-slate-200 bg-white hover:border-cyan-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {movement.client?.name ?? 'Client non renseigné'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(movement.date)}
                    {movement.reference ? ` · ${movement.reference}` : ''}
                    {' · '}
                    {movement.items_count} ligne{movement.items_count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-cyan-800">
                    {tnd(movement.preview?.net_payable)}
                  </p>
                  <MovementReadinessBadge movement={movement} />
                </div>
              </div>

              {!movement.readiness?.is_complete && (
                <MissingFieldsList fields={movement.readiness?.missing_fields ?? []} max={2} />
              )}
              {movement.has_invoice && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Déjà facturée ({movement.invoice?.reference})
                </p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Récapitulatif des lignes de la vente sélectionnée
 */
export function MovementSummary({ movement }) {
  if (!movement) return null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-xs">
          <caption className="sr-only">Lignes de la vente sélectionnée</caption>
          <thead className="border-b bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">Produit</th>
              <th scope="col" className="px-3 py-2 text-right">Qté</th>
              <th scope="col" className="px-3 py-2 text-right">PU HT</th>
              <th scope="col" className="px-3 py-2 text-right">TVA</th>
              <th scope="col" className="px-3 py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movement.items.map((item) => (
              <tr key={item.id ?? item.productId}>
                <td className="px-3 py-2 text-slate-700">{item.productName}</td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {item.quantity} {item.unitOfMeasure ?? ''}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {Number(item.unit_price ?? 0).toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">{item.tva_rate}%</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                  {tnd(item.total_ht)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-slate-50 text-xs">
            <tr>
              <th scope="row" colSpan={4} className="px-3 py-2 text-right font-semibold text-slate-600">
                Total HT
              </th>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                {tnd(movement.preview?.total_ht)}
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="px-3 py-2 text-right font-semibold text-slate-600">
                TVA ({movement.preview?.tva_breakdown?.map((t) => `${t.rate}%`).join(' / ') || '0%'})
              </th>
              <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                {tnd(movement.preview?.tva_amount)}
              </td>
            </tr>
            <tr>
              <th scope="row" colSpan={4} className="px-3 py-2 text-right font-semibold text-slate-600">
                Timbre fiscal
              </th>
              <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                {tnd(movement.preview?.timbre_fiscal)}
              </td>
            </tr>
            <tr className="border-t">
              <th scope="row" colSpan={4} className="px-3 py-2 text-right font-bold text-slate-900">
                Net à payer
              </th>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-cyan-800">
                {tnd(movement.preview?.net_payable)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] italic text-slate-500">
        {movement.preview?.amount_in_words}
      </p>
    </div>
  );
}

/**
 * Bloc "prêt à facturer" affiché quand aucune information bloquante ne manque
 */
export function ReadyBanner() {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      Toutes les informations sont disponibles : la facture peut être générée.
    </p>
  );
}