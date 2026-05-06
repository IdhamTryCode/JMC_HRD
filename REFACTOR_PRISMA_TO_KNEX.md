# Refactor Plan — Prisma → Knex + Postgres

> **Audience:** Claude Sonnet yang akan eksekusi. Kamu (the implementer) tidak perlu konteks chat sebelumnya — semua info ada di file ini + `ERD.md` + `CLAUDE.md` + `DESIGN.md`.
> **Estimated effort:** ~2.5 jam
> **Goal:** Ganti ORM dari Prisma ke Knex (query builder murni, no Objection.js). Frontend tetap Next.js full-stack. Validasi pakai Zod. Migration pakai `knex migrate`.

---

## Konteks Singkat

**Yang sudah jalan (Docker):**
- Next.js 14 App Router + TypeScript di `app/`
- PostgreSQL 16 di port `localhost:5433`
- Redis 7, MailHog, BullMQ worker
- Prisma + 16 tabel sudah ter-migrate (akan dibuang)
- MUI v5 + tema Apple-inspired di `app/src/lib/theme.ts`
- Landing page render OK di http://localhost:3000
- Health check `/api/health` works

**Yang akan diganti:**
- Prisma → Knex (`pg` driver) + Zod validation
- Migration auto Prisma → migration manual Knex SQL
- `app/src/lib/prisma.ts` → `app/src/lib/db.ts`

**Yang TIDAK berubah:**
- Stack frontend (Next.js + MUI)
- Docker compose services (db, redis, mailhog tetap)
- Schema database (lihat `ERD.md` — semua nama tabel, kolom, relasi sama persis)
- Theme & design (CLAUDE.md + DESIGN.md tetap pedoman)

---

## Decision Log (sudah dikonfirmasi user — final, tidak perlu nanya ulang)

1. **Stack:** Next.js full-stack, API routes pakai Knex langsung. **Bukan** Express/Fastify terpisah. ✅ confirmed
2. **ORM:** Knex murni (query builder + migration), **tanpa Objection.js**. ✅ confirmed
3. **Validasi:** Zod untuk input API. Row types via TypeScript interfaces manual di `app/src/types/db.ts`. ✅ confirmed
4. **Hapus Prisma sepenuhnya** (folder, deps, scripts, schema). ✅ confirmed
5. **Terjemahkan ERD.md → Knex migration** (16 tabel, sama persis). ✅ confirmed
6. **Migration format:** TS file (knex `migrate:make` default), bukan SQL murni — supaya bisa pakai helper Knex schema builder. Stored function tetap pakai `knex.schema.raw()`.
7. **Naming convention:** snake_case di DB; camelCase di app layer via helper `toCamel`/`toSnake`.
8. **Connection pool:** Default Knex (min 2, max 10).
9. **Soft delete:** Kolom `deleted_at`; query helper bikin scope `whereNull('deleted_at')`.

---

## Pre-flight Check (verifikasi sebelum mulai)

```bash
cd d:\Project\JMC

# Pastikan docker compose masih running (kalau tidak, start dulu)
docker compose ps

# Verifikasi DB accessible
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok","db":"up","time":"..."}

# Backup state Prisma (just in case rollback)
cp app/prisma/schema.prisma app/prisma/schema.prisma.bak
```

Kalau service tidak jalan: `docker compose up -d`. Kalau `/api/health` masih "ok" artinya state lama oke — kita akan **drop & recreate DB** saat refactor ini, jadi data akan hilang (tidak masalah, hanya seed superadmin).

---

## STEP 1 — Bersihkan Prisma (15 menit)

### 1.1 Drop schema Prisma di DB

```bash
docker compose exec db psql -U jmc -d jmc -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### 1.2 Hapus file & folder Prisma

```bash
# Dari d:/Project/JMC/app/
rm -rf prisma/
rm -f src/lib/prisma.ts
```

### 1.3 Update `app/package.json`

Hapus dari `dependencies`:
- `@prisma/client`

Hapus dari `devDependencies`:
- `prisma`

Hapus dari `scripts`:
- `"prisma:generate"`
- `"prisma:migrate"`
- `"prisma:seed"` (akan diganti `db:seed`)

Tambah ke `dependencies`:
```json
"knex": "3.1.0",
"pg": "8.13.1"
```

Tambah ke `devDependencies`:
```json
"@types/pg": "8.11.10"
```

Tambah ke `scripts`:
```json
"db:migrate": "knex --knexfile knexfile.ts migrate:latest",
"db:rollback": "knex --knexfile knexfile.ts migrate:rollback",
"db:seed": "knex --knexfile knexfile.ts seed:run",
"db:make": "knex --knexfile knexfile.ts migrate:make"
```

### 1.4 Regenerate lockfile

```bash
cd d:/Project/JMC/app
rm -f package-lock.json
npm install --package-lock-only --ignore-scripts
```

### 1.5 Update `app/Dockerfile`

Hapus baris berikut di **builder stage**:
```dockerfile
RUN npx prisma generate
```

Hapus baris berikut di **runner stage**:
```dockerfile
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
```

(Worker stage tidak perlu diubah — tidak pakai Prisma.)

---

## STEP 2 — Setup Knex (20 menit)

### 2.1 Buat `app/knexfile.ts`

```ts
import type { Knex } from "knex";
import * as path from "node:path";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL ?? "postgresql://jmc:jmc@localhost:5433/jmc",
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: path.resolve(__dirname, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 20 },
    migrations: {
      directory: path.resolve(__dirname, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: path.resolve(__dirname, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
  },
};

export default config;
```

### 2.2 Buat `app/src/lib/db.ts` (Knex singleton)

```ts
import knex, { Knex } from "knex";
import knexConfig from "../../knexfile";

const env = process.env.NODE_ENV === "production" ? "production" : "development";

const globalForDb = globalThis as unknown as { db?: Knex };

export const db: Knex = globalForDb.db ?? knex(knexConfig[env]);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
```

### 2.3 Update `app/src/app/api/health/route.ts`

Ganti import `prisma` → `db`, ganti query Prisma → Knex:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.raw("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: "degraded", db: "down", error: (e as Error).message },
      { status: 503 }
    );
  }
}
```

### 2.4 Buat folder migration & seed

```bash
mkdir -p app/db/migrations app/db/seeds
```

---

## STEP 3 — Translate Schema ke Knex Migration (60 menit)

> **Sumber:** `ERD.md` (16 tabel). Bagi jadi 4 file migration supaya rapi & mudah di-review.

### 3.1 Migration 1 — Master & Auth (`20260506_001_init_master_auth.ts`)

```bash
cd d:/Project/JMC/app
npx knex --knexfile knexfile.ts migrate:make init_master_auth
```

Isi (translate dari ERD section 2.1 + 2.2 + 2.3 sebagian):

**Tabel di file ini:**
- `roles`
- `provinsi`
- `kabupaten`
- `kecamatan`
- `kelurahan`
- `positions`
- `departments`
- `offices`

**Catatan implementasi:**
- ENUM Postgres bikin via `knex.schema.raw('CREATE TYPE ...')`
- Untuk ENUM `employment_type`, `marital_status`, `gender`, `attendance_kind`, `attendance_status`, `verification_status`, `verifier_role`, `attendance_source`, `import_status` — bikin semua di awal migration ini sebelum tabel yang pakainya.
- `wilayah` tables: `id` adalah BPS code (bukan auto-increment), pakai `.integer('id').primary()`.

### 3.2 Migration 2 — Employees & Users (`20260506_002_employees_users.ts`)

**Tabel:**
- `employees` (depend ke positions, departments, kelurahan, kabupaten)
- `employee_educations`
- `users` (depend ke employees, roles)
- `user_sessions`
- `otp_tokens`

**Catatan:**
- `employees.email` & `employees.nip` UNIQUE
- `users.employee_id` UNIQUE (1-to-1 optional)
- Index sesuai ERD: `(roleId)`, `(fullName)`, `(nip)`, `(employmentType)`, `(userId, purpose)` di otp.
- Soft delete: `deleted_at TIMESTAMPTZ NULL`.

### 3.3 Migration 3 — Tunjangan & Quota (`20260506_003_tunjangan_quota.ts`)

**Tabel:**
- `transport_settings`
- `transport_allowances` (composite unique `(employee_id, period_year, period_month)`)
- `leave_quotas` (composite unique `(employee_id, year)`)

### 3.4 Migration 4 — Presensi & Audit (`20260506_004_presensi_audit.ts`)

**Tabel:**
- `attendances` (composite unique `(employee_id, date)`, FK ke offices via `check_in_office_id` + `check_out_office_id`)
- `attendance_imports`
- `activity_logs`

**Index:**
- `attendances`: `(date)`
- `activity_logs`: `(created_at)`, `(user_id)`, `(module)`

### 3.5 Stored Function (Bonus untuk kriteria #5)

Buat 1 file migration tambahan: `20260506_005_functions.ts` — implementasi 2 stored function untuk demo SQL skill (mengikuti saran di chat sebelumnya):

**Function 1: `compute_masa_kerja(p_join_date DATE)` → INT (years)**
```sql
CREATE OR REPLACE FUNCTION compute_masa_kerja(p_join_date DATE)
RETURNS INT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_join_date))::INT;
END;
$$;
```

**Function 2: `compute_transport_allowance(p_base_fare NUMERIC, p_distance_km NUMERIC, p_working_days INT)` → NUMERIC**
```sql
CREATE OR REPLACE FUNCTION compute_transport_allowance(
  p_base_fare NUMERIC,
  p_distance_km NUMERIC,
  p_working_days INT
)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_km_used INT;
BEGIN
  -- Aturan jarak: <=5 km tidak dapat tunjangan, >25 km di-clamp ke 25
  IF p_distance_km <= 5 THEN RETURN 0; END IF;
  -- Aturan hari: <19 hari tidak dapat tunjangan
  IF p_working_days < 19 THEN RETURN 0; END IF;

  -- Pembulatan: <0.5 ke bawah, >=0.5 ke atas
  v_km_used := ROUND(LEAST(p_distance_km, 25))::INT;

  RETURN p_base_fare * v_km_used * p_working_days;
END;
$$;
```

Alasan masuk migration: agar tetap reproducible saat reviewer drop & re-create DB.

---

## STEP 4 — Buat Seed Files (20 menit)

### 4.1 `app/db/seeds/01_roles_positions_departments.ts`

```ts
import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Idempotent: pakai ON CONFLICT
  await knex("roles").insert([
    { name: "superadmin", description: "Akses penuh sistem" },
    { name: "manager_hrd", description: "Manager HRD" },
    { name: "admin_hrd", description: "Admin HRD" },
  ]).onConflict("name").ignore();

  await knex("positions").insert(
    ["Manager", "Staf", "Magang", "Karyawan"].map(name => ({ name }))
  ).onConflict("name").ignore();

  await knex("departments").insert(
    ["Marketing", "HRD", "Production", "Executive", "Commissioner"].map(name => ({ name }))
  ).onConflict("name").ignore();
}
```

### 4.2 `app/db/seeds/02_offices.ts`

Insert 3 gedung default (Gedung Utama, A, B) dengan koordinat placeholder Yogyakarta. Sama persis dengan `prisma/seed.ts` lama.

### 4.3 `app/db/seeds/03_superadmin.ts`

```ts
import type { Knex } from "knex";
import argon2 from "argon2";

export async function seed(knex: Knex): Promise<void> {
  const role = await knex("roles").where({ name: "superadmin" }).first();
  if (!role) throw new Error("Role superadmin not found — run seed 01 dulu");

  const exists = await knex("users").where({ username: "superadmin" }).first();
  if (exists) return;

  const passwordHash = await argon2.hash("Admin#123");
  await knex("users").insert({
    username: "superadmin",
    password_hash: passwordHash,
    role_id: role.id,
    is_active: true,
  });

  console.log("✓ Superadmin: superadmin / Admin#123");
}
```

---

## STEP 5 — Type Definitions (15 menit)

### 5.1 Buat `app/src/types/db.ts`

Interface TypeScript untuk tiap row table. Ini bukan auto-generated (karena Knex murni), jadi harus ditulis manual. Naming **camelCase** di app, mapping di service layer.

```ts
// Helper utility types
export type ID = number;
export type Timestamp = Date;

// Auth
export interface RoleRow {
  id: ID;
  name: "superadmin" | "manager_hrd" | "admin_hrd";
  description: string | null;
  created_at: Timestamp;
}

export interface UserRow {
  id: ID;
  employee_id: ID | null;
  role_id: ID;
  username: string;
  password_hash: string;
  is_active: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

// ... (lanjut untuk 14 tabel lainnya)
```

> **Tips eksekusi:** Tulis 1 interface per tabel ERD.md. Naming kolom di interface = snake_case (match DB), supaya query Knex tidak butuh alias. Convert ke camelCase hanya di service/API layer pakai helper kecil.

### 5.2 Buat `app/src/lib/case.ts` (helper konversi)

```ts
export function toCamel<T = unknown>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[ck] = v;
  }
  return out as T;
}

export function toSnake<T = unknown>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const sk = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    out[sk] = v;
  }
  return out as T;
}
```

---

## STEP 6 — Update Worker (5 menit)

`app/src/workers/index.mjs` saat ini tidak pakai DB, jadi tidak perlu diubah.
**Future-proof:** kalau worker akan butuh akses DB nanti (untuk import Excel), worker harus instantiate Knex sendiri (tidak share singleton dari Next runtime). Catat ini di TODO comment di worker file.

---

## STEP 7 — Eksekusi & Verifikasi (20 menit)

### 7.1 Build ulang Docker

```bash
cd d:/Project/JMC

# Hentikan worker & app dulu
docker compose stop app worker

# Rebuild image
docker compose build app worker
```

### 7.2 Apply migration & seed (dari host, pointing ke localhost:5433)

```bash
cd d:/Project/JMC/app

# Install deps di host (untuk jalankan knex CLI)
npm install --ignore-scripts

# Apply migration
DATABASE_URL="postgresql://jmc:jmc@localhost:5433/jmc" npm run db:migrate

# Seed
DATABASE_URL="postgresql://jmc:jmc@localhost:5433/jmc" npm run db:seed
```

### 7.3 Restart app & worker

```bash
cd d:/Project/JMC
docker compose up -d
```

### 7.4 Verifikasi 5 hal:

```bash
# 1. Semua service Up
docker compose ps
# Expected: jmc-app, jmc-db (healthy), jmc-redis, jmc-mailhog, jmc-worker semua "Up"

# 2. Health endpoint OK
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok","db":"up","time":"..."}

# 3. Landing page render
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/
# Expected: HTTP 200

# 4. Tabel ada di DB
docker compose exec db psql -U jmc -d jmc -c "\dt"
# Expected: 16 tables (roles, users, employees, attendances, dll)

# 5. Seed superadmin ada
docker compose exec db psql -U jmc -d jmc -c "SELECT username, is_active FROM users;"
# Expected: superadmin | t

# 6. Stored function works
docker compose exec db psql -U jmc -d jmc -c "SELECT compute_transport_allowance(5000, 10, 22);"
# Expected: 1100000 (5000 × 10 × 22)
```

### 7.5 Worker check

```bash
docker compose logs worker --tail 5
# Expected: "[worker] listening on queue: attendance-import"
```

Kalau ke-6 verifikasi pass → refactor selesai.

---

## STEP 8 — Update Dokumentasi (10 menit)

### 8.1 `app/README.md`

Update bagian Quick Start:

**Sebelum:**
```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run prisma:seed
```

**Sesudah:**
```bash
# Migration & seed dijalankan dari host
cd app && npm install --ignore-scripts
DATABASE_URL="postgresql://jmc:jmc@localhost:5433/jmc" npm run db:migrate
DATABASE_URL="postgresql://jmc:jmc@localhost:5433/jmc" npm run db:seed
```

Update bagian "Skema Database":
> Migrations: `app/db/migrations/`. Seeds: `app/db/seeds/`. Skema referensi: `../ERD.md`. Stack: Knex 3 + pg.

Update bagian "Skrip":
| Skrip | Tujuan |
|---|---|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:rollback` | Rollback last batch |
| `npm run db:seed` | Run seed files |
| `npm run db:make <name>` | Buat migration baru |

### 8.2 `ERD.md` — section 4 (Stack Implementasi)

Ganti rekomendasi Prisma → Knex:

> - **Knex 3 + pg** — query builder + migration manual SQL, full control. Cocok untuk demonstrasi skill SQL (kriteria penilaian #5).
> - Validasi input: **Zod**.
> - Stored function di-define di migration (lihat `005_functions.ts`).

### 8.3 `ASUMSI.md`

Tambah entry baru di section "Stack":
> 1.1 **ORM:** Knex 3 (query builder murni, no Objection.js). Validasi pakai Zod. Pilihan ini menukar kemudahan auto-migrate Prisma dengan kontrol penuh atas SQL — sesuai dengan kriteria penilaian #5 yang menilai kemampuan function/procedure.

### 8.4 Update memory file (lewat Write tool)

File: `C:\Users\idham\.claude\projects\d--Project-JMC\memory\project_jmc_test.md`

Cari baris `Stack:` (kalau ada disebut Prisma), ganti referensi Prisma → Knex.

Atau tambah memory baru:

File: `C:\Users\idham\.claude\projects\d--Project-JMC\memory\feedback_orm_choice.md`
```markdown
---
name: User prefers Knex over Prisma
description: For JMC project, user is most familiar with Knex + Postgres; rejected Prisma in favor of Knex
type: feedback
---

User explicitly chose **Knex 3 + pg** over Prisma for JMC HRD project on 2026-05-06.

**Why:** User's strongest familiarity is Knex + Postgres. Also matches JMC test grading criteria #5 ("kemampuan function/procedure") better than Prisma.

**How to apply:**
- Use Knex query builder, not Prisma Client
- Migrations live in `app/db/migrations/`, seeds in `app/db/seeds/`
- Stored functions/procedures encouraged (kriteria #5)
- Don't suggest Prisma again unless user re-opens the discussion
```

Update `MEMORY.md` index dengan satu baris pointer baru.

---

## Rollback Plan (kalau ada masalah serius)

Kalau migration Knex gagal & perlu balik ke Prisma:

```bash
# 1. Drop semua schema Knex
docker compose exec db psql -U jmc -d jmc -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Restore schema.prisma
cp app/prisma/schema.prisma.bak app/prisma/schema.prisma

# 3. Revert package.json (git diff/checkout)
cd app && git checkout package.json package-lock.json

# 4. Re-install + re-migrate
npm install
DATABASE_URL="postgresql://jmc:jmc@localhost:5433/jmc" npx prisma migrate deploy
```

(Karena git belum di-init, sebaiknya inisialisasi `git init` + `git add . && git commit -m "scaffold prisma working"` SEBELUM mulai refactor sebagai save point.)

---

## Definition of Done — Refactor Sukses Kalau:

- [ ] `docker compose ps` — 5 service Up & healthy
- [ ] `curl http://localhost:3000/api/health` → `{"status":"ok","db":"up"}`
- [ ] `curl http://localhost:3000/` → HTTP 200, landing page render
- [ ] `\dt` di psql → 16 tabel (sama persis dengan ERD.md)
- [ ] `SELECT username FROM users` → superadmin row exists
- [ ] `SELECT compute_transport_allowance(5000, 10, 22)` → 1100000
- [ ] `docker compose logs worker` → listening on queue
- [ ] Tidak ada referensi `prisma` di `app/src/` (kecuali komentar TODO)
- [ ] `app/prisma/` folder hilang
- [ ] `package.json` tidak ada Prisma deps
- [ ] `README.md`, `ERD.md`, `ASUMSI.md` ter-update
- [ ] Memory file ter-update dengan keputusan Knex

---

## Tips untuk Implementer (Sonnet)

1. **Baca CLAUDE.md dulu** — surface assumptions, simplest viable, surgical changes.
2. **Cek file yang ada via Read sebelum Edit** — beberapa file akan saya sebut tapi state-nya bisa berubah.
3. **Jangan tambah fitur** — refactor murni, no new feature, no "improvement adjacent".
4. **Test di tiap STEP** — jangan tumpuk semua perubahan baru test di akhir.
5. **Jaga ERD.md sebagai single source of truth schema** — kalau ada beda antara plan ini dan ERD.md, ikuti ERD.md.
6. **Pakai TodoWrite** untuk track 8 step di atas — supaya progress jelas ke user.
7. **Auto mode:** kerjakan tanpa nanya kalau pilihan sudah jelas di Decision Log section. Tanya hanya kalau ketemu sesuatu yang benar-benar di luar scope plan.

---

## File Inventory — Apa yang Akan Berubah

**HAPUS:**
- `app/prisma/` (seluruh folder)
- `app/src/lib/prisma.ts`

**BUAT BARU:**
- `app/knexfile.ts`
- `app/db/migrations/20260506_001_init_master_auth.ts`
- `app/db/migrations/20260506_002_employees_users.ts`
- `app/db/migrations/20260506_003_tunjangan_quota.ts`
- `app/db/migrations/20260506_004_presensi_audit.ts`
- `app/db/migrations/20260506_005_functions.ts`
- `app/db/seeds/01_roles_positions_departments.ts`
- `app/db/seeds/02_offices.ts`
- `app/db/seeds/03_superadmin.ts`
- `app/src/lib/db.ts`
- `app/src/lib/case.ts`
- `app/src/types/db.ts`
- Memory file untuk feedback Knex preference

**EDIT:**
- `app/package.json` (deps + scripts)
- `app/Dockerfile` (hapus `prisma generate` + COPY prisma)
- `app/src/app/api/health/route.ts` (Prisma → Knex)
- `app/README.md` (skrip + setup)
- `ERD.md` (catatan stack)
- `ASUMSI.md` (decision Knex)

**TIDAK BERUBAH:**
- `app/src/app/layout.tsx`
- `app/src/app/page.tsx`
- `app/src/lib/theme.ts`
- `app/src/lib/redis.ts`
- `app/src/workers/index.mjs`
- `docker-compose.yml`
- `CLAUDE.md`, `DESIGN.md`
- `JAWABAN_TEORI.md`, `BREAKDOWN_TASK.md`

---

## Cara Memulai

```bash
# 1. (rekomendasi) git init sebagai save point
cd d:/Project/JMC
git init && git add . && git commit -m "checkpoint: prisma scaffold working"

# 2. Mulai dari STEP 1
# Eksekusi sequential, verify di tiap step.
```

Selamat ngerjain. 🛠️
