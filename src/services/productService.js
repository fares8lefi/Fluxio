import { request } from './apiClient';

/** Build a query string from a params object, ignoring null/undefined/empty values */
function toQuery(params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

const BASE = '/api/products';

// ── CRUD ────────────────────────────────────────────────────────────────────

/**
 * GET /api/products/getAllProducts?page=1&limit=50
 * Retourne { success, products[], pagination: { total, page, pages } }
 */
export const getProducts = ({ page = 1, limit = 50 } = {}) =>
  request(`${BASE}/getAllProducts${toQuery({ page, limit })}`);

export const createProduct = (payload)     => request(`${BASE}/addProduct`, payload, 'POST');
export const updateProduct = (id, payload) => request(`${BASE}/updateProduct/${id}`, payload, 'PUT');
export const deleteProduct = (id)          => request(`${BASE}/deleteProduct/${id}`, undefined, 'DELETE');

// ── Lecture par identifiant ──────────────────────────────────────────────────

/**
 * Récupère un produit par son ID.
 * GET /api/products/getProductById/:id
 */
export const getProductById = (id) =>
  request(`${BASE}/api/products/getProductById/${id}`);

// ── Filtres & recherche ──────────────────────────────────────────────────────

/**
 * Récupère les produits selon des filtres combinés.
 * GET /api/products/getProductByFiltres?name=&categoryId=&supplierId=&minPrice=&maxPrice=
 *
 * @param {{ name?, categoryId?, supplierId?, minPrice?, maxPrice?, tva_rate?, unit_of_measure? }} filters
 */
export const getProductByFiltres = (filters = {}) =>
  request(`${BASE}/api/products/getProductByFiltres${toQuery(filters)}`);

/**
 * Récupère les produits associés à un fournisseur.
 * GET /api/products/getProductsBySupplier?supplierId=
 *
 * @param {string} supplierId
 */
export const getProductsBySupplier = (supplierId) =>
  request(`${BASE}/api/products/getProductsBySupplier${toQuery({ supplierId })}`);

/**
 * Récupère les produits associés à une catégorie.
 * GET /api/products/getProductsByCategories?categoryId=
 *
 * @param {string} categoryId
 */
export const getProductsByCategories = (categoryId) =>
  request(`${BASE}/api/products/getProductsByCategories${toQuery({ categoryId })}`);

// ── Agrégats & analytics ─────────────────────────────────────────────────────

/**
 * Retourne le nombre / la valeur totale de produits groupés par catégorie.
 * GET /api/products/getSumProductByCategorie
 */
export const getSumProductByCategorie = () =>
  request(`${BASE}/api/products/getSumProductByCategorie`);

/**
 * Retourne les produits dont le stock est en-dessous du seuil minimum.
 * GET /api/products/getProductsBelowStockMin
 */
export const getProductsBelowStockMin = () =>
  request(`${BASE}/api/products/getProductsBelowStockMin`);

/**
 * Retourne un résumé des alertes stock bas pour le dashboard.
 * GET /api/products/getLowStockDashboard
 */
export const getLowStockDashboard = () =>
  request(`${BASE}/api/products/getLowStockDashboard`);

/**
 * Retourne les produits en rupture totale de stock (stock_quantity === 0).
 * GET /api/products/getOutOfStockProducts
 */
export const getOutOfStockProducts = () =>
  request(`${BASE}/api/products/getOutOfStockProducts`);
