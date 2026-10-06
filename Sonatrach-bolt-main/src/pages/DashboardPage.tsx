import { FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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
import { canReviewCompletedWork, getActingInterim, getEffectiveRole, getSessionUser, subscribeSession } from '@/session';
import { addFeedback, listWorks } from '@/works';
import { DECISION_TO_API, PRIORITY_FROM_API, STATUS_FROM_API, type ApiWork } from '@/workTypes';
import { FEEDBACK_DECISIONS, isFeedbackApproved, type FeedbackDecision } from '@/types';
import { InterimBanner } from '@/components/InterimBanner';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type WorkStatusLabel = 'En attente' | 'En cours' | 'Terminé' | 'En retard';

const STATUS_COLORS: Record<WorkStatusLabel, string> = {
  'En attente': '#fcd34d',
  'En cours': '#93c5fd',
  'Terminé': '#6ee7b7',
  'En retard': '#fca5a5',
};

const STATUS_GRADIENTS: Record<WorkStatusLabel, [string, string]> = {
  'En attente': ['#fe912a', '#fd8b27'],
  'En cours': ['#5fa4ff', '#bfdbfe'],
  'Terminé': ['#73ffb7', '#5effb4'],
  'En retard': ['#fd6767', '#fe7070'],
};

function statusLabel(work: ApiWork): WorkStatusLabel | 'Annulé' {
  return (STATUS_FROM_API[work.status] as WorkStatusLabel | 'Annulé') ?? 'En attente';
}
function priorityLabel(work: ApiWork) {
  return PRIORITY_FROM_API[work.priority] ?? work.priority;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (design inchangé)                                  */
/* ------------------------------------------------------------------ */

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = { Critique: 'text-red-600', Haute: 'text-orange-600', Normale: 'text-slate-500' };
  return <span className={`text-xs font-bold ${styles[priority] ?? 'text-slate-500'}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
    'En cours': 'bg-blue-50 text-blue-700 border-blue-200',
    'Terminé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'En retard': 'bg-red-50 text-red-700 border-red-200',
    'Annulé': 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status] ?? styles['En attente']}`}>{status}</span>;
}

function StatusDonut({ counts }: { counts: Record<WorkStatusLabel, number> }) {
  const segments = (Object.keys(STATUS_COLORS) as WorkStatusLabel[]).map((status) => ({
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

        <circle cx="100" cy="100" r={radius + 14} fill="none" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 4" />
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#eef2f6" strokeWidth={strokeWidth} />

        {segments.map((seg) => {
          if (seg.value === 0) return null;
          const length = Math.max((seg.value / total) * circumference - gap, 0);
          const dashoffset = -acc;
          acc += (seg.value / total) * circumference;
          return (
            <circle
              key={seg.label}
              cx="100" cy="100" r={radius}
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

        <circle cx="100" cy="100" r={radius - strokeWidth / 2 - 6} fill="none" stroke="#f8fafc" strokeWidth="1" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="heading text-4xl font-extrabold text-slate-900 tabular-nums">{total}</span>
        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">travaux</span>
        <span className="mt-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">total</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, color, bg }: {
  label: string; value: string; note: string; icon: typeof ClipboardCheck; color: string; bg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="heading mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${bg} ${color}`}><Icon size={20} /></div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{note}</p>
    </div>
  );
}

function FeedbackModal({ work, onSaved, onClose }: { work: ApiWork; onSaved: () => void; onClose: () => void }) {
  const [decision, setDecision] = useState<FeedbackDecision | ''>('');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approved = Boolean(decision && isFeedbackApproved(decision));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!decision || !comment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addFeedback(work.id, DECISION_TO_API[decision], comment.trim());
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={44} />
          <h2 className="heading mt-4 text-2xl font-extrabold text-emerald-900">Feedback enregistré</h2>
          <p className="mt-2 text-sm text-emerald-800">Votre avis a été ajouté à l'ordre {work.code}.</p>
          <button type="button" onClick={onClose} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
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
          <p className="mt-1 text-sm text-slate-600">{work.code} · {work.title}</p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <span className="mb-2 block text-sm font-bold text-slate-800">Votre décision <b className="text-red-500">*</b></span>
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
                        ? isApproved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {dec}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">Votre observation <b className="text-red-500">*</b></span>
            <textarea
              required rows={4} value={comment} onChange={(event) => setComment(event.target.value)}
              placeholder="Qualité d'exécution, respect HSE, points à améliorer..."
              className="w-full resize-y rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
            />
          </label>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!decision || !comment.trim() || saving}
              className={`rounded-lg px-6 py-3 text-sm font-bold text-white transition ${
                approved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer le feedback'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CompletedWorkReview({ works, statusCounts, onOpenFeedback }: {
  works: ApiWork[]; statusCounts: Record<WorkStatusLabel, number>; onOpenFeedback: (work: ApiWork) => void;
}) {
  const total = (Object.keys(STATUS_COLORS) as WorkStatusLabel[]).reduce((sum, status) => sum + (statusCounts[status] ?? 0), 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="heading font-bold text-slate-900">Travaux terminés — avis encadrement</h2>
          <p className="mt-1 text-xs text-slate-500">Visible par le directeur, le sous-directeur, le chef de département et le chef de service.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">{works.length} clôturé(s)</span>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="divide-y divide-slate-100">
          {works.map((work) => (
            <div key={work.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => navigate(`orders/${work.id}`)} className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-sonatrach">{work.code}</span>
                  <PriorityBadge priority={priorityLabel(work)} />
                  <StatusBadge status={statusLabel(work)} />
                </div>
                <p className="mt-1 truncate text-sm font-bold text-slate-800">{work.title}</p>
                <p className="mt-1 text-xs text-slate-500">{work.unit ?? '—'} · {work.assigneeName ?? '—'} · {work.serviceName ?? '—'}</p>
              </button>
              <button
                type="button"
                onClick={() => onOpenFeedback(work)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <MessageSquarePlus size={16} /> Donner un feedback
              </button>
            </div>
          ))}
          {works.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun travail terminé pour le moment.</p>}
        </div>

        <div className="flex flex-col items-center justify-center gap-5 border-t border-slate-100 px-5 py-8 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">Répartition des travaux</p>
          <StatusDonut counts={statusCounts} />
          <ul className="w-full max-w-[220px] space-y-2">
            {(Object.keys(STATUS_COLORS) as WorkStatusLabel[]).map((status) => {
              const pct = total ? Math.round((statusCounts[status] / total) * 100) : 0;
              return (
                <li key={status} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${STATUS_GRADIENTS[status][0]}, ${STATUS_GRADIENTS[status][1]})` }} />
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

function PriorityOrders({ works }: { works: ApiWork[] }) {
  const priorityWorks = works.filter((w) =>
    priorityLabel(w) === 'Haute' || priorityLabel(w) === 'Critique' || statusLabel(w) === 'En retard'
  );
  return (
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
        {priorityWorks.slice(0, 4).map((work) => (
          <div
            key={work.id}
            onClick={() => navigate(`orders/${work.id}`)}
            className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-sonatrach">{work.code}</span>
                <PriorityBadge priority={priorityLabel(work)} />
              </div>
              <p className="mt-1 truncate text-sm font-bold text-slate-800">{work.title}</p>
              <p className="mt-1 text-xs text-slate-500">{work.unit ?? '—'} · {work.assigneeName ?? '—'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden w-28 sm:block">
                <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                  <span>Avancement</span><span>{work.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sonatrach" style={{ width: `${work.progress}%` }} />
                </div>
              </div>
              <StatusBadge status={statusLabel(work)} />
            </div>
          </div>
        ))}
        {priorityWorks.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Aucun ordre prioritaire.</p>}
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
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              item.tone === 'green' ? 'bg-emerald-500' : item.tone === 'red' ? 'bg-red-500' : item.tone === 'blue' ? 'bg-blue-500' : 'bg-sonatrach'
            }`} />
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
        <span><strong>Système nominal.</strong> Aucune alerte HSE critique.</span>
      </div>
    </section>
  );
}

function BottomStats() {
  return (
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
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function DashboardPage() {
  const user = useSyncExternalStore(subscribeSession, getSessionUser);
  const acting = useSyncExternalStore(subscribeSession, getActingInterim);
  const canReview = canReviewCompletedWork(getEffectiveRole());

  const [works, setWorks] = useState<ApiWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackWork, setFeedbackWork] = useState<ApiWork | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { works: rows } = await listWorks();
      setWorks(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const active = works.filter((w) => statusLabel(w) === 'En cours').length;
  const late = works.filter((w) => statusLabel(w) === 'En retard').length;
  const openCount = works.filter((w) => statusLabel(w) !== 'Terminé' && statusLabel(w) !== 'Annulé').length;
  // Hors intérim : seul l'initiateur réel voit sa revue.
  // En intérim : l'intérimaire ne voit que les travaux que la personne absente
  // a elle-même confiés — jamais ceux initiés par quelqu'un d'autre, même visibles dans le périmètre.
  const completed = works.filter((w) => {
    if (statusLabel(w) !== 'Terminé') return false;
    const reviewerId = acting?.delegatingUser?.id ?? user.id;
    return w.initiatorId === reviewerId;
  });
  const statusCounts = useMemo(() => {
    const counts: Record<WorkStatusLabel, number> = { 'En attente': 0, 'En cours': 0, 'Terminé': 0, 'En retard': 0 };
    works.forEach((w) => {
      const label = statusLabel(w);
      if (label !== 'Annulé') counts[label] += 1;
    });
    return counts;
  }, [works]);

  const cards = [
    { label: 'Ordres ouverts', value: String(openCount), note: `${works.length} travaux au total`, icon: ClipboardCheck, color: 'text-sonatrach', bg: 'bg-orange-50' },
    { label: 'Interventions en cours', value: String(active), note: 'Suivi en temps réel', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En retard', value: String(late), note: 'À traiter en priorité', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Disponibilité unités', value: '98.4%', note: '+0.6% ce mois', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <AppShell active="dashboard">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <InterimBanner />
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
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

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          {loading && <p className="text-sm text-slate-500">Chargement…</p>}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>

          {canReview && (
            <CompletedWorkReview works={completed} statusCounts={statusCounts} onOpenFeedback={setFeedbackWork} />
          )}

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <PriorityOrders works={works} />
            <RecentActivity />
          </div>

          <BottomStats />
        </div>
      </main>

      {feedbackWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <FeedbackModal
            work={feedbackWork}
            onSaved={() => { void refresh(); }}
            onClose={() => setFeedbackWork(null)}
          />
        </div>
      )}
    </AppShell>
  );
}