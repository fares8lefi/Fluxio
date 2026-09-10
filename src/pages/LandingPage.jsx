import { ArrowRight, Check, PackageCheck, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { StockMetrics } from '@/components/landing/StockMetrics';
import { LANDING_FEATURES, SECURITY_POINTS } from '@/constants/landing';

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-hidden bg-[#fcfcfd] text-slate-950 selection:bg-cyan-200">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] overflow-hidden">
        <div className="absolute top-[-420px] left-1/2 size-[920px] -translate-x-1/2 rounded-full bg-cyan-200/55 blur-3xl" />
        <div className="absolute top-20 right-[8%] size-80 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <LandingHeader />

      <motion.main
        id="accueil"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 pt-16 pb-20 text-center sm:pt-24 lg:px-8 lg:pb-28">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-cyan-800 shadow-sm"
          >
            <PackageCheck className="size-3.5" /> MVP gratuit de gestion
            d'activité
          </motion.p>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.08 }}
            className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.03] font-semibold tracking-[-.055em] sm:text-6xl lg:text-7xl"
          >
            Gardez le contrôle de votre activité,{' '}
            <span className="text-cyan-700">sans complexité.</span>
          </motion.h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Fluxio réunit inventaire, catalogue, clients et facturation pour
            aider les PME à travailler avec une information toujours fiable.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 rounded-xl px-5" asChild>
              <a href="#signup">
                Accéder au MVP gratuitement <ArrowRight />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl bg-white px-5"
              asChild
            >
              <a href="#produit">Découvrir le produit</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Gratuit pendant la phase MVP · Sans carte bancaire
          </p>

          <DashboardPreview />
        </section>

        {/* MVP Banner */}
        <section id="mvp" className="border-y bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-9 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-medium tracking-[.16em] text-slate-400 uppercase">
                UNE VERSION CONSTRUITE AVEC VOUS
              </p>
              <p className="mt-1 font-medium text-slate-700">
                Fluxio est gratuit pendant sa phase MVP.
              </p>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Nous itérons avec les premiers utilisateurs. Un plan payant ne
              sera envisagé qu'après validation du produit.
            </p>
          </div>
        </section>

        {/* Features */}
        <section
          id="produit"
          className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"
        >
          <p className="text-sm font-semibold text-cyan-700">
            UNE VUE FIABLE DE VOTRE ACTIVITÉ
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Les essentiels de votre entreprise, réunis.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Un outil simple pour transformer vos données de gestion en décisions
            rapides et sereines.
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {LANDING_FEATURES.map(([Icon, title, description]) => (
              <article
                className="rounded-2xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                key={title}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-cyan-100 text-cyan-800">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Security */}
        <section
          id="securite"
          className="bg-slate-950 px-5 py-24 text-white lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                CONÇU POUR VOTRE ENTREPRISE
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                Des données fiables, une entreprise protégée.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Chaque entreprise dispose de son espace isolé. Les opérations de
                stock restent cohérentes, même lors de mouvements simultanés.
              </p>
              <ul className="mt-8 grid gap-4 text-slate-200">
                {SECURITY_POINTS.map((text) => (
                  <li className="flex gap-3" key={text}>
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-cyan-400 text-slate-950">
                      <Check className="size-3.5 stroke-[3]" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <StockMetrics />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.01 }}
            className="rounded-3xl bg-cyan-100 px-6 py-14 text-center"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-cyan-800 shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
              Reprenez le contrôle, dès maintenant.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Accédez au MVP gratuitement et participez à la construction de
              l'outil dont votre équipe a besoin.
            </p>
            <Button
              id="demarrer"
              size="lg"
              className="mt-8 h-12 rounded-xl bg-cyan-800 px-6 hover:bg-cyan-900"
              asChild
            >
              <a href="mailto:bonjour@fluxio.app">
                Demander l'accès gratuit <ArrowRight />
              </a>
            </Button>
          </motion.div>
        </section>
      </motion.main>

      <footer className="border-t px-5 py-8 text-center text-sm text-slate-500">
        © 2026 Fluxio. Conçu pour les PME.
      </footer>
    </div>
  );
}
