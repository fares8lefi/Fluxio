import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { SignupSidebar } from '@/components/auth/SignupSidebar';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/Spinner';
import { acceptInvitation, previewInvitation } from '@/services/teamService';
import { COMPANY_ROLES } from '@/lib/permissions';

/** Jeton passé dans le lien : #accept-invite?token=… */
const tokenFromHash = () => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('token') ?? '';

/**
 * Page publique où un collaborateur invité crée son accès à l'entreprise.
 */
export default function AcceptInvitePage() {
  const [token] = useState(tokenFromHash);
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ username: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Lien d'invitation incomplet.");
      return;
    }
    previewInvitation(token)
      .then(setInvite)
      .catch((err) => setLoadError(err.message || "Lien d'invitation invalide"));
  }, [token]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.username.trim().length < 3) next.username = 'Au moins 3 caractères';
    if (form.password.length < 8) next.password = 'Au moins 8 caractères';
    if (form.password !== form.confirm) next.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await acceptInvitation({ token, username: form.username.trim(), phone: form.phone.trim() || undefined, password: form.password });
      setDone(true);
    } catch (err) {
      setErrors({ ...(err.payload?.errors ?? {}), form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <SignupSidebar />
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          {!invite && !loadError && <PageLoader label="Vérification de l'invitation…" />}

          {loadError && (
            <div role="alert" className="space-y-4 text-center">
              <h1 className="text-xl font-semibold text-slate-900">Invitation indisponible</h1>
              <p className="text-sm text-slate-600">{loadError}</p>
              <p className="text-xs text-slate-500">Demandez au gérant de votre entreprise de vous renvoyer une invitation.</p>
              <a href="#login" className="inline-block text-sm font-semibold text-cyan-700 hover:underline">
                Aller à la connexion
              </a>
            </div>
          )}

          {invite && done && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-slate-900">Votre accès est prêt</h1>
              <p className="text-sm text-slate-600">
                Connectez-vous avec <strong>{invite.email}</strong> et le mot de passe que vous venez de choisir.
              </p>
              <Button className="rounded-xl" onClick={() => (window.location.hash = '#login')}>
                Se connecter <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )}

          {invite && !done && (
            <form onSubmit={handleSubmit} noValidate className="grid gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Rejoindre {invite.company_name}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Vous êtes invité(e) en tant que <strong>{COMPANY_ROLES[invite.company_role]?.label}</strong> —{' '}
                  {COMPANY_ROLES[invite.company_role]?.description?.toLowerCase()}.
                </p>
              </div>

              <FormInput label="Adresse e-mail" name="email" value={invite.email} readOnly disabled />
              <div>
                <FormInput label="Nom d'utilisateur" name="username" value={form.username} onChange={set('username')} autoComplete="username" required />
                {errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username}</p>}
              </div>
              <div>
                <FormInput label="Téléphone (facultatif)" name="phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <FormInput label="Mot de passe" name="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
                <p className={`mt-1 text-xs ${errors.password ? 'text-rose-600' : 'text-slate-400'}`}>{errors.password ?? 'Au moins 8 caractères'}</p>
              </div>
              <div>
                <FormInput label="Confirmer le mot de passe" name="confirm" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
                {errors.confirm && <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>}
              </div>

              {errors.form && (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{errors.form}</p>
              )}

              <Button type="submit" disabled={submitting} className="h-11 rounded-xl">
                {submitting ? 'Création…' : 'Créer mon accès'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
