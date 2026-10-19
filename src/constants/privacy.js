/** Contenu de la page « Politique de confidentialité » (#confidentialite) */

export const PRIVACY_UPDATED_AT = '16 octobre 2026';

/** Adresse de contact affichée dans « Vos droits » ; null = renvoi vers le responsable du projet */
export const PRIVACY_CONTACT_EMAIL = null;

export const PRIVACY_SECTIONS = [
  ['projet', 'Un projet éducatif'],
  ['donnees', 'Données enregistrées'],
  ['usage', 'Utilisation des données'],
  ['documents', 'Rédaction des documents'],
  ['securite', 'Sécurité et conservation'],
  ['droits', 'Vos droits'],
];

export const COLLECTED_DATA = [
  {
    title: 'Votre compte',
    text: "Nom, adresse email et mot de passe. Le mot de passe est stocké sous forme chiffrée (haché) : personne ne peut le lire, pas même l'équipe du projet.",
  },
  {
    title: 'Votre entreprise',
    text: 'Raison sociale, matricule fiscal, adresse et téléphone. Ils apparaissent en en-tête de chaque document imprimé.',
  },
  {
    title: 'Vos clients et fournisseurs',
    text: 'Nom, coordonnées, matricule fiscal et code TVA si vous les renseignez. Ils servent de destinataire sur les factures et les bons.',
  },
  {
    title: 'Votre activité',
    text: 'Produits, mouvements de stock, devis, factures et règlements, avec le nom de la personne qui a fait chaque opération et sa date.',
  },
];

/**
 * Documents produits par Fluxio, dans l'ordre où ils apparaissent dans une vente.
 * `prefix` : numérotation réelle du backend (FAC-2026-0001) ; null = référence du mouvement.
 */
export const STOCK_DOCUMENTS = [
  {
    title: 'Bon de réception',
    sheet: 'Bon de réception',
    origin: "Créé à partir d'une entrée de stock (livraison fournisseur).",
    purpose:
      'Prouve ce que vous avez réellement reçu, en quelle quantité et de quel fournisseur. Il est signé par le livreur et par la personne qui réceptionne.',
  },
  {
    title: 'Bon de livraison',
    sheet: 'Bon de livraison',
    origin: "Créé à partir d'une sortie de stock vers un client.",
    purpose:
      'Accompagne la marchandise et prouve sa remise au client. Sa référence est reprise sur la facture qui en découle.',
  },
  {
    title: 'Bons de retour',
    sheet: 'Bon de retour',
    origin: "Créés à partir d'un retour client ou d'un retour fournisseur.",
    purpose:
      'Justifient la remise en stock (retour client) ou la sortie vers le fournisseur (retour fournisseur), avec le motif.',
  },
  {
    title: "Bon d'ajustement",
    sheet: "Bon d'ajustement",
    origin: 'Créé à partir d’un ajustement : inventaire, casse, perte ou péremption.',
    purpose:
      "Document interne, sans client ni fournisseur. Il explique pourquoi le stock a changé sans achat ni vente, et qui l'a validé.",
  },
];

export const SALES_DOCUMENTS = [
  {
    title: 'Devis',
    sheet: 'Devis',
    prefix: 'DEV',
    origin: 'Rédigé librement, avec ou sans produits du catalogue, et des remises par ligne.',
    purpose:
      "Propose un prix au client avant la vente. Il ne touche pas au stock. Il passe par les statuts brouillon, envoyé, accepté, refusé ou expiré ; une fois accepté, il se transforme en facture en un clic et le stock est alors mis à jour.",
  },
  {
    title: 'Facture',
    sheet: 'Facture',
    prefix: 'FAC',
    origin: "Générée à partir d'une vente déjà enregistrée ou d'un devis accepté. Elle ne se rédige jamais à partir de rien.",
    purpose:
      "Demande le paiement et sert de pièce comptable. Une facture n'est jamais supprimée : si elle est annulée, elle reste visible, barrée, pour que la numérotation ne présente aucun trou.",
  },
  {
    title: "Facture d'avoir",
    sheet: "Facture d'avoir",
    prefix: 'AVO',
    origin: "Émise à partir d'une facture existante, à laquelle elle reste liée.",
    purpose:
      "Corrige tout ou partie d'une facture (retour, erreur, geste commercial). Dans le journal des ventes, ses montants sont comptés en négatif.",
  },
];

/** Règles communes à tous les documents fiscaux */
export const DOCUMENT_RULES = [
  'Chaque document part d’un fait déjà enregistré dans Fluxio (une réception, une vente, un devis accepté). Ce que dit le papier correspond donc toujours à ce qui s’est passé dans le stock.',
  'Les montants sont calculés par le serveur, jamais par votre navigateur : TVA ventilée par taux (0 %, 7 %, 13 % ou 19 %), timbre fiscal de 1,000 DT, retenue à la source de 1 %, 5 % ou 15 % si vous l’appliquez. Tous les montants sont arrondis au millime.',
  'La numérotation est continue et repart chaque année : FAC-2026-0001, FAC-2026-0002… Il en va de même pour les devis (DEV) et les avoirs (AVO).',
  'Avant l’impression, Fluxio vérifie les mentions de l’article 18 du Code de la TVA (raison sociale, matricule fiscal, adresse…). Une mention absente est signalée dans l’aperçu et s’imprime « — » plutôt que de disparaître.',
  'En cas de vente en suspension de TVA, la TVA et le timbre passent à zéro et le numéro d’attestation du client devient obligatoire.',
];

export const SECURITY_MEASURES = [
  'La connexion demande un code de vérification envoyé par email.',
  'La session est tenue par un cookie protégé, illisible par les scripts de la page et envoyé uniquement en HTTPS en production.',
  "Les données de chaque entreprise sont séparées : chaque compte ne voit que l'espace de sa propre entreprise.",
  "Aucun cookie publicitaire ni outil de suivi n'est utilisé.",
];
