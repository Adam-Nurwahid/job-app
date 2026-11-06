import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorText } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, LoadingButton } from '../components/ui';
import { Role } from '../types';

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="6.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 11.5h17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'JOB_SEEKER' as Role,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = isLogin
        ? await login(form.email, form.password)
        : await register(form);
      navigate(u.role === 'COMPANY' ? '/company/jobs' : '/jobs');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  // Sudah login: jangan tampilkan form lagi (mis. saat tombol Back ditekan)
  if (user) return <Navigate to={user.role === 'COMPANY' ? '/company/jobs' : '/jobs'} replace />;

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        {/* Logo */}
        <div className="auth-logo">
          <BriefcaseIcon />
          IndoKerja Mini
        </div>

        <h1 className="auth-title">{isLogin ? 'Masuk ke akun' : 'Buat akun baru'}</h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Selamat datang kembali! Silakan masuk untuk melanjutkan.'
            : 'Daftar gratis dan mulai temukan pekerjaan impian Anda.'}
        </p>

        <ErrorBox message={error} />

        {!isLogin && (
          <>
            <label>
              Daftar sebagai
              <select value={form.role} onChange={set('role')}>
                <option value="JOB_SEEKER">Pencari kerja</option>
                <option value="COMPANY">Perusahaan</option>
              </select>
            </label>
            <label>
              {form.role === 'COMPANY' ? 'Nama perusahaan' : 'Nama lengkap'}
              <input
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
                placeholder={form.role === 'COMPANY' ? 'PT. Contoh Maju' : 'Budi Santoso'}
              />
            </label>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
            placeholder="email@contoh.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={isLogin ? 1 : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder={isLogin ? '••••••••' : 'Minimal 8 karakter'}
          />
        </label>

        <LoadingButton
          loading={loading}
          loadingLabel={isLogin ? 'Memproses…' : 'Mendaftar…'}
          className="btn"
          style={{ width: '100%', marginTop: '0.25rem' } as React.CSSProperties}
        >
          {isLogin ? 'Masuk' : 'Daftar sekarang'}
        </LoadingButton>

        <p className="muted small mt-4" style={{ textAlign: 'center' }}>
          {isLogin ? (
            <>
              Belum punya akun?{' '}
              <Link to="/register">Daftar gratis</Link>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <Link to="/login">Masuk</Link>
            </>
          )}
        </p>

        {isLogin && (
          <div className="demo-hint">
            <strong>💡 Akun demo</strong>
            Pencari kerja: <code>seeker@test.com</code><br />
            Perusahaan: <code>hr@acme.test</code><br />
            Password: <code>password123</code>
          </div>
        )}
      </form>
    </div>
  );
}
