import type { Priority, WorkStatus } from '@/types';

export function StatusBadge({ status }: { status: WorkStatus }) {
  const styles: Record<WorkStatus, string> = { 'En attente': 'bg-amber-50 text-amber-700 border-amber-200', 'En cours': 'bg-blue-50 text-blue-700 border-blue-200', 'Terminé': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'En retard': 'bg-red-50 text-red-700 border-red-200' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = { Critique: 'text-red-600', Haute: 'text-orange-600', Normale: 'text-slate-500' };
  return <span className={`text-xs font-bold ${styles[priority]}`}>{priority}</span>;
}
