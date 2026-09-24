const TOKEN_KEY = 'sonatrach-token';
const USER_KEY = 'sonatrach-session';
const ACTING_KEY = 'sonatrach-acting-interim';
export const getActingInterimId = () => localStorage.getItem(ACTING_KEY);
export const setActingInterimId = (id: string | null) =>
  id ? localStorage.setItem(ACTING_KEY, id) : localStorage.removeItem(ACTING_KEY);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
     ...(token ? { Authorization: `Bearer ${token}` } : {}),
     ...(getActingInterimId() ? { 'X-Acting-Interim': getActingInterimId()! } : {}),
     ...init.headers,
      },
    });
  } catch {
    throw new ApiError('Serveur injoignable. Le backend est-il démarré ?', 0);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));

  // Session expirée / révoquée : on nettoie et on renvoie vers le login
  if (res.status === 401 && token && !path.includes('/auth/login')) {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }

  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Erreur ${res.status}`, res.status);
  return data as T;
}