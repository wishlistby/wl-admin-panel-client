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
import {
  attributeDataTypeEnum,
  mediaTypeEnum,
  productCollectionTypeEnum,
  productRelationTypeEnum,
  productStatusEnum,
  productVisibilityEnum,
  seoLandingPageTypeEnum,
} from '@/shared/api/catalog-enums';
import { http, withQuery } from '@/shared/api/http';

type Id = string;

function normalizeAttributePayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    dataType: attributeDataTypeEnum.toApi(payload.dataType as string | number | undefined),
  };
}

function normalizeCollectionPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    collectionType: productCollectionTypeEnum.toApi(payload.collectionType as string | number | undefined),
  };
}

function normalizeSeoPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    pageType: seoLandingPageTypeEnum.toApi(payload.pageType as string | number | undefined),
  };
}

function normalizeProductPayload(
  payload: Record<string, unknown> & {
    product?: Record<string, unknown>;
    productMedia?: Record<string, unknown>[];
    relations?: Record<string, unknown>[];
    variants?: Array<Record<string, unknown> & { media?: Record<string, unknown>[] }>;
  },
) {
  return {
    ...payload,
    product: {
      ...payload.product,
      status: productStatusEnum.toApi(payload.product?.status as string | number | null | undefined),
      visibility: productVisibilityEnum.toApi(payload.product?.visibility as string | number | null | undefined),
    },
    productMedia: (payload.productMedia ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      mediaType: mediaTypeEnum.toApi(item.mediaType as string | number | undefined),
    })),
    relations: (payload.relations ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      relationType: productRelationTypeEnum.toApi(item.relationType as string | number | undefined),
    })),
    variants: (payload.variants ?? []).map((variant) => ({
      ...variant,
      media: (variant.media ?? []).map((item: Record<string, unknown>) => ({
        ...item,
        mediaType: mediaTypeEnum.toApi(item.mediaType as string | number | undefined),
      })),
    })),
  };
}

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
    create: (payload: Record<string, unknown>) =>
      http<Id>('/admin/catalog/structure/attribute-definitions', {
        method: 'POST',
        body: JSON.stringify(normalizeAttributePayload(payload)),
      }),
    update: (id: Id, payload: Record<string, unknown>) =>
      http<void>(`/admin/catalog/structure/attribute-definitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalizeAttributePayload(payload)),
      }),
    replaceOptions: (id: Id, payload: Record<string, unknown>[]) =>
      http<void>(`/admin/catalog/structure/attribute-definitions/${id}/options`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
};

export const productsApi = {
  list: (request: Partial<AdminListRequest> = {}) =>
    http<AdminPagedResult<CatalogProductListItem>>(`/admin/catalog/products${listQuery(request)}`),
  getEditor: (id: Id) => http<CatalogProductEditor>(`/admin/catalog/products/${id}`),
  create: (payload: Record<string, unknown>) =>
    http<Id>('/admin/catalog/products', { method: 'POST', body: JSON.stringify(normalizeProductPayload(payload)) }),
  update: (envelope: MutationEnvelope<Record<string, unknown>>) =>
    http<Id>(`/admin/catalog/products/${envelope.id}`, {
      method: 'PUT',
      body: JSON.stringify(normalizeProductPayload(envelope.payload)),
    }),
  remove: (id: Id) => http<void>(`/admin/catalog/products/${id}`, { method: 'DELETE' }),
};

export const marketingApi = {
  collections: {
    ...createCrud<ProductCollection, Record<string, unknown>>('/admin/catalog/marketing/collections'),
    getDetail: (id: Id) => http<ProductCollectionDetail>(`/admin/catalog/marketing/collections/${id}`),
    create: (payload: Record<string, unknown>) =>
      http<Id>('/admin/catalog/marketing/collections', {
        method: 'POST',
        body: JSON.stringify(normalizeCollectionPayload(payload)),
      }),
    update: (id: Id, payload: Record<string, unknown>) =>
      http<void>(`/admin/catalog/marketing/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalizeCollectionPayload(payload)),
      }),
  },
  seo: {
    ...createCrud<SeoLandingPage, Record<string, unknown>>('/admin/catalog/marketing/seo-landing-pages'),
    create: (payload: Record<string, unknown>) =>
      http<Id>('/admin/catalog/marketing/seo-landing-pages', {
        method: 'POST',
        body: JSON.stringify(normalizeSeoPayload(payload)),
      }),
    update: (id: Id, payload: Record<string, unknown>) =>
      http<void>(`/admin/catalog/marketing/seo-landing-pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalizeSeoPayload(payload)),
      }),
  },
  synonyms: createCrud<SearchSynonym, Record<string, unknown>>('/admin/catalog/marketing/search-synonyms'),
  redirects: createCrud<SearchRedirect, Record<string, unknown>>('/admin/catalog/marketing/search-redirects'),
};
