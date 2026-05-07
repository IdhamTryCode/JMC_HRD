# ASUMSI Pengerjaan — JMC HRD System

Dokumen ini mencatat keputusan implementasi untuk poin-poin yang ambigu atau tidak dirinci di soal.

---

## Stack & Infrastruktur

- **ORM**: Knex 3 + pg (raw SQL/query builder). Tidak menggunakan ORM (Prisma ditinggalkan setelah evaluasi kriteria penilaian).
- **Docker**: Single Dockerfile multi-stage untuk dua target — `runner` (Next.js app) dan `worker` (BullMQ worker). Dikelola oleh satu `docker-compose.yml` di root.
- **Node modules**: Semua `node_modules` di-build dari source dalam container; image tidak menyertakan devDependencies di production.

---

## Autentikasi & Keamanan

- **OTP**: Dibangkitkan server-side (6 digit angka acak), disimpan di Redis dengan TTL 60 detik. Satu percobaan verify mengkonsumsi OTP (hapus setelah terpakai).
- **Rate limiting**: Berbasis Redis, 5 percobaan gagal per IP per 15 menit. Key format `rate_limit:{ip}`.
- **Remember me**: Jika dicentang, JWT/session cookie disetel max-age 30 hari. Jika tidak, cookie session (tanpa max-age, berakhir saat browser ditutup).
- **Password hashing**: Argon2id.
- **Password requirement**: Min 8 karakter, mengandung huruf kapital, huruf kecil, karakter spesial, tanpa spasi.
- **Captcha**: Server-generated image sederhana, jawaban disimpan di Redis dengan TTL singkat. Setiap request `/api/auth/captcha` menghasilkan captcha baru.

---

## Pegawai

- **Usia**: Dihitung dari `join_date` (tanggal masuk) ke tanggal hari ini, bukan dari `birth_date`. Ini mengikuti kata-kata literal spek: *"usia dihitung ketika input tanggal masuk"*.
- **NIP**: Numerik saja (0-9), min 8 digit, max 20 digit.
- **Nama**: Hanya huruf, angka, apostrof, spasi (regex `/^[A-Za-z0-9' ]+$/`).
- **No. HP/Telepon**: Format internasional dimulai `+` diikuti 7-19 digit (regex `/^\+[1-9]\d{6,19}$/`).
- **Status Kawin**: Radio button dengan dua pilihan: `kawin` / `tidak_kawin`.
- **Tempat Lahir**: Autocomplete kabupaten dari data wilayah, min 2 karakter ketik.
- **Wilayah Domisili (kecamatan-first)**: User memilih kecamatan dulu via global autosuggest (min 2 karakter). Setelah kecamatan dipilih, Provinsi dan Kabupaten/Kota otomatis terisi sebagai field disabled (read-only). Kelurahan/Desa baru bisa dipilih setelah kecamatan ditentukan. Ini berbeda dari cascading top-down (provinsi → kabupaten → kecamatan) karena spek menyebutkan kecamatan sebagai input utama.
- **Koordinat**: Latitude -90 s/d 90, Longitude -180 s/d 180. Peta Leaflet menampilkan marker di koordinat tersimpan.
- **Jarak untuk tunjangan**: Dihitung menggunakan formula Haversine antara koordinat domisili pegawai dan koordinat kantor utama.
- **Delete proteksi**: Admin tidak bisa menghapus pegawai yang terhubung ke akun dengan role `superadmin`. Cek dilakukan server-side, return 403.

---

## User & RBAC

- **Username**: Huruf kecil dan angka saja, min 6 karakter, max 50 karakter.
- **Email user**: Diambil dari data pegawai yang dipilih saat create user. Tidak dipercaya dari client.
- **Password awal**: Di-generate server-side (acak), dikirim ke email pegawai via MailHog (dev) / SMTP (prod).
- **Superadmin tidak bisa CRUD diri sendiri**: Untuk menghindari lockout, superadmin tidak bisa mengedit/hapus/nonaktifkan akun diri sendiri.
- **RBAC enforcement**: Middleware Next.js mencocokkan prefix URL dengan daftar role yang diizinkan. Pengecekan juga dilakukan di setiap route handler API untuk defense-in-depth.

---

## Tunjangan Transport

- **Eligibilitas**: Jarak > 5 km DAN hari masuk >= 19 dalam sebulan.
- **Clamp jarak**: Max 25 km. Jarak > 25 km dihitung sebagai 25 km.
- **Pembulatan**: ROUND standar (>= 0.5 ke atas), diterapkan ke nilai km setelah clamp.
- **Formula**: `base_fare * km_rounded * working_days`.
- **base_fare**: Dikonfigurasi Admin via modul Setting Transport, disimpan di tabel `transport_settings`, diambil aktif satu record.

---

## Presensi

- **Template Excel**: Kolom: NIP, Tanggal (YYYY-MM-DD), Jam Masuk (HH:mm), Jam Keluar (HH:mm), Lokasi Checkin (nama kantor), Lokasi Checkout (nama kantor), Kehadiran (hadir/sakit/izin/alpha), Keterangan (opsional).
- **Validasi lokasi**: Nama kantor dicocokkan ke tabel `offices` (case-insensitive). Checkin office harus sama dengan checkout office agar dihitung hadir; jika berbeda, kehadiran tidak valid.
- **Halfday**: Terlambat > 15 menit dari jam masuk standar DAN total durasi kerja < 8 jam → `is_halfday = true`.
- **Background job**: Import file Excel diproses via BullMQ worker (`src/workers/index.ts`) agar request tidak timeout untuk file besar.
- **Duplicate import**: Jika kombinasi `(employee_id, date)` sudah ada, record di-upsert (update).

---

## Log Aktivitas

- **Trigger**: Setiap operasi CRUD yang berhasil di modul lain mencatat entry ke tabel `activity_logs` via fungsi `logActivity()`.
- **Field**: `user_id`, `action` (CREATE/UPDATE/DELETE), `target_type`, `target_id`, `description`, `created_at`.
- **Akses**: Hanya Superadmin yang bisa membaca log. Tidak ada operasi tulis dari UI.

---

## Wilayah (Data Statis)

- Data wilayah (provinsi, kabupaten, kecamatan, kelurahan) diambil dari API publik `wilayah.zone` atau data statik sesuai yang tersedia. Endpoint `/api/wilayah/*` mem-proxy atau menyajikan data ini.

---

## Dokumentasi API

- Swagger UI tersedia di `/docs` (hanya untuk Superadmin sesuai RBAC).
- Spesifikasi OpenAPI di `/api/docs`.
