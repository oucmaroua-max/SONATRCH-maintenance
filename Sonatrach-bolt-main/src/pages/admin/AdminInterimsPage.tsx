import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, History, Plus, UserCog } from 'lucide-react';
import { AppShell } from '@/components/Shell';
import { listUsers } from '@/adminUsers';
import { createInterim, endInterim, listInterims, type Interim } from '@/interims';
import type { User } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  directeur: 'Directeur', sous_directeur: 'Sous-directeur', chef_departement: 'Chef de département',
  chef_service: 'Chef de service', employe: 'Employé',
};

export function AdminInterimsPage() {
  const [interims, setInterims] = useState<Interim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [delegatingUserId, setDelegatingUserId] = useState('');
  const [delegateUserId, setDelegateUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, u] = await Promise.all([listInterims(), listUsers()]);
      setInterims(i);
      setUsers(u.filter((x) => x.status === 'active'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!delegatingUserId || !delegateUserId || !startDate || !endDate) {
      setFormError('Tous les champs marqués * sont requis.');
      return;
    }
    setSaving(true);
    try {
      await createInterim({ delegatingUserId, delegateUserId, startDate, endDate, reason: reason || undefined });
      setDelegatingUserId(''); setDelegateUserId(''); setStartDate(''); setEndDate(''); setReason('');
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSaving(false);
    }
  }

  async function onEnd(id: string) {
    if (!window.confirm('Mettre fin à cet intérim ?')) return;
    try { await endInterim(id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible'); }
  }

  return (
    <AppShell active="admin-interims">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Administration · Continuité de service</p>
            <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">Gestion des intérims</h1>
            <p className="mt-1 text-sm text-slate-600">
              En cas d'absence d'un responsable, désignez un remplaçant. Il gardera son propre compte et pourra
              basculer temporairement vers l'espace de la personne absente.
            </p>
          </div>

          {loading && <p className="text-sm text-slate-500">Chargement…</p>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
              <Plus size={18} /> Nouvel intérim
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Personne absente <span className="text-red-500">*</span></span>
                  <select value={delegatingUserId} onChange={(e) => setDelegatingUserId(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                    <option value="">— Sélectionner —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role] ?? u.role})</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Remplaçant <span className="text-red-500">*</span></span>
                  <select value={delegateUserId} onChange={(e) => setDelegateUserId(e.target.value)}
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100">
                    <option value="">— Sélectionner —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role] ?? u.role})</option>)}
                  </select>
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
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Motif</span>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Congé, mission, arrêt maladie..."
                    className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100" />
                </label>
              </div>
              {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}
              <button disabled={saving} className="rounded-lg bg-sonatrach px-5 py-2.5 text-sm font-bold text-white hover:bg-sonatrach-600 disabled:opacity-60">
                {saving ? 'Création…' : "Créer l'intérim"}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
                <History size={18} /> Historique des intérims
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {interims.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">Aucun intérim enregistré.</p>}
              {interims.map((i) => (
                <div key={i.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <UserCog size={15} className="text-sonatrach" />
                      {i.delegateUser?.name} remplace {i.delegatingUser?.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{i.startDate} → {i.endDate}{i.reason ? ` · ${i.reason}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      i.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}>
                      {i.status === 'active' ? 'Actif' : i.status === 'termine' ? 'Terminé' : 'Annulé'}
                    </span>
                    {i.status === 'active' && (
                      <button onClick={() => onEnd(i.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                        <AlertTriangle size={13} /> Terminer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}