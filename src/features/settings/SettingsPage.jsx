import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { updatePersonnelData, changePassword, getMe } from '@/services/authService';
import { CompanySettingsForm } from './CompanySettingsForm';
import { COMPANY_ROLES } from '@/lib/permissions';
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Save,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export function SettingsPage({ initialTab = 'profile' }) {
  const { user, setUser, can } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'company' | 'team' | 'security'

  // État profil
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // État sécurité / mot de passe
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Sauvegarder les modifications du profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!profileData.password) {
      setProfileMessage({
        type: 'error',
        text: 'Veuillez renseigner votre mot de passe actuel pour valider les modifications.',
      });
      return;
    }

    setProfileLoading(true);
    try {
      await updatePersonnelData({
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone,
        password: profileData.password,
      });

      // Rafraîchir les données de l'utilisateur
      const meRes = await getMe();
      if (meRes?.user) {
        setUser(meRes.user);
      }

      setProfileMessage({
        type: 'success',
        text: 'Profil mis à jour avec succès.',
      });
      setProfileData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err.message || 'Erreur lors de la mise à jour du profil.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Modifier le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });

    if (securityData.newPassword !== securityData.confirmPassword) {
      setSecurityMessage({
        type: 'error',
        text: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
      });
      return;
    }

    if (securityData.newPassword.length < 6) {
      setSecurityMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.',
      });
      return;
    }

    setSecurityLoading(true);
    try {
      // Backend attend `currentPassord`
      await changePassword(securityData.currentPassword, securityData.newPassword);
      setSecurityMessage({
        type: 'success',
        text: 'Mot de passe modifié avec succès.',
      });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setSecurityMessage({
        type: 'error',
        text: err.message || 'Erreur lors du changement de mot de passe.',
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez vos informations de compte, vos préférences et la sécurité de votre accès.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-cyan-700 text-cyan-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="size-4" />
          Mon Profil
        </button>
        {can('company.manage') && (
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'company'
              ? 'border-cyan-700 text-cyan-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="size-4" />
          Entreprise
        </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'security'
              ? 'border-cyan-700 text-cyan-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="size-4" />
          Sécurité & Mot de passe
        </button>
      </div>

      {/* Contenu Onglet Entreprise */}
      {activeTab === 'company' && can('company.manage') && <CompanySettingsForm />}

      {/* Contenu Onglet Profil */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Carte Résumé Entreprise / Rôle */}
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 h-fit md:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 text-xs">
              Contexte du compte
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Building2 className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">Entreprise</p>
                  <p className="font-medium text-slate-800">{user?.company_name || 'Non rattaché'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
                  <Shield className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">Rôle</p>
                  <p className="font-medium text-slate-800">
                    {COMPANY_ROLES[user?.company_role]?.label ?? 'Gérant'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire Profil */}
          <div className="rounded-xl border bg-white p-6 shadow-sm md:col-span-2 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Informations personnelles</h2>
              <p className="text-xs text-slate-500">Mettez à jour vos coordonnées principales.</p>
            </div>

            {profileMessage.text && (
              <div
                className={`flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Adresse email</label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Téléphone</label>
                <input
                  type="text"
                  placeholder="Ex: 98123456"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Mot de passe actuel <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Requis pour confirmer l'enregistrement des modifications.
                  </p>
                  <input
                    type="password"
                    required
                    placeholder="Saisissez votre mot de passe pour valider"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs h-9 px-4"
                >
                  <Save className="mr-1.5 size-3.5" />
                  {profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contenu Onglet Sécurité */}
      {activeTab === 'security' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm max-w-xl space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Changer de mot de passe</h2>
            <p className="text-xs text-slate-500">
              Assurez la sécurité de votre compte avec un mot de passe robuste d'au moins 6 caractères.
            </p>
          </div>

          {securityMessage.text && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3.5 text-sm ${
                securityMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {securityMessage.type === 'success' ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{securityMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid gap-1.5 relative">
              <label className="text-xs font-semibold text-slate-700">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  placeholder="Votre mot de passe actuel"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-1.5 relative">
              <label className="text-xs font-semibold text-slate-700">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  placeholder="Au moins 6 caractères"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Confirmer le nouveau mot de passe</label>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                required
                placeholder="Répétez le nouveau mot de passe"
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-700"
              />
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                disabled={securityLoading}
                className="bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs h-9 px-4"
              >
                <KeyRound className="mr-1.5 size-3.5" />
                {securityLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
