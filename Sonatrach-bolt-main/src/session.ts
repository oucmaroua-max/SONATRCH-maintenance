import { api, getActingInterimId, getToken, setActingInterimId, setToken } from '@/api';
import type { UserRole } from '@/types';

export type SessionUser = {
  id: string; name: string; identifier: string; role: UserRole; isAdmin: boolean;
  sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null;
};
export type ActiveInterim = {
  id: string; startDate: string; endDate: string; reason: string | null;
  delegatingUser: {
    id: string; name: string; role: string;
    sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null;
  } | null;
};

const STORAGE_KEY = 'sonatrach-session';

export const USER_ROLES: UserRole[] = ['Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service', 'Chef de quart', 'Technicien'];
export const MANAGEMENT_ROLES: UserRole[] = ['Directeur', 'Sous-directeur', 'Chef de département', 'Chef de service'];

const ROLE_FROM_API: Record<string, UserRole> = {
  directeur: 'Directeur', sous_directeur: 'Sous-directeur', chef_departement: 'Chef de département',
  chef_service: 'Chef de service', employe: 'Technicien',
};
export const ROLE_TO_API: Record<string, string> = {
  'Directeur': 'directeur', 'Sous-directeur': 'sous_directeur',
  'Chef de département': 'chef_departement', 'Chef de service': 'chef_service', 'Employé': 'employe',
};

const GUEST: SessionUser = {
  id: '', name: 'Invité', identifier: '', role: 'Technicien', isAdmin: false,
  sousDirectionAbrv: null, departementAbrv: null, serviceAbrv: null,
};

type ApiUser = {
  id: string; name: string; username: string; role: string | null; isAdmin: boolean;
  sousDirectionAbrv: string | null; departementAbrv: string | null; serviceAbrv: string | null;
};

function toSessionUser(u: ApiUser): SessionUser {
  return {
    id: u.id, name: u.name, identifier: u.username,
    role: (u.role && ROLE_FROM_API[u.role]) || 'Technicien', isAdmin: u.isAdmin,
    sousDirectionAbrv: u.sousDirectionAbrv, departementAbrv: u.departementAbrv, serviceAbrv: u.serviceAbrv,
  };
}

function load(): SessionUser {
  if (!getToken()) return GUEST;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SessionUser | null;
    return parsed?.id ? parsed : GUEST;
  } catch { return GUEST; }
}

let user = load();
let activeInterims: ActiveInterim[] = [];
let actingInterimId: string | null = getActingInterimId();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setUser(next: SessionUser) {
  user = next;
  if (next.id) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribeSession(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export const getSessionUser = () => user;
export const isLoggedIn = () => Boolean(getToken()) && user.id !== '';
export const getActiveInterims = () => activeInterims;
export function getActingInterim() { return actingInterimId ? activeInterims.find((i) => i.id === actingInterimId) ?? null : null; }

export function enterInterim(id: string) { setActingInterimId(id); actingInterimId = id; emit(); }
export function exitInterim() { setActingInterimId(null); actingInterimId = null; emit(); }

// Rôle réellement utilisé (celui du délégant si intérim actif)
export function getEffectiveRole(): UserRole {
  const acting = getActingInterim();
  if (acting?.delegatingUser?.role) return ROLE_FROM_API[acting.delegatingUser.role] ?? user.role;
  return user.role;
}

// Organisation réellement utilisée (celle du délégant si intérim actif)
export function getEffectiveOrgScope() {
  const acting = getActingInterim();
  if (acting?.delegatingUser) {
    return {
      sousDirectionAbrv: acting.delegatingUser.sousDirectionAbrv,
      departementAbrv: acting.delegatingUser.departementAbrv,
      serviceAbrv: acting.delegatingUser.serviceAbrv,
    };
  }
  return { sousDirectionAbrv: user.sousDirectionAbrv, departementAbrv: user.departementAbrv, serviceAbrv: user.serviceAbrv };
}

export async function login(identifier: string, password: string) {
  const data = await api<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ identifier, password }),
  });
  setToken(data.token);
  setUser(toSessionUser(data.user));
}

export async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* déconnexion locale quand même */ }
  setToken(null);
  exitInterim();
  setUser(GUEST);
}

export async function refreshSession() {
  if (!getToken()) return;
  try {
    const data = await api<{ user: ApiUser; activeInterimsAsDelegate: ActiveInterim[] }>('/api/auth/me');
    setUser(toSessionUser(data.user));
    activeInterims = data.activeInterimsAsDelegate;
    if (actingInterimId && !activeInterims.some((i) => i.id === actingInterimId)) exitInterim();
    emit();
  } catch { /* le 401 est déjà géré dans api() */ }
}

export function canReviewCompletedWork(role: UserRole = getEffectiveRole()) {
  return MANAGEMENT_ROLES.includes(role);
}

export function userInitials(name: string) {
  return name.replace(/^Ing\.\s*/i, '').split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}