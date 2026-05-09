# JMC HRD — Aplikasi Pengelolaan Pegawai

Stack: **Next.js 14 (App Router) + TypeScript + Knex 3 + PostgreSQL + MUI + BullMQ/Redis + Docker**.

> Pedoman koding di repo ini: ikuti [`CLAUDE.md`](CLAUDE.md) (Karpathy guidelines) dan [`DESIGN.md`](DESIGN.md) (Apple-inspired).

## Prasyarat

- Docker Desktop 4.x+
- (Opsional, untuk dev native) Node 20 LTS + npm

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up -d --build

# Jalankan migration & seed (sekali saja, atau setelah pull migration baru)
# Pakai container worker karena image app standalone tidak punya tooling tsx
docker compose exec worker npm run db:migrate
docker compose exec worker npm run db:seed
```

Aplikasi: http://localhost:3000  
MailHog (UI inbox OTP): http://localhost:8025  
Postgres: `localhost:5433` (user/pass/db = `jmc`)  

Login awal: `superadmin` / `Admin#123` (wajib ganti setelah login pertama).

## Quick Start (Native)

```bash
cp .env.example .env
# Pastikan Postgres (port 5433) + Redis lokal jalan, sesuaikan DATABASE_URL & REDIS_URL di .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
# (terminal lain) jalankan worker
npm run worker
```

## Skema Database

Lihat [`db/migrations/`](db/migrations/) untuk definisi tabel dan relasinya.

## Skrip

| Skrip | Tujuan |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build && npm start` | Production build & serve |
| `npm run worker` | Worker BullMQ (import Excel, dll) |
| `npm run db:migrate` | Apply migration terbaru ke DB |
| `npm run db:rollback` | Rollback migration terakhir |
| `npm run db:seed` | Seed data master + superadmin |
| `npm run db:make -- <nama>` | Buat file migration baru |
| `npm run test` | Vitest unit test |
| `npm run test:e2e` | Playwright E2E test |

## Struktur Folder

```
.
├─ db/
│  ├─ migrations/          # Knex migration files (TypeScript)
│  └─ seeds/               # Seed data master + superadmin
├─ src/
│  ├─ app/                 # Next.js routes (App Router)
│  │  ├─ api/              # API routes
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ lib/                 # db singleton, redis, theme, util
│  ├─ types/               # TypeScript interfaces untuk tabel DB
│  └─ workers/             # BullMQ workers
├─ Dockerfile
├─ knexfile.ts
├─ next.config.mjs
├─ package.json
└─ tsconfig.json
```

## Environment Variables

Salin `.env.example` ke `.env`, lalu sesuaikan nilainya. Berikut daftar variabel yang dipakai:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NODE_ENV` | ya | `development` atau `production` |
| `APP_URL` | ya | URL aplikasi (untuk link di email OTP) |
| `SESSION_SECRET` | ya | Random string panjang untuk sign cookie session |
| `JWT_SECRET` | ya | Random string panjang untuk sign JWT |
| `DATABASE_URL` | ya | Connection string PostgreSQL |
| `REDIS_URL` | ya | Connection string Redis (untuk queue & revoke session) |
| `SMTP_HOST` | ya | Host SMTP untuk kirim OTP (dev: `mailhog`) |
| `SMTP_PORT` | ya | Port SMTP (dev MailHog: `1025`, prod TLS: `587`) |
| `SMTP_USER` | opsional | User SMTP (kosongkan untuk MailHog) |
| `SMTP_PASS` | opsional | Password SMTP (kosongkan untuk MailHog) |
| `SMTP_FROM` | ya | Alamat pengirim email OTP |
| `OFFICE_DEFAULT_LAT` | ya | Latitude kantor default (untuk hitung jarak) |
| `OFFICE_DEFAULT_LNG` | ya | Longitude kantor default |

**Sebelum production**, wajib ganti `SESSION_SECRET`, `JWT_SECRET`, kredensial DB, dan kredensial SMTP ke nilai yang aman.

## Catatan Keamanan (baseline)

- Password di-hash dengan **argon2id**.
- OTP & session token disimpan sebagai **hash**, bukan plaintext.
- Validasi input pakai **zod** di server (jangan andalkan validasi client-side saja).
- Aktifkan **rate limit** pada endpoint `/auth/login` & `/auth/otp`.
- Wajib HTTPS di production; cookie `Secure; HttpOnly; SameSite=Lax`.
