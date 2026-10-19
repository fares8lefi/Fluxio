import { toISODate } from '@/lib/fiscal';

/** Périodes proposées sur la liste des factures */
export const INVOICE_PERIODS = [
  { key: 'month', label: 'Mois en cours' },
  { key: 'prev_month', label: 'Mois précédent' },
  { key: 'year', label: 'Exercice en cours' },
  { key: 'custom', label: 'Personnalisée' },
];

/**
 * Dates de début et de fin (AAAA-MM-JJ, incluses) d'une période.
 * Pour « custom », renvoie la plage saisie telle quelle.
 */
export function periodRange(key, custom = {}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'prev_month':
      return { from: toISODate(new Date(y, m - 1, 1)), to: toISODate(new Date(y, m, 0)) };
    case 'year':
      return { from: toISODate(new Date(y, 0, 1)), to: toISODate(now) };
    case 'all':
      return { from: HISTORY_START, to: toISODate(now) };
    case 'custom':
      return { from: custom.from ?? '', to: custom.to ?? '' };
    case 'month':
    default:
      return { from: toISODate(new Date(y, m, 1)), to: toISODate(now) };
  }
}

/** Relevé : tout l'historique d'abord, puis les périodes habituelles */
export const STATEMENT_PERIODS = [{ key: 'all', label: "Tout l'historique" }, ...INVOICE_PERIODS];

/** Début de « tout l'historique » : antérieur à toute donnée de l'application */
const HISTORY_START = '2000-01-01';

export const isValidRange = ({ from, to }) => Boolean(from && to && from <= to);

/** « du 01/10/2026 au 16/10/2026 » */
export function rangeLabel({ from, to }) {
  const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR');
  if (from === HISTORY_START) return `jusqu'au ${fmt(to)}`;
  return `du ${fmt(from)} au ${fmt(to)}`;
}
