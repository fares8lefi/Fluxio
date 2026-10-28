// Lancé après les deux builds Vite (client + SSR), voir "build" dans package.json.
//  - dist/app.html   : coquille SPA (#root vide), fallback de toutes les routes sauf "/"
//  - dist/index.html : même coquille, avec le HTML de l'accueil prérendu dans #root
import { readFile, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const ssrDir = new URL('../dist-ssr/', import.meta.url);
const ROOT = '<div id="root"></div>';

const template = await readFile(new URL('index.html', dist), 'utf8');
if (!template.includes(ROOT)) throw new Error(`dist/index.html ne contient pas ${ROOT}`);

// Les autres pages ne sont pas l'accueil : pas de canonical vers "/" pour elles
const shell = template.replace(/\s*<link rel="canonical"[^>]*>/, '');
await writeFile(new URL('app.html', dist), shell);

const { render } = await import(new URL('entry-server.js', ssrDir).href);
const appHtml = render();
if (!appHtml) throw new Error('Le prérendu de "/" est vide');
await writeFile(new URL('index.html', dist), template.replace(ROOT, `<div id="root">${appHtml}</div>`));

await rm(ssrDir, { recursive: true, force: true });
console.log(`Prérendu de "/" : ${appHtml.length} caractères → dist/index.html, fallback SPA → dist/app.html`);
