<div align="center">

# Fluxio — Frontend

**Gestion de stock, de catalogue, de clients et de facturation pour les PME.**

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
![Statut](https://img.shields.io/badge/statut-MVP-0e7490)

</div>

---

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation et démarrage](#installation-et-démarrage)
- [Configuration](#configuration)
- [Scripts disponibles](#scripts-disponibles)
- [Architecture du projet](#architecture-du-projet)
- [Routage](#routage)
- [Rôles et permissions](#rôles-et-permissions)
- [Communication avec l’API](#communication-avec-lapi)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Sécurité](#sécurité)
- [Conventions de code](#conventions-de-code)
- [Principes d’interface](#principes-dinterface)
- [Contribuer](#contribuer)

---

## Présentation

**Fluxio** est une application web de gestion destinée aux petites et moyennes entreprises. Elle centralise le catalogue produits, les mouvements de stock, les partenaires (clients et fournisseurs) et le cycle de facturation, dans le respect des règles fiscales tunisiennes (TVA, timbre fiscal, matricule fiscal, montants en dinars avec 3 décimales).

Ce dépôt contient l’**interface web (SPA React)**. Elle s’appuie sur l’API Fluxio (Node.js, Express, Prisma, MySQL), qui reste l’autorité pour l’authentification, l’isolation des données par entreprise et tous les calculs faisant foi.

> Le produit est gratuit pendant la phase MVP. Cette phase sert à recueillir les retours des premiers utilisateurs et à valider les fonctionnalités avant d’envisager une offre payante.

---

## Fonctionnalités

### Authentification et comptes

- Inscription en plusieurs étapes : informations personnelles, entreprise, identifiants, vérification par code OTP
- Connexion par JWT stocké en cookie, avec rafraîchissement automatique de la session
- Réinitialisation du mot de passe
- Comptes entreprise isolés (architecture multi-tenant côté API)

### Catalogue et stock

- Produits, catégories et fournisseurs
- Mouvements de stock : entrées (achats), sorties (ventes), retours fournisseur et retours client
- Inventaire et alertes de stock (seuil bas, rupture)
- Tableau de bord : santé du stock, évolution, produits critiques et derniers mouvements

### Ventes et facturation

- Répertoire clients
- Devis, conversion de devis en facture
- Génération de factures à partir des mouvements facturables
- Avoirs et relevés d’avoirs
- Suivi des règlements (paiements partiels ou complets)
- Impression et aperçu PDF des documents fiscaux, impression par lot

### Pilotage et exports

- Tableau de bord gérant : chiffre d’affaires, marges par catégorie, valeur du stock, flux de mouvements, encaissements, meilleurs clients, filtrage par période
- Exports CSV pour le comptable : journal des ventes, récapitulatif de TVA, mouvements, produits, clients
- Neutralisation des formules dans les exports CSV (protection contre l’injection de formules dans les tableurs)

### Paramètres

- Fiche entreprise (identité fiscale, coordonnées) avec indicateur de complétude
- Gestion des rôles de l’équipe

---

## Stack technique

| Domaine            | Outils                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework UI       | [React 19](https://react.dev)                                 |
| Build et dev       | [Vite 8](https://vite.dev)                                    |
| Styles             | [Tailwind CSS v4](https://tailwindcss.com), `tailwind-merge`, `clsx` |
| Composants         | [shadcn/ui](https://ui.shadcn.com), Radix UI, `class-variance-authority` |
| Icônes             | [Lucide](https://lucide.dev)                                  |
| Formulaires        | [React Hook Form](https://react-hook-form.com)                |
| Graphiques         | [Recharts](https://recharts.org)                              |
| Animations         | [Motion](https://motion.dev)                                  |
| Qualité de code    | [Oxlint](https://oxc.rs), [Prettier](https://prettier.io) (+ plugin Tailwind) |
| Production         | Docker multi-étapes, Nginx (Alpine)                           |

---

## Prérequis

- **Node.js 20** ou version ultérieure (l’image Docker utilise Node 22)
- **npm** (fourni avec Node.js)
- Une instance de l’**API Fluxio** accessible (par défaut sur `http://localhost:3000`)
- *Optionnel* : **Docker** pour construire l’image de production

---

## Installation et démarrage

```bash
# 1. Cloner le dépôt
git clone https://github.com/fares8lefi/Fluxio.git
cd Fluxio

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Lancer le serveur de développement
npm run dev
```

L’application est disponible à l’adresse affichée par Vite, généralement **http://localhost:5173**.

> L’API doit autoriser l’origine du frontend (CORS avec `credentials`), car l’authentification repose sur des cookies.

---

## Configuration

Les variables d’environnement sont lues par Vite au moment du build. Seules les variables préfixées par `VITE_` sont exposées au navigateur : n’y placez **jamais** de secret.

| Variable       | Description                     | Valeur par défaut       |
| -------------- | ------------------------------- | ----------------------- |
| `VITE_API_URL` | URL de base de l’API Fluxio     | `http://localhost:3000` |

Les fichiers `.env` et `.env.*` sont ignorés par Git et Docker ; seul `.env.example` est versionné.

---

## Scripts disponibles

| Commande               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Lance le serveur de développement avec rechargement à chaud |
| `npm run build`        | Génère la version de production dans `dist/`        |
| `npm run preview`      | Sert localement le build de production              |
| `npm run lint`         | Analyse le code avec Oxlint                         |
| `npm run format`       | Formate le code avec Prettier                       |
| `npm run format:check` | Vérifie le formatage sans modifier les fichiers     |

---

## Architecture du projet

L’alias `@` pointe vers `src/` (configuré dans `vite.config.js` et `jsconfig.json`).

```text
src/
├── assets/            # Images et ressources statiques
├── components/
│   ├── auth/          # Étapes du parcours d'inscription et champs de formulaire
│   ├── charts/        # Graphiques du tableau de bord (et manager/ pour la vue gérant)
│   ├── dashboard/     # Cartes de statistiques, derniers mouvements
│   ├── landing/       # Éléments de la page d'accueil
│   ├── layout/        # Layouts (tableau de bord, en-tête public)
│   ├── print/         # Documents fiscaux imprimables et aperçu d'impression
│   └── ui/            # Composants génériques (Modal, Toast, Button, Skeleton…)
├── constants/         # Constantes (URL de l'API, contenus statiques)
├── contexts/          # AuthContext : session et permissions de l'utilisateur
├── features/          # Modules métier, un dossier par domaine
│   ├── categories/
│   ├── clients/
│   ├── inventory/
│   ├── invoices/      # Factures, devis, avoirs, règlements, exports
│   ├── manager/       # Tableau de bord gérant
│   ├── movements/     # Mouvements de stock
│   ├── products/
│   ├── settings/
│   └── suppliers/
├── hooks/             # Hooks partagés (useHashRoute…)
├── lib/               # Utilitaires : fiscalité, permissions, animations, helpers
├── pages/             # Pages de premier niveau (accueil, connexion, tableau de bord…)
├── routes/            # AppRouter : aiguillage public / protégé
├── services/          # Appels à l'API, un service par ressource
├── App.jsx
├── index.css          # Point d'entrée Tailwind et thème
└── main.jsx           # Point d'entrée de l'application
```

**Principe d’organisation** : le code métier vit dans `features/<domaine>/`, les composants réutilisables dans `components/`, et tout accès réseau passe par `services/`.

---

## Routage

L’application utilise un routage par **hash** (`useHashRoute`), ce qui la rend compatible avec n’importe quel hébergement statique.

| Route                               | Accès     | Contenu                              |
| ----------------------------------- | --------- | ------------------------------------ |
| `#` (défaut)                        | Public    | Page d’accueil                       |
| `#login`, `#signup`, `#forgot-password` | Public | Authentification (redirige vers le tableau de bord si connecté) |
| `#confidentialite`                  | Public    | Politique de confidentialité         |
| `#dashboard`                        | Protégé   | Tableau de bord                      |
| `#dashboard/products`               | Protégé   | Produits                             |
| `#dashboard/categories`             | Protégé   | Catégories                           |
| `#dashboard/suppliers`              | Protégé   | Fournisseurs                         |
| `#dashboard/inventory`              | Protégé   | Inventaire                           |
| `#dashboard/movements`              | Protégé   | Tous les mouvements                  |
| `#dashboard/movements/in` (`achats`)   | Protégé | Entrées de stock                   |
| `#dashboard/movements/out` (`ventes`)  | Protégé | Sorties de stock                   |
| `#dashboard/movements/return-supplier` | Protégé | Retours fournisseur                |
| `#dashboard/movements/return-client`   | Protégé | Retours client                     |
| `#dashboard/clients`                | Protégé   | Clients                              |
| `#dashboard/invoices`               | Protégé   | Factures                             |
| `#dashboard/invoices/quotes`        | Protégé   | Devis                                |
| `#dashboard/invoices/credit-notes`  | Protégé   | Avoirs                               |
| `#dashboard/manager`                | Protégé   | Tableau de bord gérant               |
| `#dashboard/settings`, `#dashboard/settings/company` | Protégé | Paramètres                |

---

## Rôles et permissions

Chaque utilisateur possède un rôle au sein de son entreprise. Le module `src/lib/permissions.js` reflète les règles du backend afin de **masquer** les actions non autorisées ; **le backend reste l’autorité** et refuse toute requête non permise.

| Action           | Gérant (`OWNER`) | Magasinier (`STOCK`) | Comptable (`ACCOUNTANT`) |
| ---------------- | :--------------: | :------------------: | :----------------------: |
| `stock.write`    | ✅               | ✅                   | —                        |
| `billing.write`  | ✅               | —                    | ✅                       |
| `finance.read`   | ✅               | —                    | ✅                       |
| `company.manage` | ✅               | —                    | —                        |

```jsx
const { can } = useAuth();
{can('billing.write') && <Button>Nouvelle facture</Button>}
```

---

## Communication avec l’API

Tous les appels passent par le client centralisé `src/services/apiClient.js` :

- **Cookies** : requêtes envoyées avec `credentials: 'include'` (aucun jeton stocké dans `localStorage`)
- **Rafraîchissement automatique** : sur une réponse `401`, un unique appel à `/api/users/refreshToken` est partagé entre les requêtes concurrentes, puis la requête initiale est rejouée
- **Messages d’erreur** : les codes HTTP sont traduits en messages lisibles en français
- **Services par ressource** : `productService`, `clientService`, `invoiceService`, `exportService`, etc.

Les montants fiscaux (TVA, totaux, timbre) sont **calculés et stockés par le backend**. Le module `src/lib/fiscal.js` sert uniquement à l’affichage (formatage en dinars, ventilation de TVA, validation du matricule fiscal).

---

## Déploiement avec Docker

Le `Dockerfile` construit l’application avec Node, puis la sert avec Nginx.

```bash
# Construire l'image
docker build -t fluxio-frontend .

# Lancer le conteneur
docker run -d -p 8080:80 --name fluxio-frontend fluxio-frontend
```

L’application est alors disponible sur **http://localhost:8080**.

> `VITE_API_URL` est intégrée au moment du build. Pour cibler une autre API, fournissez un fichier `.env` adapté (ou exportez la variable) **avant** `npm run build` dans votre pipeline.

La configuration `nginx.conf` :

- renvoie `index.html` pour toute route inconnue (fallback SPA) ;
- masque la version de Nginx (`server_tokens off`) ;
- ajoute les en-têtes de sécurité décrits ci-dessous.

---

## Sécurité

| Mesure                                  | Détail                                                  |
| --------------------------------------- | ------------------------------------------------------- |
| Authentification par cookie             | Aucun jeton accessible depuis le JavaScript applicatif  |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | Protection contre le clickjacking            |
| `X-Content-Type-Options: nosniff`       | Empêche l’interprétation erronée des types MIME         |
| `Referrer-Policy`                       | `strict-origin-when-cross-origin`                       |
| `Permissions-Policy`                    | Caméra, micro et géolocalisation désactivés             |
| Content-Security-Policy                 | `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| Exports CSV                             | Neutralisation des formules (`=`, `+`, `-`, `@`…)       |
| Secrets                                 | `.env` exclus de Git et de l’image Docker               |

Pour signaler une vulnérabilité, contactez directement le mainteneur plutôt que d’ouvrir une issue publique.

---

## Conventions de code

- **Formatage** : Prettier (`.prettierrc`) avec tri automatique des classes Tailwind ; lancez `npm run format` avant chaque commit.
- **Lint** : Oxlint (`.oxlintrc.json`) ; `npm run lint` doit passer sans erreur.
- **Imports** : utilisez l’alias `@/` plutôt que des chemins relatifs profonds.
- **Composants** : un composant par fichier, nommé en `PascalCase` ; hooks en `use-kebab-case.js` ou `useCamelCase.js`.
- **Commits** : format [Conventional Commits](https://www.conventionalcommits.org/fr/) — `feat(invoices): …`, `fix(stock): …`, `chore(deps): …`.

Des guides internes complémentaires (architecture, routage, accessibilité, performance, validation…) se trouvent dans le dossier `skills/`.

---

## Principes d’interface

- Chaque page s’appuie sur des composants réutilisables et des layouts responsives.
- La palette utilise des tons bleu pétrole, cyan et émeraude ; le violet n’est pas utilisé.
- Les informations critiques de stock doivent être lisibles, accessibles et visibles en priorité.
- Les états de chargement, d’erreur et de liste vide sont toujours gérés (`Skeleton`, `ErrorBoundary`, `EmptyState`).

---

## Contribuer

1. Créez une branche depuis `main` : `git checkout -b feat/ma-fonctionnalite`
2. Développez, puis vérifiez : `npm run lint && npm run format:check && npm run build`
3. Commitez en suivant les Conventional Commits
4. Ouvrez une Pull Request décrivant le changement et, si pertinent, des captures d’écran

---

<div align="center">

Fait avec soin pour les PME · **Fluxio**

</div>
