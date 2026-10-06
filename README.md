# Fluxio — Frontend

Interface web du MVP **Fluxio**, une solution de gestion d’inventaire, de catalogue produits, de clients et de facturation destinée aux petites et moyennes entreprises.

Le produit est actuellement gratuit pendant la phase MVP. Cette phase sert à recueillir les retours des premiers utilisateurs et à valider les fonctionnalités avant d’envisager une offre payante.

## Fonctionnalités couvertes

- Gestion des produits, catégories et fournisseurs
- Suivi des mouvements de stock : entrées, sorties et retours
- Répertoire clients
- Préparation de la facturation
- Comptes entreprise isolés (architecture multi-tenant côté API)
- Authentification sécurisée : connexion, JWT et vérification OTP

## Stack technique

- React 19 et Vite
- Tailwind CSS v4
- shadcn/ui et Radix UI
- Lucide Icons

## Démarrage

Prérequis : Node.js 20 ou version ultérieure.

```bash
npm install
npm run dev
```

L’application est alors disponible à l’adresse affichée par Vite, généralement `http://localhost:5173`.

## Scripts

| Commande          | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Lance le serveur de développement   |
| `npm run build`   | Génère la version de production     |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint`    | Analyse le code avec Oxlint         |

## Backend

L’API Fluxio est construite avec Node.js, Express, Prisma et MySQL. Elle gère l’authentification, l’isolation des données par entreprise, le catalogue, les clients et les mouvements de stock transactionnels.

Avant de connecter ce frontend, configurez l’URL de l’API dans les variables d’environnement du projet selon les conventions retenues par l’équipe.

## Principes d’interface

- Chaque page s’appuie sur des composants réutilisables et des layouts responsives.
- La palette utilise des tons bleu pétrole, cyan et émeraude ; le violet n’est pas utilisé.
- Les informations critiques de stock doivent être lisibles, accessibles et visibles en priorité.
