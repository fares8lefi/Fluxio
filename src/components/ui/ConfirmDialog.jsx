import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { SPRING_POP } from '@/lib/motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider — styled replacement for window.confirm / window.prompt.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Supprimer ?', destructive: true }))) return;
 *
 *   // With a text field (prompt): resolves to the string, or null if cancelled
 *   const reason = await confirm({ title: 'Motif', input: { label: 'Motif' } });
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [value, setValue] = useState('');
  const resolver = useRef(null);
  // Last options shown, kept so the dialog keeps its content while animating out
  const lastShown = useRef(null);

  const confirm = useCallback((options) => {
    setValue(options.input?.defaultValue ?? '');
    lastShown.current = options;
    setState(options);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
  };

  const cancel = () => close(state?.input ? null : false);
  const accept = () => close(state?.input ? value.trim() : true);

  const {
    title,
    description,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    destructive = false,
    input,
  } = state ?? lastShown.current ?? {};
  const Icon = destructive ? AlertTriangle : HelpCircle;
  const invalid = input?.required && !value.trim();
  const isOpen = !!state;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={isOpen}
        title={title}
        onClose={cancel}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="rounded-xl" onClick={cancel}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form="confirm-dialog-form"
              disabled={invalid}
              className={cn(
                'rounded-xl text-white',
                destructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-cyan-700 hover:bg-cyan-800'
              )}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <form
          id="confirm-dialog-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalid) accept();
          }}
          className="flex gap-4"
        >
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { ...SPRING_POP, delay: 0.08 } }}
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full',
              destructive ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-700'
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0 flex-1 space-y-3">
            {description && (
              <p className="pt-2 text-sm whitespace-pre-line text-slate-600">
                {description}
              </p>
            )}
            {input && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  {input.label}
                </span>
                <textarea
                  rows={3}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={input.placeholder}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
              </label>
            )}
          </div>
        </form>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}
