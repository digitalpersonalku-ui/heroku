# 🏆 HeroKu — SDIT Qudwatun Hasanah

Platform gamifikasi karakter anak berbasis Program **7 Kebiasaan Anak Indonesia Hebat**.

## 📁 Struktur Project

```
heroku-web/
├── index.html          ← Halaman utama (struktur HTML)
├── css/
│   └── style.css       ← Semua styling & animasi
├── js/
│   ├── data.js          ← Data: kebiasaan, badge, kartu, kuis, staf, archetipe
│   └── app.js            ← Logika aplikasi: login, render, interaksi
└── README.md            ← Dokumen ini
```

File besar (sebelumnya 1 file ~200KB) sudah dipecah menjadi 4 file agar lebih mudah dikelola dan di-debug.

---

## 🚀 Cara Publikasi ke GitHub Pages (Gratis)

### Langkah 1 — Buat Repository Baru
1. Buka [github.com/new](https://github.com/new)
2. Nama repository: `heroku-app` (atau nama lain)
3. Pilih **Public**
4. Klik **Create repository**

### Langkah 2 — Upload File
**Cara termudah (tanpa command line):**
1. Di halaman repository, klik **"uploading an existing file"**
2. Drag & drop folder `index.html`, `css/`, `js/` sekaligus
3. Tulis pesan commit: `Upload HeroKu v1`
4. Klik **Commit changes**

**Catatan:** GitHub akan otomatis membuat struktur folder `css/` dan `js/` sesuai yang di-upload.

### Langkah 3 — Aktifkan GitHub Pages
1. Di repository, klik tab **Settings**
2. Di sidebar kiri, klik **Pages**
3. Di bagian **Source**, pilih branch `main` dan folder `/ (root)`
4. Klik **Save**
5. Tunggu 1-2 menit, lalu refresh halaman

### Langkah 4 — Dapatkan Link
Setelah aktif, GitHub menampilkan link seperti:
```
https://[username-anda].github.io/heroku-app/
```

Link ini yang dibagikan ke kepala sekolah, guru, orang tua, dan siswa — **tidak perlu install apapun**, tinggal dibuka di browser HP atau laptop.

---

## 🔄 Cara Update Aplikasi

Setiap kali ada perbaikan atau fitur baru:
1. Edit file langsung di GitHub (klik file → ikon pensil ✏️) **atau**
2. Upload ulang file yang sudah diperbarui (akan otomatis menimpa versi lama)
3. Tunggu 1-2 menit, perubahan otomatis muncul di link yang sama

Tidak perlu kirim ulang file ke semua pengguna — mereka tetap memakai link yang sama.

---

## 🗄️ Setup Database Supabase (Wajib untuk Multi-Device)

Tanpa langkah ini, aplikasi tetap berjalan tapi data tersimpan **terpisah di setiap perangkat** (localStorage). Dengan Supabase, semua perangkat — HP siswa, laptop guru, laptop kepala sekolah — melihat data yang sama secara real-time.

### Langkah 1 — Jalankan Skema Database
1. Buka [supabase.com](https://supabase.com) → masuk ke akun Anda
2. Buat project baru (atau pakai yang sudah ada)
3. Di sidebar kiri, klik **SQL Editor** → **New Query**
4. Buka file `supabase-schema.sql` di folder ini, copy semua isinya
5. Paste ke SQL Editor, klik **Run**
6. Tunggu sampai muncul "Success" — ini berarti semua tabel dan data awal sudah dibuat

### Langkah 2 — Ambil Kredensial API
1. Di Supabase, klik **Project Settings** (ikon gear) → **API**
2. Salin dua nilai ini:
   - **Project URL** (contoh: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public key** (kunci panjang yang diawali `eyJ...`)

### Langkah 3 — Masukkan ke Kode
1. Buka file `js/supabase-sync.js`
2. Cari baris ini di paling atas:
   ```javascript
   const SUPABASE_URL = 'GANTI_DENGAN_PROJECT_URL_ANDA';
   const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_ANDA';
   ```
3. Ganti dengan nilai yang Anda salin di Langkah 2
4. Simpan file, upload ulang ke GitHub (timpa file lama)

### Langkah 4 — Verifikasi
1. Buka aplikasi di browser, login sebagai siswa apapun
2. Lihat badge kecil yang muncul sebentar di bawah layar:
   - 🟢 **"Tersambung ke Database"** → berhasil!
   - 🔴 **pesan error** → cek kembali URL/key, atau lihat Console browser (F12) untuk detail

### Cara Kerja di Balik Layar
File `js/bridge.js` secara otomatis "menyambungkan kabel" antara kode aplikasi yang sudah ada (`app.js`) dengan Supabase — tanpa perlu mengubah logika tampilan atau fitur yang sudah berjalan. Jika koneksi Supabase gagal (misal internet putus), aplikasi otomatis memakai cadangan localStorage agar tidak crash.

---



| Peran | ID / PIN | Password |
|---|---|---|
| Siswa (Ahmad Badshah) | PIN: `1001` | — |
| Orang Tua (linked) | PIN: `2001` | — |
| Guru (Reski Wulandari) | `guru01` | `guru01` |
| Kepala Sekolah | `kepsek1` | `kepsek2025` |
| Admin | `admin1` | `admin2025` |

---

## ⚠️ Batasan Versi Saat Ini

- Data disimpan di **localStorage** browser — belum sinkron antar perangkat
- Belum ada backend/database server sungguhan
- AI Mentor "Syekh Al-Fath" masih berbasis template, belum terhubung ke AI sungguhan
- Cocok untuk **demo, presentasi, dan pilot terbatas** — belum untuk skala penuh

Langkah pengembangan selanjutnya: migrasi ke database (Supabase/Firebase) agar data tersinkron real-time antar semua pengguna.

---

*HeroKu — Membangun Generasi Indonesia yang Berkarakter* 🇮🇩
