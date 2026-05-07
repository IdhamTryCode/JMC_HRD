# TEST PLAN — JMC HRD System

Tanggal: 2026-05-07
Versi: 1.0 (sesuai spek teknis tes Programmer Middle)

---

## Unit Tests (Vitest)

| # | File | Deskripsi | Status |
|---|------|-----------|--------|
| 1 | `src/lib/transport.test.ts` | Formula tunjangan transport: jarak <= 5 km → 0, hari masuk < 19 → 0, clamp 25 km, pembulatan standar | 10 tests PASS |
| 2 | `src/lib/validation.test.ts` | Validasi schema pegawai (NIP, email, employmentType, gender, maritalStatus) dan schema password (min 8, uppercase, lowercase, spesial, tanpa spasi) | 13 tests PASS |

Jalankan: `npm test`

---

## 1. Modul Login & Autentikasi

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 1.1 | Login dengan username + password benar + captcha benar → OTP dikirim ke email | Semua | Redirect ke form OTP |
| 1.2 | Username/password salah | Semua | Error pesan gagal |
| 1.3 | Captcha salah | Semua | Error, captcha di-refresh |
| 1.4 | Rate limit: >5 percobaan gagal dalam 15 menit | Semua | Error 429 |
| 1.5 | OTP benar dalam 60 detik → session dibuat | Semua | Redirect ke dashboard sesuai role |
| 1.6 | OTP kadaluarsa (>60 detik) → verifikasi gagal | Semua | Error, tombol Kirim Ulang OTP muncul |
| 1.7 | Kirim ulang OTP → countdown reset ke 60 detik | Semua | OTP baru dikirim ke email |
| 1.8 | Centang "Ingat saya" → sesi 30 hari | Semua | Cookie max-age 30 hari |
| 1.9 | Tanpa centang → sesi berakhir saat browser ditutup | Semua | Cookie session biasa |
| 1.10 | Akses halaman terproteksi tanpa login | - | Redirect ke /login |

---

## 2. Modul Kelola User

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 2.1 | Superadmin melihat daftar user | Superadmin | Tabel dengan username, nama pegawai, role, email, status |
| 2.2 | Superadmin tambah user baru (pilih pegawai dari autosuggest, isi username, role) | Superadmin | User dibuat, password dikirim ke email pegawai |
| 2.3 | Username < 6 karakter atau mengandung huruf kapital/spasi | Superadmin | Error validasi inline |
| 2.4 | Pegawai yang sudah punya akun tidak muncul di autosuggest | Superadmin | Hanya pegawai tanpa akun tersedia |
| 2.5 | Superadmin edit username/role user | Superadmin | Data terupdate |
| 2.6 | Superadmin nonaktifkan user | Superadmin | Status Nonaktif, user tidak bisa login |
| 2.7 | Superadmin aktifkan user kembali | Superadmin | Status Aktif |
| 2.8 | Superadmin hapus user (dialog konfirmasi) | Superadmin | User terhapus |
| 2.9 | Manager/Admin hanya lihat daftar user | Manager, Admin | Read-only, tidak ada tombol tambah/hapus |
| 2.10 | Manager/Admin update password sendiri via profil | Manager, Admin | Password terupdate |

---

## 3. Modul Dashboard

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 3.1 | Superadmin lihat dashboard | Superadmin | Statistik sistem (total user, pegawai, aktivitas) |
| 3.2 | Manager lihat dashboard | Manager | Statistik presensi bulan ini |
| 3.3 | Admin lihat dashboard | Admin | Statistik presensi + ringkasan pegawai |

---

## 4. Modul Data Pegawai

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 4.1 | Admin tambah pegawai baru | Admin | Pegawai tersimpan |
| 4.2 | NIP < 8 atau > 20 digit | Admin | Error validasi |
| 4.3 | NIP duplikat | Admin | Error NIP sudah digunakan |
| 4.4 | Email format tidak valid | Admin | Error validasi |
| 4.5 | Status kawin menggunakan radio button (kawin / tidak kawin) | Admin | Tersimpan benar |
| 4.6 | Usia otomatis terhitung saat input tanggal masuk | Admin | Usia tampil otomatis |
| 4.7 | Tempat lahir (kabupaten) menggunakan autocomplete min 2 karakter | Admin | Tersaring dari data wilayah |
| 4.8 | Wilayah domisili: pilih kecamatan dulu → provinsi/kabupaten auto-fill (disabled) | Admin | Kecamatan-first, provinsi & kabupaten readonly |
| 4.9 | Kelurahan/Desa muncul setelah kecamatan dipilih | Admin | Dropdown kelurahan tersedia |
| 4.10 | Admin edit data pegawai | Admin | Data terupdate |
| 4.11 | Admin tidak bisa hapus pegawai terhubung ke superadmin | Admin | Error 403 |
| 4.12 | Admin hapus pegawai biasa (dialog konfirmasi bulk) | Admin | Terhapus setelah konfirmasi |
| 4.13 | Halaman detail menampilkan peta domisili Leaflet | Admin, Manager | Peta tampil dengan marker |
| 4.14 | Download PDF profil pegawai per baris | Admin | PDF terunduh |
| 4.15 | Export semua pegawai ke Excel | Admin | File Excel terunduh |
| 4.16 | Filter: jenis kepegawaian (multi), jabatan, status aktif, masa kerja | Admin, Manager | Hasil terfilter |
| 4.17 | Sort dan pagination server-side | Admin, Manager | Fungsi benar |
| 4.18 | Manager hanya view, tidak ada tombol tambah/edit/hapus | Manager | Read-only |

---

## 5. Modul Tunjangan Transport

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 5.1 | Admin/Manager lihat tunjangan bulan tertentu | Admin, Manager | Daftar nama + nominal |
| 5.2 | Jarak <= 5 km tidak dapat tunjangan | - | Nominal 0 |
| 5.3 | Hari masuk < 19 tidak dapat tunjangan | - | Nominal 0 |
| 5.4 | Jarak di-clamp ke max 25 km | - | Nominal dari 25 km |
| 5.5 | Pembulatan jarak standar (>=0.5 ke atas) | - | Hasil sesuai |
| 5.6 | Export tunjangan ke Excel | Admin, Manager | File Excel terunduh |

---

## 6. Modul Setting Transport

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 6.1 | Admin lihat/ubah tarif per km | Admin | Tersimpan, berlaku untuk kalkulasi berikutnya |
| 6.2 | Superadmin/Manager tidak bisa akses | Superadmin, Manager | 403 / tidak ada menu |

---

## 7. Modul Presensi

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 7.1 | Admin lihat daftar presensi dengan filter | Admin | Tabel presensi tampil |
| 7.2 | Admin download template Excel presensi | Admin | File dengan kolom: NIP, Tanggal, Jam Masuk, Jam Keluar, Lokasi Checkin, Lokasi Checkout, Kehadiran, Keterangan |
| 7.3 | Admin import presensi via Excel (background BullMQ) | Admin | File diproses asinkron |
| 7.4 | Import: checkin office != checkout office → tidak dihitung hadir | Admin | Kehadiran tidak valid |
| 7.5 | Import: terlambat >15 menit DAN durasi < 8 jam → halfday | Admin | is_halfday = true |
| 7.6 | Manager hanya view, tidak ada fitur import | Manager | Tombol import tidak tampil |

---

## 8. Modul Log Aktivitas

| # | Skenario | Aktor | Expected |
|---|----------|-------|----------|
| 8.1 | Superadmin lihat log aktivitas semua user | Superadmin | Tabel log tampil (user, aksi, target, waktu) |
| 8.2 | Filter log berdasarkan user, aksi, rentang tanggal | Superadmin | Hasil terfilter |
| 8.3 | Aktivitas CRUD di modul lain tercatat otomatis di log | Sistem | Entry log terbuat |
| 8.4 | Manager/Admin tidak bisa akses halaman log | Manager, Admin | 403 / tidak ada menu |

---

## 9. RBAC

| Role | Kelola User | Dashboard | Pegawai | Tunjangan | Setting Transport | Presensi | Log |
|------|-------------|-----------|---------|-----------|-------------------|---------|-----|
| Superadmin | CRUD (bukan diri sendiri) | R | Tidak ada akses | Tidak ada akses | Tidak ada akses | Tidak ada akses | R |
| Manager HRD | R + Update Own | R | R | R | Tidak ada akses | R | Tidak ada akses |
| Admin HRD | R + Update Own | R | CRUD* | R | CRUD | CRUD | Tidak ada akses |

*tidak bisa hapus pegawai yang terhubung ke superadmin

### Tes RBAC
| # | Skenario | Expected |
|---|----------|---------|
| 9.1 | Superadmin akses /employees | 403 |
| 9.2 | Manager akses /api/transport-settings | 403 |
| 9.3 | Admin akses /logs | 403 |
| 9.4 | Manager akses /logs | 403 |
| 9.5 | Admin GET /api/users | 200 |
| 9.6 | Admin POST /api/users | 403 |

---

## 10. Non-Functional

| # | Aspek | Expected |
|---|-------|---------|
| 10.1 | Rate limiting | >5 login gagal dalam 15 menit → 429 |
| 10.2 | Session expiry | Cookie kadaluarsa → redirect /login |
| 10.3 | Docker clean start | docker compose up → semua container up, DB termigasi dan terseed |
| 10.4 | Background worker | Import Excel diproses via BullMQ, tidak blocking request |
| 10.5 | Captcha refresh | Setiap load halaman login → captcha baru |
