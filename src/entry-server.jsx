import { renderToString } from 'react-dom/server';
import Root from './Root.jsx';

/**
 * Prérendu au build (scripts/prerender.js) : HTML de la page d'accueil "/".
 * Côté serveur, usePathname() vaut '/' et les useEffect (appel /me…) ne s'exécutent pas.
 */
export function render() {
  return renderToString(<Root />);
}
