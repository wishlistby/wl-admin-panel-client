import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fallbackNavigationIcon, navigationIcons } from '@/app/layout/navigation';
import { adminAccessApi } from '@/shared/api/admin-access-api';
import { env } from '@/shared/config/env';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Button } from '@/shared/ui/Button';

export function AdminLayout() {
  const location = useLocation();
  const { auth, logout } = useAuth();
  const navigationQuery = useQuery({
    queryKey: ['admin-navigation', auth?.session.userId, auth?.session.role],
    queryFn: adminAccessApi.navigation,
    enabled: Boolean(auth?.session.userId),
    staleTime: 5 * 60_000,
  });
  const availableNavigation = navigationQuery.data ?? [];
  const activeItem = availableNavigation.find((item) => item.path === location.pathname) ?? availableNavigation[0];

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname, location.search]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">WL</div>
          <div>
            <div className="eyebrow">Webshop control</div>
            <h1>Admin panel</h1>
          </div>
        </div>

        <nav className="nav-stack">
          {availableNavigation.map((item) => {
            const Icon = navigationIcons[item.icon] ?? fallbackNavigationIcon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-card ${isActive ? 'is-active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user-card">
            <strong>{auth?.session.email ?? auth?.session.userName ?? 'Авторизован'}</strong>
            <small>{auth?.session.role ?? 'unknown role'}</small>
            <Button variant="ghost" className="sidebar-logout" onClick={logout}>
              Выйти
            </Button>
          </div>
          <div className="status-chip">
            <span className={`status-dot env-${env.appEnv}`} />
            <span>{env.label}</span>
          </div>
          <small>{env.webshopApiBaseUrl}</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <div className="eyebrow">Раздел</div>
            <h2>{activeItem?.label ?? 'Admin panel'}</h2>
          </div>
          <div className="topbar-meta">
            <div className="hero-note">
              <strong>{auth?.session.role ?? 'unknown role'}</strong>
              <span>{auth?.session.permissions.length ?? 0} permissions в текущем токене</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
