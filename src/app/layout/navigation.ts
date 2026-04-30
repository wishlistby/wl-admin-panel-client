import {
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  Shapes,
} from 'lucide-react';

export const navigation = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, description: 'Состояние каталога и среды' },
  { to: '/setup', label: 'Справочники', icon: Settings2, description: 'Бренды, прайсы, склады, теги' },
  { to: '/structure', label: 'Структура', icon: Shapes, description: 'Категории, типы, атрибуты' },
  { to: '/products', label: 'Товары', icon: Boxes, description: 'Карточки, SKU, цены, медиа' },
  { to: '/marketing', label: 'Маркетинг', icon: FolderKanban, description: 'Подборки, SEO, поиск' },
] as const;
