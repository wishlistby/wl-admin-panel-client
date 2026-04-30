import { useQuery } from '@tanstack/react-query';
import { Boxes, FolderTree, PackageSearch, Workflow } from 'lucide-react';
import { setupApi } from '@/shared/api/catalog-api';
import { Card } from '@/shared/ui/Card';

const statCards = [
  { key: 'brands', label: 'Бренды', icon: PackageSearch },
  { key: 'categories', label: 'Категории', icon: FolderTree },
  { key: 'productTypes', label: 'Типы товаров', icon: Workflow },
  { key: 'collections', label: 'Подборки', icon: Boxes },
] as const;

export function DashboardPage() {
  const bootstrap = useQuery({
    queryKey: ['catalog-bootstrap'],
    queryFn: setupApi.bootstrap,
  });

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
    </div>
  );
}
