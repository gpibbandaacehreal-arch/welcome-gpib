# Catatan Hasil Review Situs GPIB Banda Aceh

> Catatan sesi tanya-jawab — diarsipkan ke git untuk dokumentasi.
> Disusun: 16 September 2026.

---

## 1. Upload vs Link Gambar — Mana yang Lebih Ringan?

**Kesimpulan: gunakan tombol Upload.**

Kedua tombol sama-sama dilayani via ImageKit CDN dengan transformasi `q-80`,
jadi bobotnya hampir identik dari sisi pengunjung. Perbedaannya di belakang layar:

| Aspek | Upload | Link (terutama Google Drive) |
|---|---|---|
| Kompresi sumber | ✅ Dikecilkan ≤1600px sebelum disimpan | ❌ Tergantung file asli di Drive |
| Kecepatan request pertama | ✅ Supabase cepat & stabil | ⚠️ Drive sering lambat & rate-limited |
| Keandalan jangka panjang | ✅ File milik sendiri, permanen | ⚠️ Link Drive bisa mati (permission/hapus) |
| Cache ImageKit | ✅ Hit ratio tinggi | ⚠️ Drive throttle → gambar putih |
| Kuota Supabase | ⚠️ Memakai storage (sudah dikompres) | ✅ Tidak pakai storage |

**Rekomendasi:**
1. Utamakan **Upload** untuk semua gambar konten, logo, dan header.
2. Tombol **Link** hanya untuk gambar yang sudah stabil di hosting sendiri
   (URL ImageKit/vercel).
3. **Hindari link Google Drive** — sumber paling sering bikin gambar
   hilang/putih, dan hotlink Drive melanggar ketentuannya.
4. GIF animasi header wajib **Upload** (GIF di-skip dari kompresi canvas agar
   animasinya tidak rusak — sudah ditangani di `imageUtils.ts`).
5. Jangan pernah menempel gambar base64 langsung ke konten — `toImageKitUrl`
   membiarkan `data:` apa adanya, tidak terkompresi ImageKit, dan bikin data
   di database membengkak.

---

## 2. Perbandingan Menu dengan Situs GPIB Lain

Situs pembanding: GPIB **Sumber Kasih** Jakarta, **Markus** Jakarta Selatan,
**Gloria** Bekasi, **Immanuel** Jakarta, **Bukit Benuas** Balikpapan.

| Fitur | Situs GPIB lain | Situs kita |
|---|---|---|
| Beranda + profil jemaat | ✅ | ✅ |
| Jadwal Ibadah | ✅ detail (tanggal, pendoa, tema) | ✅ tapi masih teks statis |
| Warta Jemaat & Tata Ibadah | ✅ | ✅ lebih rapi (custom menu + PDF) |
| PelKat: PA, PT, GP, PKB, PKP, PKLU | ✅ | ✅ lengkap semua |
| Komisi: Germasa, PEG, Inforkom-Litbang | ✅ | ✅ lengkap |
| Direktori fungsionaris | ⚠️ kadang hanya teks | ✅ halaman khusus |
| Alamat, telepon, email, peta | ✅ hampir semua punya | ❌ baru copyright di footer |
| Renungan (Meja Pendeta) | ⚠️ Sumber Kasih punya | ❌ |
| Live streaming / YouTube | ✅ umum | ❌ |
| Info persembahan (rekening) | ✅ umum | ❌ |
| Berita/kegiatan jemaat | ✅ umum | ❌ |
| **Pendataan Umat digital** | ❌ hampir tidak ada | ✅ **kita unggul** |

**Kesimpulan:** struktur menu sudah menyamai bahkan melebihi standar jemaat
GPIB lain. Struktur PelKat & Komisi lengkap sesuai tata GPIB, dan fitur Data
Umat + generator PDF (warta, tata ibadah, proposal, undangan) jarang dimiliki
situs jemaat lain.

---

## 3. Kritik & Saran (urutan prioritas)

1. **Kontak & alamat di footer** — paling mengganggap mata. Pengunjung butuh
   alamat gereja, jam kantor, nomor WA, dan peta Google Maps. (Contoh rapi:
   situs Immanuel & Bukit Benuas.)
2. **Jadwal Ibadah yang hidup** — tampilkan jadwal minggu ini + minggu depan
   dengan nama pendoa dan tema (contoh: Sumber Kasih). Bisa dibuat halaman
   yang diupdate admin lewat A.Panel tanpa edit kode.
3. **Info persembahan** — nomor rekening/QRIS di halaman tersendiri atau footer.
4. **Tautan YouTube/media sosial** — ikon di header/footer jika jemaat punya
   kanal ibadah streaming.
5. **Beranda terasa "dingin"** — beri blok: jadwal minggu ini, warta terbaru,
   dan 1–2 foto kegiatan (contoh menarik: situs Gloria).
6. **Renungan singkat** — nilai tambah besar, tapi opsional (butuh
   konsistensi isi tiap minggu).

> Kelemahan kita bukan di fitur, tapi di **informasi dasar** (kontak, jadwal
> hidup, kegiatan) — semuanya bisa diperbaiki lewat A.Panel tanpa ganti kode.

---

## Perbaikan yang Sudah Dilakukan Sesi Ini

- [x] Typo "Riwayat **Sawkramen**" → "Riwayat **Sakramen**" pada isian nomor 2
      di form Isi Data Mandiri (menu Data Umat).
      - `src/components/DataUmatForm.tsx` (judul section)
      - `src/types/dataUmat.ts` (komentar)
