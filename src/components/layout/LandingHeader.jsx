import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { NAV_MENU } from '@/constants/landing';

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a href="#accueil" aria-label="Fluxio, accueil" className="rounded-md">
          <Logo ink />
        </a>
        <nav aria-label="Sections" className="hidden gap-8 text-sm font-medium text-cyan-100/80 md:flex">
          {NAV_MENU.map(([label, id]) => (
            <a href={`#${id}`} key={id} className="transition hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" asChild>
            <a href="#login">Se connecter</a>
          </Button>
          <Button className="bg-white text-cyan-900 hover:bg-cyan-50" asChild>
            <a href="#signup">Créer un compte</a>
          </Button>
        </div>
        <button
          className="grid size-10 place-items-center rounded-lg text-white ring-1 ring-white/20 md:hidden"
          type="button"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="absolute inset-x-5 top-18 grid gap-1 rounded-xl border bg-white p-3 shadow-xl md:hidden">
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
          <Button variant="outline" className="mt-2" asChild>
            <a href="#login">Se connecter</a>
          </Button>
          <Button asChild>
            <a href="#signup">Créer un compte</a>
          </Button>
        </nav>
      )}
    </header>
  );
}
