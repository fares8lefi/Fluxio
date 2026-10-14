import { downloadFile } from './apiClient';

const BASE = '/api/exports';
const qs = (params) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return query ? `?${query}` : '';
};

/** Journal des ventes (factures + avoirs) sur une période */
export const exportSalesJournal = (from, to) => downloadFile(`${BASE}/sales-journal${qs({ from, to })}`, 'journal-ventes.csv');

/** Récapitulatif de TVA collectée — month : AAAA-MM */
export const exportVatSummary = (month) => downloadFile(`${BASE}/vat-summary${qs({ month })}`, 'recap-tva.csv');

/** Mouvements de stock (une ligne par article) sur une période */
export const exportMovements = (from, to) => downloadFile(`${BASE}/movements${qs({ from, to })}`, 'mouvements.csv');

export const exportProducts = () => downloadFile(`${BASE}/products`, 'produits.csv');
export const exportClients = () => downloadFile(`${BASE}/clients`, 'clients.csv');
