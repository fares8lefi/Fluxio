import { useAuth } from '@/contexts/AuthContext';
import { Package2, LogOut, Settings, Users, FileText, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Accueil', active: true },
    { icon: Package2, label: 'Produits' },
    { icon: Users, label: 'Clients' },
    { icon: FileText, label: 'Factures' },
    { icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <a className="flex items-center gap-2 font-semibold" href="#dashboard">
            <span className="inline-grid size-7 place-items-center rounded-lg bg-cyan-700 text-xs text-white">
              F
            </span>
            Fluxio
          </a>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#dashboard"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-cyan-50 text-cyan-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="size-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-semibold text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user?.username}</span>
              <span className="text-xs text-slate-500 mt-1">{user?.company_name}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start text-slate-600 hover:text-rose-600 hover:bg-rose-50"
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 lg:hidden">
          <span className="inline-grid size-7 place-items-center rounded-lg bg-cyan-700 text-xs text-white">
            F
          </span>
          <span className="font-semibold">Fluxio</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="size-7 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-semibold text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <div className="p-6 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
