import { request } from './apiClient';

const BASE = '/api/dashboard/manager';

/**
 * Construit la query string de la période.
 * Les valeurs vides sont ignorées pour ne jamais envoyer `undefined`.
 * @param {{period: string, startDate?: string, endDate?: string}} period
 */
export const buildPeriodQuery = (period) => {
  const params = new URLSearchParams();
  Object.entries(period || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

/** Tuiles « vue d'ensemble » avec variation vs période précédente */
export const getManagerKpis = (period) =>
  request(`${BASE}/kpis${buildPeriodQuery(period)}`);

/** Bloc Ventes & facturation (CA, recouvrement, TVA, série 12 mois) */
export const getManagerSales = (period) =>
  request(`${BASE}/sales${buildPeriodQuery(period)}`);

/** Bloc Clients (top, concentration, clients à risque) */
export const getManagerClients = (period) =>
  request(`${BASE}/clients${buildPeriodQuery(period)}`);

/** Bloc Stock & achats (valorisation, couverture, anomalies) */
export const getManagerStock = (period) =>
  request(`${BASE}/stock${buildPeriodQuery(period)}`);

/** Bloc Activité & conformité */
export const getManagerActivity = (period) =>
  request(`${BASE}/activity${buildPeriodQuery(period)}`);