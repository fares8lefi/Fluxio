import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * `vite preview` comme Vercel : "/" sert l'accueil prérendu (index.html),
 * les autres routes sans fichier servent la coquille SPA app.html.
 */
const spaFallback = () => ({
  name: 'spa-fallback-app-html',
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname !== '/' && !path.extname(pathname)) req.url = '/app.html';
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
