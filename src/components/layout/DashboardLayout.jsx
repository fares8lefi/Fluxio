import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { DURATION, EASE_OUT, SPRING_SOFT, pageTransition } from '@/lib/motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Package2,
  Tag,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  FileInput,
  ReceiptText,
  FileMinus,
  Gauge,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * Sidebar nav item definition
 * id        — hash sub-route segment (e.g. 'products')
 * label     — display label
 * icon      — LucideIcon
 * children  — optional nested items
 */
const NAV = [
  { id: '', label: 'Accueil', icon: Home },
  {
    id: 'products',
    label: 'Produits',
    icon: Package2,
    children: [
      { id: 'categories', label: 'Catégories', icon: Tag },
      { id: 'inventory', label: 'Inventaire', icon: ClipboardCheck },
    ],
  },
  {
    id: 'movements',
    label: 'Mouvements',
    icon: ArrowLeftRight,
    children: [
      { id: 'movements/in', label: 'Entrées (Achats)', icon: ArrowDownLeft },
      { id: 'movements/out', label: 'Sorties (Ventes)', icon: ArrowUpRight },
      {
        id: 'movements/return-supplier',
        label: 'Retour Fournisseur',
        icon: RotateCcw,
      },
      {
        id: 'movements/return-client',
        label: 'Retour Client',
        icon: RotateCcw,
      },
    ],
  },
  { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
  { id: 'clients', label: 'Clients', icon: Users },
  // Indicateurs financiers (marge, encaissements) : gérant et comptable
  { id: 'manager', label: 'Pilotage', icon: Gauge, permission: 'finance.read' },
  {
    id: 'invoices',
    label: 'Facturation',
    icon: FileText,
    children: [
      { id: 'invoices', label: 'Factures de Vente', icon: ReceiptText },
      { id: 'invoices/quotes', label: 'Devis & Pro Forma', icon: FileInput },
      { id: 'invoices/credit-notes', label: 'Avoirs', icon: FileMinus },
    ],
  },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

// Legacy sub-routes that render the same page as a nav entry
const ALIASES = {
  achats: 'movements/in',
  ventes: 'movements/out',
  'settings/company': 'settings',
};

/** Trail of nav items leading to `sub` (deepest match last), or null */
function findTrail(sub, items = NAV, trail = []) {
  for (const item of items) {
    if (item.children) {
      const found = findTrail(sub, item.children, [...trail, item]);
      if (found) return found;
    }
    if (item.id === sub) return [...trail, item];
  }
  return null;
}

const containsSub = (item, sub) =>
  item.children?.some((c) => c.id === sub || containsSub(c, sub)) ?? false;

const FOCUS_RING =
  'focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none';

function NavItem({ item, currentSub, onNavigate, depth = 0 }) {
  const hasActiveChild = containsSub(item, currentSub);
  // Exact match — unless a child shares the same id (e.g. 'invoices')
  const isCurrent = item.id === currentSub && !hasActiveChild;

  const [open, setOpen] = useState(hasActiveChild || isCurrent);

  // Expand when navigating into this group from elsewhere
  const [prevActive, setPrevActive] = useState(hasActiveChild);
  if (hasActiveChild !== prevActive) {
    setPrevActive(hasActiveChild);
    if (hasActiveChild) setOpen(true);
  }

  return (
    <div>
      <div className="relative flex items-center">
        {/* Label navigates; the chevron alone toggles the group */}
        <button
          type="button"
          onClick={() => {
            onNavigate(item.id);
            if (item.children) setOpen(true);
          }}
          aria-current={isCurrent ? 'page' : undefined}
          className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${FOCUS_RING} ${
            depth > 0 ? 'pl-9' : ''
          } ${item.children ? 'pr-10' : ''} ${
            isCurrent
              ? 'text-cyan-800'
              : hasActiveChild
                ? 'text-slate-950'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
          }`}
        >
          {/* Active highlight glides between items (shared layoutId) */}
          {isCurrent && (
            <motion.span
              layoutId="nav-active"
              aria-hidden="true"
              className="absolute inset-0 rounded-lg bg-cyan-50"
              transition={SPRING_SOFT}
            />
          )}
          <item.icon
            className={`relative shrink-0 ${depth > 0 ? 'size-3.5' : 'size-4'}`}
          />
          <span className="relative flex-1 truncate text-left">
            {item.label}
          </span>
        </button>
        {item.children && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={`${open ? 'Replier' : 'Déplier'} ${item.label}`}
            className={`absolute right-1 grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 ${FOCUS_RING}`}
          >
            <ChevronRight
              className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </div>

      {item.children && open && (
        <div className="relative mt-0.5 space-y-0.5 before:absolute before:top-1 before:bottom-1 before:left-5 before:w-px before:bg-slate-200">
          {item.children.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              currentSub={currentSub}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Logo({ small = false }) {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span
        className={`inline-grid place-items-center bg-cyan-700 text-xs text-white ${
          small ? 'size-6 rounded-md' : 'size-7 rounded-lg'
        }`}
      >
        F
      </span>
      Fluxio
    </span>
  );
}

function UserAvatar({ user, className = 'size-8 text-sm' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-800 ${className}`}
    >
      {user?.username?.charAt(0).toUpperCase() || 'U'}
    </span>
  );
}

/** Sidebar content — shared by the desktop aside and the mobile drawer */
function Sidebar({ currentSub, onNavigate, onClose }) {
  const { user, isAdmin, logout, can } = useAuth();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <button
          type="button"
          onClick={() => onNavigate('')}
          aria-label="Fluxio — Accueil"
          className={`rounded-md ${FOCUS_RING}`}
        >
          <Logo />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-4">
        {/* One layout group per sidebar instance (desktop / mobile drawer) */}
        <LayoutGroup id={onClose ? 'sidebar-mobile' : 'sidebar-desktop'}>
          <nav aria-label="Navigation principale" className="grid gap-0.5 px-3">
            {NAV.filter((item) => !item.permission || can(item.permission)).map((item) => (
              <NavItem
                key={item.id}
                item={item}
                currentSub={currentSub}
                onNavigate={onNavigate}
              />
            ))}

            {isAdmin && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '#admin';
                    onClose?.();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg bg-indigo-50/70 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  <ShieldCheck className="size-4 shrink-0 text-indigo-600" />
                  <span className="flex-1 text-left">Administration</span>
                  <span className="rounded bg-indigo-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-800 uppercase">
                    Admin
                  </span>
                </button>
              </div>
            )}
          </nav>
        </LayoutGroup>
      </div>

      {/* User footer */}
      <div className="border-t p-4">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          title="Paramètres du compte"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-slate-50 ${FOCUS_RING}`}
        >
          <UserAvatar user={user} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-none font-medium">
              {user?.username}
            </span>
            <span className="mt-1 block truncate text-xs text-slate-500">
              {user?.company_name}
            </span>
          </span>
        </button>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start text-slate-600 hover:bg-rose-50 hover:text-rose-600"
          onClick={logout}
        >
          <LogOut className="mr-2 size-4" />
          Déconnexion
        </Button>
      </div>
    </>
  );
}

function Breadcrumb({ trail, onNavigate }) {
  const items = trail.filter((item) => item.id !== '');

  return (
    <nav aria-label="Fil d'Ariane" className="hidden min-w-0 lg:block">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          {items.length === 0 ? (
            <span aria-current="page" className="font-medium text-slate-900">
              Accueil
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('')}
              className="text-slate-500 transition hover:text-slate-900"
            >
              Accueil
            </button>
          )}
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={`${item.id}-${i}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              <ChevronRight
                className="size-3.5 shrink-0 text-slate-300"
                aria-hidden="true"
              />
              {last ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-slate-900"
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className="truncate text-slate-500 transition hover:text-slate-900"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function DashboardLayout({ children, currentSub, onNavigate }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSub = ALIASES[currentSub] ?? currentSub;
  const trail = findTrail(activeSub) ?? [NAV[0]];
  const pageTitle = trail[trail.length - 1].label;

  // Browser tab title follows the current page
  useEffect(() => {
    document.title = `${pageTitle} · Fluxio`;
  }, [pageTitle]);

  // Mobile drawer: close on Escape, lock body scroll while open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navigate = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault(); // keep the hash router untouched
          document.getElementById('main-content')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Aller au contenu
      </a>

      {/* Desktop sidebar — stays in view while the page scrolls */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-white lg:flex">
        <Sidebar currentSub={activeSub} onNavigate={navigate} />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div key="drawer" className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.base }}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{
                x: 0,
                transition: { duration: DURATION.base, ease: EASE_OUT },
              }}
              exit={{
                x: '-100%',
                transition: { duration: DURATION.fast, ease: 'easeIn' },
              }}
              className="absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col border-r bg-white shadow-xl"
            >
              <Sidebar
                currentSub={activeSub}
                onNavigate={navigate}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar — breadcrumb on desktop, menu + logo on mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/85 px-5 backdrop-blur sm:px-10">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            className="grid size-9 place-items-center rounded-lg border text-slate-600 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <span className="lg:hidden">
            <Logo small />
          </span>

          <Breadcrumb trail={trail} onNavigate={navigate} />

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('settings')}
              aria-label="Paramètres du compte"
              className={`flex items-center gap-2 rounded-full p-0.5 transition hover:bg-slate-100 lg:pr-3 ${FOCUS_RING}`}
            >
              <UserAvatar user={user} className="size-8 text-xs" />
              <span className="hidden text-sm font-medium text-slate-700 lg:inline">
                {user?.username}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Déconnexion"
              title="Déconnexion"
              className="text-slate-500 hover:bg-rose-50 hover:text-rose-600 lg:hidden"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-5 outline-none sm:p-10"
        >
          {/* Reset on navigation: a crash on one page doesn't follow you to the next */}
          <ErrorBoundary key={activeSub}>
            {/* Short fade-and-rise on every navigation */}
            <motion.div key={activeSub} {...pageTransition}>
              {children}
            </motion.div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
