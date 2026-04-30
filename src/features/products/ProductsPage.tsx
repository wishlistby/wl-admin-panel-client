import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { productsApi, setupApi } from '@/shared/api/catalog-api';
import type { CatalogProductEditor } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { Tabs } from '@/shared/ui/Tabs';
import { formatCurrency, formatDate, slugify } from '@/shared/lib/format';

type ProductTab = 'overview' | 'content' | 'variants' | 'marketing';
type DraftRecord = Record<string, any>;

type EditorState = ReturnType<typeof createEmptyProductState>;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProductTab>('overview');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
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

  const [state, setState] = useState<EditorState>(createEmptyProductState());

  useEffect(() => {
    if (!editorQuery.data) return;
    setState(mapEditorToState(editorQuery.data));
  }, [editorQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toSaveRequest(state);
      if (selectedProductId) {
        return productsApi.update({ id: selectedProductId, payload });
      }
      const id = await productsApi.create(payload);
      setSelectedProductId(id);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
      if (selectedProductId) {
        await queryClient.invalidateQueries({ queryKey: ['product-editor', selectedProductId] });
      }
    },
  });

  const categories = useMemo(() => flattenCategories(bootstrapQuery.data?.categories ?? []), [bootstrapQuery.data]);
  const attributeDefinitions = useMemo(
    () =>
      bootstrapQuery.data?.attributeGroups.flatMap((group) =>
        group.definitions.map((definition) => ({
          id: definition.definition.id,
          name: definition.definition.name,
          dataType: definition.definition.dataType,
          options: definition.options,
          groupName: group.group.name,
        })),
      ) ?? [],
    [bootstrapQuery.data],
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
            <button key={item.id} type="button" className={`selection-row product-row ${selectedProductId === item.id ? 'is-active' : ''}`} onClick={() => setSelectedProductId(item.id)}>
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
          title={state.product.name || 'Новая карточка товара'}
          description="Одна форма управляет карточкой, SKU, ценами, остатками, медиа и маркетинговыми связями."
          actions={
            <div className="toolbar">
              {selectedProductId && (
                <Button
                  variant="danger"
                  onClick={() =>
                    productsApi.remove(selectedProductId).then(async () => {
                      setSelectedProductId('');
                      setState(createEmptyProductState());
                      await queryClient.invalidateQueries({ queryKey: ['products-list'] });
                    })
                  }
                >
                  Удалить
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
              { id: 'overview', label: 'Карточка' },
              { id: 'content', label: 'Контент и цены' },
              { id: 'variants', label: 'SKU и остатки', count: state.variants.length },
              { id: 'marketing', label: 'Маркетинг' },
            ]}
          />
        </Card>

        {tab === 'overview' && (
          <Card title="Основа карточки" description="Бизнес-контекст товара: тип, бренд, категория, описания и публикация.">
            <div className="form-grid form-grid-2">
              <TextField
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
              <TextField label="Slug" value={state.product.slug} onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, slug: event.target.value } }))} />
              <SelectField
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
                options={['Draft', 'Published', 'Archived', 'OutOfStock'].map((value) => ({ value, label: value }))}
              />
              <SelectField
                label="Видимость"
                value={state.product.visibility}
                onChange={(event) => setState((prev) => ({ ...prev, product: { ...prev.product, visibility: event.target.value } }))}
                options={['Visible', 'Hidden', 'SearchOnly', 'DirectLinkOnly'].map((value) => ({ value, label: value }))}
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
                onChange={(items) => setState((prev) => ({ ...prev, productAttributes: items as ProductAttributeValue[] }))}
                definitions={attributeDefinitions}
                scope="product"
              />
            </Card>
            <Card title="Медиа карточки" description="Общие изображения и файлы товара.">
              <MediaEditor items={state.productMedia} onChange={(items) => setState((prev) => ({ ...prev, productMedia: items as ProductMedia[] }))} />
            </Card>
            <Card title="Цены карточки" description="Используй только если цена задаётся на уровне всей карточки, а не SKU.">
              <PriceEditor
                items={state.productPrices}
                onChange={(items) => setState((prev) => ({ ...prev, productPrices: items as ProductPrice[] }))}
                priceLists={bootstrapQuery.data?.priceLists ?? []}
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
                  <TextField label="Название SKU" value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value }, setState)} />
                  <TextField label="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value }, setState)} />
                  <TextField label="Barcode" value={variant.barcode} onChange={(event) => updateVariant(index, { barcode: event.target.value }, setState)} />
                  <TextField label="Slug" value={variant.slug} onChange={(event) => updateVariant(index, { slug: event.target.value }, setState)} />
                  <TextField label="Price" type="number" value={String(variant.price)} onChange={(event) => updateVariant(index, { price: Number(event.target.value) }, setState)} />
                  <TextField label="Old price" type="number" value={String(variant.oldPrice ?? '')} onChange={(event) => updateVariant(index, { oldPrice: Number(event.target.value) || null }, setState)} />
                  <TextField label="Currency" value={variant.currency} onChange={(event) => updateVariant(index, { currency: event.target.value.toUpperCase() }, setState)} />
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
                  <AttributeEditor items={variant.attributes} onChange={(items) => updateVariant(index, { attributes: items }, setState)} definitions={attributeDefinitions} scope="variant" />
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
                      options={['Accessory', 'CrossSell', 'UpSell', 'Similar', 'Replacement', 'Bundle'].map((value) => ({ value, label: value }))}
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
  items: Array<ProductAttributeValue | VariantAttributeValue | Record<string, unknown>>;
  onChange: (items: Array<Record<string, unknown>>) => void;
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

function MediaEditor({ items, onChange }: { items: ProductMedia[]; onChange: (items: ProductMedia[]) => void }) {
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
            options={['Image', 'Video', 'Document'].map((value) => ({ value, label: value }))}
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
  items: ProductPrice[];
  onChange: (items: ProductPrice[]) => void;
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
      <Button variant="secondary" onClick={() => onChange([...items, { id: crypto.randomUUID(), priceListId: '', price: 0, oldPrice: null, currency: 'RUB', isActive: true, startDate: '', lastUpdate: '' } as ProductPrice])}>
        Добавить цену
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
      isActive: true,
    },
    categories: [] as Array<{ id: string; catalogCategoryId: string; isPrimary: boolean; sortOrder: number; isActive: boolean }>,
    productAttributes: [] as Array<ProductAttributeValue>,
    productMedia: [] as Array<ProductMedia>,
    productPrices: [] as Array<ProductPrice>,
    tags: [] as Array<ProductTag>,
    collections: [] as Array<ProductCollectionItem>,
    relations: [] as Array<ProductRelation>,
    variants: [] as Array<
      ProductVariant & {
        attributes: VariantAttributeValue[];
        inventoryStocks: Array<{ id: string; warehouseId: string; quantity: number; reservedQuantity: number; availableQuantity: number; isActive: boolean }>;
        prices: ProductPrice[];
        media: ProductMedia[];
      }
    >,
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
      status: editor.product.status,
      visibility: editor.product.visibility,
      externalId: editor.product.externalId ?? '',
      isActive: editor.product.isActive,
    },
    categories: editor.categories.map((item) => ({
      id: item.id,
      catalogCategoryId: item.catalogCategoryId,
      isPrimary: item.isPrimary,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    productAttributes: editor.productAttributes,
    productMedia: editor.productMedia,
    productPrices: editor.productPrices,
    tags: editor.tags,
    collections: editor.collections,
    relations: editor.relations,
    variants: editor.variants.map((item) => ({
      ...item.variant,
      attributes: item.attributes,
      inventoryStocks: item.inventoryStocks,
      prices: item.prices,
      media: item.media,
    })),
  };
}

function toSaveRequest(state: EditorState) {
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
      isActive: state.product.isActive,
    },
    categories: state.categories.map((item) => ({
      id: item.id,
      catalogCategoryId: item.catalogCategoryId,
      isPrimary: item.catalogCategoryId === state.product.primaryCategoryId || item.isPrimary,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    productAttributes: state.productAttributes.map(cleanAttribute),
    productMedia: state.productMedia.map(cleanMedia),
    productPrices: state.productPrices.map(cleanPrice),
    tags: state.tags.map((item) => ({ id: item.id, tagId: item.tagId, isActive: item.isActive })),
    collections: state.collections.map((item) => ({
      id: item.id,
      productCollectionId: item.productCollectionId,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    relations: state.relations.map((item) => ({
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
      attributes: item.attributes.map(cleanAttribute),
      inventoryStocks: item.inventoryStocks.map((stock) => ({
        id: stock.id,
        warehouseId: stock.warehouseId,
        quantity: Number(stock.quantity) || 0,
        reservedQuantity: Number(stock.reservedQuantity) || 0,
        availableQuantity: Number(stock.availableQuantity) || 0,
        isActive: stock.isActive,
      })),
      prices: item.prices.map(cleanPrice),
      media: item.media.map(cleanMedia),
    })),
  };
}

function cleanAttribute(item: Record<string, unknown>) {
  return {
    id: item.id,
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

function cleanMedia(item: ProductMedia) {
  return {
    id: item.id,
    productVariantId: item.productVariantId || null,
    url: item.url,
    altText: item.altText || null,
    title: item.title || null,
    mediaType: item.mediaType,
    sortOrder: item.sortOrder,
    isMain: item.isMain,
    isActive: item.isActive,
  };
}

function cleanPrice(item: ProductPrice) {
  return {
    id: item.id,
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

function updateVariant(index: number, patch: Record<string, unknown>, setState: React.Dispatch<React.SetStateAction<EditorState>>) {
  setState((prev) => ({
    ...prev,
    variants: prev.variants.map((entry, current) => (current === index ? { ...entry, ...patch } : entry)),
  }));
}

function flattenCategories(nodes: Array<{ id: string; name: string; depth: number; children: Array<any> }>): Array<{ id: string; name: string; depth: number }> {
  return nodes.flatMap((node) => [{ id: node.id, name: node.name, depth: node.depth }, ...flattenCategories(node.children)]);
}
