# Breakdown Task & Estimasi — Aplikasi HRD JMC

> Menjawab soal teori **#11 (Breakdown task)** dan **#12 (Estimasi waktu realistis)**.
> Total budget: **96 jam (4 hari kalender)**. Estimasi di bawah pakai **jam efektif coding** (sudah memperhitungkan friksi: nge-debug, baca dokumentasi, mengetik dokumentasi).
> Mengacu CLAUDE.md (simplest viable, no speculative work) — fitur "wajib jalan" diprioritaskan, fitur "nice-to-have" terakhir.

## Ringkasan Estimasi

| Fase | Estimasi | Kumulatif | Target |
|---|---|---|---|
| Fase 0 — Setup & Persiapan | **5 j** | 5 j | H1 pagi |
| Fase 1 — Auth + RBAC + Log | **12 j** | 17 j | H1 sore |
| Fase 2 — Modul User & Master | **10 j** | 27 j | H2 pagi |
| Fase 3 — Modul Pegawai | **18 j** | 45 j | H2 malam |
| Fase 4 — Presensi + Tunjangan | **18 j** | 63 j | H3 malam |
| Fase 5 — Dashboard + Map | **8 j** | 71 j | H4 pagi |
| Fase 6 — Polish, Test, Doc, Deploy | **13 j** | **84 j** | H4 sore |
| **Buffer** (debug, fix, hal tak terduga) | 12 j | 96 j | H4 malam |

> **84 jam efektif** + **12 jam buffer**. Pengalaman: buffer SELALU habis. Jangan pakai buffer untuk fitur baru.

---

## Fase 0 — Setup & Persiapan (5 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 0.1 | Baca soal + panduan secara utuh, tulis ASUMSI.md | 1 j | ASUMSI.md ada, 20+ poin |
| 0.2 | Bikin ERD di kertas/diagram | 1 j | ERD.md final |
| 0.3 | Inisialisasi repo, scaffold Next.js + Prisma + MUI + Docker | 1.5 j | `docker compose up` jalan, `/` terbuka |
| 0.4 | Seed wilayah Indonesia (provinsi/kab/kec/kel) | 1 j | Query autosuggest 200ms |
| 0.5 | CI minimal: lint + typecheck + test runner | 0.5 j | GitHub Action hijau di push pertama |

---

## Fase 1 — Auth + RBAC + Log (12 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 1.1 | Migration awal + seed roles, superadmin | 0.5 j | `superadmin/Admin#123` bisa di-query |
| 1.2 | Captcha image generator (server-side) | 1 j | Refresh menampilkan kode baru |
| 1.3 | Endpoint `POST /api/auth/login` (verify pass + captcha) | 1.5 j | Test: 4 skenario (sukses, salah pass, captcha salah, user nonaktif) |
| 1.4 | Generate & kirim OTP via SMTP (MailHog dev) | 1.5 j | OTP masuk ke MailHog inbox; expire 60s |
| 1.5 | Endpoint `POST /api/auth/otp/verify` + buat session | 1 j | Cookie session ter-set, hashed di DB |
| 1.6 | Middleware auth + RBAC (cek `role` per route group) | 2 j | Akses langsung URL pegawai sebagai admin → 403 |
| 1.7 | Force-logout saat user dinonaktifkan (revoke session di Redis) | 1.5 j | Test: nonaktifkan user yang sedang login → request berikut 401 |
| 1.8 | Halaman UI login (3 step: credential → captcha → OTP) | 2 j | Lighthouse a11y ≥ 90 |
| 1.9 | Activity logger middleware (auto-log login/logout/CRUD) | 1 j | Login pertama bikin row di `activity_logs` |

---

## Fase 2 — Modul User & Master Data (10 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 2.1 | API list user + paginasi + search | 1 j | Postman: filter username works |
| 2.2 | UI list user (DataGrid MUI) + filter status | 1.5 j | Aktif/Nonaktif toggle persist |
| 2.3 | API + UI form tambah user (autosuggest pegawai, generate password, kirim email) | 2.5 j | User baru dapat email password awal |
| 2.4 | UI edit user + validasi onkeyup (username, password rules) | 2 j | Validasi muncul real-time |
| 2.5 | Toggle Aktif/Nonaktif (kirim event force-logout) | 1 j | E2E: user A login, user B nonaktifkan A → A ke-logout |
| 2.6 | Halaman profil (ganti password mandiri) | 1 j | Password lama wajib, baru ter-hash |
| 2.7 | Modul Log: list + filter username/modul/daterange | 1 j | Log 1000 rows render <1s |

---

## Fase 3 — Modul Data Pegawai (18 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 3.1 | API list pegawai (paginasi, sort, search nama/NIP/jabatan) | 2 j | Sort multi-kolom works |
| 3.2 | API filter (jabatan multi, masa kerja >/=/<, jenis multi) | 1.5 j | Filter masa kerja `>5` benar |
| 3.3 | UI list (DataGrid + bulk select + tombol aksi) | 2.5 j | Bulk select 50 rows lalu hapus jalan |
| 3.4 | API + UI form tambah pegawai (~25 field) | 4 j | Validasi server: NIP unik, format HP, dll |
| 3.5 | Cascading dropdown wilayah (kecamatan → auto provinsi/kabupaten/kelurahan) | 2 j | Pilih kecamatan → 3 field terisi |
| 3.6 | Upload foto + simpan ke disk + validasi MIME | 1 j | Upload .exe ditolak |
| 3.7 | Form pendidikan dinamis (tambah/hapus/reorder) | 1.5 j | Submit dengan 5 row pendidikan |
| 3.8 | Halaman detail + halaman edit (reuse form) | 1.5 j | Edit existing pegawai update |
| 3.9 | Download PDF per pegawai (pdfkit) | 1 j | PDF berisi foto + semua field |
| 3.10 | Download list pegawai (Excel/CSV) | 1 j | File ter-download, 1000 rows < 5s |

---

## Fase 4 — Presensi + Tunjangan Transport (18 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 4.1 | Engine perhitungan presensi (08–17, late ≤15, halfday, lokasi sama) | 3 j | Unit test: 10+ skenario edge case |
| 4.2 | Migration leave_quotas + seed default per pegawai | 0.5 j | 1 pegawai punya quota 12/12/3 |
| 4.3 | API + UI list presensi (default N-1 bulan, rekap + tombol view) | 2 j | Buka modul → langsung tampil bulan lalu |
| 4.4 | Halaman detail presensi per pegawai | 1.5 j | Data tabel sesuai aturan |
| 4.5 | Download template Excel | 0.5 j | File template benar formatnya |
| 4.6 | API import Excel (upload file, queue ke BullMQ) | 1 j | File <10MB diterima, queue tampil |
| 4.7 | Worker BullMQ proses Excel + tulis ke DB | 2.5 j | 1000 row diproses <30s, error row dilog |
| 4.8 | UI status import (polling) + auto-refresh tabel | 1.5 j | Saat status `done` → halaman refresh |
| 4.9 | Setting Tunjangan Transport (CRUD base fare, versioning) | 1 j | Ubah base fare tidak menimpa histori |
| 4.10 | Engine hitung tunjangan (rumus + clamp 5–25 + min 19 hari + tetap-only) | 2.5 j | Unit test: 8 skenario (kontrak, <19 hari, jarak 3km, dll) |
| 4.11 | UI Modul Tunjangan (list per pegawai per bulan, RO) | 1 j | Manager HRD bisa lihat, tidak bisa edit |
| 4.12 | Cron/manual trigger hitung tunjangan bulanan | 1 j | Endpoint `/api/transport/compute?month=` works |

---

## Fase 5 — Dashboard + Map (8 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 5.1 | Dashboard Superadmin (selamat datang) | 0.5 j | Render nama + role |
| 5.2 | Dashboard Admin HRD (selamat datang) | 0.5 j | Render nama + role |
| 5.3 | Dashboard Manager HRD: 4 widget agregat | 1 j | Total pegawai = COUNT actual |
| 5.4 | 2 doughnut chart (kontrak/tetap/magang, pria/wanita) — Chart.js / Recharts | 1.5 j | Chart proporsional |
| 5.5 | Tabel 5 pegawai terbaru (sort by join_date DESC) | 0.5 j | Data sesuai |
| 5.6 | Map "rumah pegawai terdekat ke kantor" — Leaflet routing | 2 j | Marker rumah + kantor + garis arah |
| 5.7 | Map "area domisili pegawai" — marker cluster Leaflet | 2 j | 100 marker tidak laggy |

---

## Fase 6 — Polish, Test, Documentation, Deploy (13 j)

| # | Task | Est | Output verifikasi |
|---|---|---:|---|
| 6.1 | Swagger/OpenAPI doc untuk semua endpoint | 2 j | `/api/docs` render |
| 6.2 | README.md final (setup Docker + native + env vars) | 1 j | Orang lain bisa setup dari README |
| 6.3 | ASUMSI.md final review | 0.5 j | Tidak ada keputusan tersembunyi |
| 6.4 | Dokumen pengujian (test plan + test cases per modul) | 2 j | TEST_PLAN.md ≥30 test case |
| 6.5 | Unit test critical path (auth, presensi engine, tunjangan engine) | 3 j | Coverage critical ≥70% |
| 6.6 | E2E test 1 happy path (login → buat pegawai → import presensi) | 2 j | Playwright pass di CI |
| 6.7 | Polish UI: konsistensi spasi, typografi, error state, empty state | 1.5 j | Walk-through manual semua halaman |
| 6.8 | Security pass (rate limit, CSRF, headers, env audit) | 1 j | npm audit clean atau ter-document |

---

## Strategi Eksekusi (rekomendasi sekuens)

**Hari 1 (24 j tersedia, target 17 j coding)**
- Pagi: Fase 0 (setup + ERD)
- Siang–malam: Fase 1 (auth + RBAC + log) — *blocker semua modul lain, harus selesai H1*

**Hari 2 (target 18 j coding)**
- Pagi: Fase 2 (user + log UI)
- Siang–malam: Fase 3 (pegawai) — modul terbesar, kerjakan saat masih segar

**Hari 3 (target 18 j coding)**
- Full day: Fase 4 (presensi + tunjangan) — kompleksitas algoritma tinggi

**Hari 4 (target 21 j termasuk buffer)**
- Pagi: Fase 5 (dashboard + map)
- Siang: Fase 6 (test + docs + polish)
- Malam: **buffer + final push 4 jam sebelum deadline**, **JANGAN push 5 menit terakhir**

---

## Prioritas Drop-Order (kalau waktu mepet)

Jika di H3 sore terlihat tidak akan selesai semua, drop dengan urutan ini:

1. **Drop dulu:** Map direction terdekat (5.6) → ganti dengan tabel sederhana "5 pegawai terdekat"
2. **Drop kedua:** E2E test Playwright (6.6) → cukup unit test
3. **Drop ketiga:** Marker cluster (5.7) → ganti dengan list area
4. **Drop keempat:** Background job import Excel (4.7) → jadi sync (loading spinner)
5. **Drop kelima:** PDF per pegawai (3.9) → ganti print CSS

**Tidak boleh di-drop:** Auth + RBAC, CRUD Pegawai, Log, satu jalur Presensi (manual entry minimal), Docker, README.

---

## Catatan Estimasi (kejujuran ke diri sendiri)

- Estimasi di atas **optimis** — pengalaman pribadi: tambah 30% kalau ini stack/library yang belum sangat familiar.
- **Jam tidur** belum dipotong dari 96 jam total. 96 jam × ~10 jam efektif/hari = 40 jam realistis. Sisa di estimasi (84 j) sudah agresif — perlu disiplin.
- Test scripts dapat **nilai plus** sesuai panduan. Jangan dipotong duluan kalau ada waktu.

---

## Update Log

| Tanggal | Apa yang diupdate |
|---|---|
| 2026-05-06 | Initial breakdown |
