import { AlertTriangle, ArrowLeft, ClipboardPenLine, Pencil, Save, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell, navigate } from '@/components/Shell';
import { getWork, updateWork } from '@/works';
import { PRIORITY_FROM_API, STATUS_FROM_API, STATUS_TO_API, type ApiWork } from '@/workTypes';

const STATUSES = ['En attente', 'En cours', 'Terminé', 'En retard', 'Annulé'];
const REJECTED_DECISIONS = ['non_valide', 'a_reprendre', 'non_conforme_hse'];
const DECISION_LABELS: Record<string, string> = {
  valide: 'Validé', valide_reserves: 'Validé avec réserves', non_valide: 'Non validé',
  a_reprendre: 'À reprendre', non_conforme_hse: 'Non conforme HSE',
};

export function WorkOrderDetailPage({ id }: { id: string }) {
  const [work, setWork] = useState<ApiWork | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [status, setStatus] = useState('En attente');
  const [progress, setProgress] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [observation, setObservation] = useState('');

  async function load() {
    try {
      const { work: w, feedbacks: fb, canEdit: ce } = await getWork(id);
      setWork(w);
      setFeedbacks(fb);
      setCanEdit(ce);
      setStatus(STATUS_FROM_API[w.status] ?? 'En attente');
      setProgress(String(w.progress));
      setDueDate(w.dueDate ?? '');
      setDescription(w.descriptionPrevue);
      setObservation(w.observation ?? '');
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!work) return;
    setFormError(null);
    setSaving(true);
    try {
      const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
      await updateWork(work.id, {
        status: STATUS_TO_API[status],
        progress: STATUS_TO_API[status] === 'termine' ? 100 : clampedProgress,
        dueDate: dueDate || undefined,
        description,
        observation: observation || undefined,
      });
      await load();
      setEditing(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (!work) return;
    setStatus(STATUS_FROM_API[work.status] ?? 'En attente');
    setProgress(String(work.progress));
    setDueDate(work.dueDate ?? '');
    setDescription(work.descriptionPrevue);
    setObservation(work.observation ?? '');
    setFormError(null);
    setEditing(false);
  }

  const fieldClass = 'w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100';

  if (loading) {
    return (
      <AppShell active="orders">
        <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm text-slate-500">Chargement…</p>
          </div>
        </main>
      </AppShell>
    );
  }

  if (loadError || !work) {
    return (
      <AppShell active="orders">
        <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <button onClick={() => navigate('orders')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
              <ArrowLeft size={16} /> Retour au registre
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h1 className="heading text-2xl font-extrabold text-slate-950">Travail introuvable</h1>
              <p className="mt-2 text-sm text-slate-600">{loadError ?? `Aucun ordre de travail ne correspond à la référence ${id}.`}</p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  const lastFeedback = feedbacks[0];
  const needsCorrection = lastFeedback && REJECTED_DECISIONS.includes(lastFeedback.decision) && work.status !== 'termine';

  return (
    <AppShell active="orders">
      <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <button onClick={() => navigate('orders')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} /> Retour au registre
          </button>

          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Ordres d'intervention / Détail</p>
              <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">{work.title}</h1>
              <p className="mt-1 text-sm text-slate-600">Détails complets de cet ordre de travail.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-mono text-xs font-bold text-sonatrach">{work.code}</span>
              <span className="text-xs font-bold">{PRIORITY_FROM_API[work.priority] ?? work.priority}</span>
              <span className="rounded-full border px-2.5 py-1 text-[11px] font-bold">{STATUS_FROM_API[work.status] ?? work.status}</span>
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-sonatrach bg-orange-50 p-4 text-sm text-slate-700">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-sonatrach" />
            <span>
              <strong className="text-slate-900">Rappel procédure sécurité :</strong> le Permis de Travail et l'alignement avec le protocole de cadenassage sont obligatoires avant exécution.
            </span>
          </div>

          {needsCorrection && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle size={19} className="mt-0.5 shrink-0 text-red-600" />
              <span>
                <strong className="text-red-900">Retour de l'encadrement : {DECISION_LABELS[lastFeedback.decision]}.</strong>{' '}
                {lastFeedback.comment} Vous pouvez corriger ce travail via « Éditer » ci-dessous.
              </span>
            </div>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unité</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{work.unit ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Équipement</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{work.equipment ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avancement</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{work.progress}%</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sonatrach" style={{ width: `${work.progress}%` }} />
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{work.serviceName ?? '—'}</p>
              <p className="text-xs text-slate-500">{work.departmentName ?? ''}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {work.assigneeNames && work.assigneeNames.length > 1 ? 'Responsables' : 'Responsable'}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {work.assigneeNames && work.assigneeNames.length > 0 ? work.assigneeNames.join(', ') : '—'}
              </p>
              <p className="text-xs text-slate-500">Créé par {work.initiatorName ?? '—'}</p>
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="rounded-lg bg-orange-100 p-2.5 text-sonatrach">
                <ClipboardPenLine size={20} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900">Détails du travail</h2>
                <p className="text-xs text-slate-500">
                  {editing ? 'Modifiez les champs puis enregistrez.' : canEdit ? 'Cliquez sur « Éditer » pour modifier.' : 'Vous consultez ce travail en lecture seule.'}
                </p>
              </div>
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Pencil size={15} /> Éditer
                </button>
              )}
              {editing && (
                <button onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <X size={15} /> Annuler
                </button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
                  <p className="text-sm leading-6 text-slate-700">{work.descriptionPrevue || '—'}</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Statut</p>
                    <p className="text-sm font-bold text-slate-900">{STATUS_FROM_API[work.status] ?? work.status}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Avancement</p>
                    <p className="text-sm font-bold text-slate-900">{work.progress}%</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Date de fin prévue</p>
                    <p className="text-sm font-bold text-slate-900">{work.dueDate ?? '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Observation</p>
                  <p className="text-sm leading-6 text-slate-700">{work.observation || '—'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">Description de ce qui doit être fait</span>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={`resize-y ${fieldClass}`} />
                </label>

                <div className="grid gap-6 sm:grid-cols-3">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-800">Statut</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-800">Avancement (%)</span>
                    <input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className={fieldClass} disabled={status === 'Terminé'} />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-800">Date de fin prévue</span>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-800">Observation</span>
                  <textarea rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} className={`resize-y ${fieldClass}`} />
                </label>

                {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Annuler
                  </button>
                  <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                    <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {feedbacks.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <h2 className="font-bold text-slate-900">Feedbacks de l'encadrement</h2>
                <p className="text-xs text-slate-500">Avis du responsable ayant confié ce travail.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {feedbacks.map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{item.authorName}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.createdAt?.slice(0, 10)}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}