import { request } from './apiClient';

const BASE = '/api/dashboard';

/**
 * Récupère le résumé global des KPIs du dashboard
 */
export const getDashboardSummary = () => request(`${BASE}/summary`);

/**
 * Récupère les données de chiffre d'affaires
 * @param {'month' | 'week' | 'year'} period
 */
export const getDashboardRevenue = (period = 'month') =>
  request(`${BASE}/revenue?period=${period}`);

/**
 * Récupère les top 5 produits les plus vendus
 */
export const getTopProducts = () => request(`${BASE}/topProducts`);

/**
 * Récupère la synthèse de santé du stock et comparaison des seuils
 */
export const getStockHealth = () => request(`${BASE}/stock-health`);

/**
 * Récupère la courbe chronologique du stock réel vs seuil d'alerte pour un produit
 * @param {string} [productId]
 * @param {number} [days=30]
 */
export const getStockHistory = (productId, days = 30) => {
  const params = new URLSearchParams();
  if (productId) params.append('productId', productId);
  if (days) params.append('days', days.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/stock-history${query}`);
};
