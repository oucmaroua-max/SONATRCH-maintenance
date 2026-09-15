import type { Role, UserStatus } from '@/types';
import { USER_STATUS_LABELS } from '@/types';

const ROLE_STYLES: Record<Role, string> = {
  'Directeur': 'bg-orange-50 text-orange-700 border-orange-200',
  'Sous-directeur': 'bg-amber-50 text-amber-700 border-amber-200',
  'Chef de département': 'bg-blue-50 text-blue-700 border-blue-200',
  'Chef de service': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Employé': 'bg-slate-100 text-slate-600 border-slate-200',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

const STATUS_STYLES: Record<UserStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_DOTS: Record<UserStatus, string> = {
  pending: 'bg-amber-500',
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  suspended: 'bg-red-500',
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]}`} />
      {USER_STATUS_LABELS[status]}
    </span>
  );
}
