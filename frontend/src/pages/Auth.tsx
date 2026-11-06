import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorText } from '../api';
import { useAuth } from '../auth';
import { ErrorBox } from '../components/ui';
import { Role } from '../types';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'JOB_SEEKER' as Role });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = isLogin ? await login(form.email, form.password) : await register(form);
      navigate(user.role === 'COMPANY' ? '/company/jobs' : '/jobs');
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
      <form className="card auth-card" onSubmit={submit}>
        <h1>{isLogin ? 'Masuk' : 'Buat akun'}</h1>
        <ErrorBox message={error} />
        {!isLogin && (
          <>
            <label>Daftar sebagai
              <select value={form.role} onChange={set('role')}>
                <option value="JOB_SEEKER">Pencari kerja</option>
                <option value="COMPANY">Perusahaan</option>
              </select>
            </label>
            <label>{form.role === 'COMPANY' ? 'Nama perusahaan' : 'Nama lengkap'}
              <input value={form.name} onChange={set('name')} required />
            </label>
          </>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required minLength={isLogin ? 1 : 8} /></label>
        <button className="btn" disabled={loading}>{loading ? 'Memproses…' : isLogin ? 'Masuk' : 'Daftar'}</button>
        <p className="muted">
          {isLogin ? <>Belum punya akun? <Link to="/register">Daftar</Link></> : <>Sudah punya akun? <Link to="/login">Masuk</Link></>}
        </p>
        {isLogin && <p className="muted small">Demo: seeker@test.com atau hr@acme.test, password: password123</p>}
      </form>
    </div>
  );
}
