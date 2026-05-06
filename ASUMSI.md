# ASUMSI Pengerjaan

> File ini mendokumentasikan keputusan saat soal ambigu/tidak jelas. Di-update terus selama pengerjaan.

## Stack

1. **Stack utama:** Node 20 LTS, Next.js 14 (App Router) + TypeScript, PostgreSQL 16, Prisma ORM, MUI v5, BullMQ + Redis, Docker Compose.
   - Soal menyebut "PHP & JS" tapi panduan teknis hanya menyebut JS (Nuxt/Next). Mengikuti panduan teknis sebagai sumber paling preskriptif.
2. **No Tailwind** — sesuai panduan, pakai MUI sebagai component framework. Token visual mengikuti `DESIGN.md` (Apple-inspired).

## Login & Autentikasi

3. **OTP** dikirim via email setelah verifikasi password berhasil; kode 6 digit, valid 60 detik, hanya boleh dipakai sekali, max 5 attempts/IP per 10 menit (rate limit).
4. **Captcha:** image captcha lokal (server-rendered, disimpan di session), bukan reCAPTCHA — agar bisa offline & tidak bergantung Google.
5. **Remember me:** session cookie panjang 30 hari (refresh token); tanpa remember-me, session 8 jam.
6. **Force-logout saat user di-nonaktifkan:** dilakukan dengan menulis `revoked_at` pada semua `user_sessions` user terkait + push event ke Redis pubsub agar middleware menolak request berikutnya.

## Kelola User

7. **Autosuggest "Nama Pengguna"** mencari di tabel `employees` (yang belum punya akun). Validasi server: nama yang dipilih harus eksis dan `users.employee_id` belum dipakai.
8. **Email & No Seluler** autofill dari `employees.email` & `employees.phone`, field disabled di UI dan **tidak di-trust dari client** — server tetap mengambil ulang dari DB saat submit.
9. **Password generate otomatis:** 12 karakter, memenuhi semua aturan, dikirim sekali via email + harus di-reset di login pertama (best practice).

## Modul Data Pegawai

10. **Usia di-derive dari `birth_date`**, bukan `join_date`. Soal sepertinya typo — saya catat eksplisit.
11. **Cascading wilayah:** memilih kecamatan otomatis mengisi provinsi & kabupaten. Sumber data: dataset wilayah Indonesia (mis. EMSIFA / wilayah.id) di-seed ke 4 tabel master.
12. **Foto pegawai** disimpan di disk lokal (`/uploads/employees/{id}/`) di-mount sebagai volume Docker. Production sebaiknya pindah ke object storage.
13. **PDF download per pegawai** pakai `pdfkit` (server-side render) untuk konsistensi & kemampuan menyertakan foto.
14. **Field "Gender"** ditambahkan walau tidak disebut di field form — diperlukan oleh dashboard Manager HRD untuk doughnut chart Pria vs Wanita.

## Tunjangan Transport

15. **Pembulatan km:** soal hanya menyebut kasus `<0.5` (turun) dan `=0.5` (naik). Saya asumsikan `>0.5` juga dibulatkan **naik** (aturan matematis standar). Tercatat di sini.
16. **Jarak rumah-kantor** = haversine distance antara `employees.lat/long` dan koordinat **Gedung Utama** (jadi referensi tunggal). Alternatif "kantor terdekat" tidak digunakan agar tunjangan deterministik.
17. **Bulan berjalan:** tunjangan dihitung untuk bulan N-1 (yang sudah lengkap presensinya), bukan bulan berjalan.

## Modul Presensi

18. **Background job import Excel** pakai BullMQ + Redis. Halaman list pegawai akan polling status job tiap 3 detik (atau via SSE/websocket — tergantung waktu).
19. **Format template Excel** disediakan untuk download: kolom NIP, Tanggal, Lokasi Checkin, Jam Masuk, Jam Pulang, Lokasi Checkout, Kehadiran (Hadir/Cuti/Izin), Keterangan.
20. **Aturan halfday:** jika telat >15 menit, dihitung halfday tetapi **durasi total kerja tetap harus ≥8 jam** (dari soal). Kalau <8 jam → dianggap tidak masuk.
21. **Lokasi checkin & checkout harus sama** — kalau beda, hari itu dianggap tidak masuk (sesuai aturan).

## Modul Log

22. Disimpan ke tabel `activity_logs` lewat **middleware/interceptor**, bukan di tiap handler manual — supaya tidak mungkin lupa.
23. Failed login juga tercatat (`user_id` null, `username` snapshot) untuk security audit.

## Dashboard Manager HRD

24. **"Direction rumah pegawai terdekat dengan kantor"** → ditampilkan sebagai map (Leaflet + OpenStreetMap, gratis, no API key). Ambil 1 pegawai dengan jarak haversine terkecil ke Gedung Utama.
25. **"Map area domisili pegawai"** → marker cluster Leaflet, satu marker per pegawai berdasarkan lat/long.

## Lain-lain

26. **Soft delete** dipakai untuk `users` dan `employees` (kolom `deleted_at`). Master data lain hard delete.
27. **Timezone** seluruh aplikasi: Asia/Jakarta (UTC+7). Disimpan di DB sebagai `timestamp with time zone`, dikonversi di app.
28. **Admin HRD tidak boleh hapus pegawai dengan role superadmin** (sesuai matriks role) — diperiksa di service layer, bukan hanya di UI.
