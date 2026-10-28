import { useState } from 'react';
import { navigate } from '@/lib/router';
import { SignupSidebar } from '@/components/auth/SignupSidebar';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/ui/button';
import { forgotPassword, resetPassword } from '@/services/authService';
import { ChevronRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = Demande du code, 2 = Saisie du code + nouveau mot de passe
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  // Étape 1 : Envoyer le code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await forgotPassword(email);
      setMessage({
        type: 'success',
        text: res.message || 'Si cet email est enregistré, un code de réinitialisation vous a été envoyé.',
      });
      setStep(2);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Une erreur est survenue lors de l\'envoi du code.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Valider code et nouveau mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit comporter au moins 6 caractères.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await resetPassword(email, code, newPassword);
      setIsSuccess(true);
      setMessage({
        type: 'success',
        text: res.message || 'Votre mot de passe a été réinitialisé avec succès !',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Code invalide ou expiré.',
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950 transition"
            href="/login"
          >
            <ArrowLeft className="size-4" />
            Retour à la connexion
          </a>

          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
            {message.text && (
              <div
                className={`mb-6 flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' && <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Mot de passe réinitialisé</h2>
                <p className="text-sm text-slate-600">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
                <Button
                  onClick={() => { navigate('/login'); }}
                  className="w-full h-11 bg-cyan-800 hover:bg-cyan-900 text-white"
                >
                  Aller à la connexion
                </Button>
              </div>
            ) : step === 1 ? (
              <form className="grid gap-4" onSubmit={handleSendCode}>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Mot de passe oublié ?</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Saisissez l'adresse email associée à votre compte. Nous vous enverrons un code de réinitialisation.
                  </p>
                </div>

                <FormInput
                  required
                  label="Adresse email"
                  name="email"
                  type="email"
                  value={email}
                  placeholder="nom@entreprise.com"
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button
                  disabled={loading}
                  className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900 text-white"
                  type="submit"
                >
                  {loading ? 'Envoi du code...' : 'Recevoir le code'} <ChevronRight className="ml-1" />
                </Button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleResetPassword}>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Nouveau mot de passe</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Un code de confirmation a été envoyé à <strong>{email}</strong>.
                  </p>
                </div>

                <FormInput
                  required
                  label="Code de réinitialisation"
                  name="code"
                  type="text"
                  placeholder="Entrez le code reçu"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                <div className="relative">
                  <FormInput
                    required
                    label="Nouveau mot de passe"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Au moins 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>

                <FormInput
                  required
                  label="Confirmez le nouveau mot de passe"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setMessage({ type: '', text: '' }); }}
                    className="hover:underline text-cyan-700"
                  >
                    Changer d'email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="hover:underline text-cyan-700"
                  >
                    Renvoyer le code
                  </button>
                </div>

                <Button
                  disabled={loading}
                  className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900 text-white"
                  type="submit"
                >
                  {loading ? 'Réinitialisation...' : 'Valider le mot de passe'} <ChevronRight className="ml-1" />
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-600">
              Vous vous souvenez de votre mot de passe ?{' '}
              <a href="/login" className="font-semibold text-cyan-700 hover:underline">
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
