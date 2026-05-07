# JMC HRD System

Sistem Pengelolaan Sumber Daya Manusia (HRD) untuk JMC Indonesia.

## Stack

| Layer | Teknologi |
|---|---|
| Frontend & API | Next.js 14 (App Router) + TypeScript |
| UI | Material UI v5 |
| Database | PostgreSQL 16 |
| ORM / Query | Knex 3 (raw SQL) |
| Session | Redis (IORedis) |
| Queue | BullMQ |
| Auth | Argon2 + OTP via email |
| Map | Leaflet + react-leaflet |
| Email (dev) | MailHog |
| Container | Docker + Docker Compose |

## Cara Menjalankan

### 1. Clone & masuk ke direktori

```bash
git clone <repo-url>
cd JMC
```

### 2. Salin environment file

```bash
cp app/.env.example app/.env
```

Untuk development tidak perlu mengubah apa-apa. Semua service sudah dikonfigurasi via Docker.

### 3. Build dan jalankan semua service

```bash
docker compose up --build
```

Service yang akan berjalan:

| Service | URL |
|---|---|
| Aplikasi | http://localhost:3000 |
| MailHog (email dev) | http://localhost:8025 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

### 4. Jalankan migrasi dan seed

```bash
# Masuk ke container app
docker compose exec app sh

# Di dalam container:
npm run db:migrate
npm run db:seed
```

Seed akan mengunduh data wilayah Indonesia (~88 ribu baris) dari GitHub secara otomatis. Proses ini memakan waktu 1-3 menit.

### 5. Login

Akun superadmin default:

| Field | Value |
|---|---|
| Username | `superadmin` |
| Password | `Admin#123` |

OTP akan dikirim ke email — buka MailHog di http://localhost:8025 untuk melihatnya.

## Struktur Direktori

```
JMC/
├── app/                    # Next.js application
│   ├── db/
│   │   ├── migrations/     # Knex migrations
│   │   └── seeds/          # Seed data
│   ├── src/
│   │   ├── app/            # Next.js App Router (pages + API routes)
│   │   ├── components/     # Shared React components
│   │   ├── lib/            # Server-side utilities (db, auth, session, dll)
│   │   └── workers/        # BullMQ worker (import Excel presensi)
│   └── Dockerfile
└── docker-compose.yml
```

## Fitur

### Modul yang Tersedia

| Modul | Fitur |
|---|---|
| **Auth** | Login OTP + captcha, session Redis, argon2 password |
| **User Management** | CRUD user, reset password via email, role-based access |
| **Pegawai** | CRUD lengkap (~25 field), foto, PDF per pegawai, export Excel |
| **Wilayah** | Cascading dropdown provinsi → kabupaten → kecamatan → kelurahan |
| **Presensi** | Import Excel via BullMQ queue, input manual, verifikasi |
| **Tunjangan Transport** | Kalkulasi otomatis (haversine + stored function PostgreSQL) |
| **Cuti & Izin** | Kuota per tahun per pegawai |
| **Dashboard** | Statistik real-time + peta domisili pegawai (Leaflet) |
| **Log Aktivitas** | Audit trail semua aksi dengan filter modul & tanggal |
| **API Docs** | Swagger UI di `/docs` |

### Role

| Role | Akses |
|---|---|
| `superadmin` | Semua fitur + manajemen user |
| `admin_hrd` | Pegawai, presensi, tunjangan, kuota cuti |
| `manager_hrd` | View dashboard, pegawai, presensi, log |

## Menjalankan Tests

```bash
cd app
npm test
```

22 unit tests untuk:
- Business logic tunjangan transport (semua edge case)
- Validasi schema Zod (employee, password)

## API Documentation

Swagger UI tersedia di: http://localhost:3000/docs

Atau akses spec JSON: http://localhost:3000/api/docs

## Aturan Bisnis Tunjangan Transport

- Jarak ≤ 5 km → tidak eligible (Rp 0)
- Hari masuk < 19 → tidak eligible (Rp 0)
- Jarak di-clamp ke maksimal 25 km
- Pembulatan km: standar (≥ 0.5 ke atas)
- Formula: `tarif_per_km × km_digunakan × hari_masuk`
- Jarak dihitung dengan formula Haversine dari koordinat domisili pegawai ke kantor

## Aturan Bisnis Presensi

- Jam kerja: 08:00 - 17:00
- Toleransi keterlambatan: 15 menit
- Status: `hadir` / `cuti` / `izin` / `unpaid_leave`
- Durasi ≥ 8 jam → status `terpenuhi`
- Import Excel: proses via BullMQ worker (background job)
- Verifikasi 3 level: `lead` → `manager` → `hrd`
