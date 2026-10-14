import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ErrorBoundary — keeps a crashing page from blanking the whole app.
 * The layout (sidebar, top bar) stays usable and the user can retry or
 * navigate elsewhere. Give it a `key` tied to the route so it resets on
 * navigation.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-semibold text-slate-900">Cette page n'a pas pu s'afficher</h2>
        <p className="mt-1 text-sm text-slate-500">
          Une erreur inattendue s'est produite. Vous pouvez réessayer ou utiliser le menu pour
          continuer.
        </p>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs break-words text-slate-500">
          {this.state.error.message}
        </p>
        <Button className="mt-6 rounded-xl" onClick={() => this.setState({ error: null })}>
          <RotateCcw className="mr-2 size-4" /> Réessayer
        </Button>
      </div>
    );
  }
}
