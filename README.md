# Job Application Management (IndoKerja Mini)

Simulasi proses Job Application: Job Seeker melamar lowongan, Company mengelola pelamar.

**Stack:** React + TypeScript + Vite · Node.js + Express + TypeScript · PostgreSQL · Prisma · REST API · JWT

## Fitur
- Register/login sebagai Job Seeker atau Company (JWT + role-based authorization)
- Job Seeker: lihat & cari lowongan, detail, apply, daftar lamaran + status + riwayat
- Tidak bisa apply dua kali ke lowongan yang sama (cek di API + `@@unique([jobId, seekerId])` di DB)
- Company: buat lowongan, lihat pelamar di lowongan miliknya, ubah status (Applied/Reviewing/Shortlisted/Rejected/Accepted)
- Setiap perubahan status tercatat di tabel `ApplicationHistory` (dalam satu transaksi)

## Cara menjalankan (lokal)
Prasyarat: Node.js 20+, Docker (atau PostgreSQL lokal).

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env          # isi JWT_SECRET
npm install
npx prisma migrate dev --name init   # membuat tabel + folder prisma/migrations
npm run seed                  # data demo
npm run dev                   # http://localhost:4000

# 3. Frontend (terminal baru)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Akun demo (password `password123`): `seeker@test.com` (Job Seeker), `hr@acme.test` (Company).

> Commit folder `backend/prisma/migrations` ke repo setelah menjalankan migrate (deliverable "database migration").

## Deploy (alternatif Heroku: Railway / Render)
- Backend: set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL frontend). Build: `npm install && npm run build`. Start: `npx prisma migrate deploy && npm start`.
- Frontend: set `VITE_API_URL=https://<url-backend>/api`. Build: `npm run build`, publish folder `dist`. Tambahkan SPA rewrite ke `index.html`.

## Struktur
```
backend/  prisma/schema.prisma, prisma/seed.ts
          src/{config,index}.ts, routes/, middleware/, lib/
frontend/ src/{api,auth,types,utils}.ts(x), components/, pages/
docs/API.md
```

Dokumentasi API: [docs/API.md](docs/API.md)

## Keputusan desain
- **Company = User dengan role COMPANY** supaya auth cukup satu tabel.
- **Validasi** memakai zod; error dinormalisasi di satu error middleware (400/401/403/404/409/500).
- **Keamanan:** bcrypt hash, JWT, helmet, CORS dibatasi, cek kepemilikan (company hanya bisa akses lowongan/lamarannya sendiri).
- **Duplicate apply** ditangani race-condition-safe lewat unique constraint DB (P2002 -> 409).
