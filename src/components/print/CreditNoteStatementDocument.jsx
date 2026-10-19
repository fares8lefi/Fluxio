import { Fragment } from 'react';
import { formatDate, formatTND } from '@/lib/fiscal';

/**
 * Relevé des avoirs d'un client — même langage que FiscalDocument : noir et
 * blanc, A4 portrait, grille encadrée qui remplit la feuille, montants à
 * 3 décimales. Chaque avoir ouvre un groupe de lignes (référence, facture
 * d'origine, motif), suivi de son total HT ; le bas du relevé récapitule
 * chaque avoir puis l'ensemble.
 *
 * @param {{name, address, phone, matriculeFiscale}} seller
 * @param {{name, address, phone, matriculeFiscale, codeTva}} client
 * @param {string} periodText — ex. « du 01/01/2026 au 16/10/2026 »
 * @param {ReturnType<import('@/features/invoices/credit-note-statement').buildCreditNoteStatement>} statement
 */
export function CreditNoteStatementDocument({ seller, client, periodText, statement }) {
  const { notes, tvaByRate, totals } = statement;
  const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

  return (
    <article className="fiscal-doc relative mx-auto flex flex-col bg-white font-sans text-[11px] leading-snug text-black">
      {/* ── En-tête ── */}
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
            Relevé des avoirs
          </h1>
          <table className="mt-3 ml-auto text-right">
            <tbody>
              <tr>
                <td className="pr-3 text-black/60">Période</td>
                <td className="font-semibold">{periodText}</td>
              </tr>
              <tr>
                <td className="pr-3 text-black/60">Édité le</td>
                <td className="font-semibold">{formatDate(new Date())}</td>
              </tr>
              <tr>
                <td className="pr-3 text-black/60">Avoirs</td>
                <td className="font-semibold tabular-nums">{totals.count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </header>

      {/* ── Client ── */}
      <section className="mt-4 flex items-end justify-between gap-8">
        <p className="max-w-[45%] text-black/70">
          Montants hors taxes et toutes taxes, en dinars, en faveur du client.
        </p>
        <div className="w-1/2 rounded-sm border border-black/40 px-4 py-3">
          <p className="text-[9.5px] text-black/60">Client</p>
          <p className="mt-0.5 text-[13px] font-bold">{dash(client?.name)}</p>
          <p className="text-black/75">{dash(client?.address)}</p>
          {client?.phone && <p className="text-black/75">Tél. {client.phone}</p>}
          <p className="mt-1">
            <span className="text-black/60">Matricule fiscal</span>{' '}
            <span className="font-semibold tabular-nums">{dash(client?.matriculeFiscale)}</span>
          </p>
        </div>
      </section>

      {/* ── Lignes, groupées par avoir ── */}
      <table className="fiscal-lines mt-6 w-full flex-1 border-collapse border-[1.5px] border-black">
        <thead>
          <tr className="border-b-[1.5px] border-black bg-black/[0.05]">
            <Th className="w-[12%] text-left">Réf.</Th>
            <Th className="text-left">Désignation</Th>
            <Th className="w-[8%] text-center">Unité</Th>
            <Th className="w-[8%] text-right">Qté</Th>
            <Th className="w-[13%] text-right">P.U. HT</Th>
            <Th className="w-[7%] text-right">TVA</Th>
            <Th className="w-[14%] text-right">Total HT</Th>
          </tr>
        </thead>
        {/* Un seul tbody : la ligne de remplissage reçoit toute la hauteur libre */}
        <tbody>
        {notes.map((note) => (
          <Fragment key={note.reference}>
            <tr className="break-inside-avoid break-after-avoid border-t-[1.5px] border-black bg-black/[0.035]">
              <td colSpan={7} className="px-2 py-1.5">
                <span className="text-[12px] font-bold tabular-nums">{note.reference}</span>
                <span className="text-black/70"> du {formatDate(note.date)}</span>
                {note.original && (
                  <span className="text-black/70">
                    , sur la facture <span className="font-semibold text-black">{note.original.reference}</span> du{' '}
                    {formatDate(note.original.date)}
                  </span>
                )}
                {note.reason && <span className="block text-[10px] text-black/60">Motif : {note.reason}</span>}
              </td>
            </tr>
            {note.lines.map((l, i) => (
              <tr key={i} className="break-inside-avoid">
                <Td className="tabular-nums text-black/70">{dash(l.code)}</Td>
                <Td className="font-medium">{l.name}</Td>
                <Td className="text-center">{dash(l.unit)}</Td>
                <Td className="text-right tabular-nums">{l.quantity}</Td>
                <Td className="text-right tabular-nums">{formatTND(l.unitPriceHT)}</Td>
                <Td className="text-right tabular-nums">{l.tvaRate === null ? 'Susp.' : `${l.tvaRate} %`}</Td>
                <Td className="text-right font-semibold tabular-nums">{formatTND(l.totalHT)}</Td>
              </tr>
            ))}
            {note.lines.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-black/50">
                  Lignes indisponibles : la facture d'origine n'a pas de bon de livraison
                </Td>
              </tr>
            )}
            <tr className="border-t border-black/40">
              <Td colSpan={6} className="text-right text-black/70">
                Total HT de l'avoir {note.reference}
              </Td>
              <Td className="text-right font-bold tabular-nums">{formatTND(note.ht)}</Td>
            </tr>
          </Fragment>
        ))}
          {/* Remplissage : prolonge les filets de colonnes jusqu'au récapitulatif */}
          <tr aria-hidden="true" className="fiscal-filler">
            {Array.from({ length: 7 }, (_, i) => (
              <td key={i} className="border-x border-black/25 p-0" />
            ))}
          </tr>
        </tbody>
      </table>

      {/* ── Récapitulatif par avoir ── */}
      <section className="mt-4 break-inside-avoid">
        <table className="w-full border-collapse">
          <caption className="pb-1 text-left text-[9.5px] text-black/60">Récapitulatif par avoir</caption>
          <thead>
            <tr className="border-b border-black/40">
              <Th plain className="text-left">Avoir</Th>
              <Th plain className="text-left">Date</Th>
              <Th plain className="text-left">Facture d'origine</Th>
              <Th plain className="text-right">Total HT</Th>
              <Th plain className="text-right">TVA</Th>
              <Th plain className="text-right">Total TTC</Th>
              <Th plain className="text-right">Retenue annulée</Th>
              <Th plain className="text-right">Net crédité</Th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.reference}>
                <Td plain className="font-semibold tabular-nums">{n.reference}</Td>
                <Td plain>{formatDate(n.date)}</Td>
                <Td plain className="tabular-nums">{dash(n.original?.reference)}</Td>
                <Td plain className="text-right tabular-nums">{formatTND(n.ht)}</Td>
                <Td plain className="text-right tabular-nums">{formatTND(n.tva)}</Td>
                <Td plain className="text-right tabular-nums">{formatTND(n.ttc)}</Td>
                <Td plain className="text-right tabular-nums">{n.rs ? formatTND(n.rs) : '—'}</Td>
                <Td plain className="text-right font-semibold tabular-nums">{formatTND(n.net)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Récapitulatif TVA + totaux, avec le pied de page : jamais séparés ── */}
      <div className="break-inside-avoid">
      <section className="mt-3 flex items-start justify-between gap-8">
        <table className="w-[42%] border-collapse">
          <caption className="pb-1 text-left text-[9.5px] text-black/60">Récapitulatif TVA</caption>
          <thead>
            <tr className="border-b border-black/40">
              <Th plain className="text-left">Taux TVA</Th>
              <Th plain className="text-right">Base HT</Th>
              <Th plain className="text-right">Montant TVA</Th>
            </tr>
          </thead>
          <tbody>
            {tvaByRate.map((t) => (
              <tr key={t.rate ?? 'suspension'}>
                <Td plain>{t.rate === null ? 'Suspension' : `${t.rate} %`}</Td>
                <Td plain className="text-right tabular-nums">{formatTND(t.base_ht)}</Td>
                <Td plain className="text-right tabular-nums">{formatTND(t.tva_amount)}</Td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-[46%] border-collapse">
          <tbody>
            <TotalRow label="Quantités créditées" value={totals.quantity} raw />
            <TotalRow label="Total HT" value={totals.ht} />
            <TotalRow label="Total TVA" value={totals.tva} />
            <TotalRow label="Total TTC" value={totals.ttc} strong />
            {totals.rs > 0 && <TotalRow label="Retenues à la source annulées" value={-totals.rs} />}
            <tr className="bg-black text-white">
              <td className="px-2 py-2 text-[12px] font-bold">Net en faveur du client</td>
              <td className="px-2 py-2 text-right text-[14px] font-bold tabular-nums">{formatTND(totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Pied de page ── */}
      <footer className="mt-5 border-t border-black/30 pt-2 text-center text-[9px] text-black/60">
        {[seller?.name, seller?.address, seller?.matriculeFiscale && `MF ${seller.matriculeFiscale}`, seller?.phone && `Tél. ${seller.phone}`]
          .filter(Boolean)
          .join(', ')}
      </footer>
      </div>
    </article>
  );
}

function TotalRow({ label, value, strong = false, raw = false }) {
  return (
    <tr className={strong ? 'border-t border-black font-bold' : ''}>
      <td className="px-2 py-0.5">{label}</td>
      <td className="px-2 py-0.5 text-right tabular-nums">{raw ? value : formatTND(value)}</td>
    </tr>
  );
}

/** plain : sans filets verticaux (tableaux de récapitulatif) */
function Th({ className = '', plain = false, children }) {
  return (
    <th className={`${plain ? '' : 'border-x border-black/25'} px-2 py-1.5 text-[9.5px] font-semibold ${className}`}>
      {children}
    </th>
  );
}

function Td({ className = '', plain = false, children, ...props }) {
  return (
    <td
      className={`border-b ${plain ? 'border-black/15 py-1' : 'border-x border-x-black/25 border-b-black/10 py-1.5'} px-2 align-top ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
