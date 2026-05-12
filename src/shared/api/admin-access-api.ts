import { http, withQuery } from '@/shared/api/http';
import { env } from '@/shared/config/env';
import type {
  AdminAccessEditor,
  AdminAccessOptions,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminNavigationItem,
  AdminSession,
  UpdateAdminUserAccessRequest,
} from '@/shared/api/types';

export const adminAccessApi = {
  login: (payload: AdminLoginRequest) =>
    http<AdminLoginResponse>(`${env.authApiBaseUrl}/admin/access/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => http<AdminSession>(`${env.authApiBaseUrl}/admin/access/me`),
  navigation: () => http<AdminNavigationItem[]>(`${env.authApiBaseUrl}/admin/access/navigation`),
  options: () => http<AdminAccessOptions>(`${env.authApiBaseUrl}/admin/access/options`),
  lookupUser: (query: string) =>
    http<AdminAccessEditor>(`${env.authApiBaseUrl}/admin/access/users/lookup${withQuery({ query })}`),
  updateUserAccess: (userId: string, payload: UpdateAdminUserAccessRequest) =>
    http<void>(`${env.authApiBaseUrl}/admin/access/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
