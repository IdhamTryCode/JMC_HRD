# Jawaban Soal Teori

> Draft bahan — perlu dipersonalisasi (tambahkan contoh nyata dari pengalaman pribadi sebelum disubmit).

---

## A1. Code Quality & Review

### 1. Kriteria kode readable & maintainable di tim besar

Kode disebut readable kalau orang lain bisa paham maksudnya tanpa harus tanya penulisnya. Praktiknya: penamaan variabel/fungsi yang jujur menggambarkan isinya, satu fungsi satu tanggung jawab, dan struktur folder yang konsisten dengan konvensi tim. Maintainable artinya gampang diubah tanpa takut merembet — ini didapat dari low coupling antar modul, dependency yang jelas (bukan global state), dan test yang cukup untuk jadi safety net. Di tim besar saya juga menekankan konsistensi style (linter + formatter wajib di CI) supaya diff PR fokus ke logic, bukan ke spasi.

### 2. 5 kesalahan umum kode junior + cara review konstruktif

1. **Fungsi terlalu panjang** menggabung banyak hal. Saya tunjukkan titik mana yang bisa dipecah, bukan menyuruh "rapikan saja".
2. **Penamaan generic** seperti `data`, `temp`, `result`. Saya tanya balik: "kalau aku baca ini 3 bulan lagi, aku tahu ini apa?"
3. **Tidak ada error handling** atau di-`catch` lalu di-swallow tanpa log. Saya tunjukkan skenario gagalnya konkret.
4. **Magic number / hardcoded value** tanpa konstanta. Saya minta dipindah ke konfigurasi/konstanta dengan nama yang menjelaskan kenapa angkanya segitu.
5. **Copy-paste logic** di banyak tempat. Saya tunjukkan duplikasinya tapi sekaligus warning: jangan abstraksi terlalu cepat — minimal duplikasi 3 kali baru diekstrak.

Cara review-nya: komentar di review fokus ke "kenapa", bukan "salah". Saya pakai bahasa pertanyaan ("ada alasan khusus pakai ini?") supaya junior berpikir, bukan defensif.

### 3. Pendekatan saat menemukan kode jalan tapi desain buruk

Pertama, saya tanya dulu: apakah ini akan disentuh lagi? Kalau dead code yang stabil dan tidak akan dimodifikasi, biarkan dulu — refactor tanpa alasan = risiko. Kalau iya akan terus dikembangkan, saya catat technical debt-nya di tracker (Taiga/Jira), lalu saya rencanakan refactor saat ada fitur baru yang menyentuh area yang sama (boy scout rule). Saya hindari "big bang refactor" yang berdiri sendiri karena susah di-review dan rentan regresi.

### 4. Beda code review junior vs middle

Review junior fokus ke **mendidik**: saya jelaskan alasan di balik tiap koreksi, kasih referensi, tolerir style yang masih kasar asal logic benar. Tujuannya bukan PR ini perfect, tapi developer-nya naik level. Review middle fokus ke **desain dan dampak sistem**: arsitektur, kontrak antar modul, performa, edge case, security. Saya asumsikan basic sudah aman, jadi diskusinya level "kenapa pendekatan ini, bukan yang lain". Untuk middle saya juga lebih banyak bertanya daripada mengoreksi — sering ada konteks yang dia tahu tapi saya tidak.

### 5. Kapan refactor wajib vs harus ditunda

**Wajib**: saat menambah fitur baru di area yang sudah jelas-jelas merepotkan (kode itu akan di-touch toh), atau saat ada bug yang terus berulang karena desainnya bermasalah, atau saat masalah performa/security sudah terbukti, bukan asumsi.

**Tunda**: dekat deadline rilis, area kode yang stabil dan tidak disentuh berbulan-bulan, atau saat tim belum punya test coverage memadai (refactor tanpa test = main api). Refactor "karena terlihat jelek tapi jalan" tanpa alasan konkret juga sebaiknya ditunda — itu preferensi, bukan kebutuhan.

### 6. Review 4 script

**Script 1** (`fs.readFileSync` di HTTP server):
Pakai `readFileSync` di handler request memblokir event loop, jadi server tidak bisa layani request lain selama file dibaca — fatal untuk Node yang single-threaded. File besar juga dimuat full ke memori, rentan OOM. Solusinya pakai `fs.createReadStream(...).pipe(res)` plus error handler, dan tambahkan `Content-Type` yang sesuai.

**Script 2** (Express tanpa try/catch):
`getUserFromDB()` yang reject akan jadi unhandled rejection — di Express klasik, request bakal hang sampai timeout, atau process crash. Tidak ada error middleware terpusat, tidak ada validasi input, tidak ada status code 404 kalau user tidak ada. Bungkus dengan try/catch + `next(err)`, atau pakai async wrapper. Dan endpoint `/user` tanpa identifier juga semantik REST-nya buruk.

**Script 3** (kredensial DB hardcoded):
Password di source code = bocor ke git history selamanya, ini incident security level merah. Pakai environment variable + `.env` di-`gitignore`, atau secret manager. User `admin` juga melanggar least-privilege — buat role khusus app dengan hak terbatas. Tidak ada error handling connect, tidak pakai connection pool, dan tidak ada SSL/TLS.

**Script 4** (EventEmitter di handler):
Listener `emitter.on('data')` dipasang setiap request tanpa pernah dilepas — memory leak, dan pasti memicu `MaxListenersExceededWarning`. Lebih bahaya: satu emit `'data'` akan trigger semua listener dari request lama, jadi `res.send` dipanggil di response yang sudah ditutup → error "Cannot set headers after sent" atau bahkan data response salah dikirim ke user lain (kebocoran data antar request). Pakai `emitter.once` + cleanup, atau ganti pola event-nya dengan Promise per-request.

---

## A2. Version Control & Conflict

### 7. Penyebab umum conflict saat commit/push

Paling sering: dua developer mengubah baris yang sama di file yang sama, atau satu rename/move file sementara yang lain edit di lokasi lama. Penyebab lain yang jarang disadari: branch yang lama tidak di-rebase/pull dari main, sehingga divergensi-nya menumpuk. Auto-format yang berbeda antar mesin (CRLF vs LF, tab vs spasi) juga bisa bikin "false conflict" di banyak file sekaligus. Generated files (lockfile, build output) yang ikut di-commit juga sumber conflict klasik.

### 8. Langkah sistematis menangani conflict tanpa merusak history

1. Pastikan working tree bersih (`git status`), commit atau stash dulu kalau ada perubahan.
2. `git fetch` lalu rebase/merge dari branch tujuan: `git pull --rebase origin main` (atau merge kalau kebijakan tim begitu).
3. Saat conflict muncul, buka file satu-satu, baca **kedua sisi** — jangan asal pilih "Accept incoming". Pahami kenapa mereka beda.
4. Setelah resolve, jalankan **test lokal dulu** sebelum `git add` — sering kali resolve secara syntax benar tapi logic-nya pecah.
5. `git add` file yang sudah resolve, lalu `git rebase --continue` (atau commit kalau merge).
6. Push dengan `--force-with-lease` (bukan `--force` polos) kalau memang rebase shared branch — ini lebih aman karena akan gagal kalau ada commit baru dari orang lain yang belum kita tarik.

Yang harus dihindari: `git push --force` ke shared branch tanpa koordinasi, dan `git checkout .` saat panik (bisa hilang kerjaan).

### 9. Branching policy ideal untuk tim 5–10 dev

Saya pakai variasi GitHub Flow yang disesuaikan: `main` selalu deployable, `develop` (opsional, kalau perlu staging integrasi), dan feature branch per task dengan format `feat/<ticket-id>-<slug>`. Aturannya: branch pendek (idealnya merge dalam 2–3 hari), wajib PR + minimal 1 reviewer, CI hijau sebelum merge, dan squash-merge supaya history main rapi. Untuk hotfix bikin `hotfix/*` dari main, langsung merge balik ke main + develop. Hindari long-lived feature branch — itu yang biasanya jadi mimpi buruk merge.

### 10. Kapan rebase lebih tepat dari merge + risikonya

Rebase cocok untuk **branch pribadi yang belum di-share** — bikin history linear dan bersih sebelum PR dibuka. Juga cocok saat menarik update dari main ke feature branch sendiri sebelum mengajukan PR.

Risikonya: rebase **menulis ulang commit hash**, jadi jangan pernah rebase branch yang sudah di-share (orang lain sudah pull) — mereka akan ketabrak history yang berbeda. Risiko lain: kalau conflict di banyak commit, kita harus resolve berkali-kali (sekali per commit). Mitigasi: pakai `--force-with-lease` saat push, dan rebase sebelum branch jadi ramai.

---

## A3. Task Breakdown & Estimasi (lihat file `BREAKDOWN_TASK.md`)

### 11. Breakdown task — di file terpisah

### 12. Estimasi waktu — di file terpisah

(Saya pisah ke `BREAKDOWN_TASK.md` karena tabel-nya besar, supaya jawaban teori ini tetap ringkas.)

---

## A4. Dokumentasi & Komunikasi Teknis

### 13. Dokumentasi yang wajib dibuat programmer senior

Yang saya pertahankan minimal: **README** (cara setup, env, run, test), **API documentation** (Swagger/OpenAPI atau setidaknya markdown dengan contoh request/response), **ADR** (Architecture Decision Record — catatan kenapa pilih teknologi X, format ringkas 1 halaman), **dokumentasi alur kritikal** (auth flow, payment flow, dll, biasanya pakai sequence diagram), dan **runbook** untuk operasional (cara restart, cek log, recovery dari kondisi gagal). Kalau perlu, ERD dan diagram modul. Saya hindari dokumentasi yang gampang basi seperti "list semua fungsi" — itu tugas kode itu sendiri.

### 14. Cara membaca & memvalidasi dokumentasi teknis yang ambigu

Saya baca dulu utuh untuk dapat gambaran besar, baru baca detail dengan asumsi "dokumen ini bohong sampai terbukti benar". Tiap klaim penting saya validasi dengan: cek kode aktualnya, atau test kecil (curl ke endpoint, query ke DB), atau tanya ke author/owner kalau masih hidup. Untuk bagian yang ambigu, saya tulis interpretasi saya secara eksplisit dan minta konfirmasi — bukan menebak diam-diam. Setiap kali saya menemukan dokumentasi salah, saya update saat itu juga (atau setidaknya catat di issue) supaya orang berikutnya tidak kena jebakan yang sama.

### 15. Peran dokumentasi dalam mencegah technical debt

Technical debt sering bukan karena kode jelek, tapi karena **konteks hilang**. Orang yang tahu kenapa keputusan diambil sudah resign, tinggal kodenya — developer baru takut menyentuh karena tidak paham, akhirnya nambah workaround di atas workaround. Dokumentasi (terutama ADR dan komentar "kenapa", bukan "apa") menjaga konteks itu tetap hidup. Selain itu dokumentasi yang up-to-date memaksa kita jujur soal kondisi sistem — sering kali saat saya nulis dokumentasi, baru sadar ada bagian yang sebenarnya rapuh dan harus di-fix.

---
