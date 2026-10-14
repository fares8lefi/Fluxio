import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { MotionConfig } from 'motion/react';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ConfirmProvider } from './components/ui/ConfirmDialog.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Honors the OS "reduce motion" setting for every animation in the app */}
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </MotionConfig>
  </StrictMode>
);
