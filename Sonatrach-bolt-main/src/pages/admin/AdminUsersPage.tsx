import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Filter, Lock, MoreVertical, Pencil, RotateCcw, Search, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';
import { RoleBadge, UserStatusBadge } from '@/components/ui/AdminBadges';
import { users as seedUsers } from '@/data';
import { getDepartmentName, getServiceName, getSubDirectionName } from '@/data';
import type { Role, User, UserStatus } from '@/types';

const ROLES: Role[] = ['Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service', 'Employé'];
const STATUSES: UserStatus[] = ['pending', 'active', 'inactive', 'suspended'];

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [sdFilter, setSdFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [userList, setUserList] = useState<User[]>(seedUsers);

  const filtered = useMemo(() => {
    return userList.filter((u) => {
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSd = sdFilter === 'all' || u.sub_direction === sdFilter;
      return matchSearch && matchStatus && matchRole && matchSd;
    });
  }, [userList, search, statusFilter, roleFilter, sdFilter]);

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSdFilter('all');
  }

  function approveUser(id: string) {
    setUserList((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: 'active', approved_by: 'Karim Benali', approved_at: new Date().toISOString().slice(0, 10) } : u,
      ),
    );
    setMenuOpen(null);
  }

  function toggleSuspend(id: string) {
    setUserList((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' }
          : u,
      ),
    );
    setMenuOpen(null);
  }

  const pendingCount = userList.filter((u) => u.status === 'pending').length;

  return (
    <AppShell active="admin-users">
      <main className="industrial-grid min-h-[calc(100vh-200px)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-8">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">
                Administration · Sécurité & Accès
              </p>
              <h1 className="heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Gestion des utilisateurs
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {userList.length} comptes enregistrés{pendingCount > 0 && ` · ${pendingCount} en attente d'approbation`}
              </p>
            </div>
            <button
              onClick={() => navigate('admin-user-form')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-100 transition hover:bg-sonatrach-600"
            >
              <UserPlus size={17} /> Nouvel utilisateur
            </button>
          </div>

          {/* Audit banner */}
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <ShieldCheck size={20} className="shrink-0 text-blue-600" />
            <span>
              <strong>Journal d'audit actif.</strong> Toute action (création, approbation, suspension, modification) est
              tracée dans le journal d'audit administrateur.
            </span>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Recherche</span>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nom, identifiant, email..."
                    className="w-full rounded-lg border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-sonatrach focus:ring-orange-100"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Statut</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                >
                  <option value="all">Tous</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'pending' ? 'En attente' : s === 'active' ? 'Actif' : s === 'inactive' ? 'Inactif' : 'Suspendu'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Rôle</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                >
                  <option value="all">Tous</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Sous-direction</span>
                <select
                  value={sdFilter}
                  onChange={(e) => setSdFilter(e.target.value)}
                  className="w-full rounded-lg border-slate-300 text-sm focus:border-sonatrach focus:ring-orange-100"
                >
                  <option value="all">Toutes</option>
                  <option value="sd-1">Sous-direction Maintenance</option>
                  <option value="sd-2">Sous-direction Exploitation</option>
                  <option value="sd-3">Sous-direction HSE</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw size={15} /> Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Nom</th>
                    <th className="px-5 py-3.5">Identifiant</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Rôle</th>
                    <th className="px-5 py-3.5">Organisation</th>
                    <th className="px-5 py-3.5">Statut</th>
                    <th className="px-5 py-3.5">Créé le</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`admin-user-detail/${u.id}`)}
                      className="cursor-pointer transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-[11px] font-bold text-sonatrach">
                            {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            {u.is_admin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sonatrach">
                                <Lock size={9} /> Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{u.username}</td>
                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-slate-700">{getSubDirectionName(u.sub_direction)}</p>
                        <p className="text-[11px] text-slate-500">{getDepartmentName(u.department)} · {getServiceName(u.service)}</p>
                      </td>
                      <td className="px-5 py-3.5"><UserStatusBadge status={u.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{u.created_at}</td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative flex items-center justify-end gap-1">
                          {u.status === 'pending' && (
                            <button
                              onClick={() => approveUser(u.id)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                              title="Approuver"
                            >
                              <CheckCircle2 size={17} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`admin-user-form/${u.id}`)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                            title="Éditer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen === u.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-soft">
                              <button
                                onClick={() => navigate(`admin-user-detail/${u.id}`)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <ChevronRight size={14} /> Voir le détail
                              </button>
                              <button
                                onClick={() => navigate(`admin-user-form/${u.id}`)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil size={14} /> Éditer
                              </button>
                              <button
                                onClick={() => toggleSuspend(u.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {filtered.length} utilisateur(s) affiché(s) sur {userList.length}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Filter size={13} /> Filtres actifs : {[search, statusFilter, roleFilter, sdFilter].filter((f) => f && f !== 'all').length}
              </span>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
