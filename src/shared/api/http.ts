import { env } from '@/shared/config/env';
import type { ApiResponse } from '@/shared/api/types';
import { HttpError, type HttpErrorDetails } from '@/shared/api/http-error';

function extractValidationDetails(source: unknown): HttpErrorDetails[] {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source
      .flatMap((item) => {
        if (typeof item === 'string') {
          return [{ message: item }];
        }

        if (typeof item === 'object' && item !== null) {
          const candidate = item as { field?: unknown; message?: unknown; messages?: unknown };
          if (typeof candidate.message === 'string') {
            return [{ field: typeof candidate.field === 'string' ? candidate.field : undefined, message: candidate.message }];
          }

          if (Array.isArray(candidate.messages)) {
            return candidate.messages
              .filter((message): message is string => typeof message === 'string')
              .map((message) => ({ field: typeof candidate.field === 'string' ? candidate.field : undefined, message }));
          }
        }

        return [];
      })
      .filter((item) => item.message.trim().length > 0);
  }

  if (typeof source === 'object') {
    return Object.entries(source as Record<string, unknown>).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value
          .filter((item): item is string => typeof item === 'string')
          .map((message) => ({ field, message }));
      }

      if (typeof value === 'string') {
        return [{ field, message: value }];
      }

      return [];
    });
  }

  return [];
}

async function readPayload(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ApiResponse<unknown> | Record<string, unknown>;
  } catch {
    return raw;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await readPayload(response);
  const apiPayload = typeof payload === 'object' && payload !== null ? (payload as ApiResponse<T>) : null;

  const fallbackError =
    typeof payload === 'object' && payload !== null
      ? ('details' in payload && typeof payload.details === 'string'
          ? payload.details
          : 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : undefined)
      : undefined;

  const validationDetails = extractValidationDetails(
    apiPayload?.error?.data ??
      (typeof payload === 'object' && payload !== null && 'errors' in payload ? (payload as { errors?: unknown }).errors : null),
  );

  if (!response.ok || apiPayload?.error) {
    throw new HttpError(
      apiPayload?.error?.description ??
        fallbackError ??
        (validationDetails.length > 0 ? 'Пожалуйста, исправьте данные формы и попробуйте ещё раз.' : `Request failed with status ${response.status}`),
      {
        status: response.status,
        code: apiPayload?.error?.code,
        details: validationDetails,
      },
    );
  }

  return apiPayload?.data as T;
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
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
