import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { Role } from '../types';

export function Layout() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p className="container muted">Memuat…</p>;
  if (!user) return <Navigate to="/login" replace />;
  const links =
    user.role === 'JOB_SEEKER'
      ? [{ to: '/jobs', label: 'Lowongan' }, { to: '/applications', label: 'Lamaran saya' }]
      : [{ to: '/company/jobs', label: 'Lowongan saya' }, { to: '/company/jobs/new', label: 'Buat lowongan' }];
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <strong className="brand">IndoKerja Mini</strong>
          <nav>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end>{l.label}</NavLink>
            ))}
          </nav>
          <div className="user">
            <span>{user.name}</span>
            <button className="btn btn-ghost" onClick={logout}>Keluar</button>
          </div>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  );
}

export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="container muted">Memuat…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
