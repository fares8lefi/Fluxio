import { PageLoader } from '@/components/ui/Spinner';
import { useState, useEffect, useCallback } from 'react';
import {
  getCompanyDetails,
  updateCompanyGeneralInfo,
  toggleCompanyStatus,
  toggleUserStatus,
} from '@/services/adminService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Building2,
  Users,
  Package,
  ArrowLeftRight,
  ReceiptText,
  Truck,
  Edit2,
  Save,
  X,
  Power,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export function CompanyDetails({ companyId, onBack }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Mode édition des infos générales
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    matriculeFiscale: '',
    address: '',
    phone: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompanyDetails(companyId);
      if (res?.company) {
        setCompany(res.company);
        setEditForm({
          name: res.company.name || '',
          matriculeFiscale: res.company.matriculeFiscale || '',
          address: res.company.address || '',
          phone: res.company.phone || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger les détails de l\'entreprise.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Sauvegarder les modifications générales
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await updateCompanyGeneralInfo(companyId, editForm);
      setFeedback({ type: 'success', text: res.message || 'Informations mises à jour.' });
      setIsEditing(false);
      fetchDetails();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle statut entreprise
  const confirm = useConfirm();

  const handleToggleCompany = async () => {
    if (!company) return;
    const nextState = !company.is_active;
    const confirmMsg = nextState
      ? 'Voulez-vous réactiver cette entreprise ?'
      : 'Voulez-vous suspendre cette entreprise ? Ses utilisateurs ne pourront plus se connecter.';
    if (!(await confirm({ title: nextState ? 'Confirmer la réactivation' : 'Confirmer la suspension', description: confirmMsg, confirmLabel: nextState ? 'Réactiver' : 'Suspendre', destructive: !nextState }))) return;

    try {
      const res = await toggleCompanyStatus(companyId, nextState);
      setFeedback({ type: 'success', text: res.message || 'Statut mis à jour.' });
      fetchDetails();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la modification du statut.' });
    }
  };

  // Toggle statut utilisateur
  const handleToggleUser = async (userId, currentStatus) => {
    const nextState = !currentStatus;
    const confirmMsg = nextState
      ? 'Activer cet utilisateur ?'
      : 'Suspendre l\'accès de cet utilisateur ?';
    if (!(await confirm({ title: nextState ? 'Confirmer la réactivation' : 'Confirmer la suspension', description: confirmMsg, confirmLabel: nextState ? 'Réactiver' : 'Suspendre', destructive: !nextState }))) return;

    try {
      const res = await toggleUserStatus(userId, nextState);
      setFeedback({ type: 'success', text: res.message || 'Statut utilisateur mis à jour.' });
      fetchDetails();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    }
  };

  if (loading) {
    return (
      <PageLoader />
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="mr-1.5 size-4" /> Retour à la liste
        </Button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error || 'Entreprise introuvable.'}
        </div>
      </div>
    );
  }

  const counts = company._count || {};

  return (
    <div className="space-y-6">
      {/* Barre de retour et actions rapides */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl text-xs h-9">
          <ArrowLeft className="mr-1.5 size-3.5" />
          Retour aux entreprises
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCompany}
            className={`rounded-xl text-xs h-9 ${
              company.is_active
                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Power className="mr-1.5 size-3.5" />
            {company.is_active ? 'Suspendre l\'entreprise' : 'Réactiver l\'entreprise'}
          </Button>

          {!isEditing && (
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs h-9"
            >
              <Edit2 className="mr-1.5 size-3.5" />
              Modifier les coordonnées
            </Button>
          )}
        </div>
      </div>

      {/* Message feedback */}
      {feedback.text && (
        <div
          className={`flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* En-tête profil entreprise */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-800 font-bold text-xl">
              {company.name?.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
                <Badge variant={company.is_active ? 'success' : 'danger'}>
                  {company.is_active ? 'Active' : 'Suspendue'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Créée le {new Date(company.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Détails ou formulaire d'édition */}
        <div className="mt-6 border-t pt-5">
          {isEditing ? (
            <form onSubmit={handleSaveInfo} className="space-y-4 max-w-2xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Nom commercial</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Matricule Fiscale</label>
                  <input
                    type="text"
                    value={editForm.matriculeFiscale}
                    onChange={(e) => setEditForm({ ...editForm, matriculeFiscale: e.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none"
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Adresse</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-700">Téléphone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl text-xs"
                >
                  <X className="mr-1 size-3.5" /> Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  size="sm"
                  className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs"
                >
                  <Save className="mr-1 size-3.5" />
                  {savingEdit ? 'Sauvegarde...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Matricule Fiscale
                </p>
                <p className="mt-1 font-mono font-medium text-slate-800">
                  {company.matriculeFiscale || '—'}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Téléphone
                </p>
                <p className="mt-1 font-medium text-slate-800">{company.phone || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Adresse
                </p>
                <p className="mt-1 font-medium text-slate-800">{company.address || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cartes Compteurs d'activité */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <span className="inline-grid size-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 mb-1">
            <Package className="size-4" />
          </span>
          <p className="text-xl font-bold tabular-nums text-slate-900">{counts.products || 0}</p>
          <p className="text-[11px] text-slate-500">Produits</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <span className="inline-grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-700 mb-1">
            <ArrowLeftRight className="size-4" />
          </span>
          <p className="text-xl font-bold tabular-nums text-slate-900">{counts.movements || 0}</p>
          <p className="text-[11px] text-slate-500">Mouvements</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <span className="inline-grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 mb-1">
            <ReceiptText className="size-4" />
          </span>
          <p className="text-xl font-bold tabular-nums text-slate-900">{counts.invoices || 0}</p>
          <p className="text-[11px] text-slate-500">Factures</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <span className="inline-grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700 mb-1">
            <Users className="size-4" />
          </span>
          <p className="text-xl font-bold tabular-nums text-slate-900">{counts.clients || 0}</p>
          <p className="text-[11px] text-slate-500">Clients</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm text-center col-span-2 sm:col-span-1">
          <span className="inline-grid size-8 place-items-center rounded-lg bg-purple-50 text-purple-700 mb-1">
            <Truck className="size-4" />
          </span>
          <p className="text-xl font-bold tabular-nums text-slate-900">{counts.suppliers || 0}</p>
          <p className="text-[11px] text-slate-500">Fournisseurs</p>
        </div>
      </div>

      {/* Liste des utilisateurs rattachés */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <Users className="size-4" />
            </span>
            <h2 className="font-semibold text-slate-900 text-sm">
              Utilisateurs associés ({company.users?.length || 0})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Utilisateur</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-center">Rôle</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-left">Dernière connexion</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {company.users?.length > 0 ? (
                company.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">{u.username}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {u.last_login ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-slate-400" />
                          {new Date(u.last_login).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        'Jamais'
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUser(u.id, u.is_active)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Power className="size-3" />
                        {u.is_active ? 'Suspendre' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    Aucun utilisateur rattaché à cette entreprise.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
