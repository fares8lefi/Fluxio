import { BarChart3, FileText, Fingerprint, History, Layers3, Lock, ShieldCheck, UsersRound } from 'lucide-react';

export const LANDING_FEATURES = [
  [
    Layers3,
    'Catalogue organisé',
    'Produits, catégories et fournisseurs réunis dans un seul espace clair et consultable par toute votre équipe.',
    ['Gestion des variantes', 'Import CSV', 'Catégories imbriquées'],
  ],
  [
    BarChart3,
    'Stock en temps réel',
    'Suivez chaque entrée, sortie et retour. Recevez des alertes avant les ruptures pour ne jamais être pris au dépourvu.',
    ['Alertes de seuil', 'Historique complet', 'Multi-entrepôt'],
  ],
  [
    UsersRound,
    'Clients centralisés',
    "Un répertoire client simple et partagé. Retrouvez l'historique complet de chaque client en un clic.",
    ['Fiche client complète', 'Historique des achats', 'Accès équipe'],
  ],
  [
    FileText,
    'Facturation simplifiée',
    'Préparez vos factures directement depuis vos commandes. Les données de votre catalogue sont déjà là.',
    ['Génération automatique', 'PDF en un clic', 'Suivi des paiements'],
  ],
];

export const NAV_MENU = [
  ['Produit', 'produit'],
  ['Sécurité', 'securite'],
  ['Témoignages', 'temoignages'],
];

export const SECURITY_POINTS = [
  [Fingerprint, 'Accès sécurisé par authentification et codes OTP'],
  [Lock, 'Données strictement séparées par entreprise'],
  [ShieldCheck, 'Mouvements de stock protégés par transactions atomiques'],
  [History, 'Historique complet des opérations pour chaque action'],
];

export const TESTIMONIALS = [
  {
    quote:
      'Avant Fluxio, on gérait notre stock sur Excel. Maintenant tout le monde voit la même info en temps réel.',
    author: 'Sophie M.',
    role: 'Responsable logistique, PME textile',
    initials: 'SM',
  },
  {
    quote:
      "La facturation prend moitié moins de temps. Les infos du catalogue sont déjà là, je n'ai plus à les ressaisir.",
    author: 'Karim B.',
    role: 'Gérant, société de distribution',
    initials: 'KB',
  },
  {
    quote:
      'Enfin un outil adapté à notre taille. Ni trop complexe, ni trop basique. Exactement ce dont on avait besoin.',
    author: 'Claire D.',
    role: 'DAF, entreprise de services',
    initials: 'CD',
  },
];
