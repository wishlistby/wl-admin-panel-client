export type Guid = string;

export interface ApiError {
  code?: string;
  description?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  statusCode?: number;
}

export interface BaseEntity {
  id: Guid;
  startDate: string;
  lastUpdate: string;
  isActive: boolean;
}

export interface AdminPagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminListRequest {
  page: number;
  pageSize: number;
  search?: string;
  includeInactive: boolean;
}

export interface Brand extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
  isIndexable: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface PriceList extends BaseEntity {
  name: string;
  code: string;
  currency: string;
  customerGroupCode?: string | null;
  isDefault: boolean;
}

export interface Warehouse extends BaseEntity {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isDefault: boolean;
}

export interface Tag extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  isIndexable: boolean;
}

export interface CatalogCategory extends BaseEntity {
  parentId?: Guid | null;
  name: string;
  slug: string;
  fullPath: string;
  depth: number;
  sortOrder: number;
  isIndexable: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  seoText?: string | null;
  canonicalUrl?: string | null;
}

export interface CatalogCategoryNode {
  id: Guid;
  parentId?: Guid | null;
  name: string;
  slug: string;
  fullPath: string;
  depth: number;
  sortOrder: number;
  isIndexable: boolean;
  isActive: boolean;
  children: CatalogCategoryNode[];
}

export interface CategoryAttribute extends BaseEntity {
  catalogCategoryId: Guid;
  attributeDefinitionId: Guid;
  isVisibleInFilter: boolean;
  isExpandedByDefault: boolean;
  isSeoRelevant: boolean;
  sortOrder: number;
}

export interface ProductType extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProductTypeAttribute extends BaseEntity {
  productTypeId: Guid;
  attributeDefinitionId: Guid;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
}

export type AttributeDataType = 'Text' | 'Number' | 'Boolean' | 'Date' | 'Option' | 'MultiOption' | 'Json';

export interface AttributeGroup extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface AttributeDefinition extends BaseEntity {
  attributeGroupId: Guid;
  code: string;
  name: string;
  description?: string | null;
  dataType: AttributeDataType;
  unit?: string | null;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isVariantDefining: boolean;
  isRequired: boolean;
  sortOrder: number;
}

export interface AttributeOption extends BaseEntity {
  attributeDefinitionId: Guid;
  value: string;
  slug: string;
  sortOrder: number;
}

export type ProductStatus = string;
export type ProductVisibility = string;
export type ProductCollectionType = string;
export type MediaType = string;
export type ProductRelationType = string;
export type SeoLandingPageType = string;

export interface ProductCollection extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  collectionType: ProductCollectionType;
  isIndexable: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  seoText?: string | null;
}

export interface ProductCollectionItem extends BaseEntity {
  productCollectionId: Guid;
  productId: Guid;
  sortOrder: number;
}

export interface SeoLandingPage extends BaseEntity {
  slug: string;
  pageType: SeoLandingPageType;
  catalogCategoryId?: Guid | null;
  brandId?: Guid | null;
  productCollectionId?: Guid | null;
  title: string;
  h1?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoText?: string | null;
  canonicalUrl?: string | null;
  isIndexable: boolean;
  filterConfigJson?: string | null;
}

export interface SearchSynonym extends BaseEntity {
  term: string;
  synonymsJson: string;
}

export interface SearchRedirect extends BaseEntity {
  searchTerm: string;
  targetUrl: string;
}

export interface Product extends BaseEntity {
  productTypeId: Guid;
  brandId?: Guid | null;
  primaryCategoryId: Guid;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  externalId?: string | null;
}

export interface ProductCategory extends BaseEntity {
  productId: Guid;
  catalogCategoryId: Guid;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductAttributeValue extends BaseEntity {
  productId: Guid;
  attributeDefinitionId: Guid;
  attributeOptionId?: Guid | null;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueJson?: string | null;
}

export interface ProductTag extends BaseEntity {
  productId: Guid;
  tagId: Guid;
}

export interface ProductRelation extends BaseEntity {
  sourceProductId: Guid;
  targetProductId: Guid;
  relationType: ProductRelationType;
  sortOrder: number;
}

export interface ProductPrice extends BaseEntity {
  productId?: Guid | null;
  productVariantId?: Guid | null;
  priceListId: Guid;
  price: number;
  oldPrice?: number | null;
  currency: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface ProductMedia extends BaseEntity {
  productId: Guid;
  productVariantId?: Guid | null;
  url: string;
  altText?: string | null;
  title?: string | null;
  mediaType: MediaType;
  sortOrder: number;
  isMain: boolean;
}

export interface ProductVariant extends BaseEntity {
  productId: Guid;
  sku: string;
  barcode?: string | null;
  name: string;
  slug?: string | null;
  price: number;
  oldPrice?: number | null;
  currency: string;
  stockQuantity: number;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface VariantAttributeValue extends BaseEntity {
  productVariantId: Guid;
  attributeDefinitionId: Guid;
  attributeOptionId?: Guid | null;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueJson?: string | null;
}

export interface InventoryStock extends BaseEntity {
  productVariantId: Guid;
  warehouseId: Guid;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface CatalogBootstrap {
  brands: Brand[];
  categories: CatalogCategoryNode[];
  productTypes: ProductTypeDetail[];
  attributeGroups: AttributeGroupDetail[];
  priceLists: PriceList[];
  warehouses: Warehouse[];
  tags: Tag[];
  collections: ProductCollection[];
}

export interface CatalogCategoryDetail {
  category: CatalogCategory;
  attributes: CategoryAttribute[];
}

export interface ProductTypeDetail {
  productType: ProductType;
  attributes: ProductTypeAttribute[];
}

export interface AttributeDefinitionDetail {
  definition: AttributeDefinition;
  options: AttributeOption[];
}

export interface AttributeGroupDetail {
  group: AttributeGroup;
  definitions: AttributeDefinitionDetail[];
}

export interface ProductCollectionDetail {
  collection: ProductCollection;
  items: ProductCollectionItem[];
}

export interface CatalogProductListItem {
  id: Guid;
  name: string;
  slug: string;
  brandName?: string | null;
  productTypeName: string;
  primaryCategoryName: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  isActive: boolean;
  variantCount: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  lastUpdate: string;
}

export interface CatalogProductVariant {
  variant: ProductVariant;
  attributes: VariantAttributeValue[];
  inventoryStocks: InventoryStock[];
  prices: ProductPrice[];
  media: ProductMedia[];
}

export interface CatalogProductEditor {
  product: Product;
  categories: ProductCategory[];
  productAttributes: ProductAttributeValue[];
  productMedia: ProductMedia[];
  productPrices: ProductPrice[];
  tags: ProductTag[];
  collections: ProductCollectionItem[];
  relations: ProductRelation[];
  variants: CatalogProductVariant[];
}

export interface MutationEnvelope<T> {
  id: Guid;
  payload: T;
}
