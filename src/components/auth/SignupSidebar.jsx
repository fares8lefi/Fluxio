import { Logo } from '@/components/ui/Logo';
import { StockTag } from '@/components/landing/StockTag';

/** Left panel of the auth pages: same ink + shelf tag as the landing hero */
export function SignupSidebar() {
  return (
    <aside className="hidden bg-cyan-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <a href="#accueil" aria-label="Fluxio, accueil" className="self-start">
        <Logo ink />
      </a>
      <div className="flex flex-col gap-10">
        <h1 className="max-w-md text-4xl leading-tight font-semibold">
          Le stock à jour, la liste d'achats prête.
        </h1>
        <div className="origin-top-left scale-90">
          <StockTag />
        </div>
      </div>
      <p className="text-sm text-cyan-100/60">
        Gratuit pendant la phase de test. Les données de votre entreprise restent séparées des autres.
      </p>
    </aside>
  );
}
