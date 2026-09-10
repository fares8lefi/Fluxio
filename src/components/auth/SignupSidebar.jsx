export function SignupSidebar() {
  return (
    <aside className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <a className="text-xl font-semibold" href="#accueil">
        <span className="mr-2 inline-grid size-8 place-items-center rounded-lg bg-cyan-400 text-sm text-slate-950">
          F
        </span>
        Fluxio
      </a>
      <div>
        <p className="text-sm font-semibold text-cyan-300">
          LE MVP EST GRATUIT
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Votre entreprise commence ici.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Créez votre espace sécurisé pour gérer vos stocks, produits, clients
          et factures.
        </p>
      </div>
      <p className="text-sm text-slate-400">
        Vos données sont isolées pour votre entreprise.
      </p>
    </aside>
  );
}
