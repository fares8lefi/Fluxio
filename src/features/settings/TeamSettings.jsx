import { useCallback, useEffect, useState } from 'react';
import { Copy, Mail, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { COMPANY_ROLES } from '@/lib/permissions';
import { formatDate } from '@/lib/fiscal';
import { getTeam, inviteMember, removeMember, revokeInvitation, updateMemberRole } from '@/services/teamService';

const ROLE_OPTIONS = Object.entries(COMPANY_ROLES);
const INPUT_CLS =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Équipe de l'entreprise : membres, rôles et invitations (gérants uniquement) */
export function TeamSettings() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STOCK');
  const [lastLink, setLastLink] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getTeam()
      .then(setTeam)
      .catch((err) => toast.error(err.message || "Impossible de charger l'équipe"));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await inviteMember(email.trim(), role);
      setLastLink({ email: res.invitation.email, link: res.link });
      setEmail('');
      toast.success('Invitation créée', {
        description: res.email_sent
          ? `Un e-mail a été envoyé à ${res.invitation.email}.`
          : "L'e-mail n'a pas pu partir : partagez le lien vous-même.",
      });
      load();
    } catch (err) {
      toast.error(err.message || "Impossible d'inviter ce collaborateur");
    } finally {
      setBusy(false);
    }
  };

  const handleRole = async (member, company_role) => {
    try {
      await updateMemberRole(member.id, company_role);
      toast.success(`${member.username} est maintenant ${COMPANY_ROLES[company_role].label.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.message || 'Modification impossible');
      load();
    }
  };

  const handleRemove = async (member) => {
    const ok = await confirm({
      title: 'Retirer ce membre',
      description: `${member.username} n'aura plus accès à l'entreprise. Ses mouvements restent attribués à son nom.`,
      confirmLabel: 'Retirer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeMember(member.id);
      toast.success(`${member.username} a été retiré de l'équipe`);
      load();
    } catch (err) {
      toast.error(err.message || 'Retrait impossible');
    }
  };

  const handleRevoke = async (invitation) => {
    try {
      await revokeInvitation(invitation.id);
      toast.success('Invitation annulée');
      if (lastLink?.email === invitation.email) setLastLink(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Annulation impossible');
    }
  };

  const copyLink = async (link) => {
    if (await copy(link)) toast.success('Lien copié');
    else toast.error('Copie impossible : sélectionnez le lien');
  };

  if (!team) {
    return (
      <div className="space-y-3 rounded-xl border bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inviter */}
      <form onSubmit={handleInvite} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <UserPlus className="size-4 text-cyan-700" aria-hidden="true" /> Inviter un collaborateur
          </h2>
          <p className="text-xs text-slate-500">
            Il recevra un lien (valable 7 jours) pour créer son accès, sans partager votre mot de passe.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-xs font-semibold text-slate-700">
            Adresse e-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collaborateur@entreprise.tn" className={INPUT_CLS} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Rôle
            <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT_CLS}>
              {ROLE_OPTIONS.map(([key, r]) => (
                <option key={key} value={key}>{r.label}</option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={busy} className="rounded-xl">
            <Send className="mr-2 size-4" /> {busy ? 'Envoi…' : 'Inviter'}
          </Button>
        </div>
        <p className="text-xs text-slate-500">{COMPANY_ROLES[role].description}.</p>

        {lastLink && (
          <div className="flex flex-col gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 text-xs text-cyan-900">
              Lien pour <strong>{lastLink.email}</strong> (à partager par e-mail ou WhatsApp) :
              <span className="mt-1 block truncate font-mono text-[11px]">{lastLink.link}</span>
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => copyLink(lastLink.link)}>
              <Copy className="mr-1.5 size-3.5" /> Copier le lien
            </Button>
          </div>
        )}
      </form>

      {/* Membres */}
      <section className="rounded-xl border bg-white shadow-sm">
        <h2 className="flex items-center gap-2 border-b px-6 py-4 text-base font-semibold text-slate-900">
          <Users className="size-4 text-cyan-700" aria-hidden="true" /> Membres ({team.members.length})
        </h2>
        <ul className="divide-y">
          {team.members.map((m) => {
            const isMe = m.id === user?.id;
            return (
              <li key={m.id} className="flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-800">
                  {m.username.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {m.username} {isMe && <span className="text-xs font-normal text-slate-400">(vous)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {m.email} · {m.last_login ? `dernière connexion ${formatDate(m.last_login)}` : 'jamais connecté'}
                  </p>
                </div>
                <select
                  value={m.company_role}
                  onChange={(e) => handleRole(m, e.target.value)}
                  aria-label={`Rôle de ${m.username}`}
                  className={`${INPUT_CLS} py-1.5`}
                >
                  {ROLE_OPTIONS.map(([key, r]) => (
                    <option key={key} value={key}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(m)}
                  disabled={isMe}
                  aria-label={`Retirer ${m.username}`}
                  title={isMe ? 'Vous ne pouvez pas vous retirer vous-même' : 'Retirer de l’équipe'}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Invitations en attente */}
      {team.invitations.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm">
          <h2 className="flex items-center gap-2 border-b px-6 py-4 text-base font-semibold text-slate-900">
            <Mail className="size-4 text-cyan-700" aria-hidden="true" /> Invitations en attente
          </h2>
          <ul className="divide-y">
            {team.invitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-700">{inv.email}</span>
                <span className="text-xs text-slate-500">{COMPANY_ROLES[inv.company_role]?.label}</span>
                <span className="hidden text-xs text-slate-400 sm:inline">expire le {formatDate(inv.expires_at)}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRevoke(inv)}>
                  Annuler
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
