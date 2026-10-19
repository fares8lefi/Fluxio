import { PageLoader } from '@/components/ui/Spinner';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import PrivacyPage from '@/pages/PrivacyPage';

export default function AppRouter() {
  const route = useHashRoute();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <PageLoader fullScreen />
    );
  }

  // Politique de confidentialité : publique, connecté ou non
  if (route === '#confidentialite') return <PrivacyPage />;

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
