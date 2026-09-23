import { API_URL } from '@/constants/api';

const HTTP_MESSAGES = {
  401: 'Non autorisé ou session expirée.',
  403: 'Accès interdit.',
  409: 'Un compte avec ces informations existe déjà.',
  400: 'Les informations saisies sont invalides.',
  404: 'Ressource introuvable.',
  500: 'Une erreur est survenue sur le serveur.',
};

let refreshPromise = null;

/**
 * Client HTTP centralisé avec support credentials (cookies)
 * et rafraîchissement automatique du token JWT (refresh token) sur 401.
 */
export async function request(path, body, method = 'GET', isRetry = false) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  const isAuthEndpoint =
    path.includes('/loginUser') ||
    path.includes('/refreshToken') ||
    path.includes('/createUser') ||
    path.includes('/verifyAccounts');

  // Si 401 et que ce n'est pas déjà un retry ni un endpoint d'authentification primaire
  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    try {
      if (!refreshPromise) {
        refreshPromise = fetch(`${API_URL}/api/users/refreshToken`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
          .then(async (res) => {
            if (!res.ok) throw new Error('Refresh token expiré');
            return res.json();
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshData = await refreshPromise;
      if (refreshData && refreshData.success) {
        // Réessayer la requête initiale avec les nouveaux cookies
        return request(path, body, method, true);
      }
    } catch {
      // Échec du rafraîchissement : laisser l'erreur 401 se propager
    }
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Réponse sans body ou HTML inattendu
  }

  if (!response.ok || !data.success) {
    const fallback = HTTP_MESSAGES[response.status] ?? 'Une erreur est survenue.';
    throw new Error(data.message || data.error || fallback);
  }

  return data;
}
