import { PageLoader } from '@/components/ui/Spinner';
import { usePathname } from '@/lib/router';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';
import DashboardPage from '@/pages/DashboardPage';
import PrivacyPage from '@/pages/PrivacyPage';

export default function AppRouter() {
  const path = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Accueil : rendu sans attendre /me, pour que le HTML prérendu et l'hydratation coïncident
  if (path === '/') return <LandingPage />;

  // Politique de confidentialité : publique, connecté ou non
  if (path === '/confidentialite') return <PrivacyPage />;

  // Invitation : affichée même si l'on est déjà connecté
  if (path === '/accept-invite') return <AcceptInvitePage />;

  if (loading) {
    return <PageLoader fullScreen label="Vérification de votre session…" />;
  }

  // Protected routes: redirect to login if not authenticated
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
  }

  // Public routes: redirect to dashboard if already authenticated
  if (path === '/login') {
    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
  }

  if (path === '/signup') {
    return isAuthenticated ? <DashboardPage /> : <SignupPage />;
  }

  if (path === '/forgot-password') {
    return isAuthenticated ? <DashboardPage /> : <ForgotPasswordPage />;
  }

  return <LandingPage />;
}
