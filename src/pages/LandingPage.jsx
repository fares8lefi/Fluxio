import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { StockTag } from '@/components/landing/StockTag';
import { SECURITY_POINTS, WORKFLOW } from '@/constants/landing';

export default function LandingPage() {
  return (
    <div id="accueil" className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Hero: ink, the tag is the product demo ── */}
      <div className="bg-cyan-900 text-white">
        <LandingHeader />

        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-10 pb-20 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pt-16 lg:pb-28">
          <div>
            <h1 className="max-w-xl text-5xl leading-[1.02] font-semibold sm:text-6xl" style={{ fontStretch: '125%' }}>
              Sachez quoi commander avant la rupture.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-cyan-100/85">
              Fluxio enregistre vos réceptions, ventes et retours, tient le stock à jour et vous
              liste les produits à recommander. La facturation en TND est incluse.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 bg-amber-400 px-6 text-cyan-950 hover:bg-amber-300" asChild>
                <a href="/signup">Créer un compte gratuit</a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-6 text-white ring-1 ring-white/25 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="#produit">Voir comment ça marche</a>
              </Button>
            </div>
            <p className="mt-5 text-sm text-cyan-100/60">
              Gratuit pendant la phase de test. Aucune carte bancaire demandée.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <StockTag />
          </div>
        </section>
      </div>

      <main>
        {/* ── Workflow: a real sequence, numbered ── */}
        <section id="produit" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-24 lg:px-8">
          <h2 className="max-w-2xl text-4xl leading-tight font-semibold">
            Une journée au magasin, du camion à la facture.
          </h2>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {WORKFLOW.map((step, i) => (
              <li key={step.title} className="border-t-2 border-cyan-900 pt-5">
                <span className="figure text-sm font-semibold text-cyan-600">{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold" style={{ fontStretch: '112.5%' }}>
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Security ── */}
        <section id="securite" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-24 lg:px-8">
          <h2 className="max-w-2xl text-4xl leading-tight font-semibold">
            Vos chiffres restent les vôtres, et restent justes.
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {SECURITY_POINTS.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-cyan-600" aria-hidden="true" />
                <span className="leading-7 text-slate-700">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Closing call to action ── */}
        <section className="px-5 pb-24 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-2xl bg-cyan-900 px-8 py-12 text-white sm:px-12 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Votre stock à jour dès ce soir.</h2>
              <p className="mt-3 text-cyan-100/80">
                Créez l'espace de votre entreprise en quelques minutes, puis ajoutez vos produits.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 bg-amber-400 px-6 text-cyan-950 hover:bg-amber-300" asChild>
                <a href="/signup">Créer un compte gratuit</a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-6 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="/login">J'ai déjà un compte</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row lg:px-8">
          <a href="#accueil" aria-label="Fluxio, accueil">
            <Logo small />
          </a>
          <nav aria-label="Pied de page" className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <a href="#produit" className="hover:text-slate-900">Fonctionnement</a>
            <a href="#securite" className="hover:text-slate-900">Sécurité</a>
            <a href="/signup" className="hover:text-slate-900">Créer un compte</a>
            <a href="/login" className="hover:text-slate-900">Se connecter</a>
            <a href="/confidentialite" className="hover:text-slate-900">Politique de confidentialité</a>
          </nav>
          <p className="text-sm text-slate-400">© 2026 Fluxio, projet éducatif</p>
        </div>
      </footer>
    </div>
  );
}
