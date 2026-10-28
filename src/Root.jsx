import { StrictMode } from 'react';
import { MotionConfig } from 'motion/react';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ConfirmProvider } from './components/ui/ConfirmDialog.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

/** Arbre complet de l'app, partagé par le client (main.jsx) et le prérendu (entry-server.jsx) */
export default function Root() {
  return (
    <StrictMode>
      {/* Honors the OS "reduce motion" setting for every animation in the app */}
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              {/* Last resort: a crash outside the dashboard still gets an error page */}
              <ErrorBoundary fullScreen>
                <App />
              </ErrorBoundary>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </MotionConfig>
    </StrictMode>
  );
}
