import { request } from './apiClient';

/** Build a query string from a params object, ignoring null/undefined/empty values */
function toQuery(params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

const BASE = '/api/mouvments';

// ── CRUD & Endpoints ────────────────────────────────────────────────────────

/**
 * Créer un nouveau mouvement de stock
 * POST /api/mouvments/createMouvment
 *
 * @param {{
 *   type: 'IN' | 'OUT' | 'RETURN_SUPPLIER' | 'RETURN_CLIENT',
 *   items: Array<{ productId: string, quantity: number, unit_price?: number }>,
 *   supplierId?: string | null,
 *   clientId?: string | null,
 *   reference?: string | null,
 *   note?: string | null,
 *   status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
 * }} payload
 */
export const createMouvment = (payload) =>
  request(`${BASE}/createMouvment`, payload, 'POST');

/**
 * Récupérer tous les mouvements avec pagination et filtres
 * GET /api/mouvments/getAllMouvment?page=&type=&status=&startDate=&endDate=&clientId=&supplierId=
 */
export const getAllMouvment = async (filters = {}) => {
  try {
    return await request(`${BASE}/getAllMouvment${toQuery(filters)}`);
  } catch (e) {
    if (e.message?.includes('trouvé') || e.message?.includes('404') || e.message?.includes('introuvable')) {
      return { success: true, mouvments: [], count: 0 };
    }
    throw e;
  }
};

/**
 * Récupérer un mouvement par son identifiant
 * GET /api/mouvments/:id
 */
export const getMouvmentById = (id) =>
  request(`${BASE}/${id}`);

/**
 * Récupérer les mouvements liés à un client
 * GET /api/mouvments/getByClient/:clientId
 */
export const getMouvmentsByClient = (clientId) =>
  request(`${BASE}/getByClient/${clientId}`);

/**
 * Récupérer les mouvements liés à un fournisseur
 * GET /api/mouvments/getBySupplier/:supplierId
 */
export const getMouvmentsBySupplier = (supplierId) =>
  request(`${BASE}/getBySupplier/${supplierId}`);

/**
 * Annuler un mouvement (restaure automatiquement les stocks)
 * PUT /api/mouvments/cancel/:id
 */
export const cancelMouvment = (id) =>
  request(`${BASE}/cancel/${id}`, undefined, 'PUT');
