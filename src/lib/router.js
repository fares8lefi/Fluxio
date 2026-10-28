import { useSyncExternalStore } from 'react';

/**
 * Routeur maison par chemin : history.pushState + événement popstate.
 * navigate() émet aussi popstate, donc un seul événement à écouter.
 */
export function navigate(to, { replace = false, state = null } = {}) {
  window.history[replace ? 'replaceState' : 'pushState'](state, '', to);
  if (!replace) window.scrollTo(0, 0);
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}

const subscribe = (callback) => {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
};

// Sans slash final : '/login/' et '/login' donnent la même page
const getPathname = () => window.location.pathname.replace(/(.)\/+$/, '$1');

/** Chemin courant ; vaut '/' pendant le prérendu (seule page prérendue) */
export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

// Anciennes routes par hash : '#login', '#/login', '#accept-invite?token=…', '#dashboard/products'
const LEGACY_ROUTES = ['accueil', 'confidentialite', 'login', 'signup', 'forgot-password', 'accept-invite', 'dashboard'];
const LEGACY_HASH = /^#\/?([a-z-]+)(\/[^?]*)?(\?.*)?$/;

/**
 * À appeler avant le premier rendu : convertit un ancien lien
 * https://www.fluxio.tn/#login en /login (paramètres conservés).
 * Les ancres de l'accueil (#produit, #securite) ne sont pas des routes : on n'y touche pas.
 */
export function migrateLegacyHashUrl() {
  const match = window.location.hash.match(LEGACY_HASH);
  if (!match || !LEGACY_ROUTES.includes(match[1])) return;
  const [, route, subPath = '', search] = match;
  const path = route === 'accueil' ? '/' : `/${route}${subPath}`;
  window.history.replaceState(null, '', path + (search ?? window.location.search));
}

/**
 * Les liens internes <a href="/login"> passent par navigate() au lieu de
 * recharger la page. Les ancres (#produit), nouveaux onglets, téléchargements
 * et liens externes gardent le comportement normal du navigateur.
 */
export function interceptLinkClicks() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    if (link.origin !== window.location.origin || link.getAttribute('href').startsWith('#')) return;
    if (link.pathname.startsWith('/api/')) return;

    event.preventDefault();
    const to = link.pathname + link.search + link.hash;
    if (to !== window.location.pathname + window.location.search + window.location.hash) navigate(to);
  });
}
