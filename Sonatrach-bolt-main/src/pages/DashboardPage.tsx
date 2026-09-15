import { FormEvent, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MessageSquarePlus,
  Plus,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { activity } from '@/data';
import { AppShell, navigate } from '@/components/Shell';
import { PriorityBadge, StatusBadge } from '@/components/StatusBadge';
import { canReviewCompletedWork, getSessionUser, subscribeSession } from '@/session';
import { addWorkFeedback, getWorkOrders, subscribeWorkOrders } from '@/store';
import {
  FEEDBACK_DECISIONS,
  isFeedbackApproved,
  type FeedbackDecision,
  type WorkOrder,
  type WorkStatus,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<WorkStatus, string> = {
  'En attente': '#fcd34d',
  'En cours': '#93c5fd',
  'Terminé': '#6ee7b7',
  'En retard': '#fca5a5',
};

const STATUS_GRADIENTS: Record<WorkStatus, [string, string]> = {
  'En attente': ['#fe912a', '#fd8b27'],
  'En cours': ['#5fa4ff', '#bfdbfe'],
  'Terminé': ['#73ffb7', '#5effb4'],
  'En retard': ['#fd6767', '#fe7070'],
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusDonut({ counts }: { counts: Record<WorkStatus, number> }) {
  const segments = (Object.keys(STATUS_COLORS) as WorkStatus[]).map((status) => ({
    label: status,
    value: counts[status] ?? 0,
    color: STATUS_COLORS[status],
    gradient: STATUS_GRADIENTS[status],
  }));
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 70;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;
  const gap = 2;

  return (
    <div className="relative h-60 w-60">
      <svg viewBox="0 0 200 200" className="h-60 w-60 -rotate-90 drop-shadow-sm">
        <defs>
          {segments.map((seg) => (
            <linearGradient key={seg.label} id={`grad-${seg.label.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={seg.gradient[0]} />
              <stop offset="100%" stopColor={seg.gradient[1]} />
            </linearGradient>
          ))}
          <filter id="donut-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer decorative ring */}
        <circle cx="100" cy="100" r={radius + 14} fill="none" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 4" />

        {/* Background track */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#eef2f6" strokeWidth={strokeWidth} />

        {segments.map((seg) => {
          if (seg.value === 0) return null;
          const length = Math.max((seg.value / total) * circumference - gap, 0);
          const dashoffset = -acc;
          acc += (seg.value / total) * circumference;
          return (
            <circle
              key={seg.label}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={`url(#grad-${seg.label.replace(/\s/g, '')})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashoffset}
              filter="url(#donut-glow)"
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}

        {/* Inner subtle ring */}
        <circle cx="100" cy="100" r={radius - strokeWidth / 2 - 6} fill="none" stroke="#f8fafc" strokeWidth="1" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="heading text-4xl font-extrabold text-slate-900 tabular-nums">{total}</span>
        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">travaux</span>
        <span className="mt-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
          total
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof ClipboardCheck;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="heading mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${bg} ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{note}</p>
    </div>
  );
}

function FeedbackModal({
  order,
  userName,
  userRole,
  onClose,
}: {
  order: WorkOrder;
  userName: string;
  userRole: string;
  onClose: () => void;
}) {
  const [decision, setDecision] = useState<FeedbackDecision | ''>('');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const approved = Boolean(decision && isFeedbackApproved(decision));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!decision || !comment.trim()) return;
    addWorkFeedback(order.id, {
      author: userName,
      role: userRole,
      decision,
      comment: comment.trim(),
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    });
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
          <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">Feedback enregistré</h2>
          <p className="mt-2 text-sm text-emerald-800">Votre avis a été ajouté à l'ordre {order.id}.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <form onSubmit={submit}>
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Avis encadrement</p>
          <h2 className="heading mt-2 text-xl font-extrabold text-slate-950">Feedback sur le travail terminé</h2>
          <p className="mt-1 text-sm text-slate-600">{order.id} · {order.title}</p>
        </div>

        <div className="space-y-5 p-6">
          {/* Decision selector */}
          <div>
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Votre décision <b className="text-red-500">*</b>
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FEEDBACK_DECISIONS.map((dec) => {
                const isActive = decision === dec;
                const isApproved = isFeedbackApproved(dec);
                return (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setDecision(dec)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? isApproved
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {dec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Votre observation <b className="text-red-500">*</b>
            </span>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Qualité d'exécution, respect HSE, points à améliorer..."
              className="w-full resize-y rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
            />
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!decision || !comment.trim()}
              className={`rounded-lg px-6 py-3 text-sm font-bold text-white transition ${
                approved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Enregistrer le feedback
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CompletedWorkReview({
  orders,
  statusCounts,
  onOpenFeedback,
}: {
  orders: WorkOrder[];
  statusCounts: Record<WorkStatus, number>;
  onOpenFeedback: (order: WorkOrder) => void;
}) {
  const total = (Object.keys(STATUS_COLORS) as WorkStatus[]).reduce(
    (sum, status) => sum + (statusCounts[status] ?? 0),
    0,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="heading font-bold text-slate-900">Travaux terminés — avis encadrement</h2>
          <p className="mt-1 text-xs text-slate-500">
            Visible par le directeur, le sous-directeur, le chef de département et le chef de service.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
          {orders.length} clôturé(s)
        </span>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* List */}
        <div className="divide-y divide-slate-100">
          {orders.map((order) => {
            const lastFeedback = order.feedbacks?.[order.feedbacks.length - 1];
            return (
              <div
                key={order.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <button type="button" onClick={() => navigate(`orders/${order.id}`)} className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-sonatrach">{order.id}</span>
                    <PriorityBadge priority={order.priority} />
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-slate-800">{order.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.unit} · {order.assignee} · {order.service}
                  </p>
                  {lastFeedback && (
                    <p className="mt-2 text-xs text-slate-600">
                      Dernier avis ({lastFeedback.role}) : <strong>{lastFeedback.decision}</strong>
                      {lastFeedback.comment ? ` — ${lastFeedback.comment}` : ''}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenFeedback(order)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <MessageSquarePlus size={16} /> Donner un feedback
                </button>
              </div>
            );
          })}
          {orders.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun travail terminé pour le moment.</p>
          )}
        </div>

        {/* Donut + legend */}
        <div className="flex flex-col items-center justify-center gap-5 border-t border-slate-100 px-5 py-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">Répartition des travaux</p>
          <StatusDonut counts={statusCounts} />
          <ul className="w-full max-w-[220px] space-y-2">
            {(Object.keys(STATUS_COLORS) as WorkStatus[]).map((status) => {
              const pct = total ? Math.round((statusCounts[status] / total) * 100) : 0;
              return (
                <li key={status} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${STATUS_GRADIENTS[status][0]}, ${STATUS_GRADIENTS[status][1]})` }}
                    />
                    {status}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 tabular-nums">{statusCounts[status]}</span>
                    <span className="text-[10px] font-medium text-slate-400 tabular-nums">{pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PriorityOrders({ orders }: { orders: WorkOrder[] }) {
  const priorityOrders = orders.filter(
    (order) => order.priority === 'Haute' || order.priority === 'Critique',
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="heading font-bold text-slate-900">Ordres de travail prioritaires</h2>
          <p className="mt-1 text-xs text-slate-500">Les interventions nécessitant votre attention.</p>
        </div>
        <button
          onClick={() => navigate('orders')}
          className="flex items-center gap-1 text-xs font-bold text-sonatrach hover:underline"
        >
          Voir le registre <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {priorityOrders.slice(0, 4).map((order) => (
          <div
            key={order.id}
            onClick={() => navigate(`orders/${order.id}`)}
            className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between"
          >
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
        {priorityOrders.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun ordre prioritaire.</p>
        )}
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
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
            <div
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                item.tone === 'green'
                  ? 'bg-emerald-500'
                  : item.tone === 'red'
                    ? 'bg-red-500'
                    : item.tone === 'blue'
                      ? 'bg-blue-500'
                      : 'bg-sonatrach'
              }`}
            />
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
  );
}

function BottomStats() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {/* Next shutdown */}
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

      {/* Permit compliance */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Conformité permis</p>
        <p className="heading mt-3 text-3xl font-extrabold text-slate-950">100%</p>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <ShieldCheck size={15} /> 18 permis vérifiés cette semaine
        </div>
      </div>

      {/* Avg resolution time */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Temps moyen de résolution</p>
        <p className="heading mt-3 text-3xl font-extrabold text-slate-950">18h 42</p>
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
          <TrendingUp size={15} /> 14% plus rapide ce mois
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const workOrders = useSyncExternalStore(subscribeWorkOrders, getWorkOrders);
  const user = useSyncExternalStore(subscribeSession, getSessionUser);
  const canReview = canReviewCompletedWork(user.role);

  const [feedbackOrder, setFeedbackOrder] = useState<WorkOrder | null>(null);

  const active = workOrders.filter((order) => order.status === 'En cours').length;
  const late = workOrders.filter((order) => order.status === 'En retard').length;
  const completed = workOrders.filter((order) => order.status === 'Terminé' && !order.archived);
  const visibleOrders = workOrders.filter((order) => !order.archived);

  const statusCounts = useMemo(() => {
    const counts: Record<WorkStatus, number> = {
      'En attente': 0,
      'En cours': 0,
      'Terminé': 0,
      'En retard': 0,
    };
    workOrders.forEach((order) => {
      counts[order.status] += 1;
    });
    return counts;
  }, [workOrders]);

  const cards = [
    {
      label: 'Ordres ouverts',
      value: '24',
      note: '+12% vs semaine passée',
      icon: ClipboardCheck,
      color: 'text-sonatrach',
      bg: 'bg-orange-50',
    },
    {
      label: 'Interventions en cours',
      value: String(active),
      note: '3 équipes sur le terrain',
      icon: Wrench,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'En retard',
      value: String(late),
      note: 'À traiter en priorité',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Disponibilité unités',
      value: '98.4%',
      note: '+0.6% ce mois',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <AppShell active="dashboard">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 lg:px-8">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
                Mardi 08 septembre 2026 · Quart du matin
              </p>
              <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Bonjour, {user.name.replace(/^Ing\.\s*/i, '')}.
              </h1>
              <p className="mt-1 text-sm text-slate-600">Voici la situation opérationnelle de votre périmètre.</p>
            </div>
            <button
              onClick={() => navigate('new-order')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600"
            >
              <Plus size={17} /> Nouveau travail
            </button>
          </div>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Completed work review (managers only) */}
          {canReview && (
            <CompletedWorkReview
              orders={completed}
              statusCounts={statusCounts}
              onOpenFeedback={setFeedbackOrder}
            />
          )}

          {/* Priority orders + Recent activity */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <PriorityOrders orders={visibleOrders} />
            <RecentActivity />
          </div>

          {/* Bottom stats */}
          <BottomStats />
        </div>
      </main>

      {/* Feedback modal */}
      {feedbackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <FeedbackModal
            order={feedbackOrder}
            userName={user.name}
            userRole={user.role}
            onClose={() => setFeedbackOrder(null)}
          />
        </div>
      )}
    </AppShell>
  );
}
