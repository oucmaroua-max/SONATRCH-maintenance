import { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, History, Lock, Mail, Pencil, ShieldCheck, User as UserIcon, Wrench } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';
import { RoleBadge, UserStatusBadge } from '@/components/ui/AdminBadges';
import { auditLog, userPositionHistory, users, workOrders } from '@/data';
import { getDepartmentName, getServiceName, getSubDirectionName } from '@/data';

export function AdminUserDetailPage() {
  const pathParts = window.location.pathname.split('/');
  const userId = pathParts[pathParts.length - 1];
  const user = users.find((u) => u.id === userId);

  const history = useMemo(() => userPositionHistory.filter((h) => h.user_id === userId), [userId]);
  const audit = useMemo(() => auditLog.filter((a) => a.target_user_id === userId), [userId]);
  const linkedWork = useMemo(
    () => workOrders.filter((w) => w.assignee === user?.name || w.service === getServiceName(user?.service ?? '')),
    [userId, user],
  );

  if (!user) {
    return (
      <AppShell active="admin-users">
        <main className="industrial-grid min-h-[calc(100vh-200px)]">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
            <p className="text-lg font-bold text-slate-700">Utilisateur introuvable.</p>
            <button
              onClick={() => navigate('admin-users')}
              className="mt-4 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white"
            >
              Retour à la liste
            </button>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="admin-users">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
          <button
            onClick={() => navigate('admin-users')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sonatrach"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          {/* Header card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 text-xl font-bold text-sonatrach">
                  {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="heading text-2xl font-extrabold text-slate-950">{user.name}</h1>
                    {user.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sonatrach">
                        <Lock size={10} /> Admin
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user.role} />
                    <UserStatusBadge status={user.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`admin-user-form/${user.id}`)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Pencil size={16} /> Éditer
              </button>
            </div>
          </div>

          {/* Infos */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserIcon size={18} /> Informations
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem label="Identifiant" value={user.username} mono />
              <InfoItem label="Email" value={user.email} icon={<Mail size={13} />} />
              <InfoItem label="Date de création" value={user.created_at} />
              <InfoItem label="Sous-direction" value={getSubDirectionName(user.sub_direction)} />
              <InfoItem label="Département" value={getDepartmentName(user.department)} />
              <InfoItem label="Service" value={getServiceName(user.service)} />
              {user.approved_by && <InfoItem label="Approuvé par" value={user.approved_by} />}
              {user.approved_at && <InfoItem label="Approuvé le" value={user.approved_at} />}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Historique de poste */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
                  <History size={18} /> Historique de poste
                </h2>
                <p className="mt-1 text-xs text-slate-500">Changements de rôle, service et département.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {history.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">Aucun changement enregistré.</p>
                )}
                {history.map((h) => (
                  <div key={h.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sonatrach">{h.field}</span>
                      <span className="text-[11px] text-slate-400">{h.changed_at}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{h.old_value}</span>
                      <span className="mx-2 text-slate-400">→</span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{h.new_value}</span>
                    </p>
                    <p className="mt-1.5 text-[11px] text-slate-500">Par {h.changed_by}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Journal d'audit */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
                  <ShieldCheck size={18} /> Journal d'audit
                </h2>
                <p className="mt-1 text-xs text-slate-500">Actions administratives concernant cet utilisateur.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {audit.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">Aucune action enregistrée.</p>
                )}
                {audit.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sonatrach" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">{a.action}</p>
                        <span className="text-[11px] text-slate-400">{a.performed_at}</span>
                      </div>
                      {a.details && <p className="mt-1 text-xs text-slate-500">{a.details}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">Par {a.performed_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Travaux liés */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="heading flex items-center gap-2 text-lg font-bold text-slate-900">
                <Wrench size={18} /> Travaux liés
              </h2>
              <p className="mt-1 text-xs text-slate-500">Ordres de travail où l'utilisateur est intervenant ou rattaché.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {linkedWork.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Aucun travail lié.</p>
              )}
              {linkedWork.map((w) => (
                <div
                  key={w.id}
                  onClick={() => navigate(`orders/${w.id}`)}
                  className="flex cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-orange-50/30"
                >
                  <div>
                    <span className="font-mono text-[11px] font-bold text-sonatrach">{w.id}</span>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{w.title}</p>
                    <p className="text-xs text-slate-500">{w.assignee} · {w.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">{w.status}</span>
                    <ClipboardList size={16} className="text-slate-400" />
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

function InfoItem({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {icon && <span className="mr-1.5 inline-flex align-middle text-slate-400">{icon}</span>}
        {value}
      </p>
    </div>
  );
}
