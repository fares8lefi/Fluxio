import { request } from './apiClient';

/** Entreprise de l'utilisateur connecté (en-tête des documents) */
export const getMyCompany = () => request('/api/company/my-company');

/** Met à jour les mentions légales de l'entreprise (MF, adresse, téléphone…) */
export const updateMyCompany = (payload) => request('/api/company/update', payload, 'PUT');
