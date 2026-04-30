const appEnv = import.meta.env.VITE_APP_ENV ?? 'local';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:6061').replace(/\/+$/, '');

const labels: Record<string, string> = {
  local: 'Local environment',
  development: 'Development environment',
  production: 'Production environment',
};

export const env = {
  appEnv,
  apiBaseUrl,
  label: labels[appEnv] ?? appEnv,
} as const;
