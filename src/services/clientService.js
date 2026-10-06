import { request } from './apiClient';

const BASE = '/api/clients';

/**
 * Récupère tous les clients.
 * Le backend retourne 404 quand la liste est vide — on normalise en tableau vide.
 */
export const getClients = async () => {
  try {
    return await request(`${BASE}/getAllClients`);
  } catch (e) {
    // Le backend renvoie 404 + "Aucun client trouvé" quand la table est vide.
    // HTTP_MESSAGES[404] = 'Ressource introuvable.' — les deux cas sont traités ici.
    if (
      e.message?.includes('trouvé') ||
      e.message?.includes('introuvable') ||
      e.message?.includes('Ressource')
    ) {
      return { success: true, clients: [] };
    }
    throw e;
  }
};

export const getClientById     = (id)          => request(`${BASE}/${id}`);
export const createClient      = (payload)     => request(`${BASE}/createClient`, payload, 'POST');
export const updateClient      = (id, payload) => request(`${BASE}/updateClient/${id}`, payload, 'PUT');
export const deleteClient      = (id)          => request(`${BASE}/deleteClient/${id}`, undefined, 'DELETE');
export const searchClients     = (name)        => request(`${BASE}/searchClientsByName?name=${encodeURIComponent(name)}`);

