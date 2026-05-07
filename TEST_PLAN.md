# TEST_PLAN.md — JMC HRD System

## Strategi Testing

| Tipe | Tool | Scope |
|---|---|---|
| Unit Test | Vitest | Business logic (transport, validation) |
| Integration Test | Vitest + Supertest | API routes |
| E2E Test | Playwright | User flows per role |
| Manual Test | Browser | UI/UX, edge cases |

---

## Modul 1: Autentikasi (Auth)

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 1.1 | Login berhasil dengan kredensial valid | username: superadmin, password: Admin#123 | OTP terkirim ke email, response 200 + userId | Manual |
| 1.2 | Login gagal — password salah | username: superadmin, password: wrong | 401 "Username atau password salah" | Manual |
| 1.3 | Login gagal — username tidak ada | username: invalid_user | 401 | Manual |
| 1.4 | Login gagal — akun nonaktif | user is_active=false | 403 "Akun tidak aktif" | Manual |
| 1.5 | Captcha salah | captchaAnswer: XXXXX | 400 "Captcha salah atau kadaluarsa" | Manual |
| 1.6 | OTP benar → session terbuat | otp valid, dalam 60 detik | Cookie ter-set, redirect ke dashboard | Manual |
| 1.7 | OTP salah → 401 | otp: 000000 | 401 "OTP salah atau kadaluarsa" | Manual |
| 1.8 | OTP kadaluarsa (>60 detik) | otp valid tapi sudah lewat TTL | 401 | Manual |
| 1.9 | Rate limit login — >5 percobaan per IP | 6 POST /api/auth/login dari IP sama | 429 + pesan menit tersisa | Manual |
| 1.10 | Remember Me = false → session 8 jam | rememberMe: false | Cookie maxAge = 28800 | Manual |
| 1.11 | Remember Me = true → session 30 hari | rememberMe: true | Cookie maxAge = 2592000 | Manual |
| 1.12 | Logout → session revoked | POST /api/auth/logout | Cookie dihapus, Redis entry deleted | Manual |
| 1.13 | Akses endpoint protected tanpa session | GET /api/employees (no cookie) | 401 | Manual |
| 1.14 | Force logout — user dinonaktifkan | admin deactivate user yang sedang login | Session di-revoke, request berikut 401 | Manual |

---

## Modul 2: Manajemen Pengguna (Users)

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 2.1 | Create user — data valid | username unik, role valid, email ada | 201, password dikirim ke email | Manual |
| 2.2 | Create user — username duplikat | username yang sudah ada | 409 "Username sudah digunakan" | Manual |
| 2.3 | Create user — username karakter tidak valid | username: "my user!" | 400 validation error | Manual |
| 2.4 | Create user — autosuggest pegawai | GET /api/employees/without-account?search=budi | Hanya pegawai tanpa akun | Manual |
| 2.5 | Create user linked ke pegawai → email auto-fill | employeeId valid | Email dari employees.email | Manual |
| 2.6 | Edit user — ubah role | PATCH role: manager_hrd | Role berubah di DB | Manual |
| 2.7 | Nonaktifkan user | PATCH isActive: false | is_active=false + semua session di-revoke | Manual |
| 2.8 | Aktifkan user | PATCH isActive: true | is_active=true | Manual |
| 2.9 | Hapus user (soft delete) | DELETE /api/users/:id | deleted_at ter-set, user hilang dari list | Manual |
| 2.10 | List user dengan pagination | GET /api/users?page=2&limit=5 | Halaman 2, max 5 record | Manual |
| 2.11 | Filter user aktif | GET /api/users?status=active | Hanya is_active=true | Manual |
| 2.12 | Search user | GET /api/users?search=admin | Match username atau nama pegawai | Manual |
| 2.13 | Akses manajemen user oleh admin_hrd | GET /api/users (role: admin_hrd) | 403 Akses ditolak | Manual |

---

## Modul 3: Pegawai (Employees)

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 3.1 | Create pegawai — data lengkap valid | 25 field terisi, NIP unik | 201 + id pegawai baru | Manual |
| 3.2 | Create pegawai — NIP duplikat | NIP yang sudah ada | 409 "NIP sudah terdaftar" | Manual |
| 3.3 | Create pegawai — email format salah | email: "bukan-email" | 400 validation error | Manual |
| 3.4 | Create pegawai — gender harus pria/wanita | gender: "laki" | 400 | Manual |
| 3.5 | Create pegawai — marital_status harus kawin/tidak_kawin | marital_status: "menikah" | 400 | Manual |
| 3.6 | Upload foto pegawai | file: image/jpeg, <5MB | Foto tersimpan, path tersimpan di DB | Manual |
| 3.7 | Tambah riwayat pendidikan | education[] dengan 2 entri | kedua entri tersimpan | Manual |
| 3.8 | Cascading wilayah: pilih provinsi → kabupaten muncul | GET /api/wilayah?type=kabupaten&provinsiId=32 | List kabupaten provinsi 32 | Manual |
| 3.9 | Download PDF pegawai | GET /api/employees/:id/pdf | PDF berisi data lengkap pegawai | Manual |
| 3.10 | Export Excel semua pegawai | GET /api/employees/export | File .xlsx, semua kolom terisi | Manual |
| 3.11 | List pegawai dengan filter jenis | GET /api/employees?employmentType=tetap | Hanya pegawai tetap | Manual |
| 3.12 | Edit pegawai — update sebagian field | PATCH full_name saja | Hanya full_name berubah | Manual |
| 3.13 | Soft delete pegawai | DELETE /api/employees/:id | deleted_at ter-set, hilang dari list | Manual |
| 3.14 | Cari pegawai by nama | GET /api/employees?search=budi | Match full_name mengandung "budi" | Manual |

---

## Modul 4: Presensi (Attendances)

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 4.1 | Input presensi manual — hadir | kehadiran: hadir, jam masuk-keluar valid | Status terpenuhi jika durasi ≥8 jam | Manual |
| 4.2 | Durasi <8 jam → status tidak_terpenuhi | check_in: 08:00, check_out: 15:00 | work_duration=7h, status=tidak_terpenuhi | Manual |
| 4.3 | Terlambat >15 menit | check_in: 08:20 | late_minutes=20 | Manual |
| 4.4 | Tepat waktu | check_in: 08:00 | late_minutes=0 | Manual |
| 4.5 | Import Excel berhasil | file .xlsx format benar | Job queued → status=processing → done | Manual |
| 4.6 | Import Excel format salah | kolom NIP tidak ada | failed_rows > 0, error_log terisi | Manual |
| 4.7 | Polling status import (3 detik) | Setelah upload, UI auto-poll | Status berubah: queued → processing → done | Manual |
| 4.8 | Auto-refresh tabel saat import selesai | Job status = done | Tabel presensi ter-refresh otomatis | Manual |
| 4.9 | Verifikasi presensi — level lead | PATCH verifikasi: terverifikasi_lead | Status berubah ke terverifikasi_lead | Manual |
| 4.10 | Filter presensi per periode | GET ?periodYear=2025&periodMonth=11 | Hanya data November 2025 | Manual |
| 4.11 | Filter presensi per kehadiran | GET ?kehadiran=cuti | Hanya status cuti | Manual |
| 4.12 | NIP tidak ditemukan saat import | NIP baris Excel tidak cocok pegawai manapun | Baris dilompati, masuk error_log | Manual |

---

## Modul 5: Tunjangan Transport

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 5.1 | Hitung transport — jarak ≤5 km → Rp 0 | pegawai domisili 3 km dari kantor, 22 hari hadir | amount=0, eligible=false | Unit |
| 5.2 | Hitung transport — hari hadir <19 → Rp 0 | jarak 10 km, 15 hari hadir | amount=0, eligible=false | Unit |
| 5.3 | Hitung transport — clamp 25 km | jarak 30 km, 22 hari hadir | jarak yang digunakan = 25 km | Unit |
| 5.4 | Pembulatan km standar ≥0.5 ke atas | jarak 7.5 km | km_used = 8 | Unit |
| 5.5 | Hitung transport normal | jarak 10 km, 22 hari, tarif Rp 2000/km | 10 × 2000 × 22 = Rp 440.000 | Unit |
| 5.6 | Hanya pegawai tetap yang dihitung | employees dengan employment_type=kontrak dan magang | Tidak masuk hasil hitung | Manual |
| 5.7 | Pegawai tanpa koordinat → skip | lat/lon = null | Dilewati, masuk skipped count | Manual |
| 5.8 | Transport setting belum ada | POST compute tanpa setting | 422 "Transport setting belum dikonfigurasi" | Manual |
| 5.9 | Hitung ulang periode sama → upsert | Compute 2× periode yang sama | Record di-update, bukan duplikat | Manual |
| 5.10 | List tunjangan dengan filter periode | GET ?periodYear=2025&periodMonth=10 | Hanya data Oktober 2025 | Manual |

---

## Modul 6: Cuti & Izin (Leave Quotas)

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 6.1 | Set kuota cuti pegawai | POST quota: 12, tahun: 2025 | Record tersimpan | Manual |
| 6.2 | Upsert kuota — update jika sudah ada | POST kuota 2× untuk employee+year sama | Record di-update (bukan duplikat) | Manual |
| 6.3 | List kuota dengan search | GET /api/leave-quotas?search=budi | Hanya pegawai yang nama mengandung budi | Manual |
| 6.4 | Kuota tidak boleh negatif | POST quota: -1 | 400 validation error | Manual |

---

## Modul 7: Dashboard

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 7.1 | Superadmin dashboard — stats cards muncul | Login superadmin, buka dashboard | 6 stat cards terisi data | Manual |
| 7.2 | Manager dashboard — 4 widget angka | Login manager, buka dashboard | Total, Tetap, Kontrak, Magang tampil | Manual |
| 7.3 | Manager dashboard — doughnut chart employment | Data pegawai mixed type | Doughnut chart tampil proporsi benar | Manual |
| 7.4 | Manager dashboard — doughnut chart gender | Pegawai pria dan wanita | Pie rasio gender tampil | Manual |
| 7.5 | Manager dashboard — tabel 5 pegawai terbaru | Ada ≥5 pegawai | Tabel terisi 5 baris, urut created_at desc | Manual |
| 7.6 | Welcome message superadmin | Login superadmin | "Selamat Datang [Nama] — Superadmin" | Manual |
| 7.7 | Welcome message manager | Login manager_hrd | "Selamat Datang [Nama] — Manager HRD" | Manual |
| 7.8 | Peta domisili pegawai — marker tampil | Pegawai dengan lat/lon | Marker di peta sesuai koordinat | Manual |
| 7.9 | Tren kehadiran 30 hari — bar chart | Ada data presensi | Bar chart muncul, tinggi proporsional | Manual |
| 7.10 | Dashboard API tanpa autentikasi | GET /api/dashboard/stats (no cookie) | 401 | Manual |

---

## Modul 8: Log Aktivitas

| No | Kasus Uji | Input | Expected Output | Tipe |
|---|---|---|---|---|
| 8.1 | Login sukses tercatat di log | Berhasil login | Entri LOGIN_SUCCESS muncul di log | Manual |
| 8.2 | Buat pegawai → log CREATE_EMPLOYEE | POST /api/employees berhasil | Log dengan action=CREATE_EMPLOYEE | Manual |
| 8.3 | Import presensi → log IMPORT_ATTENDANCE | Upload file → job queued | Log IMPORT_ATTENDANCE tercatat | Manual |
| 8.4 | Filter log by modul | GET /api/logs?module=auth | Hanya log modul auth | Manual |
| 8.5 | Filter log by tanggal | GET /api/logs?dateFrom=2025-01-01&dateTo=2025-01-31 | Hanya log bulan Januari 2025 | Manual |
| 8.6 | Pagination log | GET /api/logs?page=2&limit=10 | Halaman 2 terisi max 10 entri | Manual |
| 8.7 | Manager HRD bisa akses log (read-only) | Login manager, GET /api/logs | 200 + data log | Manual |
| 8.8 | Admin HRD tidak bisa akses log | Login admin_hrd, GET /api/logs | 403 Akses ditolak | Manual |

---

## Unit Tests yang Sudah Ada (Vitest)

| File | Test Cases | Status |
|---|---|---|
| `src/lib/transport.test.ts` | 10 test — edge case transport formula | ✓ Pass |
| `src/lib/validation.test.ts` | 12 test — Zod schema employee + password | ✓ Pass |

**Total: 22 unit tests passing**

---

## Cara Menjalankan

```bash
# Unit tests
cd app
npm test

# E2E tests (planned — belum diimplementasi)
npx playwright test
```
