import { formatDate, formatTND } from '@/lib/fiscal';

/**
 * FiscalDocument — mise en page commune des documents commerciaux tunisiens
 * (facture, avoir, devis, bons de livraison / réception / retour).
 *
 * Volontairement sobre : noir et blanc, filets horizontaux seulement, A4
 * portrait, montants à 3 décimales. Le titre du document (Facture, Devis…)
 * est le seul élément en grand, en Archivo élargi. Les mentions de l'art. 18 du Code de la TVA sont toujours
 * présentes ; une valeur absente s'affiche « — » au lieu d'être masquée.
 *
 * @param {string}   title          — FACTURE, FACTURE D'AVOIR, DEVIS, BON DE LIVRAISON…
 * @param {string}   reference
 * @param {string}   date
 * @param {{label, value}[]} [meta] — infos complémentaires sous la date
 * @param {{name, matriculeFiscale, address, phone}} seller
 * @param {{label, name, matriculeFiscale, codeTva, address, phone}|null} [party]
 * @param {{code, name, unit, quantity, unitPriceHT, discount, tvaRate, totalHT}[]} lines
 * @param {boolean}  [showPrices=true]
 * @param {{rate, base_ht, tva_amount}[]} [tvaBreakdown]
 * @param {{label, value, emphasis?: 'total'|'net', raw?: boolean}[]} [totals] — raw : valeur non monétaire
 * @param {string}   [amountInWords]
 * @param {string}   [wordsLabel]
 * @param {string[]} [notices]      — mentions encadrées (suspension TVA, avoir…)
 * @param {{label, value}[]} [footnotes] — conditions de paiement, notes…
 * @param {string[]} [signatures]
 * @param {string}   [watermark]    — ex. ANNULÉ
 */
export function FiscalDocument({
  title,
  reference,
  date,
  meta = [],
  seller,
  party,
  lines,
  showPrices = true,
  tvaBreakdown = [],
  totals = [],
  amountInWords,
  wordsLabel = 'Arrêtée la présente facture à la somme de',
  notices = [],
  footnotes = [],
  signatures = [],
  watermark,
}) {
  const showDiscount = showPrices && lines.some((l) => Number(l.discount) > 0);
  const columnCount = 4 + (showPrices ? 3 : 0) + (showDiscount ? 1 : 0);
  const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

  return (
    <article className="fiscal-doc relative mx-auto flex flex-col bg-white font-sans text-[11px] leading-snug text-black">
      {watermark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="-rotate-30 border-4 border-black/15 px-6 py-2 text-7xl font-black tracking-widest text-black/15">
            {watermark}
          </span>
        </div>
      )}

      {/* ── En-tête : émetteur à gauche, document à droite ── */}
      <header className="flex items-start justify-between gap-8 border-b-2 border-black pb-5">
        <div className="min-w-0 max-w-[55%]">
          <p className="text-[15px] leading-tight font-bold">{dash(seller?.name)}</p>
          <p className="mt-1.5 text-black/75">{dash(seller?.address)}</p>
          {seller?.phone && <p className="text-black/75">Tél. {seller.phone}</p>}
          <p className="mt-1.5">
            <span className="text-black/60">Matricule fiscal</span>{' '}
            <span className="font-semibold tabular-nums">{dash(seller?.matriculeFiscale)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <h1 className="text-[28px] leading-none font-semibold" style={{ fontStretch: '125%', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <table className="mt-3 ml-auto text-right">
            <tbody>
              <tr>
                <td className="pr-3 text-black/60">N°</td>
                <td className="text-[12px] font-bold tabular-nums">{reference}</td>
              </tr>
              <tr>
                <td className="pr-3 text-black/60">Date</td>
                <td className="font-semibold">{formatDate(date)}</td>
              </tr>
              {meta.filter((m) => m.value).map((m) => (
                <tr key={m.label}>
                  <td className="pr-3 text-black/60">{m.label}</td>
                  <td className="font-semibold">{m.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>

      {/* ── Destinataire ── */}
      {party !== undefined && (
        <section className="mt-4 flex justify-end">
          {/* Placé à droite : visible dans la fenêtre d'une enveloppe */}
          <div className="w-1/2 rounded-sm border border-black/40 px-4 py-3">
            <p className="text-[9.5px] text-black/60">{party?.label ?? 'Client'}</p>
            <p className="mt-0.5 text-[13px] font-bold">{dash(party?.name)}</p>
            <p className="text-black/75">{dash(party?.address)}</p>
            {party?.phone && <p className="text-black/75">Tél. {party.phone}</p>}
            {party && 'matriculeFiscale' in party && (
              <p className="mt-1">
                <span className="text-black/60">Matricule fiscal</span>{' '}
                <span className="font-semibold tabular-nums">{dash(party.matriculeFiscale)}</span>
              </p>
            )}
            {party?.codeTva && (
              <p>
                <span className="text-black/60">Code TVA</span> <span className="tabular-nums">{party.codeTva}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Mentions particulières ── */}
      {notices.map((n) => (
        <p key={n} className="mt-3 border-l-4 border-black bg-black/[0.04] px-3 py-1.5 font-semibold">
          {n}
        </p>
      ))}

      {/* ── Lignes : grille encadrée qui s'étire jusqu'aux totaux pour remplir la feuille ── */}
      <table className="fiscal-lines mt-6 w-full flex-1 border-collapse border-[1.5px] border-black">
        <thead>
          <tr className="border-b-[1.5px] border-black bg-black/[0.05]">
            <Th className="w-[12%] text-left">Réf.</Th>
            <Th className="text-left">Désignation</Th>
            <Th className="w-[8%] text-center">Unité</Th>
            <Th className="w-[8%] text-right">Qté</Th>
            {showPrices && <Th className="w-[13%] text-right">P.U. HT</Th>}
            {showDiscount && <Th className="w-[7%] text-right">Rem.</Th>}
            {showPrices && <Th className="w-[7%] text-right">TVA</Th>}
            {showPrices && <Th className="w-[14%] text-right">Total HT</Th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="break-inside-avoid">
              <Td className="tabular-nums text-black/70">{dash(l.code)}</Td>
              <Td className="font-medium">{l.name}</Td>
              <Td className="text-center">{dash(l.unit)}</Td>
              <Td className="text-right tabular-nums">{l.quantity}</Td>
              {showPrices && <Td className="text-right tabular-nums">{formatTND(l.unitPriceHT)}</Td>}
              {showDiscount && (
                <Td className="text-right tabular-nums">{Number(l.discount) > 0 ? `${l.discount} %` : ''}</Td>
              )}
              {showPrices && (
                <Td className="text-right tabular-nums">{l.tvaRate === null ? 'Susp.' : `${l.tvaRate} %`}</Td>
              )}
              {showPrices && <Td className="text-right font-semibold tabular-nums">{formatTND(l.totalHT)}</Td>}
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <Td colSpan={8} className="py-4 text-center text-black/50">Aucune ligne</Td>
            </tr>
          )}
          {/* Ligne de remplissage : prend la hauteur restante, prolonge les filets de colonnes */}
          <tr aria-hidden="true" className="fiscal-filler">
            {Array.from({ length: columnCount }, (_, i) => (
              <td key={i} className="border-x border-black/25 p-0" />
            ))}
          </tr>
        </tbody>
      </table>

      {/* ── Récapitulatif TVA + totaux ── */}
      {(tvaBreakdown.length > 0 || totals.length > 0) && (
        <section className="mt-4 flex items-start justify-between gap-8 break-inside-avoid">
          {tvaBreakdown.length > 0 ? (
            <table className="w-[42%] border-collapse">
              <caption className="pb-1 text-left text-[9.5px] text-black/60">Récapitulatif TVA</caption>
              <thead>
                <tr className="border-b border-black/40">
                  <Th ruled={false} className="text-left">Taux TVA</Th>
                  <Th ruled={false} className="text-right">Base HT</Th>
                  <Th ruled={false} className="text-right">Montant TVA</Th>
                </tr>
              </thead>
              <tbody>
                {tvaBreakdown.map((t) => (
                  <tr key={t.rate}>
                    <Td ruled={false}>{t.rate} %</Td>
                    <Td ruled={false} className="text-right tabular-nums">{formatTND(t.base_ht)}</Td>
                    <Td ruled={false} className="text-right tabular-nums">{formatTND(t.tva_amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span />
          )}

          <table className="w-[46%] border-collapse">
            <tbody>
              {totals.map((t) => (
                <tr
                  key={t.label}
                  className={
                    t.emphasis === 'net'
                      ? 'bg-black text-white'
                      : t.emphasis === 'total'
                        ? 'border-t border-black font-bold'
                        : ''
                  }
                >
                  <td className={`px-2 ${t.emphasis === 'net' ? 'py-2 text-[12px] font-bold' : 'py-1'}`}>{t.label}</td>
                  <td
                    className={`px-2 text-right tabular-nums ${
                      t.emphasis === 'net' ? 'py-2 text-[14px] font-bold' : t.emphasis ? 'py-1 font-bold' : 'py-1'
                    }`}
                  >
                    {t.raw ? t.value : formatTND(t.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {amountInWords && (
        <p className="mt-5 break-inside-avoid">
          {wordsLabel} : <span className="font-bold">{amountInWords}</span>
        </p>
      )}

      {footnotes.filter((f) => f.value).map((f) => (
        <p key={f.label} className="mt-1.5">
          <span className="font-semibold">{f.label} :</span> {f.value}
        </p>
      ))}

      {/* ── Signatures ── */}
      {signatures.length > 0 && (
        <section
          className="mt-8 grid gap-8 break-inside-avoid"
          style={{ gridTemplateColumns: `repeat(${signatures.length}, minmax(0, 1fr))` }}
        >
          {signatures.map((s) => (
            <div key={s} className="h-28 rounded-sm border border-black/40 p-2">
              <p className="text-[9.5px] text-black/60">{s}</p>
            </div>
          ))}
        </section>
      )}

      {/* ── Pied de page ── */}
      <footer className="mt-8 border-t border-black/30 pt-2 text-center text-[9px] text-black/60">
        {[seller?.name, seller?.address, seller?.matriculeFiscale && `MF ${seller.matriculeFiscale}`, seller?.phone && `Tél. ${seller.phone}`]
          .filter(Boolean)
          .join(', ')}
      </footer>
    </article>
  );
}

/** ruled : filets verticaux de colonne (grille des lignes uniquement) */
function Th({ className = '', ruled = true, children }) {
  return (
    <th className={`${ruled ? 'border-x border-black/25' : ''} px-2 py-1.5 text-[9.5px] font-semibold ${className}`}>
      {children}
    </th>
  );
}

function Td({ className = '', ruled = true, children, ...props }) {
  return (
    <td
      className={`border-b ${ruled ? 'border-x border-x-black/25 border-b-black/10' : 'border-black/15'} px-2 py-1.5 align-top ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
