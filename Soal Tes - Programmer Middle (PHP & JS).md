# Tes Teknis

## Programmer Middle (PHP & JS)

```
Updated: 29/04/
```
**1. Informasi Umum**
    a. **Durasi pengerjaan:** Cek di panduan dan aturan teknis
    b. **Bentuk ujian** : (1) Uji teori (analisis dan reasoning), (2) Uji praktik (Hand-on, review, Design &
       coding)
    c. **Output akhir** :
       ● Lembar/dokumen jawaban teori
       ● Repository Code
       ● Dokumen pendukung (README / Catatan Review)
    d. **Struktur Ujian dan Bobot**
       **Bagian Bentuk Bobot**
       A Uji Teori 10%
       B Uji Praktik Teknis 70%
       C Leadership, Review & Incident 20%
**2. Soal Teori**
    **Petunjuk:**
    Berikan jawaban **singkat, jelas, dan tegas, cukup 3-5 baris per soal**. Fokus pada _decision making_
    level senior.
    **A1. Code Quality & Review (Soal 1–5)**
    1. Jelaskan **kriteria kode yang dianggap readable dan maintainable** pada tim besar.
    2. Sebutkan **5 kesalahan umum kode junior** dan bagaimana cara Anda mereviewnya secara
       konstruktif.
    3. Bagaimana pendekatan Anda saat menemukan **kode berjalan tapi desainnya buruk**?
    4. Apa perbedaan _code review_ pada junior vs middle developer?
    5. Kapan refactor **wajib dilakukan** , dan kapan **harus ditunda**?
    6. Apa yang salah atau tidak ideal pada script-script berikut?


Script 1:
Script 2:
Script 3:


```
Script 4
A2. Version Control & Conflict (Soal 6–9)
```
7. Jelaskan penyebab umum terjadinya **conflict saat commit/push**.
8. Uraikan langkah sistematis menangani conflict tanpa merusak history.
9. Bagaimana kebijakan branching yang ideal untuk tim dengan 5–10 developer?
10. Kapan rebase lebih tepat dibanding merge, dan risikonya?
**A3. Task Breakdown, Estimasi & Taiga (Soal 10–13)
Pada soal praktik, lakukan hal berikut**
11. **Breakdown task**.
12. Berikan **estimasi waktu yang realistis** dari masing-masing task
**A4. Dokumentasi & Komunikasi Teknis (Soal 14–16)**
13. Jenis dokumentasi apa yang **wajib dibuat oleh programmer senior**?
14. Bagaimana Anda membaca dan memvalidasi dokumentasi teknis yang ambigu?
15. Jelaskan peran dokumentasi dalam mencegah technical debt.
**3. Soal Praktik**
1. Buatkan sebuah aplikasi sederhana pengelolaan data pegawai berbasis web dengan informasi
kebutuhan sebagai berikut:
**A. Role**
Aktivitas Superadmin Manager HRD Admin HRD
1. Login/Logout Y Y Y


2. Kelola User CRUD, kecuali
    menghapus data
    dirinya

### RO, UO RO,UO

3. Dashboard R, Sesuai Role R, Sesuai Role Sesuai Role
4. Modul Data Pegawai X R CRUD, kecuali
    menghapus data
    pegawai superadmin
5. Modul Tunjangan X RO RO
6. Setting Tunjangan
    Transport

### X X CRUD

7. Modul Presensi X R CRUD
8. Modul Log R X X
Keterangan:
- C (Create) = Bisa membuat data baru
- R (Read) = Bisa membaca data
- RO (Read Only) = Hanya bisa membaca data yang dia buat atau hanya
diperuntukkan dirinya
- RO (Read Only) = Biasa membaca data terbatas pada data yang dia buat
- U (Update) = Bisa memperbarui/mengubah data
- UO (Update only) = Bisa memperbarui/mengubah data terbatas pada data yang dia
buat
- D (Delete) = Bisa menghapus data
- DO (Delete Only) = Bisa menghapus data terbatas pada data yang dia buat
- X = Tidak dapat mengakses modul tersebut
- Y = Bisa mengakses modul tersebut tanpa perlu aksi CRUD
**B. Penjelasan Modul
1. Login**
Login adalah sebuah gerbang keamanan (autentikasi) pada aplikasi atau situs web yang
berfungsi untuk memverifikasi identitas pengguna sebelum mereka diberikan akses ke fitur atau
data tertentu.
Pengguna dapat login dengan memasukkan usename atau email atau cellphone (nomor hp) dan
password dan captcha yang benar. Setelah veriifkasi berhasil, aplikasi akan mengirimkan OTP ke
email pengguna bersangkutan sebagai bentuk verifikasi tambahan. Kode OTP hanya berlaku 60
detik.


```
Metadata Aturan/Keterangan/Tipe Form
Username/Email/Cell.Phone Input text
Password Input password dengan aturan tertentu
(sesuai dengan aturan pembuatan user baru
pada field password)
Captcha Input field, harus sama dengan kode captcha
yang ditampilkan
Remember me Checkbox untuk mengingat sesi login. Apabila
pengguna login dengan mengaktifkan
“remember me”, maka pengguna tidak akan
terlogout secara otomatis (untuk logout dia
harus mengklik link/tombol logout secara
manual)
Kode OTP 6 Digit
```
**2. Kelola user**
    Modul untuk melihat, menambahkan, memperbarui, menghapus, memberikan status aktif atau
    non aktif pada user.
       Metadata Aturan/Keterangan/Tipe Form
       Nama Pengguna Autosuggestion dan autocomplete.
          Pengguna harus memasukkan minimal dua
          digit untuk memunculkan autosuggest,
          begitu autosuggest muncul, maka pengguna
          tinggal klik nama yang dimaksud.
          Tidak boleh memasukkan nama yang tidak
          ada dalam daftar autosuggest
       Username Input text, minimal 6 karakter, tidak boleh
          ada spasi, hanya boleh terdiri dari huruf serta
          angka, untuk huruf semuanya harus kecil.
          Username bersifat unik, tidak boleh ada dua
          atau lebih username yang identik
          Validasi aturan dilakukan secara onkeyup
       Email Autofill dengan value ambil dari data pegawai
          bersangkutan, field disabled
       No. Seluler Autofill dengan value ambil dari data pegawai


```
bersangkutan, field disabled
Password Digenerate secara otomatis oleh aplikasi
ketika pembuatan user baru. Setelahnya user
terkait bisa memperbarui password secara
mandiri melalui halaman profilnya.
Aturan password:
● Minimal 8 karakter
● Tidak boleh ada spasi
● Harus ada minimal 1 huruf besar
● Harus ada minimal 1 huruf kecil
● Harus ada minimal 1 karakter khusus
Validasi aturan dilakukan onkeyup
Ketik ulang password Pengguna harus mengetikkan ulang
password sebagai bentuk verifikasi
Validasi aturan dilakukan onkeyup
Status Checkbox dengan label “Aktif”. Secara default
tercentang.
Pengguna yang statusnya aktif dapat login.
Pengguna yang statusnya nonaktif (checkbox
tidak tercentang) tidak dapat login.
Apabila user terkait sedang dalam kondisi
login dan diubah statusnya menjadi nonaktif
(checkbox dalam kondisi unchecked) maka
user terkait akan terlogout secara otomatis
dari aplikasi.
```
**3. Dashboard**
    Dashboard adalah halaman yang pertama kali terbuka ketika pengguna berhasil login ke
    aplikasi. Masing-masing role memiliki dashboard sendiri-sendiri.
    a. Role Superadmin
       Dashboard hanya berisi kalimat “Selamat Datang [Nama Pengguna] - [Role]”
    b. Role Manager HRD
       Role berisi widget yang menggambarkan informasi berikut
       1) Widget
       ● Widget 1: Total Pegawai
       ● Widget 2: Total Pegawai Kontrak
       ● Widget 3: Total Pegawai Tetap
       ● Widget 4: Total Peserta Magang
       2) Doughnut Chart Pegawai Kontrak vs Pegawai Tetap vs Magang


```
3) Doughnut Chart Pegawai Pria vs Wanita
4) Data tabular 5 Pegawai dengan tanggal masuk paling baru
5) Informasi direction rumah pegawai terdekat dengan kantor
6) Informasi area (map area) yang menunjukkan area domisili pegawai
c. Role Admin HRD
Dashboard hanya berisi kalimat “Selamat Datang [Nama Pengguna] - [Role]”
```
**4. Modul Data Pegawai**
    Modul data pegawai digunakan untuk pengelolaan data pegawai, yaitu menambahkan data
    baru, merubah data, atau menghapus data. Modul data pegawai terdiri dari empat halaman
    utama, yaitu halaman daftar pegawai, halaman formulir tambah data baru, halaman edit data
    pegawai, dan halaman detail pegawai.
    a. Halaman daftar pegawai
       Halaman daftar pegawai berisi tabel daftar pegawai dengan ketentuan dan fitur sebagai
       berikut.
       1) Kolom table:
          ● No. Urut
          ● NIP (Nomor Induk Pegawai) (bisa shorting)
          ● Nama (bisa shorting)
          ● Jabatan (bisa shorting)
          ● Tanggal Masuk (bisa Shorting)
          ● Masa Kerja (bisa shorting)
          ● Aksi:
             ○ Tombol Detail, untuk membuka halaman detail pegawai terpilih
             ○ Tombol Edit, untuk membuka halaman ubah data pegawai terpilih
             ○ Tombol download, untuk mendownload data pegawai (pdf)
          Fitur pada table:
          ○ Shorting pada kolom tertentu
          ○ Paginasi
          ○ Bulk select
       2) Tombol-tombol:
          ● Data baru (untuk menuju halaman formulir tambah data baru)
          ● Download (untuk mendownload daftar pegawai)
          ● Hapus data (untuk menghapus data pegawai yang terpilih)
          ● Status (dropdown aktif/nonaktif)
       3) Search: Fitur pencarian pegawai dengan parameter: nama/nip/jabatan
       4) Filter:
          ● Jabatan: Dropdown multi select
          ● Masa Kerja: berupa dropdown operator (>, =, <) dan input text number only. Misal
             pengguna memilih operasi > dan mengisikan angka 5 pada input text, maka pada
             table hanya akan tampil pegawai dengan masa kerja lebih dari 5 tahun.


● Jenis (kontrak, tetap, magang): Dropdown multiselect
b. Halaman tambah data baru
Field/Metadata
Foto Pegawai Upload file, hanya boleh format PNG/JPEG/JPG
NIP Input text dengan aturan:
Minimal 8 karakter, hanya boleh angka, tidak boleh ada spasi
Nama Pegawai Hanya boleh huruf, angka, dan tanda petik atas (‘) dan spasi.
Email Format umum email
Nomor HP Harus menggunakan format internasional, contoh:
+
Alamat Rumah -
Provinsi
Disabled, otomatis terisi ketika pengguna memilih kecamatan
Alamat Rumah -
Kabupaten
Disabled, otomatis terisi ketika pengguna memilih kecamatan
Alamat Rumah -
Kecamatan
Dropdown kecamatan, dengan option yang menunjukkan
informasi kecamatan dan kabupaten, sehingga jika ada dua
kecamatan dengan nama identik, user bisa mengidentifikasi
melalui info kabupatennya
Alamat Rumah -
Kalurahan
Dropdown, sesuai dengan kabupaten yang dipilih
Alamat Rumah - Detail Text area
Latitude Sudah dipahami, berikan validasi yang sesuai
Longitude Sudah dipahami, berikan validasi yang sesuai
Tempat Lahir Dropdown kabupaten dengan bisa mengetikkan karakter
minimal 2 karakter untuk memunculkan autosuggestion
Tanggal Lahir DD/MM/YYYY
Status Kawin Radiobutton, “kawin”, “tidak kawin”
Jumlah Anak Input number only, maksimal 2 digit
Tanggal Masuk DD/MM/YYYY
Jabatan Dropdown:

- Manager
- Staf


- Magang
- Karyawan
Departemen Dropdown:
- Marketing
- HRD
- Production
- Executive
- Commissioner
Usia Otomatis terisi ketika pengguna menginputkan tanggal masuk.
Posisi field disabled
Pendidikan Form dinamis, bisa menambahkan list pendidikan pada form
ini.
Status Aktif/Nonaktif
c. Halaman Detail, menampilkan semua informasi dari semua field pada halaman tambah
data baru
d. Halaman Edit, metadata sama seperti metadata pada tambah data baru
**5. Setting Tunjangan Transport** , digunakan untuk memberikan pengaturan base fare, atau tarif
tunjangan transport per km.
**6. Modul Tunjangan Transport** , untuk menampung informasi tunjangan transport masing-masing
pegawai. Rumus perhitungan tunjangan transport pegawai adalah:
Tunjangan transport = base fare x km x jumlah hari masuk kerja.
Pembulatan km mengikuti aturan berikut:
- Jika angka desimal di bawah 0,5 maka dibulatkan ke bawah
- Jika angka desimal adalah 0,5 maka dibulatkan ke atas.
Aturan hari kerja dalam 1 bulan adalah sebagai berikut:
- Minimal hari masuk kerja agar mendapatkan tunjangan transport adalah 19 hari kerja. Jika
pegawai hanya masuk kerja 18 hari kerja di bulan berjalan, maka dia tidak mendapat
tunjangan transport, tanpa mempertimbangan faktor lain
- Jarak maksimal yang dapat diberikan tunjangan adalah 25km. Kelebihan jarak tidak
dihitung tunjangan.


- Jarak minimal yang dapat diberikan tunjangan adalah 5 km. Jarak 5 km atau kurang, tidak
    dihitung tunjangan.
- Tunjangan transport hanya diberikan kepada pegawai tetap.
**7. Modul Log** , menyimpan informasi siapa login dan logout kapan, apa modul yang diakses, dan
aksi apa yang dilakukan pada modul tersebut (create, read, update, delete). Contoh output
tabel log:
Tgl Jam Username Deskripsi Modul
13/01/2026 10:33:15 kenshin Login Login
13/01/2026 10:34:00 kenshin Create Data Penjualan
Parameter pencarian: username, login, modul
Filter
1. Berdasarkan username, multiselect
2. Berdasarkan modul, multiselect
3. Tanggal & jam: Daterange picker
**8. Modul Presensi**
Modul presensi digunakan untuk melihat rekap absensi pegawai. Terdapat dua halaman utama
untuk modul presensi, yaitu list pegawai (tampil secara default ketika modul presensi di buka)
dan halaman detail presensi.
A. Halaman list pegawai, secara default data rekap presensi yang tampil di halaman ini adalah
data rekap presensi N-1 bulan berjalan alias 1 bulan sebelumnya. Tabel rekap presensi berisi
tabel dengan metadata:
No. Urut number
Nama Sesuai data pegawai
Jabatan Sesuai data pegawai
Hadir Number, menampung 1 digit dibelakang
koma
Status Hadir “Terpenuhi”, “Tidak terpenuhi”
(“Terpenuhi” mengindikasikan kuota
minimal kehadiran telah terpenuhi, “Tidak
terpenuhi” mengindikasikan kuota minimal
tidak terpenuhi
Cuti Number, menampung 1 digit dibelakang
koma


```
Kuota Cuti Number, menampung 1 digit dibelakang
koma
Izin Number, menampung 1 digit dibelakang
koma
Kuota Izin Number, menampung 1 digit dibelakang
koma
Unpaid Leave Number, menampung 1 digit dibelakang
koma
Kuota Unpaid leave Number, menampung 1 digit dibelakang
koma
Tombol view Membuka detail prensensi
Di halaman ini, terdapat tombol download template excel, import excel untuk memasukkan
data presensi dengan langkah berikut:
```
1. User mengupload excel sesuai format pada template excel (template bisa didownload
    melalui tombol download template).
2. Aplikasi akan merekap absensi melalui background proses
3. Proses rekap selesai, sistem akan merefresh halaman dan mengupdate data rekap pada
    table.
B. Halaman detail presensi
Halaman detail presensi menampilkan table presensi dari pegawai terpilih. Berikut ini
adalah metadata table presensi.
Tgl Date
Lokasi checkin “Gedung Utama”, “Gedung A”, “Gedung B”
Kehadiran Hadir/Cuti/Izin
Durasi (Hadir) Number, 1 digit dibelakang koma
Status “Terpenuhi”, “Tidak terpenuhi”. Jika tidak
terpenuhi, maka akan dianggap nol dan
tidak menambah total durasi kehadiran
dalam 1 bulan.
Verifikasi “Disetujui”, “Ditolak”
Verifikator “Lead”, “Manager”, “HRD”


```
Keterangan -
Perhitungan absensi harus memenuhi aturan sebagai berikut:
```
1. Ada 3 gedung kantor, Gedung Utama, Gedung A, dan Gedung B
2. Presensi mencatat waktu dan lokasi presensi
3. Setiap pegawai harus presensi masuk(checkin) dan presensi pulang(checkout) di lokasi yang
    sama. Apabila pegawai checkin dan checkout di lokasi yang berbeda, maka tidak akan
    terhitung masuk.
4. Jam kerja adalah fix hour dari jam 08.00 - 17.00, dengan jam istirahat dari jam 12.00 sd jam
    13.
5. Keterlambatan kurang dari atau sama dengan 15 menit akan dihitung masuk.
    Keterlambatan lebih dari itu hanya akan dihitung masuk halfday, namun durasi kerja
    minimal harus tetap 8 jam. Kurang dari itu maka akan dihitung tidak masuk kerja.
6. Minimal jam kerja normal adalah 8 jam, kurang dari itu, maka status kehadirannya “Tidak
    terpenuhi”.
9. **Buat dokumentasi API** , bisa menggunakan tool seperti swagger atau tool lainnya
10. **Dokumentasi README** tentang setup atau konfigurasi environment
11. **Berikan dokumentasi pengujian aplikasi** (format bebas sesuai pengetahuan yang dimiliki)
**Keterangan**
Boleh menambahkan field pada form atau pada table di database, atau modul baru (contoh: master
data) jika diperlukan, atau berikan asumsi-asumsi yang sekiranya belum diinformasikan


