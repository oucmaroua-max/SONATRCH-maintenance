import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Save } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';
import { OrgCascadeSelect } from '@/components/ui/OrgCascadeSelect';
import { api } from '@/api';
import { createUser, getUserDetail, resetUserPassword, updateUser } from '@/adminUsers';
import type { Role, UserStatus } from '@/types';

const ROLES: Role[] = ['Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service', 'Employé'];

type OrgResponse = {
  sousDirections: { abrv: string; name: string }[];
  departements: { abrv: string; name: string; sousDirectionAbrv: string | null }[];
  services: { abrv: string; name: string; departementAbrv: string | null }[];
};

export function AdminUserFormPage() {
  const pathParts = window.location.pathname.split('/');
  const editId = pathParts[pathParts.length - 1];
  const isEdit = Boolean(editId) && editId !== 'admin-user-form';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [org, setOrg] = useState<OrgResponse>({ sousDirections: [], departements: [], services: [] });

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('Employé');
  const [status, setStatus] = useState<UserStatus>('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgSelection, setOrgSelection] = useState({ sub_direction: '', department: '', service: '' });

  // réinitialisation de mot de passe (mode édition)
  const [newPassword, setNewPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const orgTree = await api<OrgResponse>('/api/org');
        setOrg(orgTree);
        if (isEdit) {
          const { user } = await getUserDetail(editId);
          setName(user.name);
          setUsername(user.username);
          setEmail(user.email);
          setRole(user.role);
          setStatus(user.status);
          setIsAdmin(user.is_admin);
          setOrgSelection({ sub_direction: user.sub_direction, department: user.department, service: user.service });
        }
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, editId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await updateUser(editId, {
          name, email, role, isAdmin,
          sub_direction: orgSelection.sub_direction,
          department: orgSelection.department,
          service: orgSelection.service,
        });
      } else {
        await createUser({
          name, username, email, password, role, isAdmin,
          sub_direction: orgSelection.sub_direction,
          department: orgSelection.department,
          service: orgSelection.service,
        });
      }
      setSaved(true);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordReset(e: FormEvent) {
    e.preventDefault();
    setResetError(null);
    if (newPassword.length < 8) {
      setResetError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setResetSaving(true);
    try {
      await resetUserPassword(editId, newPassword);
      setResetDone(true);
      setNewPassword('');
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Réinitialisation impossible');
    } finally {
      setResetSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell active="admin-users">
        <main className="industrial-grid min-h-[calc(100vh-200px)]">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
            <p className="text-sm text-slate-500">Chargement…</p>
          </div>
        </main>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell active="admin-users">
        <main className="industrial-grid min-h-[calc(100vh-200px)]">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
            <p className="text-sm font-semibold text-red-600">{loadError}</p>
            <button onClick={() => navigate('admin-users')} className="mt-4 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
              Retour à la liste
            </button>
          </div>
        </main>
      </AppShell>
    );
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
                  {isEdit ? `Les modifications de ${name} ont été enregistrées.` : `Le compte de ${name} a été créé avec le mot de passe que vous avez défini.`}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => navigate('admin-users')} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
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
          <button onClick={() => navigate('admin-users')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sonatrach">
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
              {isEdit ? 'Modification' : 'Création'}
            </p>
            <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
              {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Identité</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Nom complet <span className="text-red-500">*</span></span>
                  <input required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" placeholder="Ex: Karim Benali" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Nom d'utilisateur <span className="text-red-500">*</span></span>
                  <input required disabled={isEdit} value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100 disabled:bg-slate-100" placeholder="Ex: k.benali" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Email <span className="text-red-500">*</span></span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" placeholder="Ex: k.benali@sonatrach.dz" />
                </label>

                {/* Mot de passe : uniquement à la création */}
                {!isEdit && (
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Mot de passe <span className="text-red-500">*</span></span>
                    <div className="relative">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Au moins 8 caractères"
                        className="w-full rounded-lg border-slate-300 pr-10 text-sm focus:border-sonatrach focus:ring-orange-100"
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="mt-1 block text-[11px] text-slate-400">Choisissez le mot de passe de ce compte. Communiquez-le à l'utilisateur en dehors de l'application.</span>
                  </label>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Rôle & Organisation</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Rôle <span className="text-red-500">*</span></span>
                  <select value={role} onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <OrgCascadeSelect
                  subDirection={orgSelection.sub_direction}
                  department={orgSelection.department}
                  service={orgSelection.service}
                  subDirections={org.sousDirections.map((sd) => ({ id: sd.abrv, name: sd.name }))}
                  departments={org.departements.map((d) => ({ id: d.abrv, name: d.name, sub_direction_id: d.sousDirectionAbrv ?? '' }))}
                  services={org.services.map((s) => ({ id: s.abrv, name: s.name, department_id: s.departementAbrv ?? '' }))}
                  onChange={setOrgSelection}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading text-lg font-bold text-slate-900">Statut & Accès</h2>
              <div className="mt-4 space-y-4">
                {isEdit && (
                  <p className="text-xs text-slate-500">
                    Statut actuel : <span className="font-bold text-slate-700">{status}</span>. Changez-le depuis la liste des utilisateurs (approuver / suspendre).
                  </p>
                )}
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50">
                  <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sonatrach focus:ring-orange-100" />
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Lock size={14} /> Accès administrateur
                    </span>
                    <span className="text-xs text-slate-500">Donne accès aux fonctions d'administration et au journal d'audit.</span>
                  </div>
                </label>
              </div>
            </section>

            {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => navigate('admin-users')} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button type="submit" disabled={saving || !name || !username || !email || (!isEdit && password.length < 8)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600 disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={16} /> {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>

          {/* Changer le mot de passe : uniquement en édition, formulaire séparé */}
          {isEdit && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
                <KeyRound size={18} /> Changer le mot de passe
              </h2>
              <form onSubmit={submitPasswordReset} className="mt-4 space-y-3">
                <label className="block max-w-sm">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Nouveau mot de passe</span>
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setResetDone(false); }}
                    placeholder="Au moins 8 caractères"
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                  />
                </label>
                {resetError && <p className="text-xs font-semibold text-red-600">{resetError}</p>}
                {resetDone && <p className="text-xs font-semibold text-emerald-600">Mot de passe mis à jour.</p>}
                <button type="submit" disabled={resetSaving || newPassword.length < 8}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {resetSaving ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}