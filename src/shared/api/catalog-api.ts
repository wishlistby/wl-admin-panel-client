import type {
  AdminListRequest,
  AdminPagedResult,
  AttributeDefinition,
  AttributeDefinitionDetail,
  AttributeGroup,
  AttributeGroupDetail,
  Brand,
  CatalogBootstrap,
  CatalogCategoryDetail,
  CatalogCategoryNode,
  CatalogProductEditor,
  CatalogProductListItem,
  MutationEnvelope,
  PriceList,
  ProductCollection,
  ProductCollectionDetail,
  ProductType,
  ProductTypeDetail,
  SearchRedirect,
  SearchSynonym,
  SeoLandingPage,
  Tag,
  Warehouse,
} from '@/shared/api/types';
import { http, withQuery } from '@/shared/api/http';

type Id = string;

export const listQuery = (request: Partial<AdminListRequest>) =>
  withQuery({
    page: request.page ?? 1,
    pageSize: request.pageSize ?? 50,
    search: request.search,
    includeInactive: request.includeInactive ?? true,
  });

function createCrud<T, TMutation>(basePath: string) {
  return {
    list: (request: Partial<AdminListRequest> = {}) =>
      http<AdminPagedResult<T>>(`${basePath}${listQuery(request)}`),
    getById: (id: Id) => http<T>(`${basePath}/${id}`),
    create: (payload: TMutation) =>
      http<Id>(basePath, { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: Id, payload: TMutation) =>
      http<void>(`${basePath}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id: Id) => http<void>(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}

export const setupApi = {
  bootstrap: () => http<CatalogBootstrap>('/admin/catalog/setup/bootstrap'),
  brands: createCrud<Brand, Record<string, unknown>>('/admin/catalog/setup/brands'),
  priceLists: createCrud<PriceList, Record<string, unknown>>('/admin/catalog/setup/price-lists'),
  warehouses: createCrud<Warehouse, Record<string, unknown>>('/admin/catalog/setup/warehouses'),
  tags: createCrud<Tag, Record<string, unknown>>('/admin/catalog/setup/tags'),
};

export const structureApi = {
  categories: {
    tree: () => http<CatalogCategoryNode[]>('/admin/catalog/structure/categories'),
    getById: (id: Id) => http<CatalogCategoryDetail>(`/admin/catalog/structure/categories/${id}`),
    create: (payload: Record<string, unknown>) =>
      http<Id>('/admin/catalog/structure/categories', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: Id, payload: Record<string, unknown>) =>
      http<void>(`/admin/catalog/structure/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    replaceAttributes: (id: Id, payload: Record<string, unknown>[]) =>
      http<void>(`/admin/catalog/structure/categories/${id}/attributes`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id: Id) => http<void>(`/admin/catalog/structure/categories/${id}`, { method: 'DELETE' }),
  },
  productTypes: {
    ...createCrud<ProductType, Record<string, unknown>>('/admin/catalog/structure/product-types'),
    getDetail: (id: Id) => http<ProductTypeDetail>(`/admin/catalog/structure/product-types/${id}`),
    replaceAttributes: (id: Id, payload: Record<string, unknown>[]) =>
      http<void>(`/admin/catalog/structure/product-types/${id}/attributes`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
  attributeGroups: {
    ...createCrud<AttributeGroup, Record<string, unknown>>('/admin/catalog/structure/attribute-groups'),
    getDetail: (id: Id) => http<AttributeGroupDetail>(`/admin/catalog/structure/attribute-groups/${id}`),
  },
  attributeDefinitions: {
    ...createCrud<AttributeDefinition, Record<string, unknown>>('/admin/catalog/structure/attribute-definitions'),
    getDetail: (id: Id) => http<AttributeDefinitionDetail>(`/admin/catalog/structure/attribute-definitions/${id}`),
    replaceOptions: (id: Id, payload: Record<string, unknown>[]) =>
      http<void>(`/admin/catalog/structure/attribute-definitions/${id}/options`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
};

export const productsApi = {
  list: (request: Partial<AdminListRequest> = {}) =>
    http<AdminPagedResult<CatalogProductListItem>>(`/admin/catalog/products${listQuery(request)}`),
  getEditor: (id: Id) => http<CatalogProductEditor>(`/admin/catalog/products/${id}`),
  create: (payload: Record<string, unknown>) =>
    http<Id>('/admin/catalog/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (envelope: MutationEnvelope<Record<string, unknown>>) =>
    http<Id>(`/admin/catalog/products/${envelope.id}`, {
      method: 'PUT',
      body: JSON.stringify(envelope.payload),
    }),
  remove: (id: Id) => http<void>(`/admin/catalog/products/${id}`, { method: 'DELETE' }),
};

export const marketingApi = {
  collections: {
    ...createCrud<ProductCollection, Record<string, unknown>>('/admin/catalog/marketing/collections'),
    getDetail: (id: Id) => http<ProductCollectionDetail>(`/admin/catalog/marketing/collections/${id}`),
  },
  seo: createCrud<SeoLandingPage, Record<string, unknown>>('/admin/catalog/marketing/seo-landing-pages'),
  synonyms: createCrud<SearchSynonym, Record<string, unknown>>('/admin/catalog/marketing/search-synonyms'),
  redirects: createCrud<SearchRedirect, Record<string, unknown>>('/admin/catalog/marketing/search-redirects'),
};
