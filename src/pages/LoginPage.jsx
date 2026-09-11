import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SignupSidebar } from '@/components/auth/SignupSidebar';
import { StepLogin } from '@/components/auth/StepLogin';

/**
 * LoginPage Component
 * Handles user authentication by taking email and password credentials.
 * Redirects to the dashboard on successful login.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setCredentials((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  // Handle form submission and API call for login
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await login(credentials.email, credentials.password);
      window.location.hash = '#dashboard';
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Identifiants incorrects.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <SignupSidebar />

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <a
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
            href="#accueil"
          >
            ← Retour à l'accueil
          </a>

          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            {message.text && (
              <p
                className={`mb-6 rounded-lg p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {message.text}
              </p>
            )}

            <StepLogin
              email={credentials.email}
              password={credentials.password}
              onChange={handleChange}
              onSubmit={handleLogin}
              loading={loading}
            />

            <div className="mt-6 text-center text-sm text-slate-600">
              Pas encore de compte ?{' '}
              <a href="#signup" className="font-semibold text-cyan-700 hover:underline">
                S'inscrire
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
