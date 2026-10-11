import { useCallback, useMemo, useState } from 'react';

/** Préréglages proposés par la page « Pilotage » */
export const PERIOD_PRESETS = [
  { key: '30d', label: '30 j', title: '30 derniers jours' },
  { key: 'month', label: 'Mois en cours', title: 'Mois en cours' },
  { key: 'prev_month', label: 'Mois précédent', title: 'Mois précédent' },
  { key: 'year', label: 'Exercice', title: 'Exercice en cours' },
  { key: 'custom', label: 'Personnalisée', title: 'Plage de dates personnalisée' },
];

const FALLBACK_LABELS = {
  '30d': '30 derniers jours',
  month: 'Mois en cours',
  prev_month: 'Mois précédent',
  year: 'Exercice en cours',
  custom: 'Période personnalisée',
};

const EMPTY_STATE = { period: 'month', startDate: '', endDate: '' };

/**
 * État de la période sélectionnée sur la page « Pilotage ».
 * Expose la query string consommée par `src/services/managerService.js` ainsi
 * qu'un libellé de repli (le libellé définitif vient de la réponse de l'API).
 */
export function useManagerPeriod() {
  const [range, setRange] = useState(EMPTY_STATE);

  // Référence stable : c'est la dépendance des requêtes de la page.
  const query = useMemo(
    () => ({
      period: range.period,
      startDate: range.period === 'custom' ? range.startDate : undefined,
      endDate: range.period === 'custom' ? range.endDate : undefined,
    }),
    [range.period, range.startDate, range.endDate]
  );

  const isCustom = range.period === 'custom';
  const customRangeValid =
    !isCustom || (!!range.startDate && !!range.endDate && range.startDate <= range.endDate);

  const setPreset = useCallback((key) => {
    setRange((current) => {
      if (key !== 'custom') return { period: key, startDate: '', endDate: '' };
      return { period: 'custom', startDate: current.startDate, endDate: current.endDate };
    });
  }, []);

  const setCustomRange = useCallback((next) => {
    setRange((current) => ({
      period: 'custom',
      startDate: next?.startDate ?? current.startDate,
      endDate: next?.endDate ?? current.endDate,
    }));
  }, []);

  const reset = useCallback(() => setRange(EMPTY_STATE), []);

  return {
    ...range,
    isCustom,
    customRangeValid,
    query,
    fallbackLabel: FALLBACK_LABELS[range.period] ?? FALLBACK_LABELS.month,
    setPreset,
    setCustomRange,
    reset,
  };
}