import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Printer, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/Spinner';

/**
 * PrintPreviewModal — aperçu A4 + impression d'un document.
 *
 * Le document est rendu une seconde fois dans un portail `.print-only`
 * directement sous <body> : à l'impression, la feuille de style masque
 * l'application (#root) et n'imprime que ce portail, avec les mêmes styles
 * que l'aperçu (pas de copie HTML vers une fenêtre sans CSS).
 *
 * @param {string}    title       — titre de la fenêtre d'aperçu
 * @param {string}    fileName    — nom proposé pour « Enregistrer en PDF »
 * @param {ReactNode|ReactNode[]} document — le FiscalDocument à imprimer (null pendant le chargement) ;
 *                                  un tableau imprime chaque document sur une nouvelle page
 * @param {string[]}  [issues]    — mentions manquantes, affichées mais jamais imprimées
 * @param {ReactNode} [actions]   — boutons supplémentaires du pied, avant « Imprimer »
 */
export function PrintPreviewModal({
  open,
  onClose,
  title,
  fileName,
  document: doc,
  loading,
  error,
  issues = [],
  printLabel = 'Imprimer / PDF',
  loadingLabel = 'Chargement du document…',
  actions = null,
}) {
  const docs = Array.isArray(doc) ? doc : doc ? [doc] : [];

  // Le titre de la page sert de nom de fichier par défaut pour « Enregistrer en PDF »
  useEffect(() => {
    if (!open || !fileName) return;
    const previous = window.document.title;
    window.document.title = fileName;
    return () => {
      window.document.title = previous;
    };
  }, [open, fileName]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            <X className="mr-1 size-4" /> Fermer
          </Button>
          <div className="flex items-center gap-2">
          {actions}
          <Button
            onClick={() => window.print()}
            disabled={docs.length === 0}
            className="rounded-xl bg-cyan-700 text-white hover:bg-cyan-800"
          >
            <Printer className="mr-2 size-4" /> {printLabel}
          </Button>
          </div>
        </div>
      }
    >
      {loading && <PageLoader label={loadingLabel} />}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {docs.length > 0 && issues.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            Mentions obligatoires à compléter avant d'utiliser ce document
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-9 text-xs">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {docs.length > 0 && (
        <>
          {/* Aperçu : feuilles A4 à l'échelle, défilement horizontal sur petit écran */}
          <div className="-mx-6 grid gap-6 overflow-x-auto bg-slate-100 px-6 py-6">
            {docs.map((d, i) => (
              <div key={i} className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[12mm] shadow-md ring-1 ring-slate-200">
                {d}
              </div>
            ))}
          </div>
          {createPortal(
            <div className="print-only">
              {docs.map((d, i) => (
                <div key={i} className={i > 0 ? 'break-before-page' : undefined}>
                  {d}
                </div>
              ))}
            </div>,
            window.document.body
          )}
        </>
      )}
    </Modal>
  );
}
