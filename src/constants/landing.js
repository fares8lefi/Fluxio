import { Fingerprint, History, Lock, ShieldCheck } from 'lucide-react';

export const NAV_MENU = [
  ['Fonctionnement', 'produit'],
  ['Sécurité', 'securite'],
];

/** A day in the shop, in order: this is a real sequence, hence the numbers */
export const WORKFLOW = [
  {
    title: 'Réceptionner',
    text: "Enregistrez une livraison fournisseur : le stock de chaque produit augmente aussitôt.",
  },
  {
    title: 'Vendre',
    text: 'Chaque sortie vers un client retire la quantité du stock et garde la trace du client.',
  },
  {
    title: 'Être prévenu',
    text: "Dès qu'un produit passe sous son seuil, il rejoint la liste « À commander », triée par urgence.",
  },
  {
    title: 'Facturer',
    text: 'Transformez une vente en facture, devis ou avoir, avec les mentions fiscales et le montant en TND.',
  },
];

export const SECURITY_POINTS = [
  [Fingerprint, 'Connexion protégée par un code de vérification envoyé par email'],
  [Lock, 'Les données de chaque entreprise sont strictement séparées'],
  [ShieldCheck, 'Un mouvement de stock est enregistré entièrement ou pas du tout'],
  [History, 'Chaque opération reste dans l’historique, avec son auteur et sa date'],
];
