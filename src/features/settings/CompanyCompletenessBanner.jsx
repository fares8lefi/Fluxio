import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getMyCompany } from '@/services/companyService';
import { missingMentions } from '@/lib/fiscal';
import { DURATION, EASE_OUT } from '@/lib/motion';

/**
 * Bandeau d'accueil tant que les mentions légales de l'entreprise sont
 * incomplètes : sans elles, aucune facture imprimée n'est conforme.
 * @param {(sub: string) => void} onNavigate
 */
export function CompanyCompletenessBanner({ onNavigate }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getMyCompany()
      .then(({ company }) => !cancelled && setIssues(missingMentions({ seller: company })))
      .catch(() => {}); // non bloquant : le bandeau est une aide, pas une condition
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      {issues.length > 0 && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-amber-900">
              Complétez les informations de votre entreprise avant de facturer
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {issues.join(' · ')}. Ces mentions sont obligatoires sur chaque facture.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings/company')}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
          >
            Compléter <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
