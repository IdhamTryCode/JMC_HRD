# JMC HRD — Aplikasi Pengelolaan Pegawai

Stack: **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + MUI + BullMQ/Redis + Docker**.

> Pedoman koding di repo ini: ikuti [`../CLAUDE.md`](../CLAUDE.md) (Karpathy guidelines) dan [`../DESIGN.md`](../DESIGN.md) (Apple-inspired).

## Prasyarat

- Docker Desktop 4.x+
- (Opsional, untuk dev native) Node 20 LTS + npm

## Quick Start (Docker)

```bash
cp app/.env.example app/.env
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run prisma:seed
```

Aplikasi: http://localhost:3000
MailHog (UI inbox OTP): http://localhost:8025
Postgres: `localhost:5432` (user/pass/db = `jmc`)

Login awal: `superadmin` / `Admin#123` (wajib ganti setelah login pertama).

## Quick Start (Native)

```bash
cd app
cp .env.example .env
# Pastikan Postgres + Redis lokal jalan, sesuaikan DATABASE_URL & REDIS_URL
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
# (terminal lain) jalankan worker
npm run worker
```

## Skema Database

Lihat [`../ERD.md`](../ERD.md) dan [`prisma/schema.prisma`](prisma/schema.prisma).

## Skrip

| Skrip | Tujuan |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build && npm start` | Production build & serve |
| `npm run worker` | Worker BullMQ (import Excel, dll) |
| `npm run prisma:migrate` | Apply migration ke DB dev |
| `npm run prisma:seed` | Seed data master + superadmin |
| `npm run test` | Vitest unit test |
| `npm run test:e2e` | Playwright E2E test |

## Struktur Folder

```
app/
├─ prisma/
│  ├─ schema.prisma     # ORM schema
│  └─ seed.ts           # seed master data
├─ src/
│  ├─ app/              # Next.js routes (App Router)
│  │  ├─ api/           # API routes
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ lib/              # prisma, redis, theme, util
│  └─ workers/          # BullMQ workers
├─ Dockerfile
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
