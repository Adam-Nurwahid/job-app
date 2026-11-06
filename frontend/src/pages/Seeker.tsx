import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api';
import {
  EmptyState,
  ErrorBox,
  LoadingButton,
  Skeleton,
  SkeletonCard,
  Spinner,
  StatusBadge,
  showToast,
} from '../components/ui';
import { Application, Job, JOB_TYPES } from '../types';
import { formatDate, formatSalary, STATUS_LABEL, TYPE_LABEL } from '../utils';

interface JobList {
  data: Job[];
  meta: { page: number; totalPages: number; total: number };
}

/* ── Back arrow icon ──────────────────────────────────────── */
function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Location pin icon ────────────────────────────────────── */
function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 16" fill="none" aria-hidden="true">
      <path d="M7 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S2 9.5 2 6a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   JOB LIST PAGE
   ═══════════════════════════════════════════════════════════ */
export function JobListPage() {
  const [filters, setFilters] = useState({ q: '', location: '', type: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JobList | null>(null);
  const [error, setError] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    setFilterLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '9' });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const t = setTimeout(() => {
      api<JobList>(`/jobs?${params}`)
        .then((r) => { setResult(r); setFilterLoading(false); })
        .catch((e) => { setError(errorText(e)); setFilterLoading(false); });
    }, 250); // debounce pencarian
    return () => clearTimeout(t);
  }, [filters, page]);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setPage(1);
      setFilters({ ...filters, [k]: e.target.value });
    };

  return (
    <>
      <div className="page-heading">
        <h1>Lowongan pekerjaan</h1>
        {result && (
          <span className="muted small">{result.meta.total} lowongan tersedia</span>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          placeholder="Cari posisi atau perusahaan…"
          value={filters.q}
          onChange={set('q')}
          aria-label="Cari posisi atau perusahaan"
        />
        <input
          placeholder="Lokasi"
          value={filters.location}
          onChange={set('location')}
          aria-label="Filter lokasi"
        />
        <select value={filters.type} onChange={set('type')} aria-label="Filter tipe pekerjaan">
          <option value="">Semua tipe</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Loading indicator for search */}
      {filterLoading && (
        <div className="filters-loading" aria-live="polite">
          <Spinner size="0.85em" /> Mencari…
        </div>
      )}

      <ErrorBox message={error} />

      {/* Skeleton while loading first time */}
      {!result && !error && (
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {result && result.data.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Tidak ada lowongan yang cocok"
          description="Coba ubah kata kunci atau filter pencarian."
        />
      )}

      {/* Job cards */}
      {result && result.data.length > 0 && (
        <div className="grid" aria-live="polite" aria-atomic="false">
          {result.data.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="card job-card">
              <div className="job-card-header">
                <h3 style={{ flex: 1 }}>{job.title}</h3>
                {job.myApplication && <StatusBadge status={job.myApplication.status} />}
              </div>
              <p className="job-card-company">{job.company.name}</p>
              <div className="job-card-meta">
                <PinIcon />
                {job.location}
                <span className="job-card-meta-dot">•</span>
                <span className="type-badge">{TYPE_LABEL[job.type]}</span>
              </div>
              <p className="job-card-salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result && result.meta.totalPages > 1 && (
        <div className="pager">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Sebelumnya
          </button>
          <span className="pager-info">
            Halaman {page} dari {result.meta.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= result.meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya →
          </button>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   JOB DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */
export function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(() => {
    setPageLoading(true);
    api<Job>(`/jobs/${id}`)
      .then((j) => { setJob(j); setPageLoading(false); })
      .catch((e) => { setError(errorText(e)); setPageLoading(false); });
  }, [id]);
  useEffect(load, [load]);

  async function apply(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api(`/jobs/${id}/apply`, {
        method: 'POST',
        body: { coverLetter: coverLetter || undefined },
      });
      showToast('Lamaran berhasil dikirim! 🎉');
      load();
    } catch (err) {
      setError(errorText(err));
      load(); // sinkronkan jika ternyata sudah pernah melamar
    } finally {
      setBusy(false);
    }
  }

  /* Skeleton while loading */
  if (pageLoading && !job) {
    return (
      <article className="card detail">
        <Skeleton height="0.85rem" width="6rem" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="1.75rem" width="80%" style={{ marginBottom: '0.75rem' }} />
        <Skeleton height="1rem" width="40%" style={{ marginBottom: '0.5rem' }} />
        <Skeleton height="0.85rem" width="55%" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="0.85rem" width="30%" style={{ marginBottom: '2rem' }} />
        <Skeleton height="0.85rem" style={{ marginBottom: '0.4rem' }} />
        <Skeleton height="0.85rem" style={{ marginBottom: '0.4rem' }} />
        <Skeleton height="0.85rem" width="70%" />
      </article>
    );
  }

  if (!job) {
    return (
      <>
        <ErrorBox message={error} />
        <EmptyState
          icon="💼"
          title="Lowongan tidak ditemukan"
          description="Lowongan ini mungkin sudah tidak tersedia."
          action={<Link to="/jobs" className="btn btn-secondary">Kembali ke daftar</Link>}
        />
      </>
    );
  }

  return (
    <article className="card detail">
      <Link to="/jobs" className="back-link">
        <ArrowLeft /> Kembali ke daftar
      </Link>

      <div className="detail-header">
        <h1 className="detail-title">{job.title}</h1>
        <p className="detail-company">{job.company.name}</p>
        <div className="detail-meta">
          <PinIcon /> {job.location}
          <span className="type-badge">{TYPE_LABEL[job.type]}</span>
        </div>
        <p className="detail-salary">{formatSalary(job.salaryMin, job.salaryMax)}</p>
      </div>

      <hr className="divider" />

      <p className="detail-section-title">Deskripsi Pekerjaan</p>
      <p className="prewrap">{job.description}</p>

      <ErrorBox message={error} />

      {job.myApplication ? (
        <div className="applied-state">
          <span>Status lamaran Anda:</span>
          <StatusBadge status={job.myApplication.status} />
        </div>
      ) : (
        <>
          <p className="detail-section-title">Kirim Lamaran</p>
          <form onSubmit={apply}>
            <label>
              Surat lamaran <span className="muted" style={{ fontWeight: 400 }}>(opsional)</span>
              <textarea
                rows={5}
                maxLength={2000}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Ceritakan mengapa Anda cocok untuk posisi ini…"
              />
            </label>
            <LoadingButton loading={busy} loadingLabel="Mengirim…">
              Lamar sekarang
            </LoadingButton>
          </form>
        </>
      )}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════
   MY APPLICATIONS PAGE
   ═══════════════════════════════════════════════════════════ */
export function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ data: Application[] }>('/applications/me')
      .then((r) => setApps(r.data))
      .catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <h1 className="mb-6">Lamaran saya</h1>
      <ErrorBox message={error} />

      {/* Skeleton */}
      {!apps && !error && (
        <div className="stack">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <Skeleton height="1rem" width="55%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="0.85rem" width="40%" style={{ marginBottom: '1rem' }} />
              <Skeleton height="0.75rem" width="20%" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {apps && apps.length === 0 && (
        <EmptyState
          icon="📋"
          title="Belum ada lamaran"
          description="Anda belum melamar pekerjaan apapun. Mulai temukan lowongan yang cocok!"
          action={<Link to="/jobs" className="btn">Cari lowongan</Link>}
        />
      )}

      {/* Application cards */}
      {apps && apps.length > 0 && (
        <div className="stack" aria-live="polite">
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="app-card-row">
                <div>
                  <h3 className="app-card-job">
                    <Link to={`/jobs/${a.job.id}`}>{a.job.title}</Link>
                  </h3>
                  <p className="app-card-meta">
                    {a.job.company.name} · dilamar {formatDate(a.createdAt)}
                  </p>
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

/* ═══════════════════════════════════════════════════════════
   HISTORY (application status timeline)
   ═══════════════════════════════════════════════════════════ */
export function History({ items }: { items: Application['history'] }) {
  return (
    <details>
      <summary>Riwayat status ({items.length})</summary>
      <ol className="timeline">
        {items.map((h) => (
          <li key={h.id}>
            <p className="timeline-status">
              {h.fromStatus ? `${STATUS_LABEL[h.fromStatus]} → ` : ''}
              {STATUS_LABEL[h.toStatus]}
            </p>
            <p className="timeline-meta">
              {formatDate(h.createdAt)}
              {h.note ? ` — ${h.note}` : ''}
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
