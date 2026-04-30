import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { navigation } from '@/app/layout/navigation';
import { env } from '@/shared/config/env';

export function AdminLayout() {
  const location = useLocation();
  const activeItem = navigation.find((item) => item.to === location.pathname) ?? navigation[0];

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
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
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
          <div className="status-chip">
            <span className={`status-dot env-${env.appEnv}`} />
            <span>{env.label}</span>
          </div>
          <small>{env.apiBaseUrl}</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <div className="eyebrow">Раздел</div>
            <h2>{activeItem.label}</h2>
          </div>
          <div className="topbar-meta">
            <div className="hero-note">
              <strong>Production-ready shell</strong>
              <span>единая работа с `setup`, `structure`, `products`, `marketing`</span>
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
