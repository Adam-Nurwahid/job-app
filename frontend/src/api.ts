const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: { field: string; message: string }[]) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Terjadi kesalahan', data?.errors);
  return data as T;
}

export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.errors?.map((e) => `${e.field}: ${e.message}`).join('; ');
    return details ? `${err.message} (${details})` : err.message;
  }
  return 'Tidak dapat terhubung ke server';
}
