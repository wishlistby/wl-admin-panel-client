import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/app/layout/AdminLayout';
import { RequireAuth } from '@/app/router/RequireAuth';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { SetupPage } from '@/features/setup/SetupPage';
import { StructurePage } from '@/features/structure/StructurePage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { MarketingPage } from '@/features/marketing/MarketingPage';
import { PartnersPage } from '@/features/partners/PartnersPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AccessControlPage } from '@/features/access/AccessControlPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
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
          { path: 'access', element: <AccessControlPage /> },
        ],
      },
    ],
  },
]);
