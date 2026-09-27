import { api } from '@/api';

export type MyProfile = {
  id: string; name: string; username: string; email: string; role: string | null; status: string;
  isAdmin: boolean; sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null;
  createdAt: string; absenceReason: string | null; absenceUntil: string | null;
};

export const getMyProfile = () => api<MyProfile>('/api/me/profile');

export const changeMyPassword = (currentPassword: string, newPassword: string) =>
  api('/api/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });

export const declareAbsence = (reason: string, endDate: string) =>
  api<MyProfile>('/api/me/declare-absence', { method: 'POST', body: JSON.stringify({ reason, endDate }) });

export const declareReturn = () => api<MyProfile>('/api/me/declare-return', { method: 'POST' });