export type FieldDoc = {
  key: string;
  sectionId: string;
  label: string;
  short: string;
};

const fieldDocs: FieldDoc[] = [
  { key: 'product-name', sectionId: 'product-card', label: 'Название товара', short: 'Основное имя карточки товара. Описывает модель, а не конкретный SKU.' },
  { key: 'generic-name', sectionId: 'mental-model', label: 'Название', short: 'Человекочитаемое имя сущности. Его роль зависит от текущего раздела и связанной модели.' },
  { key: 'slug', sectionId: 'seo-search', label: 'Slug', short: 'Читаемый идентификатор для URL и внутренних маршрутов. Должен быть стабильным и осмысленным.' },
  { key: 'product-type', sectionId: 'product-types', label: 'Тип товара', short: 'Определяет схему атрибутов и набор характеристик, которые допустимы у товара.' },
  { key: 'brand', sectionId: 'product-card', label: 'Бренд', short: 'Бренд карточки. Участвует в фильтрах, брендовых страницах и SEO-контексте.' },
  { key: 'primary-category', sectionId: 'categories', label: 'Основная категория', short: 'Главная точка входа товара в каталог, навигацию и хлебные крошки.' },
  { key: 'external-id', sectionId: 'product-card', label: 'External ID', short: 'Внешний идентификатор для интеграций. Не заменяет SKU и не должен подменять бизнес-ключ товара.' },
  { key: 'product-status', sectionId: 'product-card', label: 'Статус', short: 'Бизнес-состояние товара в жизненном цикле. Отличается от видимости на витрине.' },
  { key: 'product-visibility', sectionId: 'product-card', label: 'Видимость', short: 'Управляет тем, как и где товар показывается пользователю.' },
  { key: 'short-description', sectionId: 'product-card', label: 'Короткое описание', short: 'Краткий витринный анонс для списков и быстрых блоков карточки.' },
  { key: 'full-description', sectionId: 'product-card', label: 'Полное описание', short: 'Развёрнутое описание модели товара со всеми важными деталями.' },
  { key: 'product-active', sectionId: 'product-card', label: 'Товар активен', short: 'Технический флаг активности записи. Обычно работает вместе со статусом и видимостью.' },

  { key: 'parent-category', sectionId: 'categories', label: 'Родитель', short: 'Родительская категория в дереве. Определяет вложенность и путь раздела.' },
  { key: 'full-path', sectionId: 'categories', label: 'Full path', short: 'Полный путь категории внутри дерева и SEO-контекста.' },
  { key: 'depth', sectionId: 'categories', label: 'Depth', short: 'Глубина категории в дереве. Обычно меняется вместе с положением в иерархии.' },
  { key: 'sort-order', sectionId: 'categories', label: 'Sort order', short: 'Порядок вывода среди соседних сущностей в интерфейсе и каталоге.' },
  { key: 'meta-title', sectionId: 'seo-search', label: 'Meta title', short: 'SEO-заголовок страницы или сущности для поисковой выдачи и вкладки браузера.' },
  { key: 'meta-description', sectionId: 'seo-search', label: 'Meta description', short: 'Краткое SEO-описание страницы для поисковых систем и сниппетов.' },
  { key: 'h1', sectionId: 'seo-search', label: 'H1', short: 'Основной видимый заголовок страницы на витрине.' },
  { key: 'seo-text', sectionId: 'seo-search', label: 'SEO text', short: 'Текстовый блок для поискового входа, контекста раздела или посадочной страницы.' },
  { key: 'canonical-url', sectionId: 'seo-search', label: 'Canonical URL', short: 'Канонический адрес страницы, помогающий избежать дублей в индексации.' },
  { key: 'category-indexable', sectionId: 'categories', label: 'Индексировать категорию', short: 'Разрешает поисковым системам индексировать страницу категории.' },
  { key: 'category-active', sectionId: 'categories', label: 'Категория активна', short: 'Включает категорию как рабочий и доступный раздел каталога.' },
  { key: 'propagate-visibility', sectionId: 'categories', label: 'Применить видимость к дочерним', short: 'Распространяет текущие правила активности и индексируемости на дочерние разделы.' },
  { key: 'category-attribute', sectionId: 'product-types', label: 'Атрибут', short: 'Характеристика, которая подключается к типу товара или категории.' },
  { key: 'sort-order-generic', sectionId: 'mental-model', label: 'Порядок', short: 'Управляет порядком внутри списка, фильтра, подборки или связей.' },
  { key: 'visible-in-filter', sectionId: 'categories', label: 'Показывать в фильтре', short: 'Делает атрибут видимым в фасетной навигации текущей категории.' },
  { key: 'expanded-by-default', sectionId: 'categories', label: 'Раскрывать по умолчанию', short: 'Определяет начальное состояние блока фильтра на витрине.' },
  { key: 'seo-relevant', sectionId: 'seo-search', label: 'SEO-relevant', short: 'Помечает атрибут как значимый для SEO-страниц и фильтрационных комбинаций.' },

  { key: 'attribute-group-name', sectionId: 'product-types', label: 'Название группы', short: 'Имя визуальной группы атрибутов для редактора и витрины.' },
  { key: 'code', sectionId: 'product-types', label: 'Код', short: 'Стабильный машинный код сущности или атрибута для интеграций и бизнес-логики.' },
  { key: 'data-type', sectionId: 'product-types', label: 'Тип данных', short: 'Определяет формат значения атрибута: text, number, option и другие.' },
  { key: 'unit', sectionId: 'product-types', label: 'Unit', short: 'Единица измерения числового атрибута, например мл, кг или см.' },
  { key: 'filterable', sectionId: 'product-types', label: 'Filterable', short: 'Разрешает использовать атрибут в фильтрации при подходящей настройке категории.' },
  { key: 'searchable', sectionId: 'product-types', label: 'Searchable', short: 'Разрешает поисковому слою учитывать атрибут при поиске.' },
  { key: 'comparable', sectionId: 'product-types', label: 'Comparable', short: 'Показывает, можно ли использовать атрибут в сравнении товаров.' },
  { key: 'variant-defining', sectionId: 'product-vs-variant', label: 'Variant defining', short: 'Показывает, отличает ли атрибут один SKU от другого.' },
  { key: 'required', sectionId: 'product-types', label: 'Required', short: 'Обязательное поле или атрибут, без которого сущность считается неполной.' },
  { key: 'value-text', sectionId: 'attribute-values', label: 'Value text', short: 'Текстовое значение атрибута для свободного текстового сценария.' },
  { key: 'value-number', sectionId: 'attribute-values', label: 'Value number', short: 'Числовое значение атрибута для измеряемых характеристик.' },
  { key: 'value-boolean', sectionId: 'attribute-values', label: 'Value boolean', short: 'Логическое значение да/нет для признака атрибута.' },
  { key: 'value-date', sectionId: 'attribute-values', label: 'Value date', short: 'Дата как самостоятельное значение характеристики.' },
  { key: 'value-json', sectionId: 'attribute-values', label: 'Value JSON', short: 'Резервный сложный формат для нестандартных структур, когда простых типов недостаточно.' },

  { key: 'sku-name', sectionId: 'product-vs-variant', label: 'Название SKU', short: 'Имя конкретного варианта товара, обычно описывает отличие от базовой модели.' },
  { key: 'sku', sectionId: 'product-vs-variant', label: 'SKU', short: 'Уникальный артикул конкретного покупаемого варианта товара.' },
  { key: 'barcode', sectionId: 'product-vs-variant', label: 'Barcode', short: 'Штрихкод варианта товара для складского и кассового контуров.' },
  { key: 'price', sectionId: 'pricing', label: 'Price', short: 'Текущая рабочая цена товара или варианта.' },
  { key: 'old-price', sectionId: 'pricing', label: 'Old price', short: 'Предыдущая или зачёркнутая цена для сравнения и промо-сценариев.' },
  { key: 'currency', sectionId: 'pricing', label: 'Currency', short: 'Валюта цены, прайс-листа или внешнего предложения.' },
  { key: 'stock-quantity', sectionId: 'inventory', label: 'Stock quantity', short: 'Быстрый показатель остатка у варианта. Не отменяет складской слой InventoryStock.' },
  { key: 'weight', sectionId: 'inventory', label: 'Weight', short: 'Вес конкретного варианта, влияющий на логистику и расчёты доставки.' },
  { key: 'width', sectionId: 'inventory', label: 'Width', short: 'Ширина конкретного SKU как логистический параметр.' },
  { key: 'height', sectionId: 'inventory', label: 'Height', short: 'Высота конкретного SKU как логистический параметр.' },
  { key: 'depth-dimension', sectionId: 'inventory', label: 'Depth', short: 'Глубина конкретного SKU как логистический параметр.' },
  { key: 'sku-default', sectionId: 'inventory', label: 'SKU по умолчанию', short: 'Вариант, который система считает основным при открытии карточки.' },
  { key: 'sku-available', sectionId: 'inventory', label: 'Доступен к покупке', short: 'Флаг, который показывает, можно ли продавать этот вариант прямо сейчас.' },
  { key: 'media-url', sectionId: 'media', label: 'URL', short: 'Ссылка на изображение или другой медиаресурс внутри карточки товара.' },
  { key: 'media-alt', sectionId: 'media', label: 'Alt text', short: 'Альтернативное описание медиа для доступности и SEO.' },
  { key: 'media-type', sectionId: 'media', label: 'Тип медиа', short: 'Определяет роль медиа: основное изображение, галерея и другие форматы.' },
  { key: 'price-list', sectionId: 'pricing', label: 'Прайс-лист', short: 'Ценовой контур, в котором действует эта цена.' },
  { key: 'warehouse', sectionId: 'inventory', label: 'Склад', short: 'Склад, на котором хранится остаток конкретного SKU.' },
  { key: 'quantity', sectionId: 'inventory', label: 'Quantity', short: 'Общее количество единиц на складе.' },
  { key: 'reserved', sectionId: 'inventory', label: 'Reserved', short: 'Количество единиц, уже зарезервированных под заказы.' },
  { key: 'available', sectionId: 'inventory', label: 'Available', short: 'Количество единиц, доступных к продаже после вычета резервов.' },

  { key: 'collection-type', sectionId: 'marketing', label: 'Тип подборки', short: 'Определяет бизнес-сценарий подборки: ручная, сезонная, промо и другие.' },
  { key: 'collection', sectionId: 'marketing', label: 'Подборка', short: 'Маркетинговая витрина или curated-список товаров.' },
  { key: 'relation-type', sectionId: 'marketing', label: 'Тип связи', short: 'Смысл связи между товарами: аксессуар, похожий, комплект, замена и так далее.' },
  { key: 'collection-indexable', sectionId: 'marketing', label: 'Индексировать подборку', short: 'Разрешает индексировать страницу подборки как отдельную витрину.' },
  { key: 'active-page', sectionId: 'marketing', label: 'Активна', short: 'Технический флаг активности маркетинговой или SEO-сущности.' },
  { key: 'product-select', sectionId: 'marketing', label: 'Товар', short: 'Товар, который добавляется в подборку или участвует в маркетинговой связи.' },
  { key: 'page-type', sectionId: 'seo-search', label: 'Page type', short: 'Тип SEO-страницы: категория, бренд, подборка или фильтрационная конфигурация.' },
  { key: 'title', sectionId: 'seo-search', label: 'Title', short: 'Главный заголовок SEO-сущности или страницы для интерфейса и поисковой выдачи.' },
  { key: 'category-select', sectionId: 'categories', label: 'Категория', short: 'Категория, к которой привязывается SEO-страница или другая сущность.' },
  { key: 'filter-config', sectionId: 'seo-search', label: 'Filter config JSON', short: 'Конфигурация фильтров, которую должна открыть SEO-страница.' },
  { key: 'indexable-page', sectionId: 'seo-search', label: 'Индексировать страницу', short: 'Разрешает индексировать SEO-страницу поисковыми системами.' },
  { key: 'indexable-generic', sectionId: 'seo-search', label: 'Индексировать', short: 'Управляет индексируемостью сущности или страницы в поиске.' },
  { key: 'term', sectionId: 'seo-search', label: 'Термин', short: 'Базовый поисковый термин, для которого задаются синонимы.' },
  { key: 'synonyms-json', sectionId: 'seo-search', label: 'Synonyms JSON', short: 'Набор синонимов для поискового запроса в структурированном виде.' },
  { key: 'search-query', sectionId: 'seo-search', label: 'Поисковый запрос', short: 'Конкретный запрос пользователя, на который настраивается редирект.' },
  { key: 'target-url', sectionId: 'seo-search', label: 'Target URL', short: 'Адрес назначения для поискового редиректа.' },

  { key: 'country', sectionId: 'setup-flow', label: 'Страна', short: 'Страна бренда, склада или другого справочника, где это важно для контекста и интеграций.' },
  { key: 'logo-url', sectionId: 'media', label: 'Логотип URL', short: 'Ссылка на логотип бренда или внешний графический ресурс.' },
  { key: 'website-url', sectionId: 'seo-search', label: 'Website URL', short: 'Официальный сайт сущности или внешний URL для справочного контекста.' },
  { key: 'description-generic', sectionId: 'mental-model', label: 'Описание', short: 'Текстовое описание сущности. Его роль зависит от раздела: бренд, тег, подборка или партнёрский товар.' },
  { key: 'active-generic', sectionId: 'mental-model', label: 'Активен', short: 'Технический флаг активности записи. Показывает, доступна ли сущность в рабочем контуре.' },
  { key: 'customer-segment', sectionId: 'pricing', label: 'Сегмент клиентов', short: 'Группа покупателей, для которой действует прайс-лист.' },
  { key: 'default-generic', sectionId: 'mental-model', label: 'По умолчанию', short: 'Признак основной записи в своей группе: прайс-листа, SKU или склада.' },
  { key: 'city', sectionId: 'inventory', label: 'Город', short: 'Город расположения склада или логистической точки.' },
  { key: 'address', sectionId: 'inventory', label: 'Адрес', short: 'Физический адрес склада или другой операционной точки.' },
  { key: 'default-warehouse', sectionId: 'inventory', label: 'Склад по умолчанию', short: 'Основной склад, который удобно использовать как базовый операционный контур.' },
  { key: 'tag-indexable', sectionId: 'marketing', label: 'Индексировать страницу тега', short: 'Разрешает индексировать страницу, построенную на теге.' },
  { key: 'type-active', sectionId: 'product-types', label: 'Тип активен', short: 'Включает тип товара в рабочий каталог и делает его доступным для использования.' },
  { key: 'attribute-required', sectionId: 'product-types', label: 'Обязателен', short: 'Показывает, обязателен ли атрибут для типа товара или конкретной настройки.' },
  { key: 'attribute-filterable-ru', sectionId: 'product-types', label: 'Фильтруемый', short: 'Позволяет использовать атрибут в фильтрах текущего бизнес-сценария.' },
  { key: 'group', sectionId: 'product-types', label: 'Группа', short: 'Группа атрибутов, к которой относится характеристика.' },
  { key: 'group-active', sectionId: 'product-types', label: 'Группа активна', short: 'Флаг активности группы атрибутов в редакторе и схеме каталога.' },
  { key: 'option-value', sectionId: 'attribute-values', label: 'Value', short: 'Текстовое представление option-значения атрибута.' },
  { key: 'option-slug', sectionId: 'attribute-values', label: 'Значение', short: 'Человекочитаемое значение атрибута или option-элемента.' },
  { key: 'media-main', sectionId: 'media', label: 'Основное', short: 'Отмечает медиа как главное изображение или основной визуальный элемент.' },
  { key: 'localized-price', sectionId: 'pricing', label: 'Цена', short: 'Текущая рабочая цена в локализованной форме.' },
  { key: 'localized-old-price', sectionId: 'pricing', label: 'Старая цена', short: 'Предыдущая цена в локализованной форме для промо-отображения.' },

  { key: 'product-url', sectionId: 'partner-products', label: 'URL товара', short: 'Внешняя ссылка на партнёрское товарное предложение.' },
  { key: 'photo-url', sectionId: 'partner-products', label: 'URL фото', short: 'Внешняя ссылка на изображение партнёрского товара.' },
  { key: 'shop', sectionId: 'partner-products', label: 'Магазин', short: 'Название магазина или источника партнёрского предложения.' },
  { key: 'partner', sectionId: 'partner-products', label: 'Partner', short: 'Партнёр или провайдер внешнего товарного оффера.' },
  { key: 'start-date', sectionId: 'partner-products', label: 'Start date', short: 'Дата начала действия партнёрского предложения или акции.' },
  { key: 'hot', sectionId: 'partner-products', label: 'Hot', short: 'Флаг повышенного приоритета или промо-статуса партнёрского предложения.' },
];

const fieldDocByKey = new Map(fieldDocs.map((item) => [item.key, item]));
const fieldDocByLabel = new Map(fieldDocs.map((item) => [item.label.toLowerCase(), item]));

export function getFieldDoc(docKey?: string, label?: string) {
  if (docKey && fieldDocByKey.has(docKey)) {
    return fieldDocByKey.get(docKey) ?? null;
  }

  if (label) {
    return fieldDocByLabel.get(label.toLowerCase()) ?? null;
  }

  return null;
}
