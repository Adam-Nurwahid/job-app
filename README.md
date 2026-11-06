# Job Application Management (IndoKerja Mini)

Aplikasi web sederhana untuk mensimulasikan proses Job Application pada platform IndoKerja.id. Job Seeker dapat melamar lowongan, dan Company dapat membuat lowongan serta mengelola pelamar. Dibuat untuk Tes Asesmen IndoKerja.id (Full Stack Developer).

## Link

| Item | URL |
|---|---|
| Aplikasi (frontend) | `https://job-app-lake-theta.vercel.app/jobs` |
| API (backend) | `https://job-app-grj5.vercel.app/api` |
| Health check | `https://job-app-grj5.vercel.app/api/health` |
| Source code | `https://github.com/Adam-Nurwahid/job-app` |

> Backend berjalan sebagai serverless function, jadi request pertama setelah lama tidak dipakai bisa terasa lebih lambat (cold start).

## Akun demo

Password semua akun: `password123`

| Role | Email |
|---|---|
| Job Seeker | `seeker@test.com` |
| Company | `hr@acme.test` |

Akun baru juga bisa dibuat lewat halaman Register (pilih Pencari kerja atau Perusahaan).

## Tech stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Node.js, TypeScript, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| API | REST API (JSON) |
| Auth | JWT, bcrypt |
| Validasi | zod |
| Keamanan | helmet, CORS dibatasi |
| Deploy | Vercel (frontend dan backend), Supabase (PostgreSQL) |

## Fitur

Sesuai spesifikasi tes:

1. Login sebagai Job Seeker atau Company (plus register).
2. Job Seeker melihat daftar lowongan: job title, company, location, salary, job type. Mendukung pencarian, filter, dan paginasi.
3. Job Seeker melihat detail lowongan dan melakukan Apply Job.
4. Job Seeker melihat daftar pekerjaan yang telah dilamar beserta statusnya.
5. Job Seeker tidak dapat melamar pekerjaan yang sama lebih dari satu kali.
6. Company membuat lowongan baru.
7. Company melihat kandidat yang melamar pada lowongan miliknya.
8. Company mengubah status kandidat: `APPLIED`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, `ACCEPTED`.
9. Setiap perubahan status disimpan di application history.
10. Data disimpan menggunakan PostgreSQL.

## Struktur project

```
job-app/
├── backend/
│   ├── api/index.ts            # entry serverless untuk Vercel
│   ├── prisma/
│   │   ├── schema.prisma       # skema database
│   │   ├── migrations/         # migration SQL
│   │   └── seed.ts             # data demo
│   ├── src/
│   │   ├── index.ts            # setup Express
│   │   ├── config.ts           # environment config
│   │   ├── lib/                # prisma client, error helper
│   │   ├── middleware/         # auth (JWT + role), error handler
│   │   └── routes/             # auth, jobs, applications
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── api.ts              # helper fetch + error handling
│   │   ├── auth.tsx            # AuthProvider
│   │   ├── components/         # Layout, UI components
│   │   └── pages/              # Auth, Seeker, Company
│   └── vercel.json             # SPA rewrite
├── docs/API.md                 # dokumentasi API
├── docker-compose.yml          # PostgreSQL untuk development lokal
└── README.md
```

## Cara menjalankan secara lokal

Prasyarat: Node.js 20 ke atas, npm, serta Docker (atau PostgreSQL yang sudah terpasang).

### 1. Database

```bash
docker compose up -d
```

Perintah ini menjalankan PostgreSQL di `localhost:5432` dengan database `jobapp`.

### 2. Backend

```bash
cd backend
cp .env.example .env     # Windows PowerShell: copy .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend berjalan di `http://localhost:4000`. Cek `http://localhost:4000/api/health`, hasilnya harus `{"status":"ok"}`.

Isi `JWT_SECRET` di `.env` dengan string acak minimal 16 karakter (disarankan 32 karakter atau lebih).

Untuk membuat migration baru saat mengubah skema, gunakan `npx prisma migrate dev --name nama_perubahan`.

### 3. Frontend

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`. Saat development, request `/api` diteruskan ke backend lewat proxy Vite, jadi `VITE_API_URL` tidak perlu diisi.

## Environment variables

### Backend (`backend/.env`)

| Nama | Keterangan | Contoh |
|---|---|---|
| `DATABASE_URL` | Koneksi database yang dipakai aplikasi | `postgresql://postgres:postgres@localhost:5432/jobapp?schema=public` |
| `DIRECT_URL` | Koneksi langsung untuk migrasi. Untuk lokal sama dengan `DATABASE_URL` | sama seperti di atas |
| `JWT_SECRET` | Secret untuk menandatangani token (wajib) | string acak panjang |
| `JWT_EXPIRES_IN` | Masa berlaku token | `7d` |
| `PORT` | Port server lokal | `4000` |
| `CORS_ORIGIN` | Origin frontend yang diizinkan. Boleh lebih dari satu, pisahkan dengan koma, tanpa slash di akhir | `http://localhost:5173` |

### Frontend

| Nama | Keterangan |
|---|---|
| `VITE_API_URL` | URL API untuk produksi, contoh `https://job-app-grj5.vercel.app/api`. Kosongkan saat development |

## Database dan migration

Schema ada di `backend/prisma/schema.prisma` dan migration SQL di `backend/prisma/migrations/`.

Model utama:

| Model | Keterangan |
|---|---|
| `User` | Akun pengguna. Company adalah `User` dengan role `COMPANY` (kolom `name` adalah nama perusahaan) |
| `Job` | Lowongan. Relasi ke `User` (company) |
| `Application` | Lamaran. Relasi ke `Job` dan `User` (seeker) |
| `ApplicationHistory` | Riwayat perubahan status. Relasi ke `Application` dan `User` (yang mengubah) |

Relasi dan constraint penting:

- `User` 1 : N `Job` (satu company punya banyak lowongan).
- `Job` 1 : N `Application` dan `User` 1 : N `Application` (satu seeker bisa punya banyak lamaran).
- `Application` 1 : N `ApplicationHistory`.
- `@@unique([jobId, seekerId])` pada `Application` mencegah lamaran ganda di level database.
- Foreign key memakai `onDelete: Cascade` untuk data turunan, dan ada index pada kolom yang sering difilter.

Enum: `Role`, `JobType`, `ApplicationStatus`.

## Dokumentasi API

Dokumentasi lengkap ada di [docs/API.md](docs/API.md). Ringkasannya:

| Method | Path | Role | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | publik | Daftar akun |
| POST | `/api/auth/login` | publik | Login, mengembalikan `token` dan `user` |
| GET | `/api/auth/me` | login | Data user saat ini |
| GET | `/api/jobs` | login | Daftar lowongan (`q`, `location`, `type`, `page`, `limit`) |
| GET | `/api/jobs/:id` | login | Detail lowongan |
| POST | `/api/jobs` | COMPANY | Buat lowongan |
| GET | `/api/jobs/mine` | COMPANY | Lowongan milik sendiri |
| POST | `/api/jobs/:id/apply` | JOB_SEEKER | Melamar lowongan |
| GET | `/api/jobs/:id/applications` | COMPANY (pemilik) | Daftar pelamar |
| GET | `/api/applications/me` | JOB_SEEKER | Lamaran saya beserta status dan riwayat |
| PATCH | `/api/applications/:id/status` | COMPANY (pemilik) | Ubah status lamaran |

Autentikasi memakai header `Authorization: Bearer <token>`. Format error:

```json
{ "message": "Validasi gagal", "errors": [{ "field": "email", "message": "Email tidak valid" }] }
```

Contoh login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seeker@test.com","password":"password123"}'
```

## Deploy (Vercel + Supabase)

### 1. Database (Supabase)

1. Buat project di Supabase, lalu salin dua connection string dari menu **Connect**:
   - Session pooler (port `5432`) untuk `DIRECT_URL`.
   - Transaction pooler (port `6543`) untuk `DATABASE_URL`, tambahkan `?pgbouncer=true` di akhir.
2. Jalankan migration dan seed dari komputer lokal, dengan kedua variabel diarahkan ke Session pooler:

```powershell
cd backend
$env:DATABASE_URL="<session pooler, port 5432>"
$env:DIRECT_URL="<session pooler, port 5432>"
npx prisma migrate deploy
npm run seed
```

### 2. Backend (Vercel)

- Import repo, **Root Directory**: `backend`.
- Environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL frontend).
- Setelah deploy, tes `/api/health`.
- Disarankan mengatur Function Region ke region yang dekat dengan database.

### 3. Frontend (Vercel)

- Import repo, **Root Directory**: `frontend`, preset Vite.
- Environment variable: `VITE_API_URL=https://<url-backend>/api`.
- File `frontend/vercel.json` sudah berisi SPA rewrite agar refresh halaman dalam tidak menghasilkan 404.
- Setelah URL frontend diketahui, isi `CORS_ORIGIN` di backend dengan URL tersebut lalu redeploy backend.

## Keputusan desain

- **Company = User dengan role `COMPANY`**, sehingga autentikasi cukup memakai satu tabel.
- **Authentication dan authorization:** password di-hash dengan bcrypt, sesi memakai JWT, dan akses dibatasi lewat middleware role. Company hanya dapat melihat lowongan dan pelamar miliknya sendiri, dan hanya pemilik lowongan yang dapat mengubah status lamaran.
- **Validasi API** memakai zod, dan semua error dinormalisasi di satu error middleware (400, 401, 403, 404, 409, 500).
- **Anti lamaran ganda** dijamin oleh unique constraint di database (bukan hanya pengecekan di aplikasi), sehingga aman dari race condition. Pelanggaran dipetakan menjadi respons 409.
- **Application history** ditulis dalam satu transaksi bersama perubahan status, sehingga data konsisten.
- **Keamanan tambahan:** helmet, CORS dibatasi ke origin yang diizinkan, batas ukuran body request, dan secret hanya dibaca dari environment variable.
- **Frontend** menampilkan pesan error dari API dengan jelas, melindungi route berdasarkan role, dan memakai tampilan responsif.