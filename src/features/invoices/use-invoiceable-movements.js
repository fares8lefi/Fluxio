import { useCallback, useEffect, useState } from 'react';
import { getMovementsForInvoice } from '@/services/invoiceService';

const EMPTY_RESULT = {
  movements: [],
  count: 0,
  company: null,
  company_missing_fields: [],
  summary: { total: 0, pending: 0, ready: 0, missing_info: 0, already_invoiced: 0 },
};

const stripUndefined = (filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''));

/**
 * Charge les mouvements OUT facturables (avec les informations manquantes)
 * @param {object} filters — { page, search, onlyNotInvoiced, onlyInvoiced, movementId, clientId, startDate, endDate }
 */
export function useInvoiceableMovements(filters = {}) {
  const [result, setResult] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = JSON.stringify(stripUndefined(filters));

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMovementsForInvoice(JSON.parse(query));
      setResult({
        movements: data?.movements ?? [],
        count: data?.count ?? 0,
        company: data?.company ?? null,
        company_missing_fields: data?.company_missing_fields ?? [],
        summary: data?.summary ?? EMPTY_RESULT.summary,
      });
    } catch (err) {
      setError(err.message || 'Impossible de récupérer les ventes à facturer');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...result, loading, error, reload };
}