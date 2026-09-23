import { useHashRoute } from '@/hooks/useHashRoute';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';

export default function AppRouter() {
  const route = useHashRoute();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
      </div>
    );
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

  return <LandingPage />;
}
