import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Briefcase, CalendarClock, CheckCircle2, KeyRound, Mail, ShieldAlert, User as UserIcon, UserCog } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';
import { api } from '@/api';
import { listUsers } from '@/adminUsers';
import { roleFromApi } from '@/adminRoles';
import { changeMyPassword, declareAbsence, declareReturn, getMyProfile, type MyProfile } from '@/profile';
import { listInterims, requestInterim, type Interim } from '@/interims';
import { getSessionUser, refreshSession } from '@/session';
import type { User } from '@/types';

type OrgResponse = {
  sousDirections: { abrv: string; name: string }[];
  departements: { abrv: string; name: string }[];
  services: { abrv: string; name: string }[];
};

const MANAGEMENT_ROLES_API = ['directeur', 'sous_directeur', 'chef_departement', 'chef_service'];

export function ProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [org, setOrg] = useState<OrgResponse>({ sousDirections: [], departements: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, orgTree] = await Promise.all([getMyProfile(), api<OrgResponse>('/api/org')]);
      setProfile(p);
      setOrg(orgTree);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const sdName = (abrv: string | null) => org.sousDirections.find((s) => s.abrv === abrv)?.name ?? '—';
  const depName = (abrv: string | null) => org.departements.find((d) => d.abrv === abrv)?.name ?? '—';
  const svcName = (abrv: string | null) => org.services.find((s) => s.abrv === abrv)?.name ?? '—';

  if (loading) {
    return (
      <AppShell active="profile">
        <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-10">
          <div className="mx-auto max-w-3xl px-4 text-center"><p className="text-sm text-slate-500">Chargement…</p></div>
        </main>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell active="profile">
        <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-10">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-semibold text-red-600">{error ?? 'Profil introuvable'}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  // Directeur / Sous-directeur / Chef de département / Chef de service → intérim.
  // Employé (ou rôle non défini) → absence.
  const isManagement = profile.role ? MANAGEMENT_ROLES_API.includes(profile.role) : false;

  return (
    <AppShell active="profile">
      <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          <button onClick={() => navigate('dashboard')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} /> Retour au tableau de bord
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Mon compte</p>
            <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">Profil</h1>
          </div>

          <ProfileInfoCard profile={profile} sdName={sdName} depName={depName} svcName={svcName} />
          <ChangePasswordCard />

          {isManagement ? (
            <InterimRequestCard />
          ) : (
            <AbsenceCard profile={profile} onUpdated={load} />
          )}
        </div>
      </main>
    </AppShell>
  );
}

/* ---------------- Infos ---------------- */

function ProfileInfoCard({ profile, sdName, depName, svcName }: {
  profile: MyProfile; sdName: (a: string | null) => string; depName: (a: string | null) => string; svcName: (a: string | null) => string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 text-xl font-bold text-sonatrach">
          {profile.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </div>
        <div>
          <h2 className="heading text-xl font-extrabold text-slate-950">{profile.name}</h2>
          <p className="text-sm text-slate-500">{profile.role ? roleFromApi(profile.role) : '—'}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <InfoItem icon={<UserIcon size={13} />} label="Identifiant" value={profile.username} mono />
        <InfoItem icon={<Mail size={13} />} label="Email" value={profile.email} />
        <InfoItem icon={<Briefcase size={13} />} label="Sous-direction" value={sdName(profile.sousDirectionAbrv)} />
        <InfoItem icon={<Briefcase size={13} />} label="Département" value={depName(profile.departementAbrv)} />
        <InfoItem icon={<Briefcase size={13} />} label="Service" value={svcName(profile.serviceAbrv)} />
        <InfoItem icon={<CalendarClock size={13} />} label="Membre depuis" value={profile.createdAt?.slice(0, 10)} />
      </div>
    </section>
  );
}

function InfoItem({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{icon}{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

/* ---------------- Mot de passe ---------------- */

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (newPassword.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setDone(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
        <KeyRound size={18} /> Changer mon mot de passe
      </h2>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Mot de passe actuel</span>
          <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Nouveau mot de passe</span>
          <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Confirmer le nouveau mot de passe</span>
          <input required type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
        </label>
        {error && <p className="text-xs font-semibold text-red-600 sm:col-span-2">{error}</p>}
        {done && <p className="text-xs font-semibold text-emerald-600 sm:col-span-2">Mot de passe mis à jour.</p>}
        <div className="sm:col-span-2">
          <button disabled={saving} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------------- Absence (employés) ---------------- */

function AbsenceCard({ profile, onUpdated }: { profile: MyProfile; onUpdated: () => void }) {
  const [reason, setReason] = useState('Congé');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isInactive = profile.status === 'inactive';
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = profile.absenceUntil
    ? Math.max(0, Math.ceil((new Date(profile.absenceUntil).getTime() - new Date(today).getTime()) / 86400000))
    : null;

  async function declare() {
    setError(null);
    if (!endDate) { setError('Merci d\'indiquer une date de retour prévue.'); return; }
    setSaving(true);
    try {
      await declareAbsence(reason, endDate);
      await onUpdated();
      await refreshSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setSaving(false);
    }
  }

  async function returnFromAbsence() {
    setError(null);
    setSaving(true);
    try {
      await declareReturn();
      await onUpdated();
      await refreshSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
        <ShieldAlert size={18} /> Déclarer une absence
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Si vous êtes malade, en congé ou en mission, déclarez votre absence avec une date de retour prévue.
        Votre compte reste accessible pendant cette période ; il passe en statut « Inactif » et redevient
        « Actif » automatiquement à la date indiquée, ou dès que vous déclarez votre retour.
      </p>

      {isInactive ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">
            Vous êtes actuellement absent{profile.absenceReason ? ` (${profile.absenceReason})` : ''}.
          </p>
          {profile.absenceUntil && (
            <p className="mt-1 text-xs text-amber-700">
              Retour automatique prévu le {profile.absenceUntil}
              {daysLeft !== null ? ` (dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''})` : ''}.
            </p>
          )}
          <button onClick={returnFromAbsence} disabled={saving} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Je suis de retour maintenant'}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Motif</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
              <option>Congé</option><option>Maladie</option><option>Mission</option><option>Autre</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Retour prévu le <span className="text-red-500">*</span></span>
            <input type="date" min={today} value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
          </label>
          <button onClick={declare} disabled={saving} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Déclarer mon absence'}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
    </section>
  );
}

/* ---------------- Intérim (responsables : directeur, sous-directeur, chef dep, chef service) ---------------- */

function InterimRequestCard() {
  const user = getSessionUser();
  const [colleagues, setColleagues] = useState<User[]>([]);
  const [myInterims, setMyInterims] = useState<Interim[]>([]);
  const [loading, setLoading] = useState(true);

  const [delegateUserId, setDelegateUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const [users, all] = await Promise.all([listUsers(), listInterims()]);
      setColleagues(users.filter((u) => u.id !== user.id && u.status === 'active'));
      setMyInterims(all.filter((i) => i.delegatingUserId === user.id));
    } catch {
      /* section secondaire : on n'affiche pas d'erreur bloquante */
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { void load(); }, [load]);

  const pending = myInterims.find((i) => i.status === 'en_attente' || i.status === 'active');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!delegateUserId || !startDate || !endDate) { setError('Remplaçant et dates requis'); return; }
    setSaving(true);
    try {
      await requestInterim({ delegateUserId, startDate, endDate, reason: reason || undefined });
      setDone(true);
      setDelegateUserId(''); setStartDate(''); setEndDate(''); setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demande impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
        <UserCog size={18} /> Déclarer un intérim
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        En cas d'absence, proposez un remplaçant. Votre demande sera transmise à l'administrateur pour validation.
        Votre compte reste actif ; c'est le remplaçant qui bascule vers votre espace le temps de l'intérim.
      </p>

      {loading && <p className="mt-4 text-sm text-slate-500">Chargement…</p>}

      {!loading && pending && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-blue-600" />
          <span>
            Une demande d'intérim {pending.status === 'en_attente' ? 'est en attente de validation' : 'est déjà active'} pour vous
            ({pending.delegateUser?.name}, {pending.startDate} → {pending.endDate}).
          </span>
        </div>
      )}

      {!loading && !pending && (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Remplaçant <span className="text-red-500">*</span></span>
              <select value={delegateUserId} onChange={(e) => setDelegateUserId(e.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                <option value="">— Sélectionner —</option>
                {colleagues.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Motif</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Congé, mission..."
                className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Date de début <span className="text-red-500">*</span></span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Date de fin <span className="text-red-500">*</span></span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
            </label>
          </div>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          {done && <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Demande envoyée à l'administrateur.</p>}
          <button disabled={saving} className="rounded-lg bg-sonatrach px-5 py-2.5 text-sm font-bold text-white hover:bg-sonatrach-600 disabled:opacity-60">
            {saving ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </form>
      )}
    </section>
  );
}