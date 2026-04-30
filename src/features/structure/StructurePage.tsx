import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { setupApi, structureApi } from '@/shared/api/catalog-api';
import type { CatalogCategoryNode } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { Tabs } from '@/shared/ui/Tabs';
import { slugify } from '@/shared/lib/format';

type StructureTab = 'categories' | 'productTypes' | 'attributes';

export function StructurePage() {
  const [tab, setTab] = useState<StructureTab>('categories');

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
  const categoriesQuery = useQuery({ queryKey: ['categories-tree'], queryFn: structureApi.categories.tree });
  const [selected, setSelected] = useState<CatalogCategoryNode | null>(null);
  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    if (!selected) return;
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
    });
  }, [selected]);

  const detailQuery = useQuery({
    queryKey: ['category-detail', selected?.id],
    queryFn: () => structureApi.categories.getById(selected!.id),
    enabled: Boolean(selected?.id),
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm((prev) => ({
      ...prev,
      metaTitle: detailQuery.data.category.metaTitle ?? '',
      metaDescription: detailQuery.data.category.metaDescription ?? '',
      h1: detailQuery.data.category.h1 ?? '',
      seoText: detailQuery.data.category.seoText ?? '',
      canonicalUrl: detailQuery.data.category.canonicalUrl ?? '',
      isIndexable: detailQuery.data.category.isIndexable,
      isActive: detailQuery.data.category.isActive,
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
        await structureApi.categories.create(payload);
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
              setSelected(null);
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
            <CategoryTreeNode key={node.id} node={node} activeId={selected?.id} onSelect={setSelected} />
          ))}
        </div>
      </Card>

      <Card
        title={selected ? `Категория: ${selected.name}` : 'Новая категория'}
        description="Редактор категории и SEO-контекста"
        actions={
          selected?.id ? (
            <Button variant="danger" onClick={() => structureApi.categories.remove(selected.id).then(() => queryClient.invalidateQueries({ queryKey: ['categories-tree'] }))}>
              Удалить
            </Button>
          ) : null
        }
      >
        <div className="form-grid form-grid-2">
          <SelectField
            label="Родитель"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
            options={[
              { value: '', label: 'Корневой раздел' },
              ...flatCategories.map((item) => ({ value: item.id, label: `${'· '.repeat(item.depth)}${item.name}` })),
            ]}
          />
          <TextField
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
          <TextField label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextField label="Full path" value={form.fullPath} onChange={(event) => setForm((prev) => ({ ...prev, fullPath: event.target.value }))} />
          <TextField label="Depth" type="number" value={String(form.depth)} onChange={(event) => setForm((prev) => ({ ...prev, depth: Number(event.target.value) }))} />
          <TextField label="Sort order" type="number" value={String(form.sortOrder)} onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <TextField label="Meta title" value={form.metaTitle} onChange={(event) => setForm((prev) => ({ ...prev, metaTitle: event.target.value }))} />
          <TextField label="H1" value={form.h1} onChange={(event) => setForm((prev) => ({ ...prev, h1: event.target.value }))} />
          <TextAreaField className="field-span-2" label="Meta description" rows={3} value={form.metaDescription} onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))} />
          <TextAreaField className="field-span-2" label="SEO text" rows={5} value={form.seoText} onChange={(event) => setForm((prev) => ({ ...prev, seoText: event.target.value }))} />
          <TextField className="field-span-2" label="Canonical URL" value={form.canonicalUrl} onChange={(event) => setForm((prev) => ({ ...prev, canonicalUrl: event.target.value }))} />
          <CheckboxField label="Индексировать категорию" checked={form.isIndexable} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
          <CheckboxField label="Категория активна" checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
          <CheckboxField label="Применить видимость к дочерним" hint="Подчинённые страницы унаследуют активность и индексируемость." checked={form.propagateVisibility} onChange={(value) => setForm((prev) => ({ ...prev, propagateVisibility: value }))} />
        </div>

        {detailQuery.data && (
          <Card title="Фильтры категории" description="Настройки фасетов для этой категории" className="inner-card">
            <div className="chip-cloud">
              {detailQuery.data.attributes.map((attribute) => (
                <span key={attribute.id} className="chip">
                  {attribute.attributeDefinitionId}
                </span>
              ))}
              {detailQuery.data.attributes.length === 0 && <span className="empty-inline">Фильтры ещё не настроены.</span>}
            </div>
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

  const [selectedId, setSelectedId] = useState<string>('');
  const detailQuery = useQuery({
    queryKey: ['product-type-detail', selectedId],
    queryFn: () => structureApi.productTypes.getDetail(selectedId),
    enabled: Boolean(selectedId),
  });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    attributes: [] as Array<Record<string, unknown>>,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
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
            <button key={item.id} type="button" className={`selection-row ${selectedId === item.id ? 'is-active' : ''}`} onClick={() => setSelectedId(item.id)}>
              <strong>{item.name}</strong>
              <span>{item.slug}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Редактор типа товара" description="Внутри сразу настраиваются обязательные атрибуты и фасетные правила.">
        <div className="form-grid form-grid-2">
          <TextField label="Название" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))} />
          <TextField label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextAreaField className="field-span-2" label="Описание" rows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
          <CheckboxField label="Тип активен" checked={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </div>

        <Card title="Атрибуты типа" className="inner-card">
          <div className="stack-list compact">
            {form.attributes.map((item, index) => (
              <div key={String(item.id ?? index)} className="matrix-row">
                <SelectField
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
    setDefinitionForm({
      attributeGroupId: definitionQuery.data.definition.attributeGroupId,
      code: definitionQuery.data.definition.code,
      name: definitionQuery.data.definition.name,
      description: definitionQuery.data.definition.description ?? '',
      dataType: definitionQuery.data.definition.dataType,
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
        dataType: definitionForm.dataType,
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
        <div className="form-grid">
          <TextField label="Название группы" value={groupForm.name} onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))} />
          <TextField label="Slug" value={groupForm.slug} onChange={(event) => setGroupForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <TextAreaField label="Описание" rows={3} value={groupForm.description} onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))} />
          <TextField label="Sort order" type="number" value={String(groupForm.sortOrder)} onChange={(event) => setGroupForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <CheckboxField label="Группа активна" checked={groupForm.isActive} onChange={(value) => setGroupForm((prev) => ({ ...prev, isActive: value }))} />
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
      </Card>

      <Card title="Редактор атрибута" description="Тип данных, фильтры, variant-логика и options на одной панели.">
        <div className="form-grid">
          <SelectField
            label="Группа"
            value={definitionForm.attributeGroupId}
            onChange={(event) => setDefinitionForm((prev) => ({ ...prev, attributeGroupId: event.target.value }))}
            options={[
              { value: '', label: 'Выбери группу' },
              ...(groupsQuery.data?.items.map((item) => ({ value: item.id, label: item.name })) ?? []),
            ]}
          />
          <TextField label="Код" value={definitionForm.code} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, code: event.target.value }))} />
          <TextField label="Название" value={definitionForm.name} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, name: event.target.value }))} />
          <SelectField
            label="Тип данных"
            value={definitionForm.dataType}
            onChange={(event) => setDefinitionForm((prev) => ({ ...prev, dataType: event.target.value }))}
            options={['Text', 'Number', 'Boolean', 'Date', 'Option', 'MultiOption', 'Json'].map((value) => ({ value, label: value }))}
          />
          <TextField label="Unit" value={definitionForm.unit} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, unit: event.target.value }))} />
          <TextField label="Sort order" type="number" value={String(definitionForm.sortOrder)} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
          <TextAreaField className="field-span-2" label="Описание" rows={3} value={definitionForm.description} onChange={(event) => setDefinitionForm((prev) => ({ ...prev, description: event.target.value }))} />
          <CheckboxField label="Filterable" checked={definitionForm.isFilterable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isFilterable: value }))} />
          <CheckboxField label="Searchable" checked={definitionForm.isSearchable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isSearchable: value }))} />
          <CheckboxField label="Comparable" checked={definitionForm.isComparable} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isComparable: value }))} />
          <CheckboxField label="Variant defining" checked={definitionForm.isVariantDefining} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isVariantDefining: value }))} />
          <CheckboxField label="Required" checked={definitionForm.isRequired} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isRequired: value }))} />
          <CheckboxField label="Активен" checked={definitionForm.isActive} onChange={(value) => setDefinitionForm((prev) => ({ ...prev, isActive: value }))} />
        </div>

        {(definitionForm.dataType === 'Option' || definitionForm.dataType === 'MultiOption') && (
          <Card title="Options" className="inner-card">
            <div className="stack-list compact">
              {definitionForm.options.map((item, index) => (
                <div key={String(item.id ?? index)} className="matrix-row">
                  <TextField
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
