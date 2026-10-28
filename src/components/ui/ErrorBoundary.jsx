import { Component } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { EASE_IN_OUT } from '@/lib/motion';

/* Slots of the Fluxio mark, scaled up: x and full height of each bar */
const SLOTS = [
  { x: 10, h: 45 },
  { x: 40, h: 33 },
  { x: 70, h: 15 },
];
const GROUND = 58;

/**
 * StockOutMark — the logo's bars drain to empty once, leaving dashed
 * outlines where the stock stood; the last slot turns brick red.
 */
function StockOutMark({ className }) {
  const reduce = useReducedMotion();

  return (
    <svg viewBox="0 0 100 64" aria-hidden="true" className={className}>
      {/* Alert threshold, the amber of the logo's low bar */}
      <line x1="2" x2="98" y1={GROUND - 15} y2={GROUND - 15} stroke="#e8a33d" strokeWidth="1" strokeDasharray="3 3" />
      {SLOTS.map(({ x, h }, i) => (
        <g key={x}>
          <motion.rect
            x={x + 0.5}
            y={GROUND - h + 0.5}
            width="19"
            height={h - 1}
            rx="2"
            fill="none"
            strokeWidth="1"
            strokeDasharray="2.5 2"
            initial={{ stroke: '#bcc7c9' }}
            animate={{ stroke: i === SLOTS.length - 1 ? '#b9342b' : '#bcc7c9' }}
            transition={{ delay: reduce ? 0 : 1.1, duration: 0.3 }}
          />
          <motion.rect
            x={x}
            y={GROUND - h}
            width="20"
            height={h}
            rx="2"
            fill="#0f5a63"
            style={{ transformBox: 'fill-box', originY: 1 }}
            initial={{ scaleY: reduce ? 0 : 1 }}
            animate={{ scaleY: 0 }}
            transition={{ delay: 0.25 + i * 0.14, duration: 0.7, ease: EASE_IN_OUT }}
          />
        </g>
      ))}
      <line x1="2" x2="98" y1={GROUND + 1} y2={GROUND + 1} stroke="#8d9c9f" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ErrorState — what a crashed screen shows instead of a blank page
 * @param {Error} error
 * @param {boolean} [fullScreen] — the whole app crashed (no layout around it)
 * @param {() => void} onRetry
 */
export function ErrorState({ error, fullScreen = false, onRetry }) {
  const Heading = fullScreen ? 'h1' : 'h2';

  const body = (
    <div role="alert" className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
      <StockOutMark className="w-32 shrink-0 sm:w-40" />
      <div className="max-w-md">
        <Heading className="text-2xl font-semibold text-slate-900">
          {fullScreen ? "Fluxio n'a pas pu s'afficher" : "Cette page n'a pas pu s'afficher"}
        </Heading>
        <p className="mt-2 text-slate-600">
          {fullScreen
            ? "Une erreur inattendue a interrompu l'affichage. Rechargez la page pour reprendre là où vous en étiez."
            : "Une erreur inattendue a interrompu l'affichage. Réessayez, ou ouvrez une autre page depuis le menu."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="rounded-xl" onClick={onRetry}>
            <RotateCcw className="mr-2 size-4" aria-hidden="true" />
            {fullScreen ? 'Recharger la page' : 'Réessayer'}
          </Button>
          {fullScreen && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href="/dashboard">Aller au tableau de bord</a>
            </Button>
          )}
        </div>

        {error?.message && (
          <details className="group mt-6 text-sm text-slate-500">
            <summary className="w-fit cursor-pointer rounded select-none hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none">
              Détails techniques
            </summary>
            <p className="mt-2 border-l-2 border-rose-300 py-1 pl-3 font-mono text-xs break-words text-slate-600">
              {error.message}
            </p>
          </details>
        )}
      </div>
    </div>
  );

  if (!fullScreen) return <div className="py-10 sm:py-16">{body}</div>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-4 py-6 sm:px-10">
      <a href="/" aria-label="Accueil Fluxio" className="w-fit">
        <Logo small />
      </a>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center">{body}</main>
    </div>
  );
}

/**
 * ErrorBoundary — keeps a crash from blanking the app.
 * - Inside the dashboard layout: the sidebar stays usable; give it a `key`
 *   tied to the route so it resets on navigation.
 * - `fullScreen` at the app root: last resort when everything else failed.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack);
    // The root boundary has no route key: leaving the broken route clears it
    if (this.props.fullScreen) window.addEventListener('popstate', this.reset, { once: true });
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.reset);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    const { fullScreen = false } = this.props;
    return (
      <ErrorState
        error={this.state.error}
        fullScreen={fullScreen}
        onRetry={fullScreen ? () => window.location.reload() : this.reset}
      />
    );
  }
}
