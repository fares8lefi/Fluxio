import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminOverview } from '@/features/admin/AdminOverview';
import { CompanyDetails } from '@/features/admin/CompanyDetails';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Shield,
  Building,
} from 'lucide-react';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Écouter le hash si on navigue par URL : ex: #admin/companies/123
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#admin\/companies\/(.+)$/);
      if (match) {
        setSelectedCompanyId(match[1]);
      } else if (hash === '#admin') {
        setSelectedCompanyId(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectCompany = (id) => {
    setSelectedCompanyId(id);
    window.location.hash = `#admin/companies/${id}`;
  };

  const handleBackToOverview = () => {
    setSelectedCompanyId(null);
    window.location.hash = '#admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-950">
      {/* Top Navbar Administrateur */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 sm:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToOverview}
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <span className="inline-grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm text-white shadow-xs">
              <ShieldCheck className="size-4" />
            </span>
            <span>Fluxio <span className="text-indigo-600 font-semibold text-xs ml-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 uppercase tracking-wider">SuperAdmin</span></span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.hash = '#dashboard'; }}
            className="rounded-xl text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard className="mr-1.5 size-3.5" />
            Espace Entreprise
          </Button>

          <div className="hidden sm:flex items-center gap-2 border-l pl-3 ml-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-800 leading-none">{user?.username}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Administrateur Système</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl size-9 p-0"
            title="Déconnexion"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        {selectedCompanyId ? (
          <CompanyDetails
            companyId={selectedCompanyId}
            onBack={handleBackToOverview}
          />
        ) : (
          <AdminOverview onSelectCompany={handleSelectCompany} />
        )}
      </main>
    </div>
  );
}
