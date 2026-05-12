export interface AdminSession {
  userId: string;
  email?: string | null;
  userName?: string | null;
  role: string;
  permissions: string[];
}

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  session: AdminSession;
}

const STORAGE_KEY = 'wl-admin:auth';
const EVENT_NAME = 'wl-admin:auth-change';
let cachedRawValue: string | null = null;
let cachedAuthState: AuthState | null = null;

function isAuthState(value: unknown): value is AuthState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthState>;
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.session === 'object' &&
    candidate.session !== null &&
    typeof candidate.session.role === 'string' &&
    Array.isArray(candidate.session.permissions)
  );
}

function readStorage(): AuthState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
  if (rawValue === cachedRawValue) {
    return cachedAuthState;
  }

  cachedRawValue = rawValue;
  if (!rawValue) {
    cachedAuthState = null;
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (isAuthState(parsed)) {
      cachedAuthState = parsed;
      return parsed;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedRawValue = null;
    cachedAuthState = null;
    return null;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedRawValue = null;
    cachedAuthState = null;
    return null;
  }
}

function emit() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function getAuthState() {
  return readStorage();
}

export function getAccessToken() {
  return readStorage()?.accessToken ?? null;
}

export function setAuthState(state: AuthState) {
  const rawValue = JSON.stringify(state);
  cachedRawValue = rawValue;
  cachedAuthState = state;
  window.sessionStorage.setItem(STORAGE_KEY, rawValue);
  emit();
}

export function clearAuthState() {
  cachedRawValue = null;
  cachedAuthState = null;
  window.sessionStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribeAuthState(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

export function hasPermission(session: AdminSession | null, permission: string) {
  if (!session) {
    return false;
  }

  if (session.role === 'superAdmin') {
    return true;
  }

  return session.permissions.includes(permission);
}
