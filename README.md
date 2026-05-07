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

Lihat [`ERD.md`](ERD.md) dan [`db/migrations/`](db/migrations/).

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

Lihat [`.env.example`](.env.example). Yang wajib di-set ulang sebelum production:
`SESSION_SECRET`, `JWT_SECRET`, kredensial DB, kredensial SMTP, koordinat kantor.

## Catatan Keamanan (baseline)

- Password di-hash dengan **argon2id**.
- OTP & session token disimpan sebagai **hash**, bukan plaintext.
- Validasi input pakai **zod** di server (jangan andalkan validasi client-side saja).
- Aktifkan **rate limit** pada endpoint `/auth/login` & `/auth/otp`.
- Wajib HTTPS di production; cookie `Secure; HttpOnly; SameSite=Lax`.
