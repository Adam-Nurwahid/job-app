# Dokumentasi API

Base URL: `http://localhost:4000/api` · Format: JSON · Auth: header `Authorization: Bearer <token>` (kecuali register/login)

Error: `{ "message": "...", "errors": [{ "field": "...", "message": "..." }] }` (field `errors` hanya untuk validasi 400)

## Auth
| Method | Path | Body | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | `name, email, password(min 8), role: JOB_SEEKER \| COMPANY` | 201 `{ token, user }`, 409 jika email ada |
| POST | `/auth/login` | `email, password` | 200 `{ token, user }`, 401 jika salah |
| GET | `/auth/me` | - | User saat ini |

## Jobs
| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/jobs?q=&location=&type=&page=&limit=` | semua | Daftar lowongan aktif + `meta` paginasi. Tiap item memuat `company` dan `myApplication` |
| GET | `/jobs/:id` | semua | Detail lowongan |
| POST | `/jobs` | COMPANY | Body: `title, description, location, type, salaryMin?, salaryMax?` -> 201 |
| GET | `/jobs/mine` | COMPANY | Lowongan milik sendiri + jumlah pelamar |
| POST | `/jobs/:id/apply` | JOB_SEEKER | Body: `coverLetter?` -> 201; 409 jika sudah melamar |
| GET | `/jobs/:id/applications` | COMPANY (pemilik) | Daftar pelamar + history; 403 jika bukan pemilik |

`type`: `FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE`

## Applications
| Method | Path | Role | Keterangan |
|---|---|---|---|
| GET | `/applications/me` | JOB_SEEKER | Lamaran saya + status + history |
| PATCH | `/applications/:id/status` | COMPANY (pemilik lowongan) | Body: `status: APPLIED \| REVIEWING \| SHORTLISTED \| REJECTED \| ACCEPTED`, `note?`. Menyimpan baris `ApplicationHistory` |

## Contoh
```bash
curl -X POST localhost:4000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"seeker@test.com","password":"password123"}'
```
