import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api';
import { ErrorBox, StatusBadge } from '../components/ui';
import { Application, Job, JOB_TYPES } from '../types';
import { formatDate, formatSalary, STATUS_LABEL, TYPE_LABEL } from '../utils';

interface JobList { data: Job[]; meta: { page: number; totalPages: number; total: number } }

export function JobListPage() {
  const [filters, setFilters] = useState({ q: '', location: '', type: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JobList | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const t = setTimeout(() => {
      api<JobList>(`/jobs?${params}`).then(setResult).catch((e) => setError(errorText(e)));
    }, 250); // debounce pencarian
    return () => clearTimeout(t);
  }, [filters, page]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };

  return (
    <>
      <h1>Lowongan pekerjaan</h1>
      <div className="filters">
        <input placeholder="Cari posisi atau perusahaan" value={filters.q} onChange={set('q')} />
        <input placeholder="Lokasi" value={filters.location} onChange={set('location')} />
        <select value={filters.type} onChange={set('type')}>
          <option value="">Semua tipe</option>
          {JOB_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </div>
      <ErrorBox message={error} />
      {!result ? <p className="muted">Memuat…</p> : result.data.length === 0 ? (
        <p className="muted">Tidak ada lowongan yang cocok. Coba ubah kata kunci pencarian.</p>
      ) : (
        <div className="grid">
          {result.data.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="card job-card">
              <h3>{job.title}</h3>
              <p className="company">{job.company.name}</p>
              <p className="muted">{job.location} • {TYPE_LABEL[job.type]}</p>
              <p className="salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>
              {job.myApplication && <StatusBadge status={job.myApplication.status} />}
            </Link>
          ))}
        </div>
      )}
      {result && result.meta.totalPages > 1 && (
        <div className="pager">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
          <span>Halaman {page} dari {result.meta.totalPages}</span>
          <button className="btn btn-ghost" disabled={page >= result.meta.totalPages} onClick={() => setPage(page + 1)}>Berikutnya</button>
        </div>
      )}
    </>
  );
}

export function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<Job>(`/jobs/${id}`).then(setJob).catch((e) => setError(errorText(e)));
  }, [id]);
  useEffect(load, [load]);

  async function apply(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api(`/jobs/${id}/apply`, { method: 'POST', body: { coverLetter: coverLetter || undefined } });
      load();
    } catch (err) {
      setError(errorText(err));
      load(); // sinkronkan jika ternyata sudah pernah melamar
    } finally {
      setBusy(false);
    }
  }

  if (!job) return <><ErrorBox message={error} /><p className="muted">Memuat…</p></>;
  return (
    <article className="card detail">
      <Link to="/jobs" className="muted">Kembali ke daftar</Link>
      <h1>{job.title}</h1>
      <p className="company">{job.company.name}</p>
      <p className="muted">{job.location} • {TYPE_LABEL[job.type]}</p>
      <p className="salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>
      <h3>Deskripsi pekerjaan</h3>
      <p className="prewrap">{job.description}</p>
      <ErrorBox message={error} />
      {job.myApplication ? (
        <p>Status lamaran Anda: <StatusBadge status={job.myApplication.status} /></p>
      ) : (
        <form onSubmit={apply}>
          <label>Surat lamaran (opsional)
            <textarea rows={4} maxLength={2000} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'Mengirim…' : 'Lamar sekarang'}</button>
        </form>
      )}
    </article>
  );
}

export function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ data: Application[] }>('/applications/me').then((r) => setApps(r.data)).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <h1>Lamaran saya</h1>
      <ErrorBox message={error} />
      {!apps ? <p className="muted">Memuat…</p> : apps.length === 0 ? (
        <p className="muted">Belum ada lamaran. <Link to="/jobs">Cari lowongan</Link></p>
      ) : (
        <div className="stack">
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="row">
                <div>
                  <h3><Link to={`/jobs/${a.job.id}`}>{a.job.title}</Link></h3>
                  <p className="muted">{a.job.company.name} • dilamar {formatDate(a.createdAt)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <History items={a.history} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function History({ items }: { items: Application['history'] }) {
  return (
    <details>
      <summary>Riwayat status ({items.length})</summary>
      <ol className="timeline">
        {items.map((h) => (
          <li key={h.id}>
            <strong>{h.fromStatus ? `${STATUS_LABEL[h.fromStatus]} → ` : ''}{STATUS_LABEL[h.toStatus]}</strong>
            <span className="muted small"> {formatDate(h.createdAt)}{h.note ? ` — ${h.note}` : ''}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
