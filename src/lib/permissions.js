/**
 * Permissions par rôle dans l'entreprise — miroir de
 * Fluxio_backeEnd/src/middlewares/companyRole.js. Le backend reste l'autorité :
 * ici on masque seulement les actions qu'un rôle ne peut pas faire.
 */

export const COMPANY_ROLES = {
  OWNER: { label: 'Gérant', description: 'Accès complet, équipe et paramètres de l’entreprise' },
  STOCK: { label: 'Magasinier', description: 'Produits, mouvements de stock et inventaire' },
  ACCOUNTANT: { label: 'Comptable', description: 'Factures, règlements et exports ; stock en lecture' },
};

const RULES = {
  'stock.write': ['OWNER', 'STOCK'],
  'billing.write': ['OWNER', 'ACCOUNTANT'],
  'finance.read': ['OWNER', 'ACCOUNTANT'],
  'company.manage': ['OWNER'],
};

/**
 * @param {{ role?: string, company_role?: string } | null} user
 * @param {keyof RULES} action
 */
export function can(user, action) {
  if (!user) return false;
  return (RULES[action] ?? []).includes(user.company_role || 'OWNER');
}
