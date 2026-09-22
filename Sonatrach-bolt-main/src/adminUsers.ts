import { api } from '@/api';
import { roleFromApi, ROLE_TO_API } from '@/adminRoles';
import type { Role, User, UserStatus } from '@/types';

export type ApiUser = {
  id: string; name: string; username: string; email: string;
  role: string | null; status: UserStatus; isAdmin: boolean;
  sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null;
  createdAt: string; approvedBy: string | null; approvedAt: string | null;
};

export function toFrontUser(u: ApiUser): User {
  return {
    id: u.id, name: u.name, username: u.username, email: u.email,
    role: roleFromApi(u.role), status: u.status, is_admin: u.isAdmin,
    sub_direction: u.sousDirectionAbrv ?? '', department: u.departementAbrv ?? '', service: u.serviceAbrv ?? '',
    created_at: u.createdAt?.slice(0, 10) ?? '',
    approved_by: u.approvedBy ?? undefined,
    approved_at: u.approvedAt?.slice(0, 10),
  };
}

export const listUsers = () => api<ApiUser[]>('/api/users').then((list) => list.map(toFrontUser));

export const getUserDetail = (id: string) =>
  api<{ user: ApiUser; history: any[]; audit: any[] }>(`/api/users/${id}`)
    .then((r) => ({ user: toFrontUser(r.user), history: r.history, audit: r.audit }));

export function createUser(input: {
  name: string; username: string; email: string; password: string; role: Role; isAdmin: boolean;
  sub_direction: string; department: string; service: string;
}) {
  return api<{ user: ApiUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name, username: input.username, email: input.email, password: input.password,
      role: ROLE_TO_API[input.role], isAdmin: input.isAdmin,
      sousDirectionAbrv: input.sub_direction || null,
      departementAbrv: input.department || null,
      serviceAbrv: input.service || null,
    }),
  }).then((r) => toFrontUser(r.user));
}

export function resetUserPassword(id: string, password: string) {
  return api<ApiUser>(`/api/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }).then(toFrontUser);
}

export function updateUser(id: string, input: Partial<{
  name: string; email: string; role: Role; isAdmin: boolean;
  sub_direction: string; department: string; service: string;
}>) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.email !== undefined) body.email = input.email;
  if (input.role !== undefined) body.role = ROLE_TO_API[input.role];
  if (input.isAdmin !== undefined) body.isAdmin = input.isAdmin;
  if (input.sub_direction !== undefined) body.sousDirectionAbrv = input.sub_direction || null;
  if (input.department !== undefined) body.departementAbrv = input.department || null;
  if (input.service !== undefined) body.serviceAbrv = input.service || null;
  return api<ApiUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then(toFrontUser);
}

export function setUserStatus(id: string, status: UserStatus) {
  return api<ApiUser>(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then(toFrontUser);
}
