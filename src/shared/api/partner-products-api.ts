import { http, withQuery } from '@/shared/api/http';
import type { AdminPagedResult, PartnerProduct } from '@/shared/api/types';

export const partnerProductsApi = {
  list: (request: { page?: number; pageSize?: number } = {}) =>
    http<AdminPagedResult<PartnerProduct>>(
      `/public/pProducts${withQuery({ page: request.page ?? 1, pageSize: request.pageSize ?? 20 })}`,
    ),
  invalidateCacheRegion: () => http<void>('/admin/pProducts/invalidate-cache-region'),
};
