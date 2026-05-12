import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { productsApi, setupApi } from '@/shared/api/catalog-api';
import {
  attributeDataTypeEnum,
  mediaTypeEnum,
  mediaTypeValues,
  productRelationTypeEnum,
  productRelationTypeValues,
  productStatusEnum,
  productStatusValues,
  productVisibilityEnum,
  productVisibilityValues,
} from '@/shared/api/catalog-enums';
import type {
  CatalogProductEditor,
} from '@/shared/api/types';
import { HttpError } from '@/shared/api/http-error';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { useSessionState } from '@/shared/lib/session-state';
import { Tabs } from '@/shared/ui/Tabs';
import { formatCurrency, formatDate, slugify } from '@/shared/lib/format';

type ProductTab = 'overview' | 'content' | 'variants' | 'marketing';
type CategoryTreeOption = { id: string; name: string; depth: number; children: CategoryTreeOption[] };

type ProductAttributeDraft = {
  id?: string;
  attributeDefinitionId: string;
  attributeOptionId?: string | null;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueJson?: string | null;
  isActive: boolean;
};

type ProductMediaDraft = {
  id?: string;
  productId?: string;
  productVariantId?: string | null;
  url: string;
  altText?: string | null;
  title?: string | null;
  mediaType: string;
  sortOrder: number;
  isMain: boolean;
  isActive: boolean;
  startDate?: string;
  lastUpdate?: string;
};

type ProductPriceDraft = {
  id?: string;
  productVariantId?: string | null;
  priceListId: string;
  price: number;
  oldPrice?: number | null;
  currency: string;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
  startDate?: string;
  lastUpdate?: string;
};

type ProductOfferDraft = {
  id?: string;
  productId?: string;
  productVariantId?: string | null;
  shopId?: string | null;
  shop: string;
  shopUrl?: string | null;
  price: number;
  oldPrice?: number | null;
  currency: string;
  isHot: boolean;
  priority: number;
  isActive: boolean;
  startDate?: string;
  lastUpdate?: string;
};

type ProductTagDraft = {
  id?: string;
  tagId: string;
  isActive: boolean;
};

type ProductCollectionDraft = {
  id?: string;
  productCollectionId: string;
  sortOrder: number;
  isActive: boolean;
};

type ProductRelationDraft = {
  id?: string;
  targetProductId: string;
  relationType: string;
  sortOrder: number;
  isActive: boolean;
};

type InventoryStockDraft = {
  id: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isActive: boolean;
};

type ProductVariantDraft = {
  id?: string;
  productId?: string;
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
  isActive: boolean;
  startDate?: string;
  lastUpdate?: string;
  attributes: ProductAttributeDraft[];
  inventoryStocks: InventoryStockDraft[];
  prices: ProductPriceDraft[];
  media: ProductMediaDraft[];
};

type EditorState = {
  product: {
    productTypeId: string;
    brandId: string;
    primaryCategoryId: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    status: string;
    visibility: string;
    externalId: string;
    isHot: boolean;
    priority: number;
    isActive: boolean;
  };
  categories: Array<{ id: string; catalogCategoryId: string; isPrimary: boolean; sortOrder: number; isActive: boolean }>;
  productAttributes: ProductAttributeDraft[];
  productMedia: ProductMediaDraft[];
  productPrices: ProductPriceDraft[];
  offers: ProductOfferDraft[];
  tags: ProductTagDraft[];
  collections: ProductCollectionDraft[];
  relations: ProductRelationDraft[];
  variants: ProductVariantDraft[];
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useSessionState<ProductTab>('products:tab', 'overview');
  const [selectedProductId, setSelectedProductId] = useSessionState<string>('products:selected-id', '');
  const bootstrapQuery = useQuery({ queryKey: ['catalog-bootstrap'], queryFn: setupApi.bootstrap });
  const listQuery = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ page: 1, pageSize: 100, includeInactive: true, search: '' }),
  });
  const editorQuery = useQuery({
    queryKey: ['product-editor', selectedProductId],
    queryFn: () => productsApi.getEditor(selectedProductId),
    enabled: Boolean(selectedProductId),
  });

  const [state, setState, hasStoredState] = useSessionState<EditorState>('products:editor-state', createEmptyProductState);
  const skipInitialServerHydrationRef = useRef(hasStoredState);

  useEffect(() => {
    if (!editorQuery.data) return;
    if (skipInitialServerHydrationRef.current) {
      skipInitialServerHydrationRef.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(mapEditorToState(editorQuery.data));
  }, [editorQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const validationErrors = validateProductState(state);
      if (validationErrors.length > 0) {
        throw new HttpError('Проверьте заполнение товара. Есть обязательные поля, которые пока не заполнены.', {
          status: 400,
          code: 'catalog.product.validation',
          details: validationErrors,
        });
      }

      const payload = toSaveRequest(state);
      if (selectedProductId) {
        return productsApi.update({ id: selectedProductId, payload });
      }
      const id = await productsApi.create(payload);
      setSelectedProductId(id);
      return id;
    },
    meta: {
      successTitle: selectedProductId ? 'Товар обновлён' : 'Товар создан',
      successMessage: selectedProductId
        ? 'Карточка товара и связанные данные успешно сохранены.'
        : 'Новая карточка товара создана и открыта для дальнейшего редактирования.',
      errorTitle: 'Не удалось сохранить товар',
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      if (selectedProductId) {
        await queryClient.invalidateQueries({ queryKey: ['product-editor', selectedProductId] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId) {
        return;
      }

      await productsApi.remove(selectedProductId);
    },
    meta: {
      successTitle: 'Товар удалён',
      successMessage: 'Карточка товара и связанные данные удалены из каталога.',
      errorTitle: 'Не удалось удалить товар',
    },
    onSuccess: async () => {
      setSelectedProductId('');
      setState(createEmptyProductState());
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
    },
  });

  const categories = useMemo(() => flattenCategories(bootstrapQuery.data?.categories ?? []), [bootstrapQuery.data]);
  const attributeDefinitions = useMemo(
    () =>
      bootstrapQuery.data?.attributeGroups.flatMap((group) =>
        group.definitions.map((definition) => ({
          id: definition.definition.id,
          name: definition.definition.name,
          dataType: attributeDataTypeEnum.fromApi(definition.definition.dataType),
          isVariantDefining: definition.definition.isVariantDefining,
          options: definition.options,
          groupName: group.group.name,
        })),
      ) ?? [],
    [bootstrapQuery.data],
  );
  const selectedProductType = useMemo(
    () => bootstrapQuery.data?.productTypes.find((item) => item.productType.id === state.product.productTypeId),
    [bootstrapQuery.data, state.product.productTypeId],
  );
  const allowedAttributeIds = useMemo(
    () => new Set(selectedProductType?.attributes.map((item) => item.attributeDefinitionId) ?? []),
    [selectedProductType],
  );
  const productAttributeDefinitions = useMemo(
    () => attributeDefinitions.filter((item) => allowedAttributeIds.has(item.id) && !item.isVariantDefining),
    [allowedAttributeIds, attributeDefinitions],
  );
  const variantAttributeDefinitions = useMemo(
    () => attributeDefinitions.filter((item) => allowedAttributeIds.has(item.id) && item.isVariantDefining),
    [allowedAttributeIds, attributeDefinitions],
  );

  return (
    <div className="grid-split products-workspace">
      <Card
        title="Список товаров"
        description="Выбери карточку для редактирования или создай новую с нуля."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              skipInitialServerHydrationRef.current = false;
              setSelectedProductId('');
              setState(createEmptyProductState());
            }}
          >
            <Plus size={16} />
            <span>Новый товар</span>
          </Button>
        }
      >
        <div className="stack-list">
          {listQuery.data?.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`selection-row product-row ${selectedProductId === item.id ? 'is-active' : ''}`}
              onClick={() => {
                skipInitialServerHydrationRef.current = false;
                setSelectedProductId(item.id);
              }}
            >
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.productTypeName} · {item.primaryCategoryName}
                </span>
              </div>
              <div className="product-row-meta">
                <small>{item.variantCount} SKU</small>
                <small>{formatCurrency(item.minPrice ?? item.maxPrice)}</small>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="page-stack">
        <Card
          className="tabs-shell-card"
          title={state.product.name || 'Новая карточка товара'}
          description="Одна форма управляет карточкой, SKU, ценами, остатками, медиа и маркетинговыми связями."
          actions={
            <div className="toolbar">
              {selectedProductId && (
                <Button
                  variant="danger"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Удаляем...' : 'Удалить'}
                </Button>
              )}
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Сохраняем...' : 'Сохранить товар'}
              </Button>
            </div>
          }
        >
          <Tabs
            activeId={tab}
            onChange={(value) => setTab(value as ProductTab)}
            items={[
              {
                id: 'overview',
                label: 'Карточка',
                help: {
                  short: 'Раздел для общей карточки товара: тип, бренд, категория, описания, статус и видимость.',
                  sectionId: 'product-card',
                  linkLabel: 'Читать про карточку товара',
                },
              },
              {
                id: 'content',
                label: 'Контент и цены',
                help: {
                  short: 'Здесь живут общие атрибуты, медиа и прайс-листовые цены, которые дополняют товарный каркас.',
                  sectionId: 'pricing',
                  linkLabel: 'Читать про цены и контент',
                },
              },
              {
                id: 'variants',
                label: 'SKU и остатки',
                count: state.variants.length,
                help: {
                  short: 'Раздел для конкретных вариантов товара: SKU, variant-атрибуты, доступность, склад и логистика.',
                  sectionId: 'inventory',
                  linkLabel: 'Читать про SKU и склад',
                },
              },
              {
                id: 'marketing',
                label: 'Маркетинг',
                help: {
                  short: 'Подборки, теги и связи товаров помогают продвигать карточку и управлять витринными сценариями.',
                  sectionId: 'marketing',
                  linkLabel: 'Читать про маркетинг',
                },
              },
            ]}
          />
        </Card>

        {tab === 'overview' && (
          <Card title="Основа карточки" description="Бизнес-контекст товара: тип, бренд, категория, описания и публикация.">
            <div className="form-grid form-grid-2">
              <TextField
                required
                label="Название товара"
                value={state.product.name}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    product: {
                      ...prev.product,
                      name: event.target.value,
                      slug: slugify(event.target.value),
                    },
                  }))
                }
              />
              <TextField required label="Slug" value={state.product.slug} onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, slug: event.target.value } }))} />
              <SelectField
                required
                label="Тип товара"
                value={state.product.productTypeId}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, productTypeId: event.target.value } }))}
                options={[
                  { value: '', label: 'Выбери тип товара' },
                  ...(bootstrapQuery.data?.productTypes.map((item) => ({ value: item.productType.id, label: item.productType.name })) ?? []),
                ]}
              />
              <SelectField
                label="Бренд"
                value={state.product.brandId}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, brandId: event.target.value } }))}
                options={[
                  { value: '', label: 'Без бренда' },
                  ...(bootstrapQuery.data?.brands.map((item) => ({ value: item.id, label: item.name })) ?? []),
                ]}
              />
              <SelectField
                required
                label="Основная категория"
                value={state.product.primaryCategoryId}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, primaryCategoryId: event.target.value } }))}
                options={[
                  { value: '', label: 'Выбери категорию' },
                  ...categories.map((item) => ({ value: item.id, label: `${'· '.repeat(item.depth)}${item.name}` })),
                ]}
              />
              <TextField label="External ID" value={state.product.externalId} onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, externalId: event.target.value } }))} />
              <SelectField
                label="Статус"
                value={state.product.status}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, status: event.target.value } }))}
                options={productStatusValues.map((value) => ({ value, label: value }))}
              />
              <SelectField
                label="Видимость"
                value={state.product.visibility}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, visibility: event.target.value } }))}
                options={productVisibilityValues.map((value) => ({ value, label: value }))}
              />
              <TextAreaField className="field-span-2" label="Короткое описание" rows={3} value={state.product.shortDescription} onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, shortDescription: event.target.value } }))} />
              <TextAreaField className="field-span-2" label="Полное описание" rows={6} value={state.product.description} onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, description: event.target.value } }))} />
              <CheckboxField label="Товар активен" checked={state.product.isActive} onChange={(value) => setState((prev) => ({ ...prev, product: { ...prev.product, isActive: value } }))} />
            </div>

            <Card title="Размещение по категориям" className="inner-card">
              <div className="chip-grid">
                {categories.map((category) => {
                  const selected = state.categories.some((item) => item.catalogCategoryId === category.id);
                  return (
                    <label key={category.id} className={`choice-chip ${selected ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            categories: event.target.checked
                              ? [
                                  ...prev.categories,
                                  {
                                    id: crypto.randomUUID(),
                                    catalogCategoryId: category.id,
                                    isPrimary: prev.categories.length === 0,
                                    sortOrder: prev.categories.length + 1,
                                    isActive: true,
                                  },
                                ]
                              : prev.categories.filter((item) => item.catalogCategoryId !== category.id),
                          }))
                        }
                      />
                      <span>{`${'· '.repeat(category.depth)}${category.name}`}</span>
                    </label>
                  );
                })}
              </div>
            </Card>
          </Card>
        )}

        {tab === 'content' && (
          <div className="page-stack">
            <Card title="Атрибуты товара" description="Общие свойства карточки, которые не меняются между SKU.">
              <AttributeEditor
                items={state.productAttributes}
                onChange={(items) => setState((prev) => ({ ...prev, productAttributes: items }))}
                definitions={productAttributeDefinitions}
                scope="product"
              />
            </Card>
            <Card title="Медиа карточки" description="Общие изображения и файлы товара.">
              <MediaEditor items={state.productMedia} onChange={(items) => setState((prev) => ({ ...prev, productMedia: items }))} />
            </Card>
            <Card title="Цены карточки" description="Используй только если цена задаётся на уровне всей карточки, а не SKU.">
              <PriceEditor
                items={state.productPrices}
                onChange={(items) => setState((prev) => ({ ...prev, productPrices: items }))}
                priceLists={bootstrapQuery.data?.priceLists ?? []}
              />
            </Card>
            <Card title="Предложения магазинов" description="Один товар может продаваться в нескольких магазинах с разной ценой, ссылкой и приоритетом.">
              <OfferEditor
                items={state.offers}
                variants={state.variants}
                onChange={(items) => setState((prev) => ({ ...prev, offers: items }))}
              />
            </Card>
          </div>
        )}

        {tab === 'variants' && (
          <div className="page-stack">
            {state.variants.map((variant, index) => (
              <Card
                key={variant.id || index}
                title={variant.name || `SKU ${index + 1}`}
                description={`SKU ${variant.sku || 'без артикула'} · обновлено ${variant.lastUpdate ? formatDate(variant.lastUpdate) : 'ещё не сохранён'}`}
                actions={
                  <Button
                    variant="danger"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        variants: prev.variants.filter((_, current) => current !== index),
                      }))
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                }
              >
                <div className="form-grid form-grid-3">
                  <TextField required label="Название SKU" value={String(variant.name ?? '')} onChange={(event) => updateVariant(index, { name: event.target.value }, setState)} />
                  <TextField required label="SKU" value={String(variant.sku ?? '')} onChange={(event) => updateVariant(index, { sku: event.target.value }, setState)} />
                  <TextField label="Barcode" value={String(variant.barcode ?? '')} onChange={(event) => updateVariant(index, { barcode: event.target.value }, setState)} />
                  <TextField label="Slug" value={String(variant.slug ?? '')} onChange={(event) => updateVariant(index, { slug: event.target.value }, setState)} />
                  <TextField label="Price" type="number" value={String(variant.price)} onChange={(event) => updateVariant(index, { price: Number(event.target.value) }, setState)} />
                  <TextField label="Old price" type="number" value={String(variant.oldPrice ?? '')} onChange={(event) => updateVariant(index, { oldPrice: Number(event.target.value) || null }, setState)} />
                  <TextField required label="Currency" value={String(variant.currency ?? '')} onChange={(event) => updateVariant(index, { currency: event.target.value.toUpperCase() }, setState)} />
                  <TextField label="Stock quantity" type="number" value={String(variant.stockQuantity)} onChange={(event) => updateVariant(index, { stockQuantity: Number(event.target.value) }, setState)} />
                  <TextField label="Weight" type="number" value={String(variant.weight ?? '')} onChange={(event) => updateVariant(index, { weight: Number(event.target.value) || null }, setState)} />
                  <TextField label="Width" type="number" value={String(variant.width ?? '')} onChange={(event) => updateVariant(index, { width: Number(event.target.value) || null }, setState)} />
                  <TextField label="Height" type="number" value={String(variant.height ?? '')} onChange={(event) => updateVariant(index, { height: Number(event.target.value) || null }, setState)} />
                  <TextField label="Depth" type="number" value={String(variant.depth ?? '')} onChange={(event) => updateVariant(index, { depth: Number(event.target.value) || null }, setState)} />
                  <CheckboxField label="SKU по умолчанию" checked={variant.isDefault} onChange={(value) => updateVariant(index, { isDefault: value }, setState)} />
                  <CheckboxField label="Доступен к покупке" checked={variant.isAvailable} onChange={(value) => updateVariant(index, { isAvailable: value }, setState)} />
                  <CheckboxField label="Активен" checked={variant.isActive} onChange={(value) => updateVariant(index, { isActive: value }, setState)} />
                </div>

                <Card title="Variant attributes" className="inner-card">
                  <AttributeEditor items={variant.attributes} onChange={(items) => updateVariant(index, { attributes: items }, setState)} definitions={variantAttributeDefinitions} scope="variant" />
                </Card>
                <Card title="Остатки по складам" className="inner-card">
                  <InventoryEditor
                    items={variant.inventoryStocks}
                    onChange={(items) => updateVariant(index, { inventoryStocks: items }, setState)}
                    warehouses={bootstrapQuery.data?.warehouses ?? []}
                  />
                </Card>
                <Card title="Цены SKU" className="inner-card">
                  <PriceEditor
                    items={variant.prices}
                    onChange={(items) => updateVariant(index, { prices: items }, setState)}
                    priceLists={bootstrapQuery.data?.priceLists ?? []}
                  />
                </Card>
                <Card title="Медиа SKU" className="inner-card">
                  <MediaEditor items={variant.media} onChange={(items) => updateVariant(index, { media: items }, setState)} />
                </Card>
              </Card>
            ))}

            <Button
              variant="secondary"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  variants: [...prev.variants, createEmptyVariantState()],
                }))
              }
            >
              Добавить SKU
            </Button>
          </div>
        )}

        {tab === 'marketing' && (
          <div className="page-stack">
            <Card title="Теги" description="Быстрая мягкая классификация товара.">
              <div className="chip-grid">
                {(bootstrapQuery.data?.tags ?? []).map((tag) => {
                  const selected = state.tags.some((item) => item.tagId === tag.id);
                  return (
                    <label key={tag.id} className={`choice-chip ${selected ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          setState((prev) => ({
                            ...prev,
                            tags: event.target.checked
                              ? [...prev.tags, { id: crypto.randomUUID(), tagId: tag.id, isActive: true }]
                              : prev.tags.filter((item) => item.tagId !== tag.id),
                          }))
                        }
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            </Card>

            <Card title="Подборки" description="Ручные витрины и маркетинговые коллекции.">
              <div className="stack-list compact">
                {state.collections.map((item, index) => (
                  <div key={item.id || index} className="matrix-row">
                    <SelectField
                      label="Подборка"
                      value={item.productCollectionId}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          collections: prev.collections.map((entry, current) =>
                            current === index ? { ...entry, productCollectionId: event.target.value } : entry,
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Выбери подборку' },
                        ...(bootstrapQuery.data?.collections.map((entry) => ({ value: entry.id, label: entry.name })) ?? []),
                      ]}
                    />
                    <TextField
                      label="Порядок"
                      type="number"
                      value={String(item.sortOrder)}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          collections: prev.collections.map((entry, current) =>
                            current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setState((prev) => ({ ...prev, collections: [...prev.collections, { id: crypto.randomUUID(), productCollectionId: '', sortOrder: prev.collections.length + 1, isActive: true }] }))}>
                Добавить подборку
              </Button>
            </Card>

            <Card title="Связанные товары" description="Похожие, аксессуары, bundle, replacement и другие типы связей.">
              <div className="stack-list compact">
                {state.relations.map((item, index) => (
                  <div key={item.id || index} className="matrix-row">
                    <SelectField
                      label="Товар"
                      value={item.targetProductId}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          relations: prev.relations.map((entry, current) =>
                            current === index ? { ...entry, targetProductId: event.target.value } : entry,
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Выбери товар' },
                        ...(listQuery.data?.items.map((entry) => ({ value: entry.id, label: entry.name })) ?? []),
                      ]}
                    />
                    <SelectField
                      label="Тип связи"
                      value={item.relationType}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          relations: prev.relations.map((entry, current) =>
                            current === index ? { ...entry, relationType: event.target.value } : entry,
                          ),
                        }))
                      }
                      options={productRelationTypeValues.map((value) => ({ value, label: value }))}
                    />
                    <TextField
                      label="Порядок"
                      type="number"
                      value={String(item.sortOrder)}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          relations: prev.relations.map((entry, current) =>
                            current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setState((prev) => ({ ...prev, relations: [...prev.relations, { id: crypto.randomUUID(), targetProductId: '', relationType: 'Accessory', sortOrder: prev.relations.length + 1, isActive: true }] }))}>
                Добавить связь
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function AttributeEditor({
  items,
  onChange,
  definitions,
  scope,
}: {
  items: ProductAttributeDraft[];
  onChange: (items: ProductAttributeDraft[]) => void;
  definitions: Array<{ id: string; name: string; dataType: string; options: Array<{ id: string; value: string }>; groupName: string }>;
  scope: 'product' | 'variant';
}) {
  return (
    <div className="stack-list compact">
      {items.map((item, index) => {
        const definition = definitions.find((entry) => entry.id === item.attributeDefinitionId);
        const dataType = definition?.dataType ?? 'Text';

        return (
          <div key={String(item.id ?? index)} className="attribute-grid">
            <SelectField
              label="Атрибут"
              value={String(item.attributeDefinitionId ?? '')}
              onChange={(event) =>
                onChange(
                  items.map((entry, current) =>
                    current === index
                      ? {
                          ...entry,
                          attributeDefinitionId: event.target.value,
                          attributeOptionId: null,
                          valueText: '',
                          valueNumber: null,
                          valueBoolean: null,
                          valueDate: null,
                          valueJson: '',
                        }
                      : entry,
                  ),
                )
              }
              options={[
                { value: '', label: scope === 'product' ? 'Выбери общий атрибут' : 'Выбери SKU-атрибут' },
                ...definitions.map((entry) => ({ value: entry.id, label: `${entry.groupName} / ${entry.name}` })),
              ]}
            />

            {(dataType === 'Option' || dataType === 'MultiOption') && (
              <SelectField
                label="Значение"
                value={String(item.attributeOptionId ?? '')}
                onChange={(event) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, attributeOptionId: event.target.value } : entry)))
                }
                options={[
                  { value: '', label: 'Выбери option' },
                  ...(definition?.options.map((option) => ({ value: option.id, label: option.value })) ?? []),
                ]}
              />
            )}

            {dataType === 'Text' && (
              <TextField
                label="Value text"
                value={String(item.valueText ?? '')}
                onChange={(event) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, valueText: event.target.value } : entry)))
                }
              />
            )}

            {dataType === 'Number' && (
              <TextField
                label="Value number"
                type="number"
                value={String(item.valueNumber ?? '')}
                onChange={(event) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, valueNumber: Number(event.target.value) || null } : entry)))
                }
              />
            )}

            {dataType === 'Boolean' && (
              <CheckboxField
                label="Value boolean"
                checked={Boolean(item.valueBoolean)}
                onChange={(value) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, valueBoolean: value } : entry)))
                }
              />
            )}

            {dataType === 'Date' && (
              <TextField
                label="Value date"
                type="datetime-local"
                value={String(item.valueDate ?? '')}
                onChange={(event) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, valueDate: event.target.value } : entry)))
                }
              />
            )}

            {dataType === 'Json' && (
              <TextAreaField
                label="Value JSON"
                rows={3}
                value={String(item.valueJson ?? '')}
                onChange={(event) =>
                  onChange(items.map((entry, current) => (current === index ? { ...entry, valueJson: event.target.value } : entry)))
                }
              />
            )}
          </div>
        );
      })}

      <Button
        variant="secondary"
        onClick={() =>
          onChange([...items, { id: crypto.randomUUID(), attributeDefinitionId: '', attributeOptionId: null, valueText: '', valueNumber: null, valueBoolean: null, valueDate: null, valueJson: '', isActive: true }])
        }
      >
        Добавить атрибут
      </Button>
    </div>
  );
}

function MediaEditor({ items, onChange }: { items: ProductMediaDraft[]; onChange: (items: ProductMediaDraft[]) => void }) {
  return (
    <div className="stack-list compact">
      {items.map((item, index) => (
        <div key={item.id || index} className="matrix-row">
          <TextField label="URL" value={item.url} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, url: event.target.value } : entry)))} />
          <TextField label="Alt text" value={item.altText ?? ''} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, altText: event.target.value } : entry)))} />
          <SelectField
            label="Тип медиа"
            value={item.mediaType}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, mediaType: event.target.value } : entry)))}
            options={mediaTypeValues.map((value) => ({ value, label: value }))}
          />
          <TextField label="Порядок" type="number" value={String(item.sortOrder)} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry)))} />
          <CheckboxField label="Основное" checked={item.isMain} onChange={(value) => onChange(items.map((entry, current) => (current === index ? { ...entry, isMain: value } : entry)))} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { id: crypto.randomUUID(), productId: '', url: '', altText: '', title: '', mediaType: 'Image', sortOrder: items.length + 1, isMain: items.length === 0, isActive: true, startDate: '', lastUpdate: '' }])}>
        Добавить медиа
      </Button>
    </div>
  );
}

function PriceEditor({
  items,
  onChange,
  priceLists,
}: {
  items: ProductPriceDraft[];
  onChange: (items: ProductPriceDraft[]) => void;
  priceLists: Array<{ id: string; name: string; currency: string }>;
}) {
  return (
    <div className="stack-list compact">
      {items.map((item, index) => (
        <div key={item.id || index} className="matrix-row">
          <SelectField
            label="Прайс-лист"
            value={item.priceListId}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, priceListId: event.target.value } : entry)))}
            options={[
              { value: '', label: 'Выбери прайс-лист' },
              ...priceLists.map((entry) => ({ value: entry.id, label: `${entry.name} (${entry.currency})` })),
            ]}
          />
          <TextField label="Цена" type="number" value={String(item.price)} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, price: Number(event.target.value) } : entry)))} />
          <TextField label="Старая цена" type="number" value={String(item.oldPrice ?? '')} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, oldPrice: Number(event.target.value) || null } : entry)))} />
          <TextField label="Валюта" value={item.currency} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, currency: event.target.value.toUpperCase() } : entry)))} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { id: crypto.randomUUID(), priceListId: '', price: 0, oldPrice: null, currency: 'RUB', isActive: true, startDate: '', lastUpdate: '' }])}>
        Добавить цену
      </Button>
    </div>
  );
}

function OfferEditor({
  items,
  variants,
  onChange,
}: {
  items: ProductOfferDraft[];
  variants: ProductVariantDraft[];
  onChange: (items: ProductOfferDraft[]) => void;
}) {
  return (
    <div className="stack-list compact">
      {items.map((item, index) => (
        <div key={item.id || index} className="matrix-row">
          <SelectField
            docKey="offer-sku"
            label="SKU"
            value={item.productVariantId ?? ''}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, productVariantId: event.target.value || null } : entry)))}
            options={[
              { value: '', label: 'Вся карточка' },
              ...variants.map((variant, variantIndex) => ({
                value: variant.id ?? '',
                label: variant.sku || variant.name || `SKU ${variantIndex + 1}`,
              })).filter((option) => option.value),
            ]}
          />
          <TextField
            docKey="offer-shop"
            required
            label="Магазин"
            value={item.shop}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, shop: event.target.value } : entry)))}
          />
          <TextField
            docKey="offer-shop-url"
            label="Ссылка магазина"
            value={item.shopUrl ?? ''}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, shopUrl: event.target.value } : entry)))}
          />
          <TextField
            docKey="offer-price"
            required
            label="Цена"
            type="number"
            value={String(item.price)}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, price: Number(event.target.value) || 0 } : entry)))}
          />
          <TextField
            docKey="offer-old-price"
            label="Старая цена"
            type="number"
            value={String(item.oldPrice ?? '')}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, oldPrice: Number(event.target.value) || null } : entry)))}
          />
          <TextField
            docKey="offer-currency"
            required
            label="Валюта"
            value={item.currency}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, currency: event.target.value.toUpperCase() } : entry)))}
          />
          <TextField
            docKey="offer-priority"
            label="Приоритет"
            type="number"
            value={String(item.priority)}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, priority: Number(event.target.value) || 0 } : entry)))}
          />
          <CheckboxField docKey="offer-hot" label="В публичной выдаче" checked={item.isHot} onChange={(value) => onChange(items.map((entry, current) => (current === index ? { ...entry, isHot: value } : entry)))} />
          <CheckboxField docKey="offer-active" label="Активно" checked={item.isActive} onChange={(value) => onChange(items.map((entry, current) => (current === index ? { ...entry, isActive: value } : entry)))} />
          <Button variant="danger" onClick={() => onChange(items.filter((_, current) => current !== index))}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, createEmptyOfferState()])}>
        Добавить предложение магазина
      </Button>
    </div>
  );
}

function InventoryEditor({
  items,
  onChange,
  warehouses,
}: {
  items: Array<{ id: string; warehouseId: string; quantity: number; reservedQuantity: number; availableQuantity: number; isActive: boolean }>;
  onChange: (items: Array<{ id: string; warehouseId: string; quantity: number; reservedQuantity: number; availableQuantity: number; isActive: boolean }>) => void;
  warehouses: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="stack-list compact">
      {items.map((item, index) => (
        <div key={item.id || index} className="matrix-row">
          <SelectField
            label="Склад"
            value={item.warehouseId}
            onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, warehouseId: event.target.value } : entry)))}
            options={[
              { value: '', label: 'Выбери склад' },
              ...warehouses.map((entry) => ({ value: entry.id, label: entry.name })),
            ]}
          />
          <TextField label="Quantity" type="number" value={String(item.quantity)} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, quantity: Number(event.target.value) } : entry)))} />
          <TextField label="Reserved" type="number" value={String(item.reservedQuantity)} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, reservedQuantity: Number(event.target.value) } : entry)))} />
          <TextField label="Available" type="number" value={String(item.availableQuantity)} onChange={(event) => onChange(items.map((entry, current) => (current === index ? { ...entry, availableQuantity: Number(event.target.value) } : entry)))} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { id: crypto.randomUUID(), warehouseId: '', quantity: 0, reservedQuantity: 0, availableQuantity: 0, isActive: true }])}>
        Добавить остаток
      </Button>
    </div>
  );
}

function createEmptyProductState() {
  return {
    product: {
      productTypeId: '',
      brandId: '',
      primaryCategoryId: '',
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      status: 'Draft',
      visibility: 'Visible',
      externalId: '',
      isHot: false,
      priority: 0,
      isActive: true,
    },
    categories: [] as Array<{ id: string; catalogCategoryId: string; isPrimary: boolean; sortOrder: number; isActive: boolean }>,
    productAttributes: [] as ProductAttributeDraft[],
    productMedia: [] as ProductMediaDraft[],
    productPrices: [] as ProductPriceDraft[],
    offers: [] as ProductOfferDraft[],
    tags: [] as ProductTagDraft[],
    collections: [] as ProductCollectionDraft[],
    relations: [] as ProductRelationDraft[],
    variants: [] as ProductVariantDraft[],
  };
}

function mapEditorToState(editor: CatalogProductEditor): EditorState {
  return {
    product: {
      productTypeId: editor.product.productTypeId,
      brandId: editor.product.brandId ?? '',
      primaryCategoryId: editor.product.primaryCategoryId,
      name: editor.product.name,
      slug: editor.product.slug,
      shortDescription: editor.product.shortDescription ?? '',
      description: editor.product.description ?? '',
      status: productStatusEnum.fromApi(editor.product.status),
      visibility: productVisibilityEnum.fromApi(editor.product.visibility),
      externalId: editor.product.externalId ?? '',
      isHot: editor.product.isHot ?? false,
      priority: editor.product.priority ?? 0,
      isActive: editor.product.isActive,
    },
    categories: editor.categories.map((item) => ({
      id: item.id,
      catalogCategoryId: item.catalogCategoryId,
      isPrimary: item.isPrimary,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    productAttributes: editor.productAttributes.map((item) => ({
      ...item,
    })) as ProductAttributeDraft[],
    productMedia: editor.productMedia.map((media) => ({
      ...media,
      mediaType: mediaTypeEnum.fromApi(media.mediaType),
    })) as ProductMediaDraft[],
    productPrices: editor.productPrices.map((item) => ({ ...item })) as ProductPriceDraft[],
    offers: (editor.offers ?? []).map((item) => ({ ...item })) as ProductOfferDraft[],
    tags: editor.tags.map((item) => ({ ...item })) as ProductTagDraft[],
    collections: editor.collections.map((item) => ({
      id: item.id,
      productCollectionId: item.productCollectionId,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })) as ProductCollectionDraft[],
    relations: editor.relations.map((relation) => ({
      ...relation,
      relationType: productRelationTypeEnum.fromApi(relation.relationType),
    })) as ProductRelationDraft[],
    variants: editor.variants.map((item) => ({
      ...item.variant,
      attributes: item.attributes.map((attribute) => ({ ...attribute })) as ProductAttributeDraft[],
      inventoryStocks: item.inventoryStocks.map((stock) => ({ ...stock })) as InventoryStockDraft[],
      prices: item.prices.map((price) => ({ ...price })) as ProductPriceDraft[],
      media: item.media.map((media) => ({
        ...media,
        mediaType: mediaTypeEnum.fromApi(media.mediaType),
      })) as ProductMediaDraft[],
    })) as ProductVariantDraft[],
  };
}

function toSaveRequest(state: EditorState) {
  const validVariantIds = new Set(state.variants.map((item) => item.id).filter((id): id is string => Boolean(id)));

  return {
    product: {
      productTypeId: state.product.productTypeId,
      brandId: state.product.brandId || null,
      primaryCategoryId: state.product.primaryCategoryId,
      name: state.product.name,
      slug: state.product.slug,
      shortDescription: state.product.shortDescription,
      description: state.product.description,
      status: state.product.status,
      visibility: state.product.visibility,
      externalId: state.product.externalId || null,
      isHot: state.product.isHot,
      priority: Number(state.product.priority) || 0,
      isActive: state.product.isActive,
    },
    categories: state.categories.map((item) => ({
      id: item.id,
      catalogCategoryId: item.catalogCategoryId,
      isPrimary: item.catalogCategoryId === state.product.primaryCategoryId || item.isPrimary,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    productAttributes: state.productAttributes.map(cleanAttribute).filter(isPresent),
    productMedia: state.productMedia.map(cleanMedia).filter(isPresent),
    productPrices: state.productPrices.map(cleanPrice).filter(isPresent),
    offers: state.offers.map((item) => cleanOffer(item, validVariantIds)).filter(isPresent),
    tags: state.tags.map((item) => ({ id: item.id, tagId: item.tagId, isActive: item.isActive })),
    collections: state.collections.filter(hasCollectionValue).map((item) => ({
      id: item.id,
      productCollectionId: item.productCollectionId,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    relations: state.relations.filter(hasRelationValue).map((item) => ({
      id: item.id,
      targetProductId: item.targetProductId,
      relationType: item.relationType,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    variants: state.variants.map((item) => ({
      id: item.id,
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      slug: item.slug,
      price: Number(item.price) || 0,
      oldPrice: item.oldPrice,
      currency: item.currency,
      stockQuantity: Number(item.stockQuantity) || 0,
      weight: item.weight,
      width: item.width,
      height: item.height,
      depth: item.depth,
      isDefault: item.isDefault,
      isAvailable: item.isAvailable,
      isActive: item.isActive,
      attributes: item.attributes.map(cleanAttribute).filter(isPresent),
      inventoryStocks: item.inventoryStocks.map(cleanInventoryStock).filter(isPresent),
      prices: item.prices.map(cleanPrice).filter(isPresent),
      media: item.media.map(cleanMedia).filter(isPresent),
    })),
  };
}

function cleanAttribute(item: ProductAttributeDraft) {
  if (!hasAttributeValue(item)) {
    return null;
  }

  return {
    id: item.id || undefined,
    attributeDefinitionId: item.attributeDefinitionId,
    attributeOptionId: item.attributeOptionId || null,
    valueText: item.valueText || null,
    valueNumber: item.valueNumber || null,
    valueBoolean: item.valueBoolean || null,
    valueDate: item.valueDate || null,
    valueJson: item.valueJson || null,
    isActive: item.isActive ?? true,
  };
}

function cleanMedia(item: ProductMediaDraft) {
  if (!hasMediaValue(item)) {
    return null;
  }

  return {
    id: item.id || undefined,
    productVariantId: item.productVariantId || null,
    url: item.url.trim(),
    altText: item.altText || null,
    title: item.title || null,
    mediaType: mediaTypeEnum.toApi(item.mediaType),
    sortOrder: item.sortOrder,
    isMain: item.isMain,
    isActive: item.isActive,
  };
}

function cleanPrice(item: ProductPriceDraft) {
  if (!hasPriceValue(item)) {
    return null;
  }

  return {
    id: item.id || undefined,
    productVariantId: item.productVariantId || null,
    priceListId: item.priceListId,
    price: Number(item.price) || 0,
    oldPrice: item.oldPrice || null,
    currency: item.currency,
    validFrom: item.validFrom || null,
    validTo: item.validTo || null,
    isActive: item.isActive,
  };
}

function cleanOffer(item: ProductOfferDraft, validVariantIds: Set<string>) {
  if (!hasOfferValue(item)) {
    return null;
  }

  return {
    id: item.id || undefined,
    productVariantId: item.productVariantId && validVariantIds.has(item.productVariantId) ? item.productVariantId : null,
    shopId: item.shopId || null,
    shop: item.shop.trim(),
    shopUrl: item.shopUrl?.trim() || null,
    price: Number(item.price) || 0,
    oldPrice: item.oldPrice || null,
    currency: item.currency.trim().toUpperCase(),
    isHot: item.isHot,
    priority: Number(item.priority) || 0,
    isActive: item.isActive,
  };
}

function cleanInventoryStock(item: InventoryStockDraft) {
  if (!hasInventoryValue(item)) {
    return null;
  }

  return {
    id: item.id || undefined,
    warehouseId: item.warehouseId,
    quantity: Number(item.quantity) || 0,
    reservedQuantity: Number(item.reservedQuantity) || 0,
    availableQuantity: Number(item.availableQuantity) || 0,
    isActive: item.isActive,
  };
}

function createEmptyVariantState() {
  return {
    id: crypto.randomUUID(),
    productId: '',
    sku: '',
    barcode: '',
    name: '',
    slug: '',
    price: 0,
    oldPrice: null,
    currency: 'RUB',
    stockQuantity: 0,
    weight: null,
    width: null,
    height: null,
    depth: null,
    isDefault: false,
    isAvailable: true,
    isActive: true,
    startDate: '',
    lastUpdate: '',
    attributes: [],
    inventoryStocks: [],
    prices: [],
    media: [],
  };
}

function createEmptyOfferState(): ProductOfferDraft {
  return {
    id: crypto.randomUUID(),
    productVariantId: null,
    shopId: null,
    shop: '',
    shopUrl: '',
    price: 0,
    oldPrice: null,
    currency: 'RUB',
    isHot: true,
    priority: 0,
    isActive: true,
    startDate: '',
    lastUpdate: '',
  };
}

function updateVariant(index: number, patch: Partial<ProductVariantDraft>, setState: React.Dispatch<React.SetStateAction<EditorState>>) {
  setState((prev) => ({
    ...prev,
    variants: prev.variants.map((entry, current) => (current === index ? { ...entry, ...patch } : entry)),
  }));
}

function flattenCategories(
  nodes: CategoryTreeOption[],
): Array<{ id: string; name: string; depth: number }> {
  return nodes.flatMap((node) => [{ id: node.id, name: node.name, depth: node.depth }, ...flattenCategories(node.children)]);
}

function validateProductState(state: EditorState) {
  const errors: Array<{ field?: string; message: string }> = [];

  if (!state.product.name.trim()) {
    errors.push({ field: 'Product.Name', message: 'Укажите название товара.' });
  }

  if (!state.product.slug.trim()) {
    errors.push({ field: 'Product.Slug', message: 'Укажите slug товара.' });
  }

  if (!state.product.productTypeId) {
    errors.push({ field: 'Product.ProductTypeId', message: 'Выберите тип товара.' });
  }

  if (!state.product.primaryCategoryId) {
    errors.push({ field: 'Product.PrimaryCategoryId', message: 'Выберите основную категорию.' });
  }

  if (state.variants.length === 0) {
    errors.push({ field: 'Variants', message: 'Добавьте хотя бы один SKU, чтобы товар можно было сохранить.' });
    return errors;
  }

  state.variants.forEach((variant, index) => {
    const fieldPrefix = `Variants[${index}]`;
    const variantLabel = index === 0 ? 'первого SKU' : `SKU #${index + 1}`;

    if (!variant.name.trim()) {
      errors.push({ field: `${fieldPrefix}.Name`, message: `Укажите название ${variantLabel}.` });
    }

    if (!variant.sku.trim()) {
      errors.push({ field: `${fieldPrefix}.Sku`, message: `Укажите артикул ${variantLabel}.` });
    }

    if (!variant.currency.trim()) {
      errors.push({ field: `${fieldPrefix}.Currency`, message: `Укажите валюту ${variantLabel}.` });
    }

    variant.attributes.forEach((attribute, attributeIndex) => {
      if (!hasAttributeValue(attribute)) {
        return;
      }

      if (!attribute.attributeDefinitionId) {
        errors.push({
          field: `${fieldPrefix}.Attributes[${attributeIndex}].AttributeDefinitionId`,
          message: `Выберите атрибут для ${variantLabel} в строке #${attributeIndex + 1}.`,
        });
      }
    });

    variant.inventoryStocks.forEach((stock, stockIndex) => {
      if (!hasInventoryValue(stock)) {
        return;
      }

      if (!stock.warehouseId) {
        errors.push({
          field: `${fieldPrefix}.InventoryStocks[${stockIndex}].WarehouseId`,
          message: `Выберите склад для ${variantLabel} в строке остатка #${stockIndex + 1}.`,
        });
      }
    });

    variant.prices.forEach((price, priceIndex) => {
      if (!hasPriceValue(price)) {
        return;
      }

      if (!price.priceListId) {
        errors.push({
          field: `${fieldPrefix}.Prices[${priceIndex}].PriceListId`,
          message: `Выберите прайс-лист для ${variantLabel} в строке цены #${priceIndex + 1}.`,
        });
      }
    });

    variant.media.forEach((media, mediaIndex) => {
      if (!hasMediaValue(media)) {
        return;
      }

      if (!media.url.trim()) {
        errors.push({
          field: `${fieldPrefix}.Media[${mediaIndex}].Url`,
          message: `Укажите URL медиа для ${variantLabel} в строке #${mediaIndex + 1}.`,
        });
      }
    });
  });

  state.productAttributes.forEach((attribute, index) => {
    if (!hasAttributeValue(attribute)) {
      return;
    }

    if (!attribute.attributeDefinitionId) {
      errors.push({
        field: `ProductAttributes[${index}].AttributeDefinitionId`,
        message: `Выберите общий атрибут товара в строке #${index + 1}.`,
      });
    }
  });

  state.productPrices.forEach((price, index) => {
    if (!hasPriceValue(price)) {
      return;
    }

    if (!price.priceListId) {
      errors.push({
        field: `ProductPrices[${index}].PriceListId`,
        message: `Выберите прайс-лист для цены товара в строке #${index + 1}.`,
      });
    }
  });

  state.offers.forEach((offer, index) => {
    if (!hasOfferValue(offer)) {
      return;
    }

    if (!offer.shop.trim()) {
      errors.push({
        field: `Offers[${index}].Shop`,
        message: `Укажите магазин для предложения #${index + 1}.`,
      });
    }

    if (!offer.currency.trim()) {
      errors.push({
        field: `Offers[${index}].Currency`,
        message: `Укажите валюту для предложения #${index + 1}.`,
      });
    }

    if (Number(offer.price) <= 0) {
      errors.push({
        field: `Offers[${index}].Price`,
        message: `Укажите цену больше нуля для предложения #${index + 1}.`,
      });
    }
  });

  state.productMedia.forEach((media, index) => {
    if (!hasMediaValue(media)) {
      return;
    }

    if (!media.url.trim()) {
      errors.push({
        field: `ProductMedia[${index}].Url`,
        message: `Укажите URL медиа товара в строке #${index + 1}.`,
      });
    }
  });

  state.collections.forEach((collection, index) => {
    if (!hasCollectionValue(collection)) {
      return;
    }

    if (!collection.productCollectionId) {
      errors.push({
        field: `Collections[${index}].ProductCollectionId`,
        message: `Выберите подборку в строке #${index + 1}.`,
      });
    }
  });

  state.relations.forEach((relation, index) => {
    if (!hasRelationValue(relation)) {
      return;
    }

    if (!relation.targetProductId) {
      errors.push({
        field: `Relations[${index}].TargetProductId`,
        message: `Выберите связанный товар в строке #${index + 1}.`,
      });
    }
  });

  return errors;
}

function hasAttributeValue(item: ProductAttributeDraft) {
  return Boolean(
    item.attributeDefinitionId ||
      item.attributeOptionId ||
      (item.valueText && item.valueText.trim()) ||
      item.valueNumber !== null ||
      item.valueBoolean !== null ||
      item.valueDate ||
      (item.valueJson && item.valueJson.trim()),
  );
}

function hasPriceValue(item: ProductPriceDraft) {
  return Boolean(item.priceListId || item.price !== 0 || item.oldPrice !== null || item.validFrom || item.validTo);
}

function hasOfferValue(item: ProductOfferDraft) {
  return Boolean(
    item.shop.trim() ||
      (item.shopUrl && item.shopUrl.trim()) ||
      item.productVariantId ||
      item.price !== 0 ||
      item.oldPrice !== null ||
      item.priority !== 0,
  );
}

function hasInventoryValue(item: InventoryStockDraft) {
  return Boolean(item.warehouseId || item.quantity !== 0 || item.reservedQuantity !== 0 || item.availableQuantity !== 0);
}

function hasMediaValue(item: ProductMediaDraft) {
  return Boolean(item.url.trim() || (item.altText && item.altText.trim()) || (item.title && item.title.trim()));
}

function hasCollectionValue(item: ProductCollectionDraft) {
  return Boolean(item.productCollectionId);
}

function hasRelationValue(item: ProductRelationDraft) {
  return Boolean(item.targetProductId);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
