import { request } from './apiClient';

const BASE = '/api/invoices';
const QUOTE_BASE = '/api/quotes';

// ── Factures ────────────────────────────────────────────────────────────────

/**
 * Génère une facture depuis un mouvement OUT
 * @param {{ movementId, is_suspended?, apply_rs?, rs_rate?, attestation_ref?, purchase_order_ref?, notes?, payment_terms? }} payload
 */
export const generateInvoice = (payload) => request(`${BASE}/generate`, payload, 'POST');

/**
 * Liste les mouvements OUT facturables avec les informations manquantes à compléter
 * @param {{ page?, movementId?, clientId?, search?, startDate?, endDate?, onlyNotInvoiced?, onlyInvoiced? }} filters
 */
export const getMovementsForInvoice = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`${BASE}/getMovementsForInvoice${query}`);
};

/** Récupère toutes les factures paginées avec filtres */
export const getAllInvoices = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
  const query = params.toString() ? `?${params.toString()}` : '';
  try {
    return await request(`${BASE}/getAllInvoices${query}`);
  } catch (e) {
    if (e.message?.includes('trouvé') || e.message?.includes('introuvable')) {
      return { success: true, invoices: [], count: 0 };
    }
    throw e;
  }
};

/**
 * Toutes les factures d'une période, sans limite de page : l'API pagine
 * (taille fixée côté serveur), on lit la première page puis les suivantes.
 * @param {{ from: string, to: string }} range — dates AAAA-MM-JJ incluses
 * @param {object} [filters] — invoice_type, status…
 */
export const getInvoicesInRange = async ({ from, to }, filters = {}) => {
  // Heure explicite des deux côtés : la date de fin inclut toute la journée
  const base = { ...filters, startDate: `${from}T00:00:00`, endDate: `${to}T23:59:59.999` };
  const first = await getAllInvoices({ ...base, page: 1 });
  const invoices = first?.invoices ?? [];
  const count = first?.count ?? invoices.length;
  if (invoices.length === 0 || invoices.length >= count) return { invoices, count };

  const pages = Math.ceil(count / invoices.length);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => getAllInvoices({ ...base, page: i + 2 }))
  );
  return { invoices: invoices.concat(...rest.map((r) => r?.invoices ?? [])), count };
};

/** Récupère les données complètes d'une facture pour générer le PDF */
export const getInvoicePdfData = (id) => request(`${BASE}/getInvoiceDataForPdf/${id}`);

/** Met à jour le statut d'une facture */
export const updateInvoiceStatus = (id, status) =>
  request(`${BASE}/updateInvoiceStatus/${id}/status`, { status }, 'PUT');

/** Crée un avoir (annulation) sur une facture */
export const createCreditNote = (id, reason) =>
  request(`${BASE}/credit-note/${id}`, { reason }, 'POST');

// ── Devis ───────────────────────────────────────────────────────────────────

/** Crée un nouveau devis */
export const createQuote = (payload) => request(`${QUOTE_BASE}/create`, payload, 'POST');

/** Récupère tous les devis */
export const getAllQuotes = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
  const query = params.toString() ? `?${params.toString()}` : '';
  try {
    return await request(`${QUOTE_BASE}/getAll${query}`);
  } catch (e) {
    if (e.message?.includes('trouvé') || e.message?.includes('introuvable')) {
      return { success: true, quotes: [], count: 0 };
    }
    throw e;
  }
};

/** Met à jour le statut d'un devis */
export const updateQuoteStatus = (id, status) =>
  request(`${QUOTE_BASE}/updateStatus/${id}`, { status }, 'PUT');

/**
 * Convertit un devis accepté en facture (crée aussi la sortie de stock)
 * @param {string} id
 * @param {{ attestation_ref?, purchase_order_ref?, apply_rs?, rs_rate? }} [options]
 */
export const convertQuoteToInvoice = (id, options = {}) =>
  request(`${QUOTE_BASE}/${id}/convert`, options, 'POST');

// ── Règlements ──────────────────────────────────────────────────────────────

/** Règlements d'une facture + reste à payer */
export const getInvoicePayments = (id) => request(`${BASE}/${id}/payments`);

/** Enregistre un règlement : { amount, method, date, reference? } */
export const addInvoicePayment = (id, payload) => request(`${BASE}/${id}/payments`, payload, 'POST');

/** Supprime un règlement saisi par erreur */
export const deleteInvoicePayment = (paymentId) =>
  request(`${BASE}/payments/${paymentId}`, undefined, 'DELETE');
