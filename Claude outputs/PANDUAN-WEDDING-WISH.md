# Panduan Setup Wedding Wish (Google Sheets)

Waktu setup sekitar 5 menit. Cukup dilakukan satu kali.

## 1. Buat Google Sheets
1. Buka https://sheets.new (login dengan akun Google Anda).
2. Beri nama spreadsheet, misalnya **Wedding Wish Dito & Nike**.

## 2. Pasang skrip
1. Di spreadsheet, klik menu **Extensions → Apps Script**.
2. Hapus semua isi `Code.gs`, lalu tempel seluruh isi file `google-apps-script/Code.gs` dari folder proyek ini.
3. Klik **Save** (ikon disket).
4. Di dropdown fungsi (di sebelah tombol Run), pilih **setup**, lalu klik **Run**.
   - Google akan meminta izin. Klik **Review permissions**, pilih akun Anda, lalu **Advanced → Go to ... (unsafe) → Allow**.
     Peringatan ini normal karena skripnya milik Anda sendiri.
   - Setelah selesai, sheet **Wishes** otomatis dibuat di spreadsheet.

## 3. Deploy sebagai Web App
1. Klik **Deploy → New deployment**.
2. Klik ikon roda gigi di samping "Select type", lalu pilih **Web app**.
3. Isi:
   - **Execute as:** Me
   - **Who has access:** **Anyone** (wajib, supaya tamu bisa mengirim ucapan)
4. Klik **Deploy**, lalu salin **Web app URL** (berakhiran `/exec`).

## 4. Tempel URL ke undangan
Buka `index.html`, cari baris berikut:

```html
<section class="section-wish" id="wish" data-wish-url="">
```

Tempel URL Web App di dalam tanda kutip:

```html
<section class="section-wish" id="wish" data-wish-url="https://script.google.com/macros/s/XXXX/exec">
```

Simpan, lalu upload ulang / deploy website seperti biasa. Selesai.

## Mengelola ucapan
Semua ucapan masuk ke sheet **Wishes**:

| Kolom | Isi |
|---|---|
| A Waktu | otomatis |
| B Nama | nama tamu |
| C Ucapan | isi ucapan |
| D Centang | isi `TRUE` agar nama tampil dengan tanda ✓ (misalnya untuk keluarga/sahabat) |
| E Sembunyikan | isi `TRUE` untuk menyembunyikan ucapan dari web tanpa menghapusnya |

Anda juga bisa langsung menghapus baris ucapan. Perubahan terlihat di web saat halaman dibuka ulang.

Tips: pilih kolom D dan E, lalu klik **Insert → Checkbox** supaya tinggal dicentang.

## Catatan
- Kalau skrip `Code.gs` diubah, lakukan **Deploy → Manage deployments → Edit (pensil) → Version: New version → Deploy**. URL tetap sama.
- Teks tampilan (judul "Wedding Wish", placeholder "Name", "Give your wish", tombol "Send") bisa diubah langsung di `index.html`.
- Warna bisa diubah di bagian atas `css/wish.css` (variabel `--wish-...`).
- Fitur "Ucapan & Doa" bawaan template tetap ada di kode tetapi otomatis tersembunyi karena tidak memakai `data-key`.

## Penting saat deploy
Script `npm run build:public` hanya menyalin folder `assets`, `css`, `dist`, dan file HTML. File `wish.js` sengaja diletakkan di `assets/js/` agar ikut tersalin. Tidak perlu build ulang untuk fitur ini.
