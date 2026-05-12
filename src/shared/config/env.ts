const appEnv = import.meta.env.VITE_APP_ENV ?? 'local';
const webshopApiBaseUrl = (import.meta.env.WEBSHOP_API_BASE_URL ?? 'http://127.0.0.1:6061').replace(/\/+$/, '');
const authApiBaseUrl = (import.meta.env.AUTH_API_BASE_URL ?? 'http://127.0.0.1:8181').replace(/\/+$/, '');

const labels: Record<string, string> = {
  local: 'Local environment',
  development: 'Development environment',
  production: 'Production environment',
};

export const env = {
  appEnv,
  webshopApiBaseUrl,
  authApiBaseUrl,
  label: labels[appEnv] ?? appEnv,
} as const;
