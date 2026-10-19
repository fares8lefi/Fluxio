import { formatTND } from '@/lib/fiscal';

/** Montant aligné : chiffres tabulaires, devise discrète */
export function Money({ value, className = '', unit = true }) {
  return (
    <span className={`figure whitespace-nowrap ${className}`}>
      {formatTND(value)}
      {unit && <span className="ml-1 text-[0.8em] font-normal text-slate-400">TND</span>}
    </span>
  );
}

/**
 * En-tête de la facturation : une phrase sur ce qui reste à encaisser, puis
 * la barre de règlement (encaissé / reste à encaisser) et les avoirs.
 */
export function BillingSummary({ totalTTC, totalPaid, totalPending, openCount, creditNoteCount, loading }) {
  const collected = totalTTC > 0 ? Math.min(100, (totalPaid / totalTTC) * 100) : 0;

  return (
    <section aria-label="Situation des encaissements" className="space-y-5">
      <h2 className="text-3xl leading-tight font-semibold text-slate-900 sm:text-4xl">
        {loading ? (
          <span className="text-slate-300">Calcul des encaissements…</span>
        ) : totalPending > 0 ? (
          <>
            <Money value={totalPending} unit={false} /> TND à encaisser sur {openCount}{' '}
            {openCount > 1 ? 'factures' : 'facture'}.
          </>
        ) : totalTTC > 0 ? (
          'Toutes les factures sont réglées.'
        ) : (
          'Aucune facture émise pour le moment.'
        )}
      </h2>

      {!loading && totalTTC > 0 && (
        <div className="rounded-xl border bg-white p-5">
          {/* Barre de règlement : la part encaissée du total facturé */}
          <div
            className="flex h-3 overflow-hidden rounded-full bg-amber-100"
            role="img"
            aria-label={`${Math.round(collected)} % du montant facturé est encaissé`}
          >
            <span className="bg-emerald-600 transition-[width] duration-500" style={{ width: `${collected}%` }} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <span className="size-2 rounded-full bg-emerald-600" aria-hidden="true" />
                Encaissé
              </dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                <Money value={totalPaid} />
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <span className="size-2 rounded-full bg-amber-400" aria-hidden="true" />
                Reste à encaisser
              </dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                <Money value={totalPending} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Total facturé TTC</dt>
              <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                <Money value={totalTTC} />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Avoirs émis</dt>
              <dd className="figure mt-0.5 text-lg font-semibold text-slate-900">{creditNoteCount}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

/**
 * Résumé des ventes à facturer, en une ligne : combien sont prêtes,
 * combien demandent des informations.
 * @param {object} summary — { total, ready, missing_info, already_invoiced }
 */
export function SalesPipelineSummary({ summary }) {
  const ready = summary?.ready ?? 0;
  const missing = summary?.missing_info ?? 0;
  const invoiced = summary?.already_invoiced ?? 0;

  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-emerald-600" aria-hidden="true" />
        <span className="figure font-semibold text-slate-900">{ready}</span> prêtes à facturer
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="figure font-semibold text-slate-900">{missing}</span> à compléter
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
        <span className="figure font-semibold text-slate-900">{invoiced}</span> déjà facturées
      </span>
    </p>
  );
}
