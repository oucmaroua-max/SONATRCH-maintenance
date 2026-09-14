import type { UserRole } from '@/types';

export type SessionUser = {
  name: string;
  identifier: string;
  role: UserRole;
};

const STORAGE_KEY = 'sonatrach-session';

export const USER_ROLES: UserRole[] = [
  'Directeur',
  'Sous-directeur',
  'Chef de département',
  'Chef de service',
  'Chef de quart',
  'Technicien',
];

export const MANAGEMENT_ROLES: UserRole[] = [
  'Directeur',
  'Sous-directeur',
  'Chef de département',
  'Chef de service',
];

const DEFAULT_USER: SessionUser = {
  name: 'Ing. R. Bensalem',
  identifier: 'SH-54980',
  role: 'Chef de service',
};

function load(): SessionUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER };
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.role || !USER_ROLES.includes(parsed.role)) return { ...DEFAULT_USER };
    return {
      name: parsed.name || DEFAULT_USER.name,
      identifier: parsed.identifier || DEFAULT_USER.identifier,
      role: parsed.role,
    };
  } catch {
    return { ...DEFAULT_USER };
  }
}

let user = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionUser() {
  return user;
}

export function loginUser(next: SessionUser) {
  user = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  emit();
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
