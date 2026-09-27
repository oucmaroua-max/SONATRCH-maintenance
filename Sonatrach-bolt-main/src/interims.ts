import { api } from '@/api';

export type Interim = {
  id: string; delegatingUserId: string; delegateUserId: string; startDate: string; endDate: string;
  reason: string | null; status: string;
  delegatingUser: { id: string; name: string; role: string } | null;
  delegateUser: { id: string; name: string; role: string } | null;
};

export const listInterims = () => api<Interim[]>('/api/interims');
export const createInterim = (body: { delegatingUserId: string; delegateUserId: string; startDate: string; endDate: string; reason?: string }) =>
  api<Interim>('/api/interims', { method: 'POST', body: JSON.stringify(body) });
export const endInterim = (id: string) => api<Interim>(`/api/interims/${id}/end`, { method: 'PATCH' });

export const requestInterim = (body: { delegateUserId: string; startDate: string; endDate: string; reason?: string }) =>
  api<Interim>('/api/interims/request', { method: 'POST', body: JSON.stringify(body) });
export const approveInterim = (id: string) => api<Interim>(`/api/interims/${id}/approve`, { method: 'PATCH' });
export const rejectInterim = (id: string) => api<Interim>(`/api/interims/${id}/reject`, { method: 'PATCH' });