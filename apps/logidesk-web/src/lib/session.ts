export type IdentityUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

export type IdentitySession = {
  user: IdentityUser;
  accessToken: string;
};

const IDENTITY_API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL ?? 'http://localhost:3633';
const ACCESS_TOKEN_KEYS = ['logiidentity.accessToken', 'logidesk.accessToken'];
const USER_KEY = 'logidesk.user';

export function readAccessToken() {
  for (const key of ACCESS_TOKEN_KEYS) {
    const value = window.sessionStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
}

export function readStoredUser(): IdentityUser | null {
  const raw = window.sessionStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as IdentityUser;
  } catch {
    window.sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeIdentitySession(session: IdentitySession) {
  for (const key of ACCESS_TOKEN_KEYS) {
    window.sessionStorage.setItem(key, session.accessToken);
  }

  window.sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearIdentitySession() {
  for (const key of ACCESS_TOKEN_KEYS) {
    window.sessionStorage.removeItem(key);
  }

  window.sessionStorage.removeItem(USER_KEY);
}

export async function refreshIdentitySession() {
  const response = await fetch(`${IDENTITY_API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    clearIdentitySession();
    return null;
  }

  const session = (await response.json()) as IdentitySession;
  storeIdentitySession(session);
  return session;
}

export async function logoutIdentitySession() {
  await fetch(`${IDENTITY_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);

  clearIdentitySession();
}

export async function getSessionAccessToken() {
  return readAccessToken() ?? (await refreshIdentitySession())?.accessToken ?? null;
}
