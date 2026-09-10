import { useHashRoute } from '@/hooks/useHashRoute';
import LandingPage from '@/pages/LandingPage';
import SignupPage from '@/pages/SignupPage';

export default function AppRouter() {
  return useHashRoute() === '#signup' ? <SignupPage /> : <LandingPage />;
}
