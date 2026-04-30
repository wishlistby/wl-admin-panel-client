import { useMemo, useState } from 'react';
import { marketingApi, productsApi, setupApi } from '@/shared/api/catalog-api';
import type { ProductCollection, SearchRedirect, SearchSynonym, SeoLandingPage } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/shared/ui/Fields';
import { ResourceManager } from '@/shared/ui/ResourceManager';
import { Tabs } from '@/shared/ui/Tabs';

type MarketingTab = 'collections' | 'seo' | 'synonyms' | 'redirects';

export function MarketingPage() {
  const [tab, setTab] = useState<MarketingTab>('collections');

  return (
    <div className="page-stack">
      <Card title="Маркетинг и SEO" description="Отдельный слой для витрин, SEO-страниц и правил поиска.">
        <Tabs
          activeId={tab}
          onChange={(value) => setTab(value as MarketingTab)}
          items={[
            { id: 'collections', label: 'Подборки' },
            { id: 'seo', label: 'SEO pages' },
            { id: 'synonyms', label: 'Search synonyms' },
            { id: 'redirects', label: 'Search redirects' },
          ]}
        />
      </Card>

      {tab === 'collections' && <CollectionsManager />}
      {tab === 'seo' && <SeoManager />}
      {tab === 'synonyms' && <SynonymsManager />}
      {tab === 'redirects' && <RedirectsManager />}
    </div>
  );
}

function CollectionsManager() {
  const bootstrapQuery = useMemo(() => setupApi.bootstrap, []);
  const [selectedId, setSelectedId] = useState('');
  const collectionsQuery = useMemo(() => marketingApi.collections, []);
  const productsList = useMemo(() => productsApi.list, []);

  return (
    <ResourceManager<ProductCollection, Record<string, unknown>>
      queryKey="collections"
      title="Подборки"
      description="Ручные или сезонные витрины. Список товаров внутри можно редактировать прямо здесь."
      list={collectionsQuery.list}
      getById={async (id) => {
        setSelectedId(id);
        return (await collectionsQuery.getDetail(id)).collection;
      }}
      create={collectionsQuery.create}
      update={collectionsQuery.update}
      remove={collectionsQuery.remove}
      toForm={(entity) => ({
        name: entity?.name ?? '',
        slug: entity?.slug ?? '',
        description: entity?.description ?? '',
        collectionType: entity?.collectionType ?? 'Manual',
        isIndexable: entity?.isIndexable ?? false,
        metaTitle: entity?.metaTitle ?? '',
        metaDescription: entity?.metaDescription ?? '',
        h1: entity?.h1 ?? '',
        seoText: entity?.seoText ?? '',
        isActive: entity?.isActive ?? true,
        items: [] as Array<Record<string, unknown>>,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.name}</strong>
          <span>
            {item.slug} · {item.collectionType}
          </span>
        </>
      )}
      renderForm={(form, setForm) => (
        <CollectionForm form={form} setForm={setForm} selectedId={selectedId} getCollectionDetail={collectionsQuery.getDetail} getProducts={productsList} bootstrap={bootstrapQuery} />
      )}
    />
  );
}

function CollectionForm({
  form,
  setForm,
  selectedId,
  getCollectionDetail,
  getProducts,
  bootstrap,
}: {
  form: Record<string, unknown>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  selectedId: string;
  getCollectionDetail: (id: string) => Promise<{ collection: ProductCollection; items: Array<Record<string, unknown>> }>;
  getProducts: typeof productsApi.list;
  bootstrap: typeof setupApi.bootstrap;
}) {
  const [loadedId, setLoadedId] = useState('');
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);

  if (selectedId && selectedId !== loadedId) {
    void getCollectionDetail(selectedId).then((detail) => {
      setForm((prev) => ({
        ...prev,
        items: detail.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        })),
      }));
      setLoadedId(selectedId);
    });
  }

  if (productOptions.length === 0) {
    void getProducts({ page: 1, pageSize: 100, includeInactive: true, search: '' }).then((response) => {
      setProductOptions(response.items.map((item) => ({ value: item.id, label: item.name })));
    });
  }

  void bootstrap();

  const items = Array.isArray(form.items) ? (form.items as Array<Record<string, unknown>>) : [];

  return (
    <>
      <TextField label="Название" value={String(form.name ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      <TextField label="Slug" value={String(form.slug ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
      <TextAreaField className="field-span-2" label="Описание" rows={3} value={String(form.description ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
      <SelectField
        label="Тип подборки"
        value={String(form.collectionType ?? 'Manual')}
        onChange={(event) => setForm((prev) => ({ ...prev, collectionType: event.target.value }))}
        options={['Manual', 'Dynamic', 'Seasonal', 'Featured', 'Bestseller'].map((value) => ({ value, label: value }))}
      />
      <TextField label="H1" value={String(form.h1 ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, h1: event.target.value }))} />
      <TextField label="Meta title" value={String(form.metaTitle ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, metaTitle: event.target.value }))} />
      <TextAreaField className="field-span-2" label="Meta description" rows={3} value={String(form.metaDescription ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))} />
      <TextAreaField className="field-span-2" label="SEO text" rows={5} value={String(form.seoText ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, seoText: event.target.value }))} />
      <CheckboxField label="Индексировать подборку" checked={Boolean(form.isIndexable)} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
      <CheckboxField label="Активна" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />

      <div className="field-span-2">
        <Card title="Товары внутри подборки" className="inner-card">
          <div className="stack-list compact">
            {items.map((item, index) => (
              <div key={String(item.id ?? index)} className="matrix-row">
                <SelectField
                  label="Товар"
                  value={String(item.productId ?? '')}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      items: items.map((entry, current) =>
                        current === index ? { ...entry, productId: event.target.value } : entry,
                      ),
                    }))
                  }
                  options={[{ value: '', label: 'Выбери товар' }, ...productOptions]}
                />
                <TextField
                  label="Порядок"
                  type="number"
                  value={String(item.sortOrder ?? 0)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      items: items.map((entry, current) =>
                        current === index ? { ...entry, sortOrder: Number(event.target.value) } : entry,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setForm((prev) => ({ ...prev, items: [...items, { id: crypto.randomUUID(), productId: '', sortOrder: items.length + 1, isActive: true }] }))}>
            Добавить товар
          </Button>
        </Card>
      </div>
    </>
  );
}

function SeoManager() {
  const bootstrapQuery = useMemo(() => setupApi.bootstrap, []);

  return (
    <ResourceManager<SeoLandingPage, Record<string, unknown>>
      queryKey="seo-pages"
      title="SEO landing pages"
      description="Посадочные страницы под категории, бренды, подборки и фильтрационные комбинации."
      list={marketingApi.seo.list}
      getById={marketingApi.seo.getById}
      create={marketingApi.seo.create}
      update={marketingApi.seo.update}
      remove={marketingApi.seo.remove}
      toForm={(entity) => ({
        slug: entity?.slug ?? '',
        pageType: entity?.pageType ?? 'Category',
        catalogCategoryId: entity?.catalogCategoryId ?? '',
        brandId: entity?.brandId ?? '',
        productCollectionId: entity?.productCollectionId ?? '',
        title: entity?.title ?? '',
        h1: entity?.h1 ?? '',
        metaTitle: entity?.metaTitle ?? '',
        metaDescription: entity?.metaDescription ?? '',
        seoText: entity?.seoText ?? '',
        canonicalUrl: entity?.canonicalUrl ?? '',
        isIndexable: entity?.isIndexable ?? false,
        filterConfigJson: entity?.filterConfigJson ?? '',
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.title}</strong>
          <span>
            {item.pageType} · {item.slug}
          </span>
        </>
      )}
      renderForm={(form, setForm) => <SeoForm form={form} setForm={setForm} bootstrap={bootstrapQuery} />}
    />
  );
}

function SeoForm({
  form,
  setForm,
  bootstrap,
}: {
  form: Record<string, unknown>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  bootstrap: typeof setupApi.bootstrap;
}) {
  const [bootstrapData, setBootstrapData] = useState<Awaited<ReturnType<typeof setupApi.bootstrap>> | null>(null);

  if (!bootstrapData) {
    void bootstrap().then(setBootstrapData);
  }

  const categories = flattenCategoryOptions(bootstrapData?.categories ?? []);

  return (
    <>
      <TextField label="Slug" value={String(form.slug ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
      <SelectField
        label="Page type"
        value={String(form.pageType ?? 'Category')}
        onChange={(event) => setForm((prev) => ({ ...prev, pageType: event.target.value }))}
        options={['Category', 'Brand', 'Collection', 'CategoryBrand', 'CategoryAttribute', 'CustomFilter'].map((value) => ({ value, label: value }))}
      />
      <TextField label="Title" value={String(form.title ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
      <TextField label="H1" value={String(form.h1 ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, h1: event.target.value }))} />
      <SelectField
        label="Категория"
        value={String(form.catalogCategoryId ?? '')}
        onChange={(event) => setForm((prev) => ({ ...prev, catalogCategoryId: event.target.value }))}
        options={[{ value: '', label: 'Не выбрана' }, ...categories]}
      />
      <SelectField
        label="Бренд"
        value={String(form.brandId ?? '')}
        onChange={(event) => setForm((prev) => ({ ...prev, brandId: event.target.value }))}
        options={[
          { value: '', label: 'Не выбран' },
          ...(bootstrapData?.brands.map((item) => ({ value: item.id, label: item.name })) ?? []),
        ]}
      />
      <SelectField
        label="Подборка"
        value={String(form.productCollectionId ?? '')}
        onChange={(event) => setForm((prev) => ({ ...prev, productCollectionId: event.target.value }))}
        options={[
          { value: '', label: 'Не выбрана' },
          ...(bootstrapData?.collections.map((item) => ({ value: item.id, label: item.name })) ?? []),
        ]}
      />
      <TextField className="field-span-2" label="Canonical URL" value={String(form.canonicalUrl ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, canonicalUrl: event.target.value }))} />
      <TextAreaField className="field-span-2" label="Meta description" rows={3} value={String(form.metaDescription ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))} />
      <TextAreaField className="field-span-2" label="SEO text" rows={5} value={String(form.seoText ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, seoText: event.target.value }))} />
      <TextAreaField className="field-span-2" label="Filter config JSON" rows={5} value={String(form.filterConfigJson ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, filterConfigJson: event.target.value }))} />
      <CheckboxField label="Индексировать страницу" checked={Boolean(form.isIndexable)} onChange={(value) => setForm((prev) => ({ ...prev, isIndexable: value }))} />
      <CheckboxField label="Активна" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
    </>
  );
}

function SynonymsManager() {
  return (
    <ResourceManager<SearchSynonym, Record<string, unknown>>
      queryKey="search-synonyms"
      title="Search synonyms"
      description="Нужны, чтобы пользователь находил один и тот же товар по разным словам."
      list={marketingApi.synonyms.list}
      getById={marketingApi.synonyms.getById}
      create={marketingApi.synonyms.create}
      update={marketingApi.synonyms.update}
      remove={marketingApi.synonyms.remove}
      toForm={(entity) => ({
        term: entity?.term ?? '',
        synonymsJson: entity?.synonymsJson ?? '[""]',
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.term}</strong>
          <span>{item.synonymsJson}</span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField label="Термин" value={String(form.term ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, term: event.target.value }))} />
          <CheckboxField label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
          <TextAreaField className="field-span-2" label="Synonyms JSON" rows={5} value={String(form.synonymsJson ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, synonymsJson: event.target.value }))} />
        </>
      )}
    />
  );
}

function RedirectsManager() {
  return (
    <ResourceManager<SearchRedirect, Record<string, unknown>>
      queryKey="search-redirects"
      title="Search redirects"
      description="Когда по конкретному запросу лучше сразу открывать подготовленную страницу."
      list={marketingApi.redirects.list}
      getById={marketingApi.redirects.getById}
      create={marketingApi.redirects.create}
      update={marketingApi.redirects.update}
      remove={marketingApi.redirects.remove}
      toForm={(entity) => ({
        searchTerm: entity?.searchTerm ?? '',
        targetUrl: entity?.targetUrl ?? '',
        isActive: entity?.isActive ?? true,
      })}
      renderSummary={(item) => (
        <>
          <strong>{item.searchTerm}</strong>
          <span>{item.targetUrl}</span>
        </>
      )}
      renderForm={(form, setForm) => (
        <>
          <TextField label="Поисковый запрос" value={String(form.searchTerm ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, searchTerm: event.target.value }))} />
          <TextField label="Target URL" value={String(form.targetUrl ?? '')} onChange={(event) => setForm((prev) => ({ ...prev, targetUrl: event.target.value }))} />
          <CheckboxField label="Активен" checked={Boolean(form.isActive)} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
        </>
      )}
    />
  );
}

function flattenCategoryOptions(nodes: Array<{ id: string; name: string; depth: number; children: Array<any> }>): Array<{ value: string; label: string }> {
  return nodes.flatMap((node) => [
    { value: node.id, label: `${'· '.repeat(node.depth)}${node.name}` },
    ...flattenCategoryOptions(node.children),
  ]);
}
