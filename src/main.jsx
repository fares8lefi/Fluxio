import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import Root from './Root.jsx';
import { interceptLinkClicks, migrateLegacyHashUrl } from './lib/router.js';

// Anciens liens (/#login, /#accept-invite?token=…) → /login, /accept-invite?token=…
migrateLegacyHashUrl();
interceptLinkClicks();

const container = document.getElementById('root');

// "/" est prérendue au build (dist/index.html) : on hydrate ce HTML.
// Les autres pages arrivent avec un #root vide (app.html, ou index.html en dev).
if (window.location.pathname === '/' && container.hasChildNodes()) {
  hydrateRoot(container, <Root />);
} else {
  createRoot(container).render(<Root />);
}
