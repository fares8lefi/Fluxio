import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT, SPRING_POP, SPRING_SOFT } from '@/lib/motion';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { cls: 'text-emerald-600', bar: 'bg-emerald-500' },
  error:   { Icon: AlertCircle, cls: 'text-rose-600', bar: 'bg-rose-500' },
  info:    { Icon: Info, cls: 'text-cyan-700', bar: 'bg-cyan-600' },
};

const DURATION_MS = 4000;

/**
 * Success check that draws itself — the confirmation is a key moment, so it
 * gets a little more character than the rest of the UI.
 */
function AnimatedCheck({ className }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      initial={{ scale: 0.5 }}
      animate={{ scale: 1, transition: SPRING_POP }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, transition: { duration: 0.35, ease: EASE_OUT } }}
      />
      <motion.path
        d="m8 12.5 2.5 2.5L16 9.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, transition: { duration: 0.25, delay: 0.25, ease: EASE_OUT } }}
      />
    </motion.svg>
  );
}

/**
 * ToastProvider — renders transient notifications in the bottom-right corner.
 * Use `const toast = useToast()` then `toast.success('…')` / `toast.error('…')`.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (variant, message, { description, duration = DURATION_MS } = {}) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, variant, message, description, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      error:   (msg, opts) => show('error', msg, { duration: 6000, ...opts }),
      info:    (msg, opts) => show('info', msg, opts),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map(({ id, variant, message, description, duration }) => {
            const { Icon, cls, bar } = VARIANTS[variant];
            return (
              <motion.div
                key={id}
                layout
                role={variant === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1, transition: SPRING_SOFT }}
                exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: DURATION.fast } }}
                className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3 shadow-lg sm:w-96"
              >
                {Icon ? (
                  <Icon className={cn('mt-0.5 size-5 shrink-0', cls)} aria-hidden="true" />
                ) : (
                  <AnimatedCheck className={cn('mt-0.5 size-5 shrink-0', cls)} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{message}</p>
                  {description && (
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  aria-label="Fermer la notification"
                  className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-3.5" />
                </button>
                {/* Time left before auto-dismiss */}
                {duration > 0 && (
                  <motion.span
                    aria-hidden="true"
                    className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-60', bar)}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0, transition: { duration: duration / 1000, ease: 'linear' } }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
