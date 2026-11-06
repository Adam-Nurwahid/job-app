import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorText } from '../api';
import { ErrorBox, StatusBadge } from '../components/ui';
import { Application, Job, JOB_TYPES, STATUSES } from '../types';
import { formatDate, formatSalary, STATUS_LABEL, TYPE_LABEL } from '../utils';
import { History } from './Seeker';

export function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ data: Job[] }>('/jobs/mine').then((r) => setJobs(r.data)).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <>
      <div className="row">
        <h1>Lowongan saya</h1>
        <Link className="btn" to="/company/jobs/new">Buat lowongan</Link>
      </div>
      <ErrorBox message={error} />
      {!jobs ? <p className="muted">Memuat…</p> : jobs.length === 0 ? (
        <p className="muted">Belum ada lowongan. Buat lowongan pertama Anda untuk mulai menerima pelamar.</p>
      ) : (
        <div className="stack">
          {jobs.map((j) => (
            <div key={j.id} className="card row">
              <div>
                <h3>{j.title}</h3>
                <p className="muted">{j.location} • {TYPE_LABEL[j.type]} • {formatSalary(j.salaryMin, j.salaryMax)}</p>
              </div>
              <Link className="btn btn-ghost" to={`/company/jobs/${j.id}/applicants`}>
                {j._count?.applications ?? 0} pelamar
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '', type: 'FULL_TIME', salaryMin: '', salaryMax: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      navigate('/company/jobs');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Buat lowongan</h1>
      <ErrorBox message={error} />
      <label>Judul posisi<input value={form.title} onChange={set('title')} required /></label>
      <label>Deskripsi<textarea rows={6} value={form.description} onChange={set('description')} required /></label>
      <label>Lokasi<input value={form.location} onChange={set('location')} required /></label>
      <label>Tipe pekerjaan
        <select value={form.type} onChange={set('type')}>
          {JOB_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </label>
      <div className="two-col">
        <label>Gaji minimum (Rp)<input type="number" min={0} value={form.salaryMin} onChange={set('salaryMin')} /></label>
        <label>Gaji maksimum (Rp)<input type="number" min={0} value={form.salaryMax} onChange={set('salaryMax')} /></label>
      </div>
      <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Terbitkan lowongan'}</button>
    </form>
  );
}

export function ApplicantsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ job: Job; data: Application[] }>(`/jobs/${id}/applications`)
      .then((r) => { setJob(r.job); setApps(r.data); })
      .catch((e) => setError(errorText(e)));
  }, [id]);

  async function changeStatus(app: Application, status: string) {
    setError('');
    try {
      const updated = await api<Application>(`/applications/${app.id}/status`, { method: 'PATCH', body: { status } });
      setApps((list) => list!.map((a) => (a.id === app.id ? { ...a, status: updated.status, history: updated.history } : a)));
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <>
      <Link to="/company/jobs" className="muted">Kembali</Link>
      <h1>Pelamar{job ? `: ${job.title}` : ''}</h1>
      <ErrorBox message={error} />
      {!apps ? <p className="muted">Memuat…</p> : apps.length === 0 ? (
        <p className="muted">Belum ada pelamar untuk lowongan ini.</p>
      ) : (
        <div className="stack">
          {apps.map((a) => (
            <div key={a.id} className="card">
              <div className="row">
                <div>
                  <h3>{a.seeker?.name}</h3>
                  <p className="muted">{a.seeker?.email} • melamar {formatDate(a.createdAt)}</p>
                </div>
                <div className="status-edit">
                  <StatusBadge status={a.status} />
                  <select aria-label="Ubah status" value={a.status} onChange={(e) => changeStatus(a, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
              {a.coverLetter && <p className="prewrap">{a.coverLetter}</p>}
              <History items={a.history} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
