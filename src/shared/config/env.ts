const appEnv = import.meta.env.VITE_APP_ENV ?? 'development';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

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
