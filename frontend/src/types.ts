export type Role = 'JOB_SEEKER' | 'COMPANY';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type AppStatus = 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';

export const JOB_TYPES: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
export const STATUSES: AppStatus[] = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED'];

export interface User { id: string; name: string; email: string; role: Role }

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: JobType;
  createdAt: string;
  company: { id: string; name: string };
  myApplication?: { id: string; status: AppStatus } | null;
  _count?: { applications: number };
}

export interface HistoryItem {
  id: string;
  fromStatus: AppStatus | null;
  toStatus: AppStatus;
  note: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  status: AppStatus;
  coverLetter: string | null;
  createdAt: string;
  job: Job;
  seeker?: User;
  history: HistoryItem[];
}
