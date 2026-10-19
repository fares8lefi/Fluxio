import { useEffect } from 'react';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  COLLECTED_DATA,
  DOCUMENT_RULES,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED_AT,
  SALES_DOCUMENTS,
  SECURITY_MEASURES,
  STOCK_DOCUMENTS,
} from '@/constants/privacy';

const WIDE = { fontStretch: '125%' };
const YEAR = new Date().getFullYear();

/**
 * Miniature d'un document imprimé : reprend la mise en page de FiscalDocument
 * (noir et blanc, filet épais sous l'en-tête, titre élargi) à l'échelle d'une vignette.
 */
function PaperSheet({ title, prefix }) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[210/297] w-24 shrink-0 bg-white px-2.5 pt-3 text-black shadow-[0_1px_0_rgb(0_0_0/0.06),0_6px_14px_-6px_rgb(8_51_68/0.35)] ring-1 ring-black/10 sm:w-28"
    >
      <div className="flex items-start justify-between gap-1 border-b-[1.5px] border-black pb-1.5">
        <div className="space-y-0.5 pt-0.5">
          <div className="h-[3px] w-6 bg-black/70" />
          <div className="h-[2px] w-8 bg-black/25" />
          <div className="h-[2px] w-5 bg-black/25" />
        </div>
        <p className="max-w-[60%] text-right text-[7.5px] leading-[1.05] font-semibold" style={WIDE}>
          {title}
        </p>
      </div>
      <p className="mt-1 text-right text-[5.5px] tabular-nums text-black/60">
        {prefix ? `${prefix}-${YEAR}-0001` : 'Réf. du mouvement'}
      </p>
      <div className="mt-2 space-y-[3px]">
        {[1, 0.8, 0.9, 0.6].map((w, i) => (
          <div key={i} className="flex gap-1">
            <div className="h-[2px] bg-black/20" style={{ width: `${w * 55}%` }} />
            <div className="ml-auto h-[2px] w-[18%] bg-black/20" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-2.5 bottom-3 flex justify-between">
        <div className="h-[2px] w-[38%] bg-black/30" />
        <div className="h-[2px] w-[38%] bg-black/30" />
      </div>
    </div>
  );
}

function DocumentList({ docs }) {
  return (
    <ul className="mt-8 grid gap-10">
      {docs.map((doc) => (
        <li key={doc.title} className="flex gap-5 sm:gap-7">
          <PaperSheet title={doc.sheet} prefix={doc.prefix} />
          <div className="min-w-0">
            <h4 className="text-lg font-semibold" style={{ fontStretch: '112.5%' }}>
              {doc.title}
            </h4>
            <p className="mt-1 text-sm leading-6 text-cyan-800">{doc.origin}</p>
            <p className="mt-2 leading-7 text-slate-700">{doc.purpose}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8 border-t border-slate-200 pt-10">
      <h2 id={`${id}-title`} className="text-2xl leading-tight font-semibold sm:text-3xl" style={{ fontStretch: '112.5%' }}>
        {title}
      </h2>
      <div className="mt-5 max-w-[68ch] space-y-4 leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    const previousTitle = document.title;
    document.title = 'Politique de confidentialité – Fluxio';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Navigation par hash = routeur : un lien « #donnees » quitterait la page, on fait défiler à la place
  const goTo = (id) => (e) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-cyan-900 text-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 lg:px-8">
          <a href="#accueil" aria-label="Fluxio, accueil" className="rounded-md">
            <Logo ink />
          </a>
          <a
            href="#accueil"
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-cyan-100/80 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Retour à l'accueil
          </a>
        </div>
        <div className="mx-auto max-w-6xl px-5 pt-8 pb-14 lg:px-8 lg:pt-12 lg:pb-20">
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-5xl" style={WIDE}>
            Politique de confidentialité
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-cyan-100/85">
            Ce que Fluxio enregistre, pourquoi, et comment vos devis, factures et bons sont rédigés à
            partir de ces données.
          </p>
          <p className="mt-4 text-sm text-cyan-100/60">Mise à jour le {PRIVACY_UPDATED_AT}</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[13rem_1fr] lg:gap-16 lg:px-8 lg:py-20">
        <nav aria-label="Sommaire" className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-semibold text-slate-900">Sur cette page</p>
          <ul className="mt-3 grid gap-2 border-l border-slate-200 text-sm">
            {PRIVACY_SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={goTo(id)}
                  className="-ml-px block border-l border-transparent py-0.5 pl-4 text-slate-500 hover:border-cyan-700 hover:text-slate-900"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="grid min-w-0 gap-14">
          {/* L'avertissement passe avant tout le reste : il conditionne la lecture de la page */}
          <section
            id="projet"
            aria-labelledby="projet-title"
            className="scroll-mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6 sm:p-8"
          >
            <div className="flex items-start gap-4">
              <GraduationCap className="mt-1 size-6 shrink-0 text-amber-700" aria-hidden="true" />
              <div className="max-w-[64ch]">
                <h2 id="projet-title" className="text-2xl font-semibold text-amber-950" style={{ fontStretch: '112.5%' }}>
                  Fluxio est un projet éducatif
                </h2>
                <div className="mt-3 space-y-3 leading-7 text-amber-950/85">
                  <p>
                    Fluxio a été conçu dans un cadre d'apprentissage, pour mettre en pratique la gestion
                    de stock et la facturation selon les règles fiscales tunisiennes. Ce n'est pas un
                    service commercial : il n'y a ni abonnement, ni contrat, ni garantie de disponibilité.
                  </p>
                  <p>
                    Les documents produits suivent la réglementation avec soin, mais n'ont pas été
                    validés par un expert-comptable. Utilisez de préférence des données fictives, et
                    faites vérifier toute pièce avant de l'envoyer à un vrai client ou à
                    l'administration fiscale.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Section id="donnees" title="Données enregistrées">
            <p>Fluxio n'enregistre que ce que vous saisissez vous-même pour faire tourner votre magasin.</p>
            <dl className="grid gap-x-8 gap-y-6 pt-2 sm:grid-cols-2">
              {COLLECTED_DATA.map((item) => (
                <div key={item.title}>
                  <dt className="font-semibold text-slate-900">{item.title}</dt>
                  <dd className="mt-1">{item.text}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="usage" title="Utilisation des données">
            <p>
              Vos données servent à une seule chose : faire fonctionner votre espace. Tenir le stock à
              jour, vous prévenir quand un produit passe sous son seuil, rédiger vos documents et
              afficher vos tableaux de bord.
            </p>
            <p>
              Elles ne sont ni vendues, ni louées, ni partagées avec des annonceurs. Les seuls emails
              envoyés sont ceux dont le service a besoin : code de connexion et réinitialisation du
              mot de passe.
            </p>
          </Section>

          <Section id="documents" title="Rédaction des documents">
            <p>
              Fluxio ne vous demande jamais de rédiger une facture sur une page blanche. Chaque
              document est tiré d'une opération déjà enregistrée, avec les données de votre entreprise
              et de votre client. Cinq règles s'appliquent à tous :
            </p>
            <ul className="list-disc space-y-3 pl-5 marker:text-cyan-700">
              {DOCUMENT_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>

            <h3 className="pt-8 text-xl font-semibold text-slate-900" style={{ fontStretch: '112.5%' }}>
              Documents de stock
            </h3>
            <p>
              Ils tracent les mouvements de marchandise. Ils reprennent la référence du mouvement et
              comportent deux zones de signature.
            </p>
            <DocumentList docs={STOCK_DOCUMENTS} />

            <h3 className="pt-10 text-xl font-semibold text-slate-900" style={{ fontStretch: '112.5%' }}>
              Documents de vente
            </h3>
            <p>
              Ils engagent votre entreprise vis-à-vis du client et de l'administration fiscale. Ils
              portent une numérotation propre et les montants en dinars, au millime.
            </p>
            <DocumentList docs={SALES_DOCUMENTS} />

            <p className="pt-6">
              Vous pouvez enfin exporter le journal des ventes : une ligne par facture et par
              avoir, avec la base hors taxe et la TVA de chaque taux.
            </p>
          </Section>

          <Section id="securite" title="Sécurité et conservation">
            <ul className="list-disc space-y-3 pl-5 marker:text-cyan-700">
              {SECURITY_MEASURES.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p>
              Les factures et leur historique sont conservés tant que votre espace existe, car une
              pièce comptable ne doit pas disparaître. Le projet étant éducatif, l'espace peut
              néanmoins être réinitialisé ou supprimé à la fin de la période d'apprentissage.
            </p>
          </Section>

          <Section id="droits" title="Vos droits">
            <p>
              Conformément à la loi organique n° 2004-63 du 27 juillet 2004 sur la protection des
              données à caractère personnel, vous pouvez consulter, corriger ou faire supprimer les
              données qui vous concernent.
            </p>
            <p>
              La plupart des corrections se font directement dans Fluxio, depuis les paramètres de
              l'entreprise ou les fiches clients et fournisseurs. Pour toute autre demande,
              {PRIVACY_CONTACT_EMAIL ? (
                <>
                  {' '}écrivez à{' '}
                  <a className="font-medium text-cyan-800 underline underline-offset-2" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                    {PRIVACY_CONTACT_EMAIL}
                  </a>
                  .
                </>
              ) : (
                ' adressez-vous au responsable du projet.'
              )}
            </p>
          </Section>
        </main>
      </div>

      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-400 sm:flex-row lg:px-8">
          <a href="#accueil" aria-label="Fluxio, accueil">
            <Logo small />
          </a>
          <p>© {YEAR} Fluxio, projet éducatif</p>
        </div>
      </footer>
    </div>
  );
}
