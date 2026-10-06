/** Formatage partagé des graphiques « Pilotage » (conventions du projet) */

/** Montant complet, 3 décimales comme le reste de l'application (TND) */
export const formatMoney = (value) => Number(value ?? 0).toFixed(3);

/** Montant compact pour les axes (1.2k, 3.4M) */
export const formatCompact = (value) => {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  if (abs >= 1000000) return `${(amount / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${(amount / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return amount.toFixed(abs < 10 ? 1 : 0);
};

/** Pourcentage lisible (virgule décimale française) */
export const formatPercent = (value, digits = 1) =>
  `${Number(value ?? 0).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} %`;

/** Entier lisible */
export const formatInt = (value) =>
  Number(value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

/** Date ISO → « 12 oct. 2026 » */
export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/** Tronque les libellés longs pour les axes */
export const truncateLabel = (value, max = 16) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/** Palette partagée (thème clair, cf. composants/charts existants) */
export const CHART_COLORS = {
  cyan: '#0891b2',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  indigo: '#4f46e5',
  slate: '#94a3b8',
};

/** Style d'axe commun */
export const axisTick = { fill: '#64748b', fontSize: 11 };
export const gridStroke = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false };

export const moneyAxis = (formatter = formatCompact) => ({
  tickLine: false,
  axisLine: false,
  tick: axisTick,
  tickFormatter: formatter,
  width: 52,
});