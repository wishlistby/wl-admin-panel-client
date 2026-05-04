import { useMemo } from 'react';
import { setupApi } from '@/shared/api/catalog-api';
import type { Brand, PriceList, Tag, Warehouse } from '@/shared/api/types';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { useSessionState } from '@/shared/lib/session-state';
import { ResourceManager } from '@/shared/ui/ResourceManager';
import { Tabs } from '@/shared/ui/Tabs';

type SetupTab = 'brands' | 'priceLists' | 'warehouses' | 'tags';

export function SetupPage() {
  const [tab, setTab] = useSessionState<SetupTab>('setup:tab', 'brands');

  const tabs = useMemo(
    () => [
      { id: 'brands', label: 'Бренды' },
      { id: 'priceLists', label: 'Прайс-листы' },
      { id: 'warehouses', label: 'Склады' },
      { id: 'tags', label: 'Теги' },
    ],
    [],
  );

  return (
    <div className="page-stack">
      <Card
        title="Справочники каталога"
        description="Базовые сущности, без которых редактор товара становится шумным и неудобным."
      >
        <Tabs items={tabs} activeId={tab} onChange={(value) => setTab(value as SetupTab)} />
      </Card>

      {tab === 'brands' && <BrandsManager />}
      {tab === 'priceLists' && <PriceListsManager />}
      {tab === 'warehouses' && <WarehousesManager />}
      {tab === 'tags' && <TagsManager />}
    </div>
  );
}

function BrandsManager() {
  return (
    <ResourceManager<Brand, Record<string, unknown>>
      queryKey="brands"
      title="Бренды"
      description="Используются в карточке, фильтрах, брендовых страницах и SEO."
      list={setupApi.brands.list}
      getById={setupApi.brands.getById}
      create={setupApi.brands.create}
      update={setupApi.brands.update}
      remove={setupApi.brands.remove}
      toForm={(entity) => ({
        name: entity?.name ?? '',
        slug: entity?.slug ?? '',
        description: entity?.description ?? '',
        logoUrl: entity?.logoUrl ?? '',
        websiteUrl: entity?.websiteUrl ?? '',
        country: entity?.country ?? '',
        isIndexable: entity?.isIndexable ?? true,
        metaTitle: entity?.metaTitle ?? '',
        metaDescription: entity?.metaDescription ?? '',
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(brand) => (
        <>
          <strong>{brand.name}</strong>
          <span>{brand.slug}</span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField required docKey="brand" label="Название" value={String(form.name ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <TextField required docKey="slug" label="Slug" value={String(form.slug ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          <TextField docKey="country" label="Страна" value={String(form.country ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
          <TextField docKey="logo-url" label="Логотип URL" value={String(form.logoUrl ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))} />
          <TextField docKey="website-url" label="Website URL" value={String(form.websiteUrl ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))} />
          <TextField docKey="meta-title" label="Meta title" value={String(form.metaTitle ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))} />
          <TextAreaField docKey="description-generic" className="field-span-2" label="Описание" rows={4} value={String(form.description ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <TextAreaField docKey="meta-description" className="field-span-2" label="Meta description" rows={3} value={String(form.metaDescription ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))} />
          <CheckboxField docKey="indexable-generic" label="Индексировать" checked={Boolean(form.isIndexable)} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
          <CheckboxField docKey="active-generic" label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </>
      )}
    />
  );
}

function PriceListsManager() {
  return (
    <ResourceManager<PriceList, Record<string, unknown>>
      queryKey="price-lists"
      title="Прайс-листы"
      description="Розница, B2B, VIP или отдельные валютные контуры."
      list={setupApi.priceLists.list}
      getById={setupApi.priceLists.getById}
      create={setupApi.priceLists.create}
      update={setupApi.priceLists.update}
      remove={setupApi.priceLists.remove}
      toForm={(entity) => ({
        name: entity?.name ?? '',
        code: entity?.code ?? '',
        currency: entity?.currency ?? 'RUB',
        customerGroupCode: entity?.customerGroupCode ?? '',
        isDefault: entity?.isDefault ?? false,
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.name}</strong>
          <span>
            {item.code} · {item.currency}
          </span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField required docKey="price-list" label="Название" value={String(form.name ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <TextField required docKey="code" label="Код" value={String(form.code ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
          <TextField required docKey="currency" label="Валюта" value={String(form.currency ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
          <TextField docKey="customer-segment" label="Сегмент клиентов" value={String(form.customerGroupCode ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, customerGroupCode: e.target.value }))} />
          <CheckboxField docKey="default-generic" label="По умолчанию" checked={Boolean(form.isDefault)} onChange={(value) => setForm((prev) => ({ ...prev, isDefault: value }))} />
          <CheckboxField docKey="active-generic" label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </>
      )}
    />
  );
}

function WarehousesManager() {
  return (
    <ResourceManager<Warehouse, Record<string, unknown>>
      queryKey="warehouses"
      title="Склады"
      description="Используются в остатках SKU и операционном слое каталога."
      list={setupApi.warehouses.list}
      getById={setupApi.warehouses.getById}
      create={setupApi.warehouses.create}
      update={setupApi.warehouses.update}
      remove={setupApi.warehouses.remove}
      toForm={(entity) => ({
        name: entity?.name ?? '',
        code: entity?.code ?? '',
        address: entity?.address ?? '',
        city: entity?.city ?? '',
        country: entity?.country ?? '',
        isDefault: entity?.isDefault ?? false,
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.name}</strong>
          <span>
            {item.code} · {[item.city, item.country].filter(Boolean).join(', ')}
          </span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField required docKey="warehouse" label="Название" value={String(form.name ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <TextField required docKey="code" label="Код" value={String(form.code ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} />
          <TextField docKey="city" label="Город" value={String(form.city ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
          <TextField docKey="country" label="Страна" value={String(form.country ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
          <TextAreaField docKey="address" className="field-span-2" label="Адрес" rows={3} value={String(form.address ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
          <CheckboxField docKey="default-warehouse" label="Склад по умолчанию" checked={Boolean(form.isDefault)} onChange={(value) => setForm((prev) => ({ ...prev, isDefault: value }))} />
          <CheckboxField docKey="active-generic" label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </>
      )}
    />
  );
}

function TagsManager() {
  return (
    <ResourceManager<Tag, Record<string, unknown>>
      queryKey="tags"
      title="Теги"
      description="Мягкая тематическая классификация: подарок, эко, для офиса и похожие сценарии."
      list={setupApi.tags.list}
      getById={setupApi.tags.getById}
      create={setupApi.tags.create}
      update={setupApi.tags.update}
      remove={setupApi.tags.remove}
      toForm={(entity) => ({
        name: entity?.name ?? '',
        slug: entity?.slug ?? '',
        description: entity?.description ?? '',
        isIndexable: entity?.isIndexable ?? false,
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.name}</strong>
          <span>{item.slug}</span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField required docKey="generic-name" label="Название" value={String(form.name ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <TextField required docKey="slug" label="Slug" value={String(form.slug ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          <TextAreaField docKey="description-generic" className="field-span-2" label="Описание" rows={4} value={String(form.description ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <CheckboxField docKey="tag-indexable" label="Индексировать страницу тега" checked={Boolean(form.isIndexable)} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
          <CheckboxField docKey="active-generic" label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </>
      )}
    />
  );
}
