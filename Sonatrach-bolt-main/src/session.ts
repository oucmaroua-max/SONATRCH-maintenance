import { api, getToken, setToken } from '@/api';
import type { UserRole } from '@/types';

export type SessionUser = {
  id: string;
  name: string;
  identifier: string;
  role: UserRole;
  isAdmin: boolean;
};

const STORAGE_KEY = 'sonatrach-session';

export const USER_ROLES: UserRole[] = [
  'Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service', 'Chef de quart', 'Technicien',
];

export const MANAGEMENT_ROLES: UserRole[] = [
  'Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service',
];

// enum backend -> libellé front
const ROLE_FROM_API: Record<string, UserRole> = {
  directeur: 'Directeur',
  sous_directeur: 'Sous-directeur',
  chef_departement: 'Chef de département',
  chef_service: 'Chef de service',
  employe: 'Technicien',
};

const GUEST: SessionUser = { id: '', name: 'Invité', identifier: '', role: 'Technicien', isAdmin: false };

type ApiUser = { id: string; name: string; username: string; role: string | null; isAdmin: boolean };

function toSessionUser(u: ApiUser): SessionUser {
  return {
    id: u.id,
    name: u.name,
    identifier: u.username,
    role: (u.role && ROLE_FROM_API[u.role]) || 'Technicien',
    isAdmin: u.isAdmin,
  };
}

function load(): SessionUser {
  if (!getToken()) return GUEST;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SessionUser | null;
    return parsed?.id ? parsed : GUEST;
  } catch {
    return GUEST;
  }
}

let user = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setUser(next: SessionUser) {
  user = next;
  if (next.id) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSessionUser = () => user;
export const isLoggedIn = () => Boolean(getToken()) && user.id !== '';

export async function login(identifier: string, password: string) {
  const data = await api<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  setToken(data.token);
  setUser(toSessionUser(data.user));
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    /* on déconnecte quand même côté client */
  }
  setToken(null);
  setUser(GUEST);
}

// Au démarrage : vérifie que le token est encore valide et rafraîchit l'utilisateur
export async function refreshSession() {
  if (!getToken()) return;
  try {
    const { user: u } = await api<{ user: ApiUser }>('/api/auth/me');
    setUser(toSessionUser(u));
  } catch {
    /* le 401 est déjà géré dans api() */
  }
}

export function canReviewCompletedWork(role: UserRole = user.role) {
  return MANAGEMENT_ROLES.includes(role);
}

export function userInitials(name: string) {
  return name
    .replace(/^Ing\.\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}