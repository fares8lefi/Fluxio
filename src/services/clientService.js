import { request } from './apiClient';

const BASE = '/api/clients';

export const getClients = async () => {
  try {
    return await request(`${BASE}/getAllClients`);
  } catch (e) {
    if (e.message?.includes('trouvé') || e.message?.includes('404') || e.message?.includes('introuvable')) {
      return { success: true, clients: [] };
    }
    throw e;
  }
};

export const getClientById = (id) => request(`${BASE}/${id}`);
export const createClient = (payload) => request(`${BASE}/createClient`, payload, 'POST');
export const updateClient = (id, payload) => request(`${BASE}/updateClient/${id}`, payload, 'PUT');
export const deleteClient = (id) => request(`${BASE}/deleteClient/${id}`, undefined, 'DELETE');
