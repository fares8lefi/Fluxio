import { useEffect, useState } from 'react';
import { ChevronRight, CircleAlert, CheckCircle2 } from 'lucide-react';
import { navigate } from '@/lib/router';
import { previewInvitation, acceptInvitation } from '@/services/invitationService';
import { SignupSidebar } from '@/components/auth/SignupSidebar';
import { FormInput } from '@/components/auth/FormInput';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/Spinner';

const ROLE_LABELS = { OWNER: 'Gérant', STOCK: 'Stock', ACCOUNTANT: 'Comptable' };

const INITIAL_FORM = { username: '', phone: '', password: '' };

/**
 * AcceptInvitePage Component
 * Lien reçu par e-mail (/accept-invite?token=…) : la personne invitée crée son
 * compte, déjà vérifié, puis se connecte. L'API ne la connecte pas d'elle-même.
 */
export default function AcceptInvitePage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [invitation, setInvitation] = useState(null);
  const [linkError, setLinkError] = useState(token ? '' : "Ce lien d'invitation est incomplet.");
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [joinedCompany, setJoinedCompany] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    previewInvitation(token)
      .then((data) => !cancelled && setInvitation(data))
      .catch((error) => {
        if (cancelled) return;
        setLinkError(
          error.status === 400 || error.status === 404
            ? "Ce lien d'invitation n'est pas valide."
            : error.message || "Impossible de vérifier l'invitation."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Après la création du compte : direction la connexion, e-mail prérempli
  useEffect(() => {
    if (!joinedCompany) return;
    const id = setTimeout(() => navigate('/login', { state: { email: invitation.email } }), 3000);
    return () => clearTimeout(id);
  }, [joinedCompany, invitation]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setLoading(true);
    setMessage('');
    setFieldErrors({});
    try {
      const phone = form.phone.trim();
      const data = await acceptInvitation({
        token,
        username: form.username.trim(),
        password: form.password,
        ...(phone && { phone }),
      });
      setJoinedCompany(data.user?.company_name || invitation.company_name);
    } catch (error) {
      // 410 / 404 : l'invitation n'est plus utilisable, le formulaire ne sert plus à rien
      if (error.status === 410 || error.status === 404) {
        setLinkError(error.message);
        return;
      }
      setFieldErrors(error.payload?.errors ?? {});
      setMessage(error.message || 'Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  };

  let content;
  if (linkError) {
    content = (
      <div className="grid gap-4 text-center">
        <CircleAlert className="mx-auto size-10 text-rose-600" aria-hidden="true" />
        <h2 className="text-2xl font-semibold">Invitation indisponible</h2>
        <p className="text-sm text-slate-600">{linkError}</p>
        <p className="text-sm text-slate-600">
          Demandez au gérant de votre entreprise de vous envoyer une nouvelle invitation.
        </p>
        <Button asChild className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900">
          <a href="/">Retour à l'accueil</a>
        </Button>
      </div>
    );
  } else if (joinedCompany) {
    content = (
      <div className="grid gap-4 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <h2 className="text-2xl font-semibold">Compte créé</h2>
        <p className="text-sm text-slate-600">
          Vous avez rejoint {joinedCompany}. Redirection vers la connexion…
        </p>
        <Button
          className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900"
          onClick={() => navigate('/login', { state: { email: invitation.email } })}
        >
          Se connecter maintenant <ChevronRight className="ml-1" />
        </Button>
      </div>
    );
  } else if (!invitation) {
    content = <PageLoader label="Vérification de l'invitation…" />;
  } else {
    content = (
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold">Rejoindre {invitation.company_name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Vous êtes invité avec le rôle{' '}
            <strong className="font-semibold text-slate-900">
              {ROLE_LABELS[invitation.company_role] ?? invitation.company_role}
            </strong>
            . Créez votre compte pour accéder à l'espace de l'entreprise.
          </p>
        </div>

        {message && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{message}</p>}

        <FormInput label="Adresse email" name="email" type="email" value={invitation.email} readOnly />
        <FormInput
          required
          minLength={3}
          label="Nom complet"
          name="username"
          autoComplete="name"
          value={form.username}
          onChange={handleChange}
          error={fieldErrors.username}
        />
        <FormInput
          label="Téléphone (facultatif)"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          error={fieldErrors.phone}
        />
        <FormInput
          required
          minLength={8}
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <Button disabled={loading} className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900" type="submit">
          {loading ? 'Création du compte…' : 'Créer mon compte'} <ChevronRight className="ml-1" />
        </Button>
      </form>
    );
  }

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <SignupSidebar />

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <a className="text-sm font-medium text-slate-600 hover:text-slate-950" href="/">
            ← Retour à l'accueil
          </a>

          <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">{content}</div>
        </div>
      </section>
    </main>
  );
}
