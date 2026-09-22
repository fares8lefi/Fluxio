import {
  ArrowRight,
  Check,
  Quote,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { StockMetrics } from '@/components/landing/StockMetrics';
import {
  LANDING_FEATURES,
  SECURITY_POINTS,
  TESTIMONIALS,
} from '@/constants/landing';

const STATS = [
  { value: '< 5 min', label: 'Pour démarrer' },
  { value: '4', label: 'Modules intégrés' },
  { value: '100%', label: 'Gratuit pendant le test' },
  { value: '0', label: 'Carte bancaire requise' },
];

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen overflow-hidden bg-[#fcfcfd] text-slate-950 selection:bg-cyan-200">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] overflow-hidden">
        <div className="absolute top-[-420px] left-1/2 size-[920px] -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute top-20 right-[8%] size-80 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute top-60 left-[5%] size-60 rounded-full bg-sky-100/40 blur-2xl" />
      </div>

      <LandingHeader />

      <motion.main
        id="accueil"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-5 pt-16 pb-20 text-center sm:pt-24 lg:px-8 lg:pb-28">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-cyan-800 shadow-sm"
          >
            <Zap className="size-3.5 fill-cyan-400 text-cyan-400" />
            Gestion d'activité pour PME — simple et fiable
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.08 }}
            className="mx-auto mt-7 max-w-4xl text-5xl leading-[1.03] font-semibold tracking-[-.055em] sm:text-6xl lg:text-7xl"
          >
            Gardez le contrôle de votre activité,{' '}
            <span className="text-cyan-700">sans complexité.</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl"
          >
            Fluxio réunit inventaire, catalogue, clients et facturation dans un
            outil conçu pour les PME — pas pour les grandes entreprises.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.22 }}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" className="h-12 rounded-xl px-6" asChild>
              <a href="#signup">
                Essayer gratuitement <ArrowRight className="ml-1" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl bg-white px-6"
              asChild
            >
              <a href="#produit">Voir les fonctionnalités</a>
            </Button>
          </motion.div>

          <p className="mt-4 text-xs text-slate-400">
            Sans carte bancaire · Accès immédiat · Données sécurisées
          </p>

          <DashboardPreview />
        </section>

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <section className="border-y bg-white/70">
          <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
            {STATS.map(({ value, label }) => (
              <div key={label} className="px-6 py-8 text-center">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────── */}
        <section
          id="produit"
          className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"
        >
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 max-w-8 bg-cyan-400" />
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">
              Fonctionnalités
            </p>
          </div>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Les essentiels de votre entreprise, réunis.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Un outil conçu pour transformer vos données de gestion en décisions
            rapides — sans formation, sans consultant.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {LANDING_FEATURES.map(([Icon, title, description, bullets]) => (
              <article
                className="group rounded-2xl border bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-200"
                key={title}
              >
                <span className="grid size-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 transition group-hover:bg-cyan-100">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {description}
                </p>
                <ul className="mt-5 space-y-1.5">
                  {bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      <Check className="size-3.5 shrink-0 text-cyan-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── Why Fluxio ───────────────────────────────────────────── */}
        <section className="bg-slate-50 px-5 py-20 lg:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-px w-8 bg-cyan-400" />
                  <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">
                    Pourquoi Fluxio
                  </p>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Fini les tableaux Excel et les outils trop lourds.
                </h2>
                <p className="mt-5 leading-7 text-slate-600">
                  La plupart des PME gèrent leur activité sur des fichiers
                  partagés ou des ERP conçus pour des entreprises 10× plus
                  grandes. Fluxio comble cet écart.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Information toujours à jour pour toute l'équipe",
                    "Interface pensée pour la simplicité, pas la complexité",
                    "Démarrage en moins de 5 minutes, sans formation",
                    "Construit avec les retours des premiers utilisateurs",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-cyan-100 text-cyan-700">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      <span className="text-sm text-slate-700">{text}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 rounded-xl" asChild>
                  <a href="#signup">
                    Commencer gratuitement <ArrowRight className="ml-1" />
                  </a>
                </Button>
              </div>

              {/* Visual: before/after */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-rose-400">
                    Avant Fluxio
                  </p>
                  {[
                    "Fichiers Excel en doublon sur plusieurs postes",
                    "Stock inconnu jusqu'à la prochaine prise d'inventaire",
                    "Factures ressaisies à la main depuis le catalogue",
                  ].map((t) => (
                    <div key={t} className="mt-2 flex items-start gap-2">
                      <span className="mt-0.5 text-rose-400">✕</span>
                      <p className="text-sm text-rose-700">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Avec Fluxio
                  </p>
                  {[
                    'Une seule source de vérité, accessible partout',
                    'Stock mis à jour à chaque mouvement, en temps réel',
                    'Factures générées en un clic depuis vos commandes',
                  ].map((t) => (
                    <div key={t} className="mt-2 flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <p className="text-sm text-emerald-800">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Security ─────────────────────────────────────────────── */}
        <section
          id="securite"
          className="bg-slate-950 px-5 py-24 text-white lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-cyan-400" />
                <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">
                  Sécurité & fiabilité
                </p>
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                Des données fiables, une entreprise protégée.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Chaque entreprise dispose de son espace isolé. Les opérations de
                stock restent cohérentes, même lors de mouvements simultanés.
              </p>
              <ul className="mt-8 grid gap-5 text-slate-200">
                {SECURITY_POINTS.map(([Icon, text]) => (
                  <li className="flex items-center gap-4" key={text}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="size-5" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <StockMetrics />
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────── */}
        <section
          id="temoignages"
          className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-cyan-400" />
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">
                Témoignages
              </p>
              <span className="h-px w-8 bg-cyan-400" />
            </div>
            <h2 className="mx-auto mt-4 max-w-xl text-4xl font-semibold tracking-tight">
              Ce qu'en disent les premiers utilisateurs.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ quote, author, role, initials }) => (
              <blockquote
                key={author}
                className="flex flex-col rounded-2xl border bg-white p-7 shadow-sm"
              >
                <Quote className="size-6 text-cyan-200" />
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-700">
                  {quote}
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">
                    {initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{author}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="px-5 pb-24 lg:px-8">
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: 1.005 }}
            className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 px-8 py-16 text-center text-white shadow-xl"
          >
            <span className="mx-auto mb-6 grid size-12 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
              <TrendingUp className="size-6" />
            </span>
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Reprenez le contrôle, dès aujourd'hui.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-cyan-100">
              Rejoignez les premières PME qui ont simplifié leur gestion avec
              Fluxio. Accès immédiat, sans engagement.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-white px-6 text-cyan-800 hover:bg-cyan-50 hover:text-cyan-900"
                asChild
              >
                <a href="#signup">
                  Créer mon compte gratuitement <ArrowRight className="ml-1" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-xl px-6 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="#login">J'ai déjà un compte</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-cyan-200">
              Sans carte bancaire · Résiliable à tout moment
            </p>
          </motion.div>
        </section>
      </motion.main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <a className="flex items-center gap-2.5 font-semibold" href="#accueil">
              <span className="grid size-8 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                F
              </span>
              Fluxio
            </a>
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
              <a href="#produit" className="hover:text-slate-900">Produit</a>
              <a href="#securite" className="hover:text-slate-900">Sécurité</a>
              <a href="#temoignages" className="hover:text-slate-900">Témoignages</a>
              <a href="#signup" className="hover:text-slate-900">S'inscrire</a>
              <a href="#login" className="hover:text-slate-900">Se connecter</a>
            </nav>
            <p className="text-sm text-slate-400">
              © 2026 Fluxio
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
