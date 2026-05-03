import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/app/layout/AdminLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SetupPage } from '@/features/setup/SetupPage';
import { StructurePage } from '@/features/structure/StructurePage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { MarketingPage } from '@/features/marketing/MarketingPage';
import { PartnersPage } from '@/features/partners/PartnersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'setup', element: <SetupPage /> },
      { path: 'structure', element: <StructurePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'marketing', element: <MarketingPage /> },
      { path: 'partners', element: <PartnersPage /> },
    ],
  },
]);
