import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NAV_MENU } from '@/constants/landing';

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a className="flex items-center gap-2.5 font-semibold" href="#accueil">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
            F
          </span>
          Fluxio
        </a>
        <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
          {NAV_MENU.map(([label, id]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden gap-3 md:flex">
          <Button variant="ghost" asChild>
            <a href="#login">Se connecter</a>
          </Button>
          <Button asChild>
            <a href="#signup">
              Demander l'accès <ArrowRight />
            </a>
          </Button>
        </div>
        <button
          className="grid size-10 place-items-center rounded-lg border bg-white md:hidden"
          type="button"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>

      {open && (
        <nav className="absolute inset-x-5 top-16 z-20 grid gap-1 rounded-xl border bg-white p-4 shadow-xl md:hidden">
          {NAV_MENU.map(([label, id]) => (
            <a
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
              href={`#${id}`}
              key={id}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <Button className="mt-2" asChild>
            <a href="#signup">
              Demander l'accès <ArrowRight />
            </a>
          </Button>
        </nav>
      )}
    </>
  );
}
