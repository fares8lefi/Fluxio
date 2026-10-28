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
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * Sidebar nav item definition
 * id        — dashboard sub-path segment (e.g. 'products')
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
      { id: 'movements/in', label: 'Entrées (achats)', icon: ArrowDownLeft },
      { id: 'movements/out', label: 'Sorties (ventes)', icon: ArrowUpRight },
      {
        id: 'movements/return-supplier',
        label: 'Retour fournisseur',
        icon: RotateCcw,
      },
      {
        id: 'movements/return-client',
        label: 'Retour client',
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
      { id: 'invoices', label: 'Factures de vente', icon: ReceiptText },
      { id: 'invoices/quotes', label: 'Devis et pro forma', icon: FileInput },
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
// Same ring, legible on the ink sidebar
const FOCUS_RING_INK =
  'focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none';

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
          className={`relative flex w-full items-center gap-3 rounded-md px-3 text-sm transition-colors ${FOCUS_RING_INK} ${
            depth > 0 ? 'py-1.5 pl-9' : 'py-2'
          } ${item.children ? 'pr-10' : ''} ${
            isCurrent
              ? 'font-semibold text-white'
              : hasActiveChild
                ? 'font-medium text-white'
                : 'font-medium text-cyan-100/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          {/* Active highlight glides between items (shared layoutId) */}
          {isCurrent && (
            <motion.span
              layoutId="nav-active"
              aria-hidden="true"
              className="absolute inset-0 rounded-md bg-white/10 shadow-[inset_3px_0_0_var(--color-cyan-300)]"
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
            className={`absolute right-1 grid size-7 place-items-center rounded-md text-cyan-100/50 transition hover:bg-white/10 hover:text-white ${FOCUS_RING_INK}`}
          >
            <ChevronRight
              className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </button>
        )}
      </div>

      {item.children && open && (
        <div className="relative mt-0.5 space-y-0.5 before:absolute before:top-1 before:bottom-1 before:left-5 before:w-px before:bg-white/10">
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

function UserAvatar({ user, className = 'size-8 text-sm' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-800',
        className
      )}
    >
      {user?.username?.charAt(0).toUpperCase() || 'U'}
    </span>
  );
}

/** Sidebar content — shared by the desktop aside and the mobile drawer */
function Sidebar({ currentSub, onNavigate, onClose }) {
  const { user, logout, can } = useAuth();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <button
          type="button"
          onClick={() => onNavigate('')}
          aria-label="Fluxio, accueil"
          className={`rounded-md ${FOCUS_RING_INK}`}
        >
          <Logo ink />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className={`grid size-8 place-items-center rounded-md text-cyan-100/60 hover:bg-white/10 hover:text-white ${FOCUS_RING_INK}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-3">
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
          </nav>
        </LayoutGroup>
      </div>

      {/* User footer */}
      <div className="flex items-center gap-1 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          title="Paramètres du compte"
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white/5 ${FOCUS_RING_INK}`}
        >
          <UserAvatar user={user} className="size-8 text-sm bg-cyan-300 text-cyan-950" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-none font-medium text-white">
              {user?.username}
            </span>
            <span className="mt-1 block truncate text-xs text-cyan-100/60">
              {user?.company_name}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={logout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className={`grid size-9 shrink-0 place-items-center rounded-md text-cyan-100/60 transition hover:bg-white/10 hover:text-white ${FOCUS_RING_INK}`}
        >
          <LogOut className="size-4" />
        </button>
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
          e.preventDefault(); // keep the URL untouched
          document.getElementById('main-content')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Aller au contenu
      </a>

      {/* Desktop sidebar — stays in view while the page scrolls */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-cyan-900 lg:flex">
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
              className="absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col bg-cyan-900 shadow-xl"
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-slate-50/90 px-5 backdrop-blur sm:px-10">
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
