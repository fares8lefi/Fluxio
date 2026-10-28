import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { EASE_OUT } from '@/lib/motion';

const START = 52;
const THRESHOLD = 40;
const MAX = 80; // the gauge spans twice the threshold
const SEGMENTS = 20;

// Four sales in a morning: enough to cross the alert threshold
const SALES = [
  { client: 'Batimex SARL', qty: 6, time: '08:12' },
  { client: 'Comptoir Sfax', qty: 8, time: '09:40' },
  { client: 'Batimex SARL', qty: 7, time: '10:05' },
  { client: 'Particulier', qty: 13, time: '11:31' },
];

/**
 * Landing hero: a shelf tag that drains as sales are recorded, crosses its
 * alert threshold and tells you what to order. Plays once; with reduced
 * motion it shows the end state directly.
 */
export function StockTag() {
  const reduceMotion = useReducedMotion();
  // Toujours 0 au premier rendu, comme le HTML prérendu (sinon erreur d'hydratation) ;
  // avec mouvement réduit, on saute aussitôt à l'état final
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= SALES.length) return;
    const delay = reduceMotion ? 0 : step === 0 ? 1100 : 850;
    const id = setTimeout(() => setStep((s) => (reduceMotion ? SALES.length : s + 1)), delay);
    return () => clearTimeout(id);
  }, [step, reduceMotion]);

  const stock = SALES.slice(0, step).reduce((left, sale) => left - sale.qty, START);
  const low = stock < THRESHOLD;
  const filled = Math.round((stock / MAX) * SEGMENTS);
  const thresholdAt = (THRESHOLD / MAX) * SEGMENTS;

  return (
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-xl ring-1 ring-black/5 sm:p-7">
      {/* Hole punch of a hanging shelf tag */}
      <span
        aria-hidden="true"
        className="absolute top-4 right-5 size-3 rounded-full bg-cyan-900 ring-4 ring-slate-100"
      />

      <p className="text-sm text-slate-500">Réf. CIM-50, rayon B3</p>
      <p className="mt-1 text-lg font-semibold">Ciment CEM II 50 kg</p>

      <p className="mt-5 flex items-baseline gap-2" aria-live="polite">
        <span
          className={`figure text-6xl leading-none font-semibold transition-colors duration-300 ${
            low ? 'text-amber-600' : 'text-cyan-900'
          }`}
        >
          {stock}
        </span>
        <span className="text-slate-500">sacs en stock</span>
      </p>

      {/* Gauge: one notch = 4 sacs, the tick marks the alert threshold */}
      <div className="relative mt-5" aria-hidden="true">
        <div className="flex gap-1">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={`h-6 flex-1 rounded-[3px] transition-colors duration-300 ${
                i < filled ? (low ? 'bg-amber-500' : 'bg-cyan-600') : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
        <span
          className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded bg-slate-900"
          style={{ left: `calc(${(thresholdAt / SEGMENTS) * 100}% - 3px)` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-500">Seuil d'alerte : {THRESHOLD} sacs</p>

      <ol className="mt-5 space-y-1.5 border-t pt-4 text-sm">
        <AnimatePresence initial={false}>
          {SALES.slice(0, step).map((sale) => (
            <motion.li
              key={sale.time}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="flex items-center gap-2 text-slate-600"
            >
              <ArrowUpRight className="size-3.5 text-slate-400" aria-hidden="true" />
              <span className="figure text-slate-400">{sale.time}</span>
              <span className="flex-1 truncate">Sortie, {sale.client}</span>
              <span className="figure font-medium text-slate-900">−{sale.qty}</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {step === 0 && <li className="text-slate-400">Aucune vente ce matin.</li>}
      </ol>

      <AnimatePresence>
        {low && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <span className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
              <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
              Sous le seuil. À commander :
              <span className="figure ml-auto font-semibold">+{THRESHOLD - stock} sacs</span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StockTag;
