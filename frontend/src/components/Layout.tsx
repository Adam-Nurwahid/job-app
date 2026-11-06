import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { Role } from '../types';
import { Spinner, ToastContainer } from './ui';

/* SVG logo icon */
function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="6.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 11.5h17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* Logout icon */
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M5 1.75H2.5A1.25 1.25 0 0 0 1.25 3v8c0 .69.56 1.25 1.25 1.25H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 10.5 12.75 7 9.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Layout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="flex gap-2 muted small"><Spinner /> Memuat…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const links =
    user.role === 'JOB_SEEKER'
      ? [
          { to: '/jobs', label: 'Lowongan' },
          { to: '/applications', label: 'Lamaran saya' },
        ]
      : [
          { to: '/company/jobs', label: 'Lowongan saya' },
          { to: '/company/jobs/new', label: 'Buat lowongan' },
        ];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <BriefcaseIcon />
            IndoKerja<span className="brand-dot"> Mini</span>
          </span>

          <nav aria-label="Navigasi utama">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-user">
            <span className="topbar-user-name" title={user.email}>
              {user.name}
            </span>
            <button className="btn btn-logout" onClick={logout} aria-label="Keluar dari akun">
              <LogoutIcon />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <ToastContainer />
    </>
  );
}

export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
        <span className="flex gap-2 muted small"><Spinner /> Memuat…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
