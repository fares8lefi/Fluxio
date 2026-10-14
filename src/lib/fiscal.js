/**
 * Utilitaires fiscaux tunisiens côté client (affichage des documents).
 * Les montants faisant foi sont calculés et stockés par le backend
 * (src/utils/taxEngine.js) ; ce module ne sert qu'au rendu.
 */

/** Montant en dinars, 3 décimales (millimes) : 1 234,500 */
export function formatTND(value) {
  const n = Number(value) || 0;
  // Espace fine insécable (U+202F) → insécable classique : présente dans toutes les polices
  return n
    .toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    .replace(/\u202f/g, '\u00a0');
}

/** Date courte : 14/10/2026 */
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Matricule fiscal : 7 chiffres + clé, puis code TVA / catégorie / n° établissement
// ex. 1234567A/A/M/000 (les « / » sont parfois omis)
const MF_PATTERN = /^\d{7}[A-Z]\/?[A-Z]\/?[A-Z]\/?\d{3}$/i;

export function isValidMatriculeFiscal(mf) {
  return MF_PATTERN.test(String(mf ?? '').replace(/\s/g, ''));
}

/**
 * Ventilation de la TVA par taux à partir de lignes { totalHT, tvaRate }
 * @returns {{ rate, base_ht, tva_amount }[]}
 */
export function tvaBreakdownFromLines(lines, { suspended = false } = {}) {
  const groups = new Map();
  for (const line of lines) {
    const rate = Number(line.tvaRate) || 0;
    groups.set(rate, (groups.get(rate) ?? 0) + (Number(line.totalHT) || 0));
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, base]) => ({
      rate,
      base_ht: round3(base),
      tva_amount: suspended ? 0 : round3((base * rate) / 100),
    }));
}

export const round3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

/**
 * Vérifie les mentions obligatoires (art. 18 du Code de la TVA) avant impression.
 * Retourne la liste des manques, affichée dans l'aperçu (jamais imprimée).
 */
export function missingMentions({ seller, party, requirePartyMf = false }) {
  const issues = [];
  if (!seller?.name) issues.push("Raison sociale de l'entreprise manquante");
  if (!seller?.matriculeFiscale) issues.push("Matricule fiscal de l'entreprise manquant");
  else if (!isValidMatriculeFiscal(seller.matriculeFiscale))
    issues.push(
      `Matricule fiscal de l'entreprise au format inhabituel (« ${seller.matriculeFiscale} », attendu : 1234567A/A/M/000)`
    );
  if (!seller?.address) issues.push("Adresse de l'entreprise manquante");

  if (party !== undefined) {
    if (!party) issues.push('Aucun client / tiers renseigné');
    else if (requirePartyMf) {
      if (!party.matriculeFiscale) issues.push('Matricule fiscal du client manquant');
      else if (!isValidMatriculeFiscal(party.matriculeFiscale))
        issues.push(
          `Matricule fiscal du client au format inhabituel (« ${party.matriculeFiscale} »)`
        );
      if (!party.address) issues.push('Adresse du client manquante');
    }
  }
  return issues;
}

// ── Montant en toutes lettres (même règles que le backend) ────────────────

const ONES = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

function below100(n, final) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (t <= 6) return o === 0 ? TENS[t] : TENS[t] + (o === 1 ? ' et un' : '-' + ONES[o]);
  if (t === 7) return 'soixante' + (o === 1 ? ' et onze' : '-' + ONES[10 + o]);
  if (n === 80) return final ? 'quatre-vingts' : 'quatre-vingt';
  return 'quatre-vingt-' + ONES[n - 80];
}

function below1000(n, final) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h === 1) parts.push('cent');
  else if (h > 1) parts.push(ONES[h] + ' cent' + (rest === 0 && final ? 's' : ''));
  if (rest > 0) parts.push(below100(rest, final));
  return parts.join(' ');
}

function integerToWords(n) {
  if (n === 0) return 'zéro';
  const parts = [];
  for (const [size, noun] of [[1e9, 'milliard'], [1e6, 'million']]) {
    const count = Math.floor(n / size);
    if (count > 0) {
      parts.push(below1000(count, true) + ' ' + noun + (count > 1 ? 's' : ''));
      n %= size;
    }
  }
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : below1000(thousands, false) + ' mille');
    n %= 1000;
  }
  if (n > 0) parts.push(below1000(n, true));
  return parts.join(' ');
}

/** 1250.75 → « Mille deux cent cinquante dinars et sept cent cinquante millimes » */
export function amountToWords(amount) {
  const rounded = Math.round(Math.abs(Number(amount) || 0) * 1000);
  const dinars = Math.floor(rounded / 1000);
  const millimes = rounded % 1000;
  if (dinars === 0 && millimes === 0) return 'Zéro dinar';

  const parts = [];
  if (dinars > 0) {
    const roundScale = dinars >= 1e6 && dinars % 1e6 === 0;
    parts.push(integerToWords(dinars) + (roundScale ? ' de' : '') + (dinars > 1 ? ' dinars' : ' dinar'));
  }
  if (millimes > 0) parts.push(integerToWords(millimes) + (millimes > 1 ? ' millimes' : ' millime'));

  const result = parts.join(' et ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Date locale au format AAAA-MM-JJ (champs <input type="date">).
 * Ne pas utiliser toISOString() : il passe en UTC et, en Tunisie (UTC+1),
 * minuit local devient la veille.
 */
export function toISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
