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
    const error = new Error(data.message || data.error || fallback);
    // Conserves le statut et la réponse complète (details, missing_fields, etc.)
    // pour permettre aux formulaires d'afficher des erreurs par champ.
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

/**
 * Télécharge un fichier (export CSV…) avec les cookies de session.
 * Sur 401, tente un rafraîchissement du jeton puis réessaie une fois.
 * @param {string} path — ex. /api/exports/products
 * @param {string} fallbackName — nom utilisé si le serveur n'en fournit pas
 */
export async function downloadFile(path, fallbackName = 'export.csv') {
  const get = () => fetch(`${API_URL}${path}`, { credentials: 'include' });
  let response;
  try {
    response = await get();
    if (response.status === 401) {
      const refreshed = await fetch(`${API_URL}/api/users/refreshToken`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshed.ok) response = await get();
    }
  } catch {
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  if (!response.ok) {
    let message = HTTP_MESSAGES[response.status] ?? 'Le téléchargement a échoué.';
    try {
      message = (await response.json()).message || message;
    } catch {
      /* corps non JSON */
    }
    throw new Error(message);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const name = disposition.match(/filename="?([^";]+)"?/)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await response.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
