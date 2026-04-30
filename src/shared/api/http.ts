import { env } from '@/shared/config/env';
import type { ApiResponse } from '@/shared/api/types';

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.description ?? `Request failed with status ${response.status}`);
  }

  return payload.data as T;
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  const hasBody = init?.body !== undefined && init?.body !== null;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers,
    ...init,
  });

  return parseResponse<T>(response);
}

export function withQuery(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
