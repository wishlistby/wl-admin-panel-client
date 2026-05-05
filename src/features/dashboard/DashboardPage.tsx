import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Boxes, FolderTree, PackageSearch, Search, Workflow } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setupApi } from '@/shared/api/catalog-api';
import { Card } from '@/shared/ui/Card';
import { catalogDocSections } from '@/features/dashboard/docs/catalogDocs';
import { getFieldDoc, getFieldDocsBySection } from '@/features/dashboard/docs/fieldDocs';

const statCards = [
  { key: 'brands', label: 'Бренды', icon: PackageSearch },
  { key: 'categories', label: 'Категории', icon: FolderTree },
  { key: 'productTypes', label: 'Типы товаров', icon: Workflow },
  { key: 'collections', label: 'Подборки', icon: Boxes },
] as const;

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const bootstrap = useQuery({
    queryKey: ['catalog-bootstrap'],
    queryFn: setupApi.bootstrap,
  });
  const activeSectionId = searchParams.get('section') ?? '';
  const activeFieldKey = searchParams.get('field') ?? '';
  const returnTo = searchParams.get('returnTo');

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return catalogDocSections;
    }

    return catalogDocSections.filter((section) => {
      const fieldDocs = getFieldDocsBySection(section.id);
      const haystack = [
        section.title,
        section.summary,
        ...section.description,
        ...(section.bullets ?? []),
        ...(section.relatedFields ?? []),
        ...fieldDocs.flatMap((doc) => [doc.label, doc.short, doc.purpose, doc.example, ...doc.howToFill, ...doc.relations, ...doc.pitfalls]),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query]);

  useEffect(() => {
    if (!activeSectionId && !activeFieldKey) {
      return;
    }

    const timer = window.setTimeout(() => {
      const fieldAnchor = activeFieldKey ? getFieldDoc(activeFieldKey)?.anchorId : null;
      const targetId = fieldAnchor ?? `${activeSectionId}-top`;
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [activeFieldKey, activeSectionId]);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">React admin workspace</span>
          <h1>Одна панель для полной работы с каталогом webshop</h1>
          <p>
            Интерфейс разделён на справочники, структуру, товары и маркетинг. Сценарий заведения товара
            можно проходить сверху вниз без переключения между случайными экранами.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        {statCards.map((item) => {
          const Icon = item.icon;
          const count = bootstrap.data
            ? item.key === 'categories'
              ? bootstrap.data.categories.length
              : bootstrap.data[item.key].length
            : '—';

          return (
            <Card key={item.key} className="stat-card">
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <strong>{count}</strong>
              <span>{item.label}</span>
            </Card>
          );
        })}
      </div>

      <div className="grid-two">
        <Card title="Как лучше работать" description="Рекомендуемый поток для администратора">
          <ol className="ordered-list">
            <li>Сначала заполнить бренды, прайсы, склады и теги.</li>
            <li>Потом выстроить категории, типы товаров и атрибуты.</li>
            <li>Дальше заводить карточку товара и SKU в разделе «Товары».</li>
            <li>В конце дополнять подборками, SEO и поисковыми правилами.</li>
          </ol>
        </Card>

        <Card title="Что покрыто в этой версии" description="Фронт уже подключён к admin API webshop">
          <ul className="bullet-list">
            <li>Плоские справочники: бренды, прайсы, склады, теги.</li>
            <li>Дерево категорий и схема характеристик.</li>
            <li>Полный редактор карточки товара с вариантами, ценами, остатками и медиа.</li>
            <li>Подборки, SEO landing pages, search synonyms и redirects.</li>
          </ul>
        </Card>
      </div>

      <div className="docs-layout">
        <Card
          title="Навигатор по модели"
          description="Короткое оглавление по объединённой документации администратора и модели сущностей."
          className="docs-sidebar-card"
        >
          <div className="stack-list">
            <label className="search-box docs-search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти сущность, поле или сценарий" />
            </label>

            {returnTo && (
              <button type="button" className="button button-secondary docs-back-button" onClick={() => navigate(returnTo)}>
                <ArrowLeft size={16} />
                <span>Вернуться к форме</span>
              </button>
            )}

            <nav className="docs-toc">
              {filteredSections.map((section, index) => (
                <Link
                  key={section.id}
                  to={`/?section=${encodeURIComponent(section.id)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                  className={`docs-toc-link ${activeSectionId === section.id ? 'is-active' : ''}`}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{section.title}</strong>
                  <small>{section.summary}</small>
                </Link>
              ))}
            </nav>
          </div>
        </Card>

        <div className="page-stack">
          <Card
            title="Обзор раздела"
            description="Собранная в одном месте версия гайдов для администратора: что хранить, где это живёт в модели и как поля взаимодействуют между собой."
          >
            <div className="bullet-list">
              <li>Это не просто памятка по названиям сущностей, а рабочая карта для повседневного наполнения каталога.</li>
              <li>Каждый значок помощи в формах ведёт в нужный раздел этого обзора, а кнопка наверху возвращает вас обратно к исходному полю.</li>
              <li>Если задача прикладная, двигайтесь по схеме: справочники, структура, карточка товара, SKU, цены, остатки, медиа, маркетинг и SEO.</li>
            </div>
          </Card>

          {filteredSections.map((section) => (
            <div key={section.id} id={`${section.id}-top`} className="docs-section-anchor">
              <Card
                title={section.title}
                description={section.summary}
                className={`docs-section-card ${activeSectionId === section.id ? 'is-highlighted' : ''}`}
              >
                <section id={section.id} className="docs-section">
                <div className="stack-list compact">
                  {section.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.bullets && (
                  <ul className="bullet-list docs-bullets">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                {section.relatedFields && section.relatedFields.length > 0 && (
                  <div className="docs-related">
                    <strong>Связанные поля</strong>
                    <div className="chip-cloud">
                      {section.relatedFields.map((field) => (
                        <Link
                          key={field}
                          to={`/?section=${encodeURIComponent(section.id)}${getFieldDoc(undefined, field) ? `&field=${encodeURIComponent(getFieldDoc(undefined, field)!.key)}` : ''}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                          className="chip docs-chip-link"
                        >
                          {field}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {getFieldDocsBySection(section.id).length > 0 && (
                  <div className="docs-field-list">
                    <strong>Подробные расшифровки полей</strong>
                    <div className="stack-list compact">
                      {getFieldDocsBySection(section.id).map((doc) => (
                        <article
                          key={doc.key}
                          id={doc.anchorId}
                          className={`docs-field-card ${activeFieldKey === doc.key ? 'is-highlighted' : ''}`}
                        >
                          <div className="docs-field-head">
                            <h4>{doc.label}</h4>
                            <span>{doc.short}</span>
                          </div>

                          <div className="docs-field-block">
                            <strong>Для чего нужно</strong>
                            <p>{doc.purpose}</p>
                          </div>

                          <div className="docs-field-block">
                            <strong>Как связано с другими сущностями</strong>
                            <ul className="bullet-list docs-bullets">
                              {doc.relations.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="docs-field-block">
                            <strong>Как заполнять</strong>
                            <ul className="bullet-list docs-bullets">
                              {doc.howToFill.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="docs-field-block">
                            <strong>Пример</strong>
                            <p>{doc.example}</p>
                          </div>

                          <div className="docs-field-block">
                            <strong>Частые ошибки</strong>
                            <ul className="bullet-list docs-bullets">
                              {doc.pitfalls.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                </section>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
