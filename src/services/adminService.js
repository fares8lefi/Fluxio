import { request } from './apiClient';

const BASE = '/api/admin';

/** Construire une query string propre depuis un objet */
function toQuery(params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

/**
 * Récupère les statistiques globales de la plateforme (entreprises, utilisateurs, etc.)
 * GET /api/admin/stats
 */
export const getPlatformStats = () =>
  request(`${BASE}/stats`);

/**
 * Récupère la liste paginée et filtrée des entreprises
 * GET /api/admin/companies?page=1&limit=20&search=
 */
export const getAllCompanies = (filters = {}) =>
  request(`${BASE}/companies${toQuery(filters)}`);

/**
 * Récupère les détails complets d'une entreprise (avec compteurs et liste d'utilisateurs)
 * GET /api/admin/companies/:id
 */
export const getCompanyDetails = (id) =>
  request(`${BASE}/companies/${id}`);

/**
 * Met à jour les informations générales d'une entreprise (nom, adresse, téléphone, matricule fiscale)
 * PUT /api/admin/companies/:id
 */
export const updateCompanyGeneralInfo = (id, payload) =>
  request(`${BASE}/companies/${id}`, payload, 'PUT');

/**
 * Active ou suspend une entreprise
 * PATCH /api/admin/companies/:id/status { is_active: boolean }
 */
export const toggleCompanyStatus = (id, isActive) =>
  request(`${BASE}/companies/${id}/status`, { is_active: isActive }, 'PATCH');

/**
 * Active ou suspend un utilisateur
 * PATCH /api/admin/users/:id/status { is_active: boolean }
 */
export const toggleUserStatus = (id, isActive) =>
  request(`${BASE}/users/${id}/status`, { is_active: isActive }, 'PATCH');
