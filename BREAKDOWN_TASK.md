# Breakdown Task & Estimasi — Aplikasi HRD JMC

Menjawab soal teori **#11 (Breakdown task)** dan **#12 (Estimasi waktu realistis)**.

Total waktu pengerjaan 96 jam (4 hari). Estimasi yang saya tulis adalah jam efektif coding, jadi sudah saya potong waktu untuk debug, baca dokumentasi, dan ngetik dokumentasi. Saya kerjakan dengan prinsip yang wajib jalan dulu, baru fitur tambahan.

## Ringkasan Estimasi

| Fase | Estimasi | Target |
|---|---|---|
| Fase 0 — Setup & Persiapan | 5 j | H1 pagi |
| Fase 1 — Auth + RBAC + Log | 12 j | H1 sore |
| Fase 2 — Modul User & Master | 10 j | H2 pagi |
| Fase 3 — Modul Pegawai | 18 j | H2 malam |
| Fase 4 — Presensi + Tunjangan | 18 j | H3 malam |
| Fase 5 — Dashboard + Map | 8 j | H4 pagi |
| Fase 6 — Polish, Test, Doc, Deploy | 13 j | H4 sore |
| Buffer | 12 j | H4 malam |

Totalnya 84 jam coding + 12 jam buffer. Pengalaman saya, buffer biasanya selalu kepakai habis, jadi saya tidak akan pakai buffer untuk bikin fitur baru.

---

## Fase 0 — Setup & Persiapan (5 j)

- Baca soal + panduan, tulis daftar asumsi yang perlu ditetapkan
- Bikin ERD awal
- Inisialisasi repo, scaffold Next.js + Knex + MUI + Docker
- Seed master data wilayah Indonesia
- Setup CI minimal (lint, typecheck, test runner)

## Fase 1 — Auth + RBAC + Log (12 j)

- Migration awal + seed roles dan superadmin
- Captcha image generator
- Endpoint login (verify password + captcha)
- Generate dan kirim OTP via SMTP, expire 60 detik
- Verifikasi OTP dan pembuatan session
- Middleware auth + RBAC per route group
- Mekanisme force-logout saat user dinonaktifkan
- Halaman UI login (3 step: credential → captcha → OTP)
- Activity logger middleware untuk auto-log aksi user

## Fase 2 — Modul User & Master Data (10 j)

- API + UI list user dengan paginasi, search, dan filter status
- Form tambah user (autosuggest dari data pegawai, generate password, kirim email)
- Form edit user dengan validasi onkeyup
- Toggle aktif/nonaktif user yang trigger force-logout
- Halaman profil untuk ganti password mandiri
- Modul Log dengan filter username, modul, dan daterange

## Fase 3 — Modul Data Pegawai (18 j)

- API list pegawai (paginasi, sort, search)
- API filter (jabatan, masa kerja dengan operator, jenis pegawai)
- UI list dengan DataGrid, bulk select, dan tombol aksi
- Form tambah pegawai (~25 field) dengan validasi server
- Cascading dropdown wilayah (kecamatan → otomatis isi provinsi/kabupaten/kelurahan)
- Upload foto dengan validasi MIME
- Form pendidikan dinamis (bisa tambah/hapus baris)
- Halaman detail dan edit (reuse form)
- Download PDF per pegawai
- Download list pegawai dalam Excel/CSV

## Fase 4 — Presensi + Tunjangan Transport (18 j)

- Engine perhitungan presensi (jam 08–17, toleransi telat 15 menit, halfday, validasi lokasi sama)
- Migration leave_quotas + seed default
- API + UI list presensi (default tampilkan N-1 bulan)
- Halaman detail presensi per pegawai
- Download template Excel + API import (upload, queue ke BullMQ)
- Worker BullMQ untuk proses Excel di background
- UI status import dengan polling dan auto-refresh
- Setting tunjangan transport (CRUD base fare dengan versioning)
- Engine hitung tunjangan (rumus + clamp 5–25 km + minimal 19 hari + khusus pegawai tetap)
- UI modul tunjangan (read-only untuk Manager HRD)
- Trigger hitung tunjangan bulanan

## Fase 5 — Dashboard + Map (8 j)

- Dashboard Superadmin dan Admin HRD (selamat datang sederhana)
- Dashboard Manager HRD: 4 widget agregat
- Dua doughnut chart (jenis pegawai, gender)
- Tabel 5 pegawai terbaru
- Map "rumah pegawai terdekat ke kantor"
- Map "area domisili pegawai" dengan marker cluster

## Fase 6 — Polish, Test, Documentation, Deploy (13 j)

- Dokumentasi API dengan Swagger/OpenAPI
- README final (setup Docker dan native, env vars)
- Dokumen pengujian (test plan + test cases per modul)
- Unit test untuk critical path (auth, engine presensi, engine tunjangan)
- E2E test untuk satu happy path utama
- Polish UI (konsistensi, error state, empty state)
- Security pass (rate limit, CSRF, headers)

---

## Strategi Eksekusi

**Hari 1** — pagi saya pakai buat Fase 0 (setup + ERD), lalu siang sampai malam saya kerjakan Fase 1 (auth + RBAC + log). Auth ini blocker semua modul lain, jadi wajib selesai di H1.

**Hari 2** — pagi Fase 2 (user + log UI), siang sampai malam Fase 3 (modul pegawai). Modul pegawai ini paling besar, jadi saya kerjakan saat tenaga masih full.

**Hari 3** — full day untuk Fase 4 (presensi + tunjangan), karena algoritmanya paling kompleks dan butuh fokus.

**Hari 4** — pagi Fase 5 (dashboard + map), siang Fase 6 (test + docs + polish), malam buffer dan final push. Saya targetkan push terakhir minimal 4 jam sebelum deadline, jangan sampai push 5 menit terakhir.

---

## Prioritas Drop Kalau Waktu Mepet

Kalau di H3 sore kelihatan tidak akan selesai semua, urutan drop-nya seperti ini:

1. Map direction terdekat → ganti dengan tabel "5 pegawai terdekat"
2. E2E test → cukup unit test saja
3. Marker cluster → ganti dengan list area
4. Background job import Excel → jadikan sync dengan loading spinner
5. PDF per pegawai → ganti dengan print CSS

Yang tidak boleh di-drop apapun keadaannya: auth + RBAC, CRUD pegawai, log, satu jalur presensi (minimal manual entry), Docker, dan README.

---

## Catatan Pribadi Soal Estimasi

Estimasi di atas saya akui agak optimis. Pengalaman saya, kalau pakai stack atau library yang belum terlalu familiar, biasanya butuh tambahan sekitar 30%.

Jam tidur juga belum saya potong dari total 96 jam. Realistisnya, dari 4 hari × ~10 jam efektif per hari, hanya sekitar 40 jam yang benar-benar produktif. Angka 84 jam di estimasi saya memang agresif, jadi perlu disiplin.

Test script dapat nilai plus sesuai panduan, jadi saya tidak akan langsung memotongnya kalau waktu terbatas.
