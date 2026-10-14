import { PageLoader } from '@/components/ui/Spinner';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import AcceptInvitePage from '@/pages/AcceptInvitePage';

export default function AppRouter() {
  const route = useHashRoute();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <PageLoader fullScreen />
    );
  }

  // Invitation d'un collaborateur : publique (la personne n'a pas encore de compte)
  if (route.startsWith('#accept-invite')) return <AcceptInvitePage />;

  // Admin routes: require authentication and ADMIN role
  if (route.startsWith('#admin')) {
    if (!isAuthenticated) return <LoginPage />;
    if (!isAdmin) return <DashboardPage />;
    return <AdminPage />;
  }

  // Protected routes: redirect to login if not authenticated
  if (route.startsWith('#dashboard')) {
    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
  }

  // Public routes: redirect to dashboard if already authenticated
  if (route === '#login') {
    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
  }

  if (route === '#signup') {
    return isAuthenticated ? <DashboardPage /> : <SignupPage />;
  }

  if (route === '#forgot-password') {
    return isAuthenticated ? <DashboardPage /> : <ForgotPasswordPage />;
  }

  return <LandingPage />;
}
