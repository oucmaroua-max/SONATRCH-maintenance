import { api } from '@/api';
import type { ApiWork } from '@/workTypes';

export const listWorks = () => api<{ works: ApiWork[]; actingInterim: { id: string; delegatingName: string } | null }>('/api/works');
export const getWork = (id: string) => api<{ work: ApiWork; feedbacks: any[] }>(`/api/works/${id}`);
export const listAssignableUsers = (filters?: { sousDirectionAbrv?: string; departementAbrv?: string; serviceAbrv?: string }) => {
  const params = new URLSearchParams();
  if (filters?.sousDirectionAbrv) params.set('sousDirectionAbrv', filters.sousDirectionAbrv);
  if (filters?.departementAbrv) params.set('departementAbrv', filters.departementAbrv);
  if (filters?.serviceAbrv) params.set('serviceAbrv', filters.serviceAbrv);
  const qs = params.toString();
  return api<{ id: string; name: string; role: string }[]>(`/api/works/assignable-users${qs ? `?${qs}` : ''}`);
};
export const createWork = (body: Record<string, unknown>) => api<ApiWork>('/api/works', { method: 'POST', body: JSON.stringify(body) });
export const updateWork = (id: string, body: Record<string, unknown>) => api<ApiWork>(`/api/works/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const addFeedback = (id: string, decision: string, comment: string) =>
  api(`/api/works/${id}/feedback`, { method: 'POST', body: JSON.stringify({ decision, comment }) });