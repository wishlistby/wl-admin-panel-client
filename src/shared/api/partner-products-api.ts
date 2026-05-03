import { http, withQuery } from '@/shared/api/http';
import type { AdminPagedResult, Guid, PartnerProduct, PartnerProductMutationRequest } from '@/shared/api/types';

export const partnerProductsApi = {
  list: (request: { page?: number; pageSize?: number } = {}) =>
    http<AdminPagedResult<PartnerProduct>>(
      `/public/pProducts${withQuery({ page: request.page ?? 1, pageSize: request.pageSize ?? 20 })}`,
    ),
  create: (payload: PartnerProductMutationRequest) =>
    http<Guid>('/admin/pProducts', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: Guid, payload: PartnerProductMutationRequest) =>
    http<void>(`/admin/pProducts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  removeById: (id: Guid) => http<void>(`/admin/pProducts?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  removeByName: (name: string) =>
    http<void>(`/admin/pProducts?name=${encodeURIComponent(name)}`, { method: 'DELETE' }),
  createTestBatch: () => http<Guid[]>('/admin/pProducts/test-batch', { method: 'POST' }),
  invalidateCacheRegion: () => http<void>('/admin/pProducts/invalidate-cache-region'),
};
