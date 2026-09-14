import { FormEvent, useState, useSyncExternalStore } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardCheck, Clock3, MessageSquarePlus, Plus, ShieldCheck, TrendingUp, Wrench } from 'lucide-react';
import { activity } from '@/data';
import { AppShell, navigate } from '@/components/Shell';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { canReviewCompletedWork, getSessionUser, subscribeSession } from '@/session';
import { addWorkFeedback, getWorkOrders, subscribeWorkOrders } from '@/store';
import { FEEDBACK_DECISIONS, isFeedbackApproved, type FeedbackDecision, type WorkOrder } from '@/types';

export function DashboardPage() {
  const workOrders = useSyncExternalStore(subscribeWorkOrders, getWorkOrders);
  const user = useSyncExternalStore(subscribeSession, getSessionUser);
  const canReview = canReviewCompletedWork(user.role);
  const active = workOrders.filter((order) => order.status === 'En cours').length;
  const late = workOrders.filter((order) => order.status === 'En retard').length;
  const completed = workOrders.filter((order) => order.status === 'Terminé' && !order.archived);
  const visibleOrders = workOrders.filter((order) => !order.archived);
  const [feedbackOrder, setFeedbackOrder] = useState<WorkOrder | null>(null);
  const [decision, setDecision] = useState<FeedbackDecision | ''>('');
  const [comment, setComment] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  function openFeedback(order: WorkOrder) {
    setFeedbackOrder(order);
    setDecision('');
    setComment('');
    setSavedFeedback(false);
  }

  function submitFeedback(event: FormEvent) {
    event.preventDefault();
    if (!feedbackOrder || !decision || !comment.trim()) return;
    addWorkFeedback(feedbackOrder.id, {
      author: user.name,
      role: user.role,
      decision,
      comment: comment.trim(),
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    });
    setSavedFeedback(true);
  }

  const approved = Boolean(decision && isFeedbackApproved(decision));

  const cards = [
    { label: 'Ordres ouverts', value: '24', note: '+12% vs semaine passée', icon: ClipboardCheck, color: 'text-sonatrach', bg: 'bg-orange-50' },
    { label: 'Interventions en cours', value: String(active), note: '3 équipes sur le terrain', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En retard', value: String(late), note: 'À traiter en priorité', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Disponibilité unités', value: '98.4%', note: '+0.6% ce mois', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <AppShell active="dashboard">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Mardi 08 septembre 2026 · Quart du matin</p>
              <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Bonjour, {user.name.replace(/^Ing\.\s*/i, '')}.</h1>
              <p className="mt-1 text-sm text-slate-600">Voici la situation opérationnelle de votre périmètre.</p>
            </div>
            <button onClick={() => navigate('new-order')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600">
              <Plus size={17} /> Nouveau travail
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                    <p className="heading mt-2 text-3xl font-extrabold text-slate-950">{card.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                    <card.icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-500">{card.note}</p>
              </div>
            ))}
          </div>

          {canReview && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="heading font-bold text-slate-900">Travaux terminés — avis encadrement</h2>
                  <p className="mt-1 text-xs text-slate-500">Visible par le directeur, le sous-directeur, le chef de département et le chef de service.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">{completed.length} clôturé(s)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {completed.map((order) => {
                  const lastFeedback = order.feedbacks?.[order.feedbacks.length - 1];
                  return (
                    <div key={order.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={() => navigate(`orders/${order.id}`)} className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-sonatrach">{order.id}</span>
                          <PriorityBadge priority={order.priority} />
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">{order.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{order.unit} · {order.assignee} · {order.service}</p>
                        {lastFeedback && (
                          <p className="mt-2 text-xs text-slate-600">
                            Dernier avis ({lastFeedback.role}) : <strong>{lastFeedback.decision}</strong>
                            {lastFeedback.comment ? ` — ${lastFeedback.comment}` : ''}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openFeedback(order)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        <MessageSquarePlus size={16} /> Donner un feedback
                      </button>
                    </div>
                  );
                })}
                {completed.length === 0 && (
                  <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun travail terminé pour le moment.</p>
                )}
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="heading font-bold text-slate-900">Ordres de travail prioritaires</h2>
                  <p className="mt-1 text-xs text-slate-500">Les interventions nécessitant votre attention.</p>
                </div>
                <button onClick={() => navigate('orders')} className="flex items-center gap-1 text-xs font-bold text-sonatrach hover:underline">
                  Voir le registre <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {visibleOrders.slice(0, 4).map((order) => (
                  <div key={order.id} onClick={() => navigate(`orders/${order.id}`)} className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-sonatrach">{order.id}</span>
                        <PriorityBadge priority={order.priority} />
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-800">{order.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.unit} · {order.assignee}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden w-28 sm:block">
                        <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                          <span>Avancement</span>
                          <span>{order.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-sonatrach" style={{ width: `${order.progress}%` }} />
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="heading font-bold text-slate-900">Activité récente</h2>
                  <p className="mt-1 text-xs text-slate-500">Suivi en temps réel du site.</p>
                </div>
                <Activity size={18} className="text-slate-400" />
              </div>
              <div className="space-y-5 px-5 py-5">
                {activity.map((item) => (
                  <div key={item.time} className="flex gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === 'green' ? 'bg-emerald-500' : item.tone === 'red' ? 'bg-red-500' : item.tone === 'blue' ? 'bg-blue-500' : 'bg-sonatrach'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <span className="text-[11px] text-slate-400">{item.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-5 mb-5 flex items-center gap-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                <ShieldCheck size={17} className="shrink-0 text-emerald-600" />
                <span>
                  <strong>Système nominal.</strong> Aucune alerte HSE critique.
                </span>
              </div>
            </section>
          </div>

          <section className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white">
              <div className="flex items-center gap-2 text-orange-400">
                <Clock3 size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Prochain arrêt</span>
              </div>
              <p className="heading mt-4 text-2xl font-extrabold">Unité Topping</p>
              <p className="mt-1 text-sm text-slate-400">Planifié le 14 septembre · 06:00</p>
              <div className="mt-5 h-1.5 rounded-full bg-slate-700">
                <div className="h-full w-2/3 rounded-full bg-orange-400" />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Préparation à 68%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Conformité permis</p>
              <p className="heading mt-3 text-3xl font-extrabold text-slate-950">100%</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <ShieldCheck size={15} /> 18 permis vérifiés cette semaine
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Temps moyen de résolution</p>
              <p className="heading mt-3 text-3xl font-extrabold text-slate-950">18h 42</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <TrendingUp size={15} /> 14% plus rapide ce mois
              </div>
            </div>
          </section>
        </div>
      </main>

      {feedbackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
            {savedFeedback ? (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
                <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">Feedback enregistré</h2>
                <p className="mt-2 text-sm text-emerald-800">Votre avis a été ajouté à l'ordre {feedbackOrder.id}.</p>
                <button type="button" onClick={() => setFeedbackOrder(null)} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback}>
                <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Avis encadrement</p>
                  <h2 className="heading mt-2 text-xl font-extrabold text-slate-950">Feedback sur le travail terminé</h2>
                  <p className="mt-1 text-sm text-slate-600">{feedbackOrder.id} · {feedbackOrder.title}</p>
                </div>
                <div className="space-y-4 p-6">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-800">Votre observation <b className="text-red-500">*</b></span>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Qualité d'exécution, respect HSE, points à améliorer..."
                      className="w-full resize-y rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                    />
                  </label>
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setFeedbackOrder(null)} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Annuler
                    </button>
                    <button className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                      Enregistrer le feedback
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
