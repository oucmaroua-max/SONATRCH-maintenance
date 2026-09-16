import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy, KeyRound, Lock, RefreshCw, Save } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';
import { OrgCascadeSelect } from '@/components/ui/OrgCascadeSelect';
import { users as seedUsers } from '@/data';
import type { Role, UserStatus } from '@/types';

const ROLES: Role[] = ['Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service', 'Employé'];
const STATUSES: UserStatus[] = ['pending', 'active', 'inactive', 'suspended'];

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export function AdminUserFormPage() {
  const pathParts = window.location.pathname.split('/');
  const editId = pathParts[pathParts.length - 1];
  const isEdit = editId && editId !== 'admin-user-form';
  const existingUser = isEdit ? seedUsers.find((u) => u.id === editId) : undefined;

  const [saved, setSaved] = useState(false);
  const [tempPassword, setTempPassword] = useState(generateTempPassword());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState(existingUser?.name ?? '');
  const [username, setUsername] = useState(existingUser?.username ?? '');
  const [email, setEmail] = useState(existingUser?.email ?? '');
  const [role, setRole] = useState<Role>(existingUser?.role ?? 'Employé');
  const [status, setStatus] = useState<UserStatus>(existingUser?.status ?? 'pending');
  const [isAdmin, setIsAdmin] = useState(existingUser?.is_admin ?? false);
  const [org, setOrg] = useState({
    sub_direction: existingUser?.sub_direction ?? '',
    department: existingUser?.department ?? '',
    service: existingUser?.service ?? '',
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  function copyPassword() {
    navigator.clipboard?.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (saved) {
    return (
      <AppShell active="admin-users">
        <main className="industrial-grid min-h-[calc(100vh-200px)]">
          <div className="mx-auto max-w-lg px-4 py-16 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
                <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">
                  {isEdit ? 'Utilisateur mis à jour' : 'Utilisateur créé'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {isEdit
                    ? `Les modifications de ${name} ont été enregistrées.`
                    : `Le compte de ${name} a été créé avec succès.`}
                </p>

                {!isEdit && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
                    <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                      <KeyRound size={16} /> Mot de passe temporaire
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      À communiquer une seule fois à l'utilisateur. Il devra le changer à la première connexion.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 rounded-lg border border-amber-300 bg-white px-4 py-2.5 font-mono text-sm font-bold text-amber-900">
                        {tempPassword}
                      </code>
                      <button
                        onClick={copyPassword}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                      >
                        <Copy size={14} /> {copied ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => navigate('admin-users')}
                    className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                  >
                    Retour à la liste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="admin-users">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-8">
          <button
            onClick={() => navigate('admin-users')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sonatrach"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
              {isEdit ? 'Modification' : 'Création'}
            </p>
            <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Identité */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Identité</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Nom complet <span className="text-red-500">*</span></span>
                  <input
                    required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                    placeholder="Ex: Karim Benali"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Nom d'utilisateur <span className="text-red-500">*</span></span>
                  <input
                    required value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                    placeholder="Ex: k.benali"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Email <span className="text-red-500">*</span></span>
                  <input
                    required type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                    placeholder="Ex: k.benali@sonatrach.dz"
                  />
                </label>
              </div>
            </section>

            {/* Rôle & Organisation */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Rôle & Organisation</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Rôle <span className="text-red-500">*</span></span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <OrgCascadeSelect
                  subDirection={org.sub_direction}
                  department={org.department}
                  service={org.service}
                  onChange={setOrg}
                />
              </div>
            </section>

            {/* Statut & Admin */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Statut & Accès</h2>
              <div className="mt-4 space-y-4">
                {isEdit && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Statut</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s === 'pending' ? 'En attente' : s === 'active' ? 'Actif' : s === 'inactive' ? 'Inactif' : 'Suspendu'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sonatrach focus:ring-orange-100"
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Lock size={14} /> Accès administrateur
                    </span>
                    <span className="text-xs text-slate-500">Donne accès aux fonctions d'administration et au journal d'audit.</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Mot de passe */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Mot de passe</h2>
              {!isEdit ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-600">Un mot de passe temporaire est généré automatiquement :</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm font-bold text-slate-800">
                      {tempPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => setTempPassword(generateTempPassword())}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <RefreshCw size={14} /> Régénérer
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    L'utilisateur devra changer ce mot de passe à sa première connexion.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {!showResetConfirm && !passwordReset && (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100"
                    >
                      <KeyRound size={16} /> Réinitialiser le mot de passe
                    </button>
                  )}
                  {showResetConfirm && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800">
                        Confirmer la réinitialisation ? Un nouveau mot de passe temporaire sera généré.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setTempPassword(generateTempPassword()); setShowResetConfirm(false); setPasswordReset(true); }}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                  {passwordReset && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                        <CheckCircle2 size={16} /> Nouveau mot de passe temporaire :
                      </p>
                      <code className="mt-2 block rounded-lg border border-emerald-300 bg-white px-4 py-2 font-mono text-sm font-bold text-emerald-900">
                        {tempPassword}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('admin-users')}
                className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!name || !username || !email}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} /> {isEdit ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}
