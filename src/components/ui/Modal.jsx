import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DURATION, SPRING_SOFT } from '@/lib/motion';

const SIZE_CLS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Number of modals currently open — body scroll stays locked until the last closes
let openCount = 0;

/**
 * Modal — accessible overlay + dialog
 * Traps focus, locks body scroll, closes on Escape and restores focus on close.
 * @param {boolean}   open
 * @param {string}    title
 * @param {ReactNode} children
 * @param {()=>void}  onClose
 * @param {ReactNode} [footer]
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'} [size='md']
 */
export function Modal({ open, title, children, onClose, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Scroll lock + initial focus + focus restore
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;

    openCount += 1;
    document.body.style.overflow = 'hidden';

    // Focus the first form field, else the dialog itself
    const dialog = dialogRef.current;
    const firstField = dialog?.querySelector(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
    );
    (firstField ?? dialog)?.focus();

    return () => {
      openCount -= 1;
      if (openCount === 0) document.body.style.overflow = '';
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  // Escape + Tab focus trap
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== 'Tab') return;

    const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    // AnimatePresence keeps the dialog mounted during its exit animation
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          onKeyDown={handleKeyDown}
          exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: DURATION.base } }}
          />

          {/* Dialog — bottom sheet on mobile, centered on desktop */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING_SOFT }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
              transition: { duration: DURATION.fast },
            }}
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl border bg-white shadow-2xl outline-none sm:rounded-2xl ${SIZE_CLS[size] ?? SIZE_CLS.md}`}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
              <h2
                id={titleId}
                className="text-base font-semibold text-slate-900"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex shrink-0 justify-end gap-3 rounded-b-2xl border-t bg-slate-50/80 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
