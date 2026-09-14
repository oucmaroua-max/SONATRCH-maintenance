import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardPenLine, Save } from 'lucide-react';
import { FormEvent, useMemo, useState, useSyncExternalStore } from 'react';
import { AppShell, navigate } from '@/components/Shell';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { getWorkOrder, getWorkOrders, subscribeWorkOrders, updateWorkOrder } from '@/store';
import type { Priority, WorkStatus } from '@/types';

const services = ['Machines tournantes', 'Mécanique', 'Instrumentation', 'Électricité', 'Tuyauterie'];
const assignees = ['K. Hamidi', 'S. Belkacem', 'M. Zerrouki', 'A. Merouane', 'Y. Djebbar', 'Équipe quart A'];
const statuses: WorkStatus[] = ['En attente', 'En cours', 'Terminé', 'En retard'];
const priorities: Priority[] = ['Critique', 'Haute', 'Normale'];

export function WorkOrderDetailPage({ id }: { id: string }) {
  useSyncExternalStore(subscribeWorkOrders, getWorkOrders);
  const order = getWorkOrder(id);
  const [saved, setSaved] = useState(false);

  const initial = useMemo(
    () =>
      order
        ? {
            title: order.title,
            unit: order.unit,
            service: order.service,
            priority: order.priority,
            status: order.status,
            assignee: order.assignee,
            startDate: order.startDate,
            dueDate: order.dueDate,
            progress: String(order.progress),
            description: order.description,
            observation: order.observation,
            agents: String(order.agents),
            equipment: order.equipment,
            permit: order.permit,
          }
        : null,
    [order],
  );

  const [form, setForm] = useState(initial);

  if (!order || !form) {
    return (
      <AppShell active="orders">
        <main className="min-h-[calc(100vh-200px)] bg-slate-50 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <button onClick={() => navigate('orders')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
              <ArrowLeft size={16} /> Retour au registre
            </button>
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h1 className="heading text-2xl font-extrabold text-slate-950">Travail introuvable</h1>
              <p className="mt-2 text-sm text-slate-600">Aucun ordre de travail ne correspond à la référence {id}.</p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  function setField<K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const progress = Math.min(100, Math.max(0, Number(form.progress) || 0));
    const agents = Math.max(1, Number(form.agents) || 1);
    const status = form.status as WorkStatus;
    updateWorkOrder(order.id, {
      title: form.title,
      unit: form.unit,
      service: form.service,
      priority: form.priority as Priority,
      status,
      assignee: form.assignee,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: status === 'Terminé' ? 100 : progress,
      description: form.description,
      observation: form.observation,
      agents,
      equipment: form.equipment,
      permit: form.permit,
    });
    setSaved(true);
  }

  const fieldClass = 'w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100';

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
              <h1 className="heading mt-2 text-3xl font-extrabold text-slate-950">{order.title}</h1>
              <p className="mt-1 text-sm text-slate-600">Consultez et mettez à jour toutes les informations de cet ordre de travail.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-mono text-xs font-bold text-sonatrach">{order.id}</span>
              <PriorityBadge priority={order.priority} />
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-sonatrach bg-orange-50 p-4 text-sm text-slate-700">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-sonatrach" />
            <span>
              <strong className="text-slate-900">Rappel procédure sécurité :</strong> le Permis de Travail et l'alignement avec le protocole de cadenassage sont obligatoires avant exécution.
            </span>
          </div>

          {saved ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
              <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">Modifications enregistrées</h2>
              <p className="mt-2 text-sm text-emerald-800">L'ordre {order.id} a été mis à jour dans le registre.</p>
              <button onClick={() => navigate('orders')} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                Liste des travaux
              </button>
            </div>
          ) : (
            <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unité</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{order.unit}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Équipement</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{order.equipment}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avancement</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{order.progress}%</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sonatrach" style={{ width: `${order.progress}%` }} />
              </div>
            </div>
          </section>

          <form onSubmit={onSubmit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="rounded-lg bg-orange-100 p-2.5 text-sonatrach">
                <ClipboardPenLine size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Détails du travail</h2>
                <p className="text-xs text-slate-500">Modifiez les champs puis enregistrez pour mettre à jour l'ordre.</p>
              </div>
              <span className="ml-auto hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 sm:inline">Code OT : {order.id}</span>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Titre de l'intervention <b className="text-red-500">*</b></span>
                <input required value={form.title} onChange={(event) => setField('title', event.target.value)} className={fieldClass} />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Service <b className="text-red-500">*</b></span>
                  <select required value={form.service} onChange={(event) => setField('service', event.target.value)} className={fieldClass}>
                    {services.map((service) => (
                      <option key={service}>{service}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Affecter à</span>
                  <select value={form.assignee} onChange={(event) => setField('assignee', event.target.value)} className={fieldClass}>
                    {assignees.map((assignee) => (
                      <option key={assignee}>{assignee}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Unité / zone</span>
                  <input value={form.unit} onChange={(event) => setField('unit', event.target.value)} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Équipement / repère</span>
                  <input value={form.equipment} onChange={(event) => setField('equipment', event.target.value)} className={fieldClass} />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Description de ce qui doit être fait <b className="text-red-500">*</b></span>
                <textarea required rows={4} value={form.description} onChange={(event) => setField('description', event.target.value)} className={`resize-y ${fieldClass}`} />
              </label>

              <div className="grid gap-6 sm:grid-cols-3">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Priorité</span>
                  <select value={form.priority} onChange={(event) => setField('priority', event.target.value)} className={fieldClass}>
                    {priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Statut</span>
                  <select value={form.status} onChange={(event) => setField('status', event.target.value)} className={fieldClass}>
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Avancement (%)</span>
                  <input type="number" min="0" max="100" value={form.progress} onChange={(event) => setField('progress', event.target.value)} className={fieldClass} />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Date de début</span>
                  <input value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Date de fin prévue</span>
                  <input value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-800">Nombre d'agents</span>
                  <input type="number" min="1" max="25" value={form.agents} onChange={(event) => setField('agents', event.target.value)} className={fieldClass} />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Permis de travail</span>
                <input value={form.permit} onChange={(event) => setField('permit', event.target.value)} className={fieldClass} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Observation</span>
                <textarea rows={3} value={form.observation} onChange={(event) => setField('observation', event.target.value)} className={`resize-y ${fieldClass}`} />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => navigate('orders')} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Annuler
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                  <Save size={16} /> Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>
            </>
          )}
          {order.feedbacks && order.feedbacks.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <h2 className="font-bold text-slate-900">Feedbacks de l'encadrement</h2>
                <p className="text-xs text-slate-500">Avis du directeur, sous-directeur, chef de département ou chef de service.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {order.feedbacks.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{item.author} · {item.role}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.date}</p>
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
