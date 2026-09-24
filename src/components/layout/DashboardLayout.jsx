import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Sidebar nav item definition
 * id        — hash sub-route segment (e.g. 'products')
 * label     — display label
 * icon      — LucideIcon
 * children  — optional nested items
 */
const NAV = [
  { id: '',           label: 'Accueil',       icon: Home },
  {
    id: 'products',   label: 'Produits',       icon: Package2,
    children: [
      { id: 'categories', label: 'Catégories', icon: Tag },
    ],
  },
  { id: 'movements',  label: 'Mouvements',    icon: ArrowLeftRight },
  { id: 'suppliers',  label: 'Fournisseurs',  icon: Truck },
  { id: 'clients',    label: 'Clients',       icon: Users },
  { id: 'invoices',   label: 'Factures',      icon: FileText },
  { id: 'settings',   label: 'Paramètres',    icon: Settings },
];

function NavItem({ item, currentSub, onNavigate, depth = 0 }) {
  const isActive =
    item.id === currentSub ||
    (item.children && item.children.some((c) => c.id === currentSub));

  const [open, setOpen] = useState(isActive);

  const handleClick = () => {
    if (item.children) {
      setOpen((o) => !o);
    }
    onNavigate(item.id);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          depth > 0 ? 'pl-8' : ''
        } ${
          item.id === currentSub
            ? 'bg-cyan-50 text-cyan-800'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
        }`}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.children && (
          <ChevronRight
            className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
          />
        )}
      </button>

      {item.children && open && (
        <div className="mt-0.5 space-y-0.5">
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
    </>
  );
}

export function DashboardLayout({ children, currentSub, onNavigate }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <button
          type="button"
          onClick={() => onNavigate('')}
          className="flex items-center gap-2 font-semibold"
        >
          <span className="inline-grid size-7 place-items-center rounded-lg bg-cyan-700 text-xs text-white">
            F
          </span>
          Fluxio
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-0.5 px-3">
          {NAV.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              currentSub={currentSub}
              onNavigate={(id) => {
                onNavigate(id);
                setMobileOpen(false);
              }}
            />
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-800">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none">{user?.username}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{user?.company_name}</p>
          </div>
        </div>
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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-white">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex min-h-screen flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg border text-slate-600"
          >
            <Menu className="size-5" />
          </button>
          <span className="flex items-center gap-2 font-semibold">
            <span className="inline-grid size-6 place-items-center rounded-md bg-cyan-700 text-xs text-white">
              F
            </span>
            Fluxio
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-800">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );
}
