import { AppStatus, JobType } from './types';

export const TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Kontrak', INTERNSHIP: 'Magang', FREELANCE: 'Freelance',
};

export const STATUS_LABEL: Record<AppStatus, string> = {
  APPLIED: 'Dilamar', REVIEWING: 'Direview', SHORTLISTED: 'Shortlist', REJECTED: 'Ditolak', ACCEPTED: 'Diterima',
};

const idr = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export function formatSalary(min: number | null, max: number | null): string {
  if (min && max) return `${idr(min)} – ${idr(max)}`;
  if (min) return `Mulai ${idr(min)}`;
  if (max) return `Hingga ${idr(max)}`;
  return 'Gaji dirahasiakan';
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
