import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorText } from '../api';
import {
  EmptyState,
  ErrorBox,
  LoadingButton,
  Skeleton,
  Spinner,
  StatusBadge,
  showToast,
} from '../components/ui';
import { Application, Job, JOB_TYPES, STATUSES } from '../types';
import { formatDate, formatSalary, STATUS_LABEL, TYPE_LABEL } from '../utils';
import { History } from './Seeker';

/* Arrow icon */
function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9 2 4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Users icon */
function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 2.5a2.5 2.5 0 1 1 0 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13.5 14a4 4 0 0 0-2.5-3.73" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPANY JOBS PAGE
   ═══════════════════════════════════════════════════════════ */
export function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ data: Job[] }>('/jobs/mine')
      .then((r) => setJobs(r.data))
      .catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <div className="page-heading">
        <h1>Lowongan saya</h1>
        <Link className="btn" to="/company/jobs/new">
          + Buat lowongan
        </Link>
      </div>

      <ErrorBox message={error} />

      {/* Skeleton */}
      {!jobs && !error && (
        <div className="stack">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <Skeleton height="1rem" width="50%" style={{ marginBottom: '0.5rem' }} />
              <Skeleton height="0.85rem" width="65%" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {jobs && jobs.length === 0 && (
        <EmptyState
          icon="📢"
          title="Belum ada lowongan"
          description="Buat lowongan pertama Anda untuk mulai menerima pelamar."
          action={<Link className="btn" to="/company/jobs/new">Buat lowongan pertama</Link>}
        />
      )}

      {/* Job list */}
      {jobs && jobs.length > 0 && (
        <div className="stack">
          {jobs.map((j) => (
            <div key={j.id} className="card row">
              <div>
                <h3>{j.title}</h3>
                <p className="muted small" style={{ marginTop: '0.25rem' }}>
                  {j.location} · {TYPE_LABEL[j.type]} · {formatSalary(j.salaryMin, j.salaryMax)}
                </p>
              </div>
              <Link
                className="btn btn-secondary btn-sm"
                to={`/company/jobs/${j.id}/applicants`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UsersIcon />
                {j._count?.applications ?? 0} pelamar
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE JOB PAGE
   ═══════════════════════════════════════════════════════════ */
export function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    type: 'FULL_TIME',
    salaryMin: '',
    salaryMax: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/jobs', {
        method: 'POST',
        body: {
          ...form,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        },
      });
      showToast('Lowongan berhasil diterbitkan! 🚀');
      navigate('/company/jobs');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit} noValidate>
      <h1 style={{ marginBottom: '1.5rem' }}>Buat lowongan baru</h1>
      <ErrorBox message={error} />

      <label>
        Judul posisi
        <input
          value={form.title}
          onChange={set('title')}
          required
          placeholder="mis. Front-end Developer"
        />
      </label>

      <label>
        Deskripsi pekerjaan
        <textarea
          rows={6}
          value={form.description}
          onChange={set('description')}
          required
          placeholder="Jelaskan tanggung jawab, kualifikasi, dan keuntungan…"
        />
      </label>

      <label>
        Lokasi
        <input
          value={form.location}
          onChange={set('location')}
          required
          placeholder="mis. Jakarta, Remote"
        />
      </label>

      <label>
        Tipe pekerjaan
        <select value={form.type} onChange={set('type')}>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>

      <div className="two-col">
        <label>
          Gaji minimum (Rp)
          <input
            type="number"
            min={0}
            value={form.salaryMin}
            onChange={set('salaryMin')}
            placeholder="mis. 5000000"
          />
        </label>
        <label>
          Gaji maksimum (Rp)
          <input
            type="number"
            min={0}
            value={form.salaryMax}
            onChange={set('salaryMax')}
            placeholder="mis. 10000000"
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
        <LoadingButton loading={busy} loadingLabel="Menyimpan…">
          Terbitkan lowongan
        </LoadingButton>
        <Link to="/company/jobs" className="btn btn-ghost">
          Batal
        </Link>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPLICANTS PAGE
   ═══════════════════════════════════════════════════════════ */
export function ApplicantsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');
  // Track which application is being updated
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api<{ job: Job; data: Application[] }>(`/jobs/${id}/applications`)
      .then((r) => {
        setJob(r.job);
        setApps(r.data);
      })
      .catch((e) => setError(errorText(e)));
  }, [id]);

  async function changeStatus(app: Application, status: string) {
    setError('');
    setUpdatingId(app.id);
    try {
      const updated = await api<Application>(`/applications/${app.id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setApps((list) =>
        list!.map((a) =>
          a.id === app.id ? { ...a, status: updated.status, history: updated.history } : a,
        ),
      );
      showToast(`Status diperbarui: ${STATUS_LABEL[updated.status]}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Link to="/company/jobs" className="back-link">
        <ArrowLeft /> Kembali ke lowongan saya
      </Link>

      <h1 className="mb-6">
        Pelamar{job ? <span className="muted" style={{ fontWeight: 400 }}>: {job.title}</span> : ''}
      </h1>

      <ErrorBox message={error} />

      {/* Skeleton */}
      {!apps && !error && (
        <div className="stack">
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <div className="row">
                <div style={{ flex: 1 }}>
                  <Skeleton height="1rem" width="40%" style={{ marginBottom: '0.4rem' }} />
                  <Skeleton height="0.85rem" width="55%" />
                </div>
                <Skeleton height="2rem" width="7rem" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {apps && apps.length === 0 && (
        <EmptyState
          icon="🤝"
          title="Belum ada pelamar"
          description="Belum ada pelamar untuk lowongan ini. Bagikan lowongan Anda agar lebih banyak kandidat melamar."
        />
      )}

      {/* Applicant cards */}
      {apps && apps.length > 0 && (
        <div className="stack">
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <p className="applicant-name">{a.seeker?.name}</p>
                  <p className="applicant-email">{a.seeker?.email} · melamar {formatDate(a.createdAt)}</p>
                </div>

                {/* Status change area */}
                <div className="status-edit">
                  {updatingId === a.id ? (
                    <span className="flex gap-2 muted small">
                      <Spinner size="0.85em" /> Memperbarui…
                    </span>
                  ) : (
                    <>
                      <StatusBadge status={a.status} />
                      <select
                        className="status-select"
                        aria-label={`Ubah status ${a.seeker?.name ?? ''}`}
                        value={a.status}
                        onChange={(e) => changeStatus(a, e.target.value)}
                        disabled={updatingId !== null}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              {a.coverLetter && (
                <>
                  <p className="cover-letter-label">Surat Lamaran</p>
                  <p className="prewrap">{a.coverLetter}</p>
                </>
              )}

              <History items={a.history} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
