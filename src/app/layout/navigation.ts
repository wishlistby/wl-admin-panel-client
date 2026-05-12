import {
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Network,
  ShieldCheck,
  Settings2,
  Shapes,
  type LucideIcon,
} from 'lucide-react';

export const navigationIcons: Record<string, LucideIcon> = {
  access: ShieldCheck,
  dashboard: LayoutDashboard,
  marketing: FolderKanban,
  partners: Network,
  products: Boxes,
  settings: Settings2,
  structure: Shapes,
};

export const fallbackNavigationIcon = LayoutDashboard;
