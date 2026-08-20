# Hasil Kerja - 19 Agustus 2026

## 🎯 Target: Panel Kelola Menu (Rename, Sembunyikan, Folder Links)

### ✅ Yang Dilakukan

#### 1. Fitur Baru: Tab "🔧 Kelola Menu" di A.Panel
Tab baru ke-4 di A.Panel dengan 3 bagian utama:

**A. Ganti Nama / Sembunyikan Menu Bawaan**
- Tabel dengan semua menu bawaan (Beranda, Jadwal Ibadah, Organisasi Gereja, Data Umat, Download, FolderLinks)
- Kolom "Nama Tampilan" — rename menu (contoh: Download → PROPOSAL)
- Kolom "Sembunyi dari Non-Login" — checkbox untuk menyembunyikan menu dari user biasa
- Kolom "Tutup Otomatis" — input tanggal untuk menutup menu secara otomatis
- Tombol "Reset" untuk mengembalikan ke default

**B. Tambah Menu Baru**
- Form input: Nama Menu, Posisi (Utama/PELKAT/KOMISI), Target Slug
- Tombol "➕ Tambahkan Menu Baru"
- Ringkasan menu kustom aktif dengan tombol hapus

**C. Folder Links**
- Form input: Nama Folder + Link URL (Google Drive / lainnya)
- Toggle Aktif/Nonaktif per folder
- Tabel daftar folder dengan link langsung

#### 2. Fitur Baru: Halaman Folder Links User
- Grid folder ikon (📂) dengan hover effect
- Klik langsung buka link Google Drive / URL
- Muncul di navbar hanya jika ada folder aktif

#### 3. Bug Fix: Menu "Sembunyi" Tidak Berfungsi
- **Masalah**: Ceklist "Sembunyi" pada menu tidak bekerja untuk user non-login
- **Penyebab**: Hanya menu "Download" yang di-wrap dengan `isBuiltinMenuHidden()`, menu lain hardcoded
- **Solusi**: Wrap SEMUA menu hardcoded (Beranda, Jadwal Ibadah, Organisasi Gereja, Data Umat) dengan `isBuiltinMenuHidden()`

#### 4. Perubahan di `src/services/siteSettings.ts`
- Tambah tipe `MenuOverride` (builtinKey, displayName, hidden, hideAfterDate)
- Tambah tipe `FolderLinkItem` (id, name, url, isActive)
- Update `SiteSettings` interface dengan `menuOverrides` & `folderLinks`
- Update `getSettings()` & `saveSettings()` untuk sync ke Supabase

#### 5. Perubahan di `src/components/APanel.tsx`
- Tambah tab ke-4 "🔧 Kelola Menu"
- Tambah state `menuOverrides`, `folderLinks`, `newFolderName`, `newFolderUrl`
- Tambah handler: `handleSetMenuOverride`, `handleResetMenuOverride`, `handleAddFolderLink`, `handleDeleteFolderLink`, `handleToggleFolderLink`
- Daftar `BUILTIN_MENUS` lengkap (6 menu)

#### 6. Perubahan di `src/App.tsx`
- Import `MenuOverride`, `FolderLinkItem` dari siteSettings
- Tambah helper: `isBuiltinMenuHidden()`, `getBuiltinMenuLabel()`
- Tab type bertambah: `'FolderLinks'`
- Navbar: wrap semua menu dengan `isBuiltinMenuHidden()`
- Render halaman `FolderLinks` dengan grid folder ikon

### 🚀 Deploy & Commit

| Commit | Deskripsi |
|--------|----------|
| `77e7e1e` | feat: tambahkan panel kelola menu (rename, sembunyikan, folder links) |
| `fe2bd79` | fix: perbaiki menu override sembunyi + tambah form 'Tambah Menu Baru' |

| Aksi | Status |
|------|--------|
| Deploy ke Vercel Production | ✅ Live di https://welcome-gpib.vercel.app/ |
| Git Push | ✅ 3 commits pushed ke origin/main |

### 📝 File yang Diubah
- `src/services/siteSettings.ts` — Tambah tipe MenuOverride, FolderLinkItem, update SiteSettings
- `src/components/APanel.tsx` — Tambah tab Kelola Menu dengan form rename/sembunyikan/folder links
- `src/App.tsx` — Wrap navbar dengan override, render halaman FolderLinks

### 📋 Fitur yang Tersedia di A.Panel
1. **Tab Header & Gambar Banner** — Kustomisasi header, logo, font, background
2. **Tab Menu Navigasi & Font** — Atur font, warna navbar, tambah menu kustom
3. **Tab Warna & Tema** — Skema warna utama & background
4. **Tab 🔧 Kelola Menu** — Rename/sembunyikan/hapus menu + folder links (BARU)

---

## 📋 Catatan untuk Besok
- Untuk rename "Download" → "PROPOSAL": buka A.Panel → Tab 🔧 Kelola Menu → isi "Nama Tampilan" pada baris Download
- Untuk tutup otomatis di bulan 10: isi tanggal `2026-10-01` di kolom "Tutup Otomatis"
- Folder links akan tampil di navbar sebagai "📁 Download" hanya jika ada folder aktif
- Semua data tersimpan ke Supabase via site_settings table

---
*Dicatat oleh Buffy (Codebuff) - 19 Agustus 2026*

### ✅ Yang Dilakukan

#### 1. Fitur Baru: Menu PKLU
- Menambahkan sub menu **Persekutuan Kaum Lanjut Usia (PKLU)** ke menu PELKAT
- Submenu PELKAT sekarang ada **6 menu**:
  1. Pelayanan Anak (PA)
  2. Pelayanan Taruna (PT)
  3. Gerakan Pemuda (GP)
  4. Persekutuan Kaum Bapak (PKB)
  5. Persekutuan Kaum Perempuan (PKP)
  6. **Persekutuan Kaum Lanjut Usia (PKLU)** ✨ BARU

#### 2. Perubahan di `src/App.tsx`
- Tambah `'PKLU'` ke Tab type union
- Tambah konten default PKLU (judul + deskripsi tugas/fungsi)
- Tambah item menu PKLU di navbar PELKAT submenu
- Tambah `'PKLU'` ke dropdown active check array

### 🔧 Optimasi Performa (yang sudah ada sebelumnya)

#### 1. Favicon
- Ganti favicon PNG 1,2 MB → PNG 9 KB
- Hapus file lama: `LOGO_GPIB.jpg`, `favicon.svg`, `icons.svg`

#### 2. Google Fonts
- Load font secara async (`media="print" onload`) agar tidak render-blocking
- Tambah fallback `<noscript>` untuk browser tanpa JS

#### 3. Vercel Headers
- Tambah cache header untuk static assets di `vercel.json`

#### 4. Polling Optimasi
- Interval sinkronisasi Google Drive dinaikkan:
  - Normal: 60 detik
  - Error: 120 detik
  - Tab hidden: 300 detik (jeda)

#### 5. Supabase Realtime
- Lazy load realtime channel hanya saat tab Download aktif

#### 6. Cleanup
- Hapus aset tidak terpakai: `hero.png`, `react.svg`, `vite.svg`

### 🚀 Deploy & Commit

| Aksi | Status |
|------|--------|
| Deploy ke Vercel Production | ✅ Live di https://welcome-gpib.vercel.app/ |
| Git Commit | ✅ `3285275` — feat: tambahkan sub menu PKLU + optimasi performa |

### 📝 File yang Diubah
- `src/App.tsx` — PKLU menu + optimasi
- `index.html` — Async fonts + favicon
- `vercel.json` — Cache headers
- `public/favicon.png` — File baru
- `public/LOGO_GPIB.jpg`, `public/favicon.svg`, `public/icons.svg` — Dihapus
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` — Dihapus

---

## 📋 Catatan untuk Besok
- Konten PKLU bisa diedit melalui admin panel (APanel) jika ada perubahan
- Semua perubahan sudah ter-commit dan ter-deploy
- Backup repository sudah ter-sync ke remote

---
*Dicatat oleh Buffy (Codebuff) - 19 Agustus 2026*
