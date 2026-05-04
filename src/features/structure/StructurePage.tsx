import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { setupApi, structureApi } from '@/shared/api/catalog-api';
import { attributeDataTypeEnum, attributeDataTypeValues } from '@/shared/api/catalog-enums';
import type { CatalogCategoryNode } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { useSessionState } from '@/shared/lib/session-state';
import { Tabs } from '@/shared/ui/Tabs';
import { slugify } from '@/shared/lib/format';

type StructureTab = 'categories' | 'productTypes' | 'attributes';

export function StructurePage() {
  const [tab, setTab] = useSessionState<StructureTab>('structure:tab', 'categories');

  return (
    <div className="page-stack">
      <Card
        title="Структура каталога"
        description="Здесь администратор управляет деревом каталога, типами товаров и моделью характеристик."
      >
        <Tabs
          items={[
            { id: 'categories', label: 'Категории' },
            { id: 'productTypes', label: 'Типы товаров' },
            { id: 'attributes', label: 'Атрибуты' },
          ]}
          activeId={tab}
          onChange={(value) => setTab(value as StructureTab)}
        />
      </Card>

      {tab === 'categories' && <CategoryStudio />}
      {tab === 'productTypes' && <ProductTypeStudio />}
      {tab === 'attributes' && <AttributeStudio />}
    </div>
  );
}

function CategoryStudio() {
  const queryClient = useQueryClient();
  const bootstrapQuery = useQuery({ queryKey: ['catalog-bootstrap'], queryFn: setupApi.bootstrap });
  const categoriesQuery = useQuery({ queryKey: ['categories-tree'], queryFn: structureApi.categories.tree });
  const [selectedId, setSelectedId] = useSessionState<string>('structure:categories:selected-id', '');
  const [form, setForm, hasStoredForm] = useSessionState('structure:categories:form', {
    parentId: '',
    name: '',
    slug: '',
    fullPath: '',
    depth: 0,
    sortOrder: 0,
    isIndexable: true,
    metaTitle: '',
    metaDescription: '',
    h1: '',
    seoText: '',
    canonicalUrl: '',
    isActive: true,
    propagateVisibility: false,
    attributes: [] as Array<Record<string, unknown>>,
  });
  const selected = useMemo(() => findNodeById(categoriesQuery.data ?? [], selectedId), [categoriesQuery.data, selectedId]);
  const skipNodeHydrationRef = useRef(hasStoredForm);
  const skipDetailHydrationRef = useRef(hasStoredForm);

  useEffect(() => {
    if (!selected) return;
    if (skipNodeHydrationRef.current) {
      skipNodeHydrationRef.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      parentId: selected.parentId ?? '',
      name: selected.name,
      slug: selected.slug,
      fullPath: selected.fullPath,
      depth: selected.depth,
      sortOrder: selected.sortOrder,
      isIndexable: selected.isIndexable,
      metaTitle: '',
      metaDescription: '',
      h1: '',
      seoText: '',
      canonicalUrl: '',
      isActive: selected.isActive,
      propagateVisibility: false,
      attributes: [],
    });
  }, [selected]);

  const detailQuery = useQuery({
    queryKey: ['category-detail', selectedId],
    queryFn: () => structureApi.categories.getById(selectedId),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    if (skipDetailHydrationRef.current) {
      skipDetailHydrationRef.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      metaTitle: detailQuery.data.category.metaTitle ?? '',
      metaDescription: detailQuery.data.category.metaDescription ?? '',
      h1: detailQuery.data.category.h1 ?? '',
      seoText: detailQuery.data.category.seoText ?? '',
      canonicalUrl: detailQuery.data.category.canonicalUrl ?? '',
      isIndexable: detailQuery.data.category.isIndexable,
      isActive: detailQuery.data.category.isActive,
      attributes: detailQuery.data.attributes.map((attribute) => ({
        id: attribute.id,
        attributeDefinitionId: attribute.attributeDefinitionId,
        isVisibleInFilter: attribute.isVisibleInFilter,
        isExpandedByDefault: attribute.isExpandedByDefault,
        isSeoRelevant: attribute.isSeoRelevant,
        sortOrder: attribute.sortOrder,
        isActive: attribute.isActive,
      })),
    }));
  }, [detailQuery.data]);

  const flatCategories = useMemo(() => flattenTree(categoriesQuery.data ?? []), [categoriesQuery.data]);

  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = {
        parentId: form.parentId || null,
        name: form.name,
        slug: form.slug,
        fullPath: form.fullPath,
        depth: form.depth,
        sortOrder: form.sortOrder,
        isIndexable: form.isIndexable,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        h1: form.h1,
        seoText: form.seoText,
        canonicalUrl: form.canonicalUrl,
        isActive: form.isActive,
      };

      if (selected?.id) {
        await structureApi.categories.update(selected.id, payload);
        await structureApi.categories.replaceAttributes(selected.id, form.attributes);

        if (form.propagateVisibility) {
          const descendants = getDescendants(categoriesQuery.data ?? [], selected.id);
          await Promise.all(
            descendants.map((item) =>
              structureApi.categories.update(item.id, {
                parentId: item.parentId ?? null,
                name: item.name,
                slug: item.slug,
                fullPath: item.fullPath,
                depth: item.depth,
                sortOrder: item.sortOrder,
                isIndexable: form.isIndexable,
                metaTitle: '',
                metaDescription: '',
                h1: '',
                seoText: '',
                canonicalUrl: '',
                isActive: form.isActive,
              }),
            ),
          );
        }
      } else {
        const id = await structureApi.categories.create(payload);
        await structureApi.categories.replaceAttributes(id, form.attributes);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
      if (selected?.id) {
        await queryClient.invalidateQueries({ queryKey: ['category-detail', selected.id] });
      }
    },
  });

  return (
    <div className="grid-split">
      <Card
        title="Дерево категорий"
        description="Видимость можно менять централизованно и при необходимости прокидывать на дочерние разделы."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              skipNodeHydrationRef.current = false;
              skipDetailHydrationRef.current = false;
              setSelectedId('');
              setForm({
                parentId: '',
                name: '',
                slug: '',
                fullPath: '',
                depth: 0,
                sortOrder: 0,
                isIndexable: true,
                metaTitle: '',
                metaDescription: '',
                h1: '',
                seoText: '',
                canonicalUrl: '',
                isActive: true,
                propagateVisibility: false,
                attributes: [],
              });
            }}
          >
            <Plus size={16} />
            <span>Новая категория</span>
          </Button>
        }
      >
        <div className="tree">
          {(categoriesQuery.data ?? []).map((node) => (
            <CategoryTreeNode
              key={node.id}
              node={node}
              activeId={selectedId}
              onSelect={(node) => {
                skipNodeHydrationRef.current = false;
                skipDetailHydrationRef.current = false;
                setSelectedId(node.id);
              }}
            />
          ))}
        </div>
      </Card>

      <Card
        title={selected ? `Категория: ${selected.name}` : 'Новая категория'}
        description="Редактор категории и SEO-контекста"
        actions={
          selected?.id ? (
            <Button
              variant="danger"
              onClick={() =>
                structureApi.categories.remove(selected.id).then(async () => {
                  setSelectedId('');
                  await queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
                })
              }
            >
              Удалить
            </Button>
          ) : null
        }
      >
        <div className="form-grid form-grid-2">
          <SelectField
            docKey="parent-category"
            label="Родитель"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
            options={[
              { value: '', label: 'Корневой раздел' },
              ...flatCategories.map((item) => ({ value: item.id, label: `${'· '.repeat(item.depth)}${item.name}` })),
            ]}
          />
          <TextField
            docKey="category-select"
            label="Название"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                name: event.target.value,
                slug: slugify(event.target.value),
              }))
            }
          />
          <TextField docKey="slug" label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextField docKey="full-path" label="Full path" value={form.fullPath} onChange={(event) => setForm((prev) => ({ ...prev, fullPath: event.target.value }))} />
          <TextField docKey="depth" label="Depth" type="number" value={String(form.depth)} onChange={(event) => setForm((prev) => ({ ...prev, depth: Number(event.target.value) }))} />
          <TextField docKey="sort-order" label="Sort order" type="number" value={String(form.sortOrder)} onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <TextField docKey="meta-title" label="Meta title" value={form.metaTitle} onChange={(event) => setForm((prev) => ({ ...prev, metaTitle: event.target.value }))} />
          <TextField docKey="h1" label="H1" value={form.h1} onChange={(event) => setForm((prev) => ({ ...prev, h1: event.target.value }))} />
          <TextAreaField docKey="meta-description" className="field-span-2" label="Meta description" rows={3} value={form.metaDescription} onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))} />
          <TextAreaField docKey="seo-text" className="field-span-2" label="SEO text" rows={5} value={form.seoText} onChange={(event) => setForm((prev) => ({ ...prev, seoText: event.target.value }))} />
          <TextField docKey="canonical-url" className="field-span-2" label="Canonical URL" value={form.canonicalUrl} onChange={(event) => setForm((prev) => ({ ...prev, canonicalUrl: event.target.value }))} />
          <CheckboxField docKey="category-indexable" label="Индексировать категорию" checked={form.isIndexable} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
          <CheckboxField docKey="category-active" label="Категория активна" checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
          <CheckboxField docKey="propagate-visibility" label="Применить видимость к дочерним" hint="Подчинённые страницы унаследуют активность и индексируемость." checked={form.propagateVisibility} onChange={(value) => setForm((prev) => ({ ...prev, propagateVisibility: value }))} />
        </div>

        {detailQuery.data && (
          <Card title="Фильтры категории" description="Настройки фасетов для этой категории" className="inner-card">
            <div className="stack-list compact">
              {form.attributes.map((attribute, index) => (
                <div key={String(attribute.id ?? index)} className="matrix-row">
                  <SelectField
                    docKey="category-attribute"
                    label="Атрибут"
                    value={String(attribute.attributeDefinitionId ?? '')}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.map((entry, current) =>
                          current === index ? { ...entry, attributeDefinitionId: event.target.value } : entry,
                        ),
                      }))
                    }
                    options={[
                      { value: '', label: 'Выбери атрибут' },
                      ...(
                        bootstrapQuery.data?.attributeGroups.flatMap((group) =>
                          group.definitions.map((definition) => ({
                            value: definition.definition.id,
                            label: `${group.group.name} / ${definition.definition.name}`,
                          })),
                        ) ?? []
                      ),
                    ]}
                  />
                  <TextField
                    docKey="sort-order-generic"
                    label="Порядок"
                    type="number"
                    value={String(attribute.sortOrder ?? 0)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.map((entry, current) =>
                          current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                        ),
                      }))
                    }
                  />
                  <CheckboxField
                    docKey="visible-in-filter"
                    label="Показывать в фильтре"
                    checked={Boolean(attribute.isVisibleInFilter)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.map((entry, current) =>
                          current === index ? { ...entry, isVisibleInFilter: value } : entry,
                        ),
                      }))
                    }
                  />
                  <CheckboxField
                    docKey="expanded-by-default"
                    label="Раскрывать по умолчанию"
                    checked={Boolean(attribute.isExpandedByDefault)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.map((entry, current) =>
                          current === index ? { ...entry, isExpandedByDefault: value } : entry,
                        ),
                      }))
                    }
                  />
                  <CheckboxField
                    docKey="seo-relevant"
                    label="SEO-relevant"
                    checked={Boolean(attribute.isSeoRelevant)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.map((entry, current) =>
                          current === index ? { ...entry, isSeoRelevant: value } : entry,
                        ),
                      }))
                    }
                  />
                  <Button
                    variant="danger"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        attributes: prev.attributes.filter((_, current) => current !== index),
                      }))
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              {form.attributes.length === 0 && <span className="empty-inline">Фильтры ещё не настроены.</span>}
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  attributes: [
                    ...prev.attributes,
                    {
                      id: crypto.randomUUID(),
                      attributeDefinitionId: '',
                      isVisibleInFilter: true,
                      isExpandedByDefault: false,
                      isSeoRelevant: false,
                      sortOrder: prev.attributes.length + 1,
                      isActive: true,
                    },
                  ],
                }))
              }
            >
              Добавить фильтр
            </Button>
          </Card>
        )}

        <div className="dialog-actions">
          <Button onClick={() => saveCategory.mutate()} disabled={saveCategory.isPending}>
            {saveCategory.isPending ? 'Сохраняем...' : 'Сохранить категорию'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ProductTypeStudio() {
  const queryClient = useQueryClient();
  const bootstrapQuery = useQuery({ queryKey: ['catalog-bootstrap'], queryFn: setupApi.bootstrap });
  const productTypesQuery = useQuery({
    queryKey: ['product-types-list'],
    queryFn: () => structureApi.productTypes.list({ page: 1, pageSize: 100, includeInactive: true, search: '' }),
  });

  const [selectedId, setSelectedId] = useSessionState<string>('structure:product-types:selected-id', '');
  const detailQuery = useQuery({
    queryKey: ['product-type-detail', selectedId],
    queryFn: () => structureApi.productTypes.getDetail(selectedId),
    enabled: Boolean(selectedId),
  });

  const [form, setForm, hasStoredForm] = useSessionState('structure:product-types:form', {
    name: '',
    slug: '',
    description: '',
    isActive: true,
    attributes: [] as Array<Record<string, unknown>>,
  });
  const skipDetailHydrationRef = useRef(hasStoredForm);

  useEffect(() => {
    if (!detailQuery.data) return;
    if (skipDetailHydrationRef.current) {
      skipDetailHydrationRef.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: detailQuery.data.productType.name,
      slug: detailQuery.data.productType.slug,
      description: detailQuery.data.productType.description ?? '',
      isActive: detailQuery.data.productType.isActive,
      attributes: detailQuery.data.attributes.map((item) => ({
        id: item.id,
        attributeDefinitionId: item.attributeDefinitionId,
        isRequired: item.isRequired,
        isFilterable: item.isFilterable,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      })),
    });
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        isActive: form.isActive,
      };

      let targetId = selectedId;
      if (targetId) {
        await structureApi.productTypes.update(targetId, payload);
      } else {
        targetId = await structureApi.productTypes.create(payload);
        skipDetailHydrationRef.current = false;
        setSelectedId(targetId);
      }

      await structureApi.productTypes.replaceAttributes(targetId, form.attributes);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['product-types-list'] });
      await queryClient.invalidateQueries({ queryKey: ['product-type-detail', selectedId] });
    },
  });

  const attributeOptions =
    bootstrapQuery.data?.attributeGroups.flatMap((group) =>
      group.definitions.map((definition) => ({
        value: definition.definition.id,
        label: `${group.group.name} / ${definition.definition.name}`,
      })),
    ) ?? [];

  return (
    <div className="grid-split">
      <Card
        title="Типы товаров"
        description="Тип задаёт схему характеристик и помогает фронту собирать форму товара без хаоса."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              skipDetailHydrationRef.current = false;
              setSelectedId('');
              setForm({ name: '', slug: '', description: '', isActive: true, attributes: [] });
            }}
          >
            Новый тип
          </Button>
        }
      >
        <div className="stack-list">
          {productTypesQuery.data?.items.map((item: { id: string; name: string; slug: string }) => (
            <button
              key={item.id}
              type="button"
              className={`selection-row ${selectedId === item.id ? 'is-active' : ''}`}
              onClick={() => {
                skipDetailHydrationRef.current = false;
                setSelectedId(item.id);
              }}
            >
              <strong>{item.name}</strong>
              <span>{item.slug}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Редактор типа товара" description="Внутри сразу настраиваются обязательные атрибуты и фасетные правила.">
        {selectedId && (
          <div className="dialog-actions">
            <Button
              variant="danger"
              onClick={() =>
                structureApi.productTypes.remove(selectedId).then(async () => {
                  skipDetailHydrationRef.current = false;
                  setSelectedId('');
                  setForm({ name: '', slug: '', description: '', isActive: true, attributes: [] });
                  await queryClient.invalidateQueries({ queryKey: ['product-types-list'] });
                })
              }
            >
              Удалить тип
            </Button>
          </div>
        )}
        <div className="form-grid form-grid-2">
          <TextField docKey="product-type" label="Название" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))} />
          <TextField docKey="slug" label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextAreaField docKey="description-generic" className="field-span-2" label="Описание" rows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          <CheckboxField docKey="type-active" label="Тип активен" checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </div>

        <Card title="Атрибуты типа" className="inner-card">
          <div className="stack-list compact">
            {form.attributes.map((item, index) => (
              <div key={String(item.id ?? index)} className="matrix-row">
                <SelectField
                  docKey="category-attribute"
                  label="Атрибут"
                  value={String(item.attributeDefinitionId ?? '')}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: prev.attributes.map((entry, current) =>
                        current === index ? { ...entry, attributeDefinitionId: event.target.value } : entry,
                      ),
                    }))
                  }
                  options={[{ value: '', label: 'Выбери атрибут' }, ...attributeOptions]}
                />
                <TextField
                  docKey="sort-order-generic"
                  label="Порядок"
                  type="number"
                  value={String(item.sortOrder ?? 0)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: prev.attributes.map((entry, current) =>
                        current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                      ),
                    }))
                  }
                />
                <CheckboxField
                  docKey="attribute-required"
                  label="Обязателен"
                  checked={Boolean(item.isRequired)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: prev.attributes.map((entry, current) =>
                        current === index ? { ...entry, isRequired: value } : entry,
                      ),
                    }))
                  }
                />
                <CheckboxField
                  docKey="attribute-filterable-ru"
                  label="Фильтруемый"
                  checked={Boolean(item.isFilterable)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: prev.attributes.map((entry, current) =>
                        current === index ? { ...entry, isFilterable: value } : entry,
                      ),
                    }))
                  }
                />
                <Button
                  variant="danger"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      attributes: prev.attributes.filter((_, current) => current !== index),
                    }))
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                attributes: [
                  ...prev.attributes,
                  { attributeDefinitionId: '', isRequired: false, isFilterable: false, sortOrder: prev.attributes.length + 1, isActive: true },
                ],
              }))
            }
          >
            Добавить атрибут
          </Button>
        </Card>

        <div className="dialog-actions">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохраняем...' : 'Сохранить тип товара'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AttributeStudio() {
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({
    queryKey: ['attribute-groups-list'],
    queryFn: () => structureApi.attributeGroups.list({ page: 1, pageSize: 100, includeInactive: true, search: '' }),
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>('');
  const groupDetailQuery = useQuery({
    queryKey: ['attribute-group-detail', selectedGroupId],
    queryFn: () => structureApi.attributeGroups.getDetail(selectedGroupId),
    enabled: Boolean(selectedGroupId),
  });
  const definitionQuery = useQuery({
    queryKey: ['attribute-definition-detail', selectedDefinitionId],
    queryFn: () => structureApi.attributeDefinitions.getDetail(selectedDefinitionId),
    enabled: Boolean(selectedDefinitionId),
  });

  const [groupForm, setGroupForm] = useState({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
  const [definitionForm, setDefinitionForm] = useState({
    attributeGroupId: '',
    code: '',
    name: '',
    description: '',
    dataType: 'Text',
    unit: '',
    isFilterable: false,
    isSearchable: false,
    isComparable: false,
    isVariantDefining: false,
    isRequired: false,
    sortOrder: 0,
    isActive: true,
    options: [] as Array<Record<string, unknown>>,
  });

  useEffect(() => {
    if (!groupDetailQuery.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupForm({
      name: groupDetailQuery.data.group.name,
      slug: groupDetailQuery.data.group.slug,
      description: groupDetailQuery.data.group.description ?? '',
      sortOrder: groupDetailQuery.data.group.sortOrder,
      isActive: groupDetailQuery.data.group.isActive,
    });
  }, [groupDetailQuery.data]);

  useEffect(() => {
    if (!definitionQuery.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefinitionForm({
      attributeGroupId: definitionQuery.data.definition.attributeGroupId,
      code: definitionQuery.data.definition.code,
      name: definitionQuery.data.definition.name,
      description: definitionQuery.data.definition.description ?? '',
      dataType: attributeDataTypeEnum.fromApi(definitionQuery.data.definition.dataType),
      unit: definitionQuery.data.definition.unit ?? '',
      isFilterable: definitionQuery.data.definition.isFilterable,
      isSearchable: definitionQuery.data.definition.isSearchable,
      isComparable: definitionQuery.data.definition.isComparable,
      isVariantDefining: definitionQuery.data.definition.isVariantDefining,
      isRequired: definitionQuery.data.definition.isRequired,
      sortOrder: definitionQuery.data.definition.sortOrder,
      isActive: definitionQuery.data.definition.isActive,
      options: definitionQuery.data.options.map((item) => ({
        id: item.id,
        value: item.value,
        slug: item.slug,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      })),
    });
  }, [definitionQuery.data]);

  const saveGroup = useMutation({
    mutationFn: async () => {
      if (selectedGroupId) {
        await structureApi.attributeGroups.update(selectedGroupId, groupForm);
        return selectedGroupId;
      }

      return structureApi.attributeGroups.create(groupForm);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attribute-groups-list'] });
      if (selectedGroupId) await queryClient.invalidateQueries({ queryKey: ['attribute-group-detail', selectedGroupId] });
    },
  });

  const saveDefinition = useMutation({
    mutationFn: async () => {
      const payload = {
        attributeGroupId: definitionForm.attributeGroupId,
        code: definitionForm.code,
        name: definitionForm.name,
        description: definitionForm.description,
        dataType: attributeDataTypeEnum.toApi(definitionForm.dataType),
        unit: definitionForm.unit,
        isFilterable: definitionForm.isFilterable,
        isSearchable: definitionForm.isSearchable,
        isComparable: definitionForm.isComparable,
        isVariantDefining: definitionForm.isVariantDefining,
        isRequired: definitionForm.isRequired,
        sortOrder: definitionForm.sortOrder,
        isActive: definitionForm.isActive,
      };

      let targetId = selectedDefinitionId;
      if (targetId) {
        await structureApi.attributeDefinitions.update(targetId, payload);
      } else {
        targetId = await structureApi.attributeDefinitions.create(payload);
        setSelectedDefinitionId(targetId);
      }

      await structureApi.attributeDefinitions.replaceOptions(targetId, definitionForm.options);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attribute-group-detail', selectedGroupId] });
      if (selectedDefinitionId) await queryClient.invalidateQueries({ queryKey: ['attribute-definition-detail', selectedDefinitionId] });
    },
  });

  return (
    <div className="grid-three">
      <Card title="Группы атрибутов" description="Визуальные блоки вроде «Основные», «Размеры», «Материалы».">
        <div className="stack-list">
          {groupsQuery.data?.items.map((item) => (
            <button key={item.id} type="button" className={`selection-row ${selectedGroupId === item.id ? 'is-active' : ''}`} onClick={() => setSelectedGroupId(item.id)}>
              <strong>{item.name}</strong>
              <span>{item.slug}</span>
            </button>
          ))}
        </div>
        <div className="dialog-actions">
          {selectedGroupId && (
            <Button
              variant="danger"
              onClick={() =>
                structureApi.attributeGroups.remove(selectedGroupId).then(async () => {
                  setSelectedGroupId('');
                  setSelectedDefinitionId('');
                  setGroupForm({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
                  await queryClient.invalidateQueries({ queryKey: ['attribute-groups-list'] });
                })
              }
            >
              Удалить группу
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedGroupId('');
              setSelectedDefinitionId('');
              setGroupForm({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
            }}
          >
            Новая группа
          </Button>
        </div>
        <div className="form-grid">
          <TextField docKey="attribute-group-name" label="Название группы" value={groupForm.name} onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))} />
          <TextField docKey="slug" label="Slug" value={groupForm.slug} onChange={(event) => setGroupForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextAreaField docKey="description-generic" label="Описание" rows={3} value={groupForm.description} onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))} />
          <TextField docKey="sort-order" label="Sort order" type="number" value={String(groupForm.sortOrder)} onChange={(event) => setGroupForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <CheckboxField docKey="group-active" label="Группа активна" checked={groupForm.isActive} onChange={(value) => setGroupForm((prev) => ({ ...prev, isActive: value }))} />
          <Button onClick={() => saveGroup.mutate()} disabled={saveGroup.isPending}>
            Сохранить группу
          </Button>
        </div>
      </Card>

      <Card title="Атрибуты группы" description="Определения характеристик, которые потом назначаются типам товара.">
        <div className="stack-list">
          {(groupDetailQuery.data?.definitions ?? []).map((item) => (
            <button
              key={item.definition.id}
              type="button"
              className={`selection-row ${selectedDefinitionId === item.definition.id ? 'is-active' : ''}`}
              onClick={() => setSelectedDefinitionId(item.definition.id)}
            >
              <strong>{item.definition.name}</strong>
              <span>
                {item.definition.code} · {item.definition.dataType}
              </span>
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedDefinitionId('');
            setDefinitionForm({
              attributeGroupId: selectedGroupId,
              code: '',
              name: '',
              description: '',
              dataType: 'Text',
              unit: '',
              isFilterable: false,
              isSearchable: false,
              isComparable: false,
              isVariantDefining: false,
              isRequired: false,
              sortOrder: 0,
              isActive: true,
              options: [],
            });
          }}
        >
          Новый атрибут
        </Button>
      </Card>

      <Card title="Редактор атрибута" description="Тип данных, фильтры, variant-логика и options на одной панели.">
        {selectedDefinitionId && (
          <div className="dialog-actions">
            <Button
              variant="danger"
              onClick={() =>
                structureApi.attributeDefinitions.remove(selectedDefinitionId).then(async () => {
                  setSelectedDefinitionId('');
                  await queryClient.invalidateQueries({ queryKey: ['attribute-group-detail', selectedGroupId] });
                })
              }
            >
              Удалить атрибут
            </Button>
          </div>
        )}
        <div className="form-grid">
          <SelectField
            docKey="group"
            label="Группа"
            value={definitionForm.attributeGroupId}
            onChange={(event) => setDefinitionForm((prev) => ({ ...prev, attributeGroupId: event.target.value }))}
            options={[
              { value: '', label: 'Выбери группу' },
              ...(groupsQuery.data?.items.map((item) => ({ value: item.id, label: item.name })) ?? []),
            ]}
          />
          <TextField docKey="code" label="Код" value={definitionForm.code} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, code: event.target.value }))} />
          <TextField docKey="category-attribute" label="Название" value={definitionForm.name} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, name: event.target.value }))} />
          <SelectField
            docKey="data-type"
            label="Тип данных"
            value={definitionForm.dataType}
            onChange={(event) => setDefinitionForm((prev) => ({ ...prev, dataType: event.target.value }))}
            options={attributeDataTypeValues.map((value) => ({ value, label: value }))}
          />
          <TextField docKey="unit" label="Unit" value={definitionForm.unit} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, unit: event.target.value }))} />
          <TextField docKey="sort-order" label="Sort order" type="number" value={String(definitionForm.sortOrder)} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <TextAreaField docKey="description-generic" className="field-span-2" label="Описание" rows={3} value={definitionForm.description} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, description: event.target.value }))} />
          <CheckboxField docKey="filterable" label="Filterable" checked={definitionForm.isFilterable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isFilterable: value }))} />
          <CheckboxField docKey="searchable" label="Searchable" checked={definitionForm.isSearchable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isSearchable: value }))} />
          <CheckboxField docKey="comparable" label="Comparable" checked={definitionForm.isComparable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isComparable: value }))} />
          <CheckboxField docKey="variant-defining" label="Variant defining" checked={definitionForm.isVariantDefining} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isVariantDefining: value }))} />
          <CheckboxField docKey="required" label="Required" checked={definitionForm.isRequired} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isRequired: value }))} />
          <CheckboxField docKey="active-generic" label="Активен" checked={definitionForm.isActive} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isActive: value }))} />
        </div>

        {(definitionForm.dataType === 'Option' || definitionForm.dataType === 'MultiOption') && (
          <Card title="Options" className="inner-card">
            <div className="stack-list compact">
              {definitionForm.options.map((item, index) => (
                <div key={String(item.id ?? index)} className="matrix-row">
                  <TextField
                    docKey="option-value"
                    label="Value"
                    value={String(item.value ?? '')}
                    onChange={(event) =>
                      setDefinitionForm((prev) => ({
                        ...prev,
                        options: prev.options.map((entry, current) =>
                          current === index ? { ...entry, value: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                  <TextField
                    docKey="slug"
                    label="Slug"
                    value={String(item.slug ?? '')}
                    onChange={(event) =>
                      setDefinitionForm((prev) => ({
                        ...prev,
                        options: prev.options.map((entry, current) =>
                          current === index ? { ...entry, slug: event.target.value } : entry,
                        ),
                      }))
                    }
                  />
                  <TextField
                    docKey="sort-order-generic"
                    label="Порядок"
                    type="number"
                    value={String(item.sortOrder ?? 0)}
                    onChange={(event) =>
                      setDefinitionForm((prev) => ({
                        ...prev,
                        options: prev.options.map((entry, current) =>
                          current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                        ),
                      }))
                    }
                  />
                  <CheckboxField
                    docKey="active-generic"
                    label="Активен"
                    checked={Boolean(item.isActive)}
                    onChange={(value) =>
                      setDefinitionForm((prev) => ({
                        ...prev,
                        options: prev.options.map((entry, current) =>
                          current === index ? { ...entry, isActive: value } : entry,
                        ),
                      }))
                    }
                  />
                  <Button
                    variant="danger"
                    onClick={() =>
                      setDefinitionForm((prev) => ({
                        ...prev,
                        options: prev.options.filter((_, current) => current !== index),
                      }))
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={() => setDefinitionForm((prev) => ({ ...prev, options: [...prev.options, { value: '', slug: '', sortOrder: prev.options.length + 1, isActive: true }] }))}>
              Добавить option
            </Button>
          </Card>
        )}

        <div className="dialog-actions">
          <Button onClick={() => saveDefinition.mutate()} disabled={saveDefinition.isPending}>
            Сохранить атрибут
          </Button>
        </div>
      </Card>
    </div>
  );
}

function CategoryTreeNode({
  node,
  activeId,
  onSelect,
}: {
  node: CatalogCategoryNode;
  activeId?: string;
  onSelect: (node: CatalogCategoryNode) => void;
}) {
  return (
    <div className="tree-node">
      <button type="button" className={`tree-button ${activeId === node.id ? 'is-active' : ''}`} onClick={() => onSelect(node)}>
        <span>{node.name}</span>
        <small>{node.slug}</small>
      </button>
      {node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <CategoryTreeNode key={child.id} node={child} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function flattenTree(nodes: CatalogCategoryNode[]): CatalogCategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

function getDescendants(nodes: CatalogCategoryNode[], targetId: string): CatalogCategoryNode[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return flattenTree(node.children);
    }

    const nested = getDescendants(node.children, targetId);
    if (nested.length > 0) return nested;
  }

  return [];
}

function findNodeById(nodes: CatalogCategoryNode[], targetId: string): CatalogCategoryNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    const nested = findNodeById(node.children, targetId);
    if (nested) {
      return nested;
    }
  }

  return null;
}
