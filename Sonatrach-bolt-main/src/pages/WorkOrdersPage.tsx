import { Filter, Plus, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell, navigate } from '@/components/Shell';
import { listWorks } from '@/works';
import { PRIORITY_FROM_API, STATUS_FROM_API, type ApiWork } from '@/workTypes';

export function WorkOrdersPage() {
  const [works, setWorks] = useState<ApiWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Tous les statuts');

  useEffect(() => {
    (async () => {
      try {
        const { works: rows } = await listWorks();
        setWorks(rows);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => works.filter((w) => {
    const statusLabel = STATUS_FROM_API[w.status] ?? w.status;
    const haystack = `${w.title} ${w.unit ?? ''} ${w.code} ${w.serviceName ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'Tous les statuts' || statusLabel === status);
  }), [works, query, status]);

  return (
    <AppShell active="orders">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Direction Maintenance / Registre opérationnel</p>
              <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">Liste des travaux de maintenance</h1>
              <p className="mt-1 text-sm text-slate-600">Consultez, filtrez et suivez l'avancement des ordres de travail de votre périmètre.</p>
            </div>
            <button onClick={() => navigate('new-order')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600">
              <Plus size={17} /> Nouveau travail
            </button>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher unité, équipement, code..."
                  className="w-full rounded-lg border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-sonatrach focus:ring-orange-100" />
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border-slate-300 py-2.5 text-sm focus:border-sonatrach focus:ring-orange-100">
                <option>Tous les statuts</option><option>En attente</option><option>En cours</option><option>Terminé</option><option>En retard</option>
              </select>
              <button onClick={() => { setQuery(''); setStatus('Tous les statuts'); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <RotateCcw size={15} /> Réinitialiser
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Registre d'interventions</h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">{filtered.length} travaux</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-slate-200 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Code</th><th className="px-5 py-3">Titre</th><th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Priorité</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3 text-right">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((w) => (
                    <tr key={w.id} onClick={() => navigate(`orders/${w.id}`)} className="cursor-pointer transition hover:bg-orange-50/30">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-sonatrach">{w.code}<p className="mt-1 font-sans text-[11px] font-normal text-slate-400">{w.startDate}</p></td>
                      <td className="px-5 py-4"><p className="text-sm font-bold text-slate-800">{w.title}</p><p className="mt-1 text-xs text-slate-500">{w.unit ?? '—'} · {w.assigneeName ?? '—'}</p></td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{w.serviceName}<p className="text-[11px] font-normal text-slate-400">{w.departmentName}</p></td>
                      <td className="px-5 py-4"><span className="text-xs font-bold">{PRIORITY_FROM_API[w.priority] ?? w.priority}</span></td>
                      <td className="px-5 py-4"><span className="rounded-full border px-2.5 py-1 text-[11px] font-bold">{STATUS_FROM_API[w.status] ?? w.status}</span></td>
                      <td className="px-5 py-4 text-right text-xs font-semibold text-slate-600">
                        {w.dueDate ?? '—'}
                        <div className="mt-2 h-1.5 w-20 rounded-full bg-slate-100 ml-auto"><div className="h-full rounded-full bg-sonatrach" style={{ width: `${w.progress}%` }} /></div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">Aucun ordre de travail ne correspond à votre recherche.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}