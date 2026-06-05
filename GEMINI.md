# Proyek: Welcome-GPIB

## Deskripsi
Aplikasi web untuk informasi jemaat GPIB Banda Aceh, dibangun menggunakan React + Vite + TypeScript.

## Status Terakhir
- **Frontend:** Menggunakan React 19 dan Vite 8.
- **Fitur Utama:**
  - Landing page dengan informasi jadwal ibadah dan organisasi.
  - Sistem login Admin (kredensial saat ini: `adminGPIB` / `admin`).
  - Dashboard Admin untuk mengedit konten halaman secara langsung.
  - Integrasi dengan Google Apps Script (`SCRIPT_URL`) untuk penyimpanan data (konten & data umat).
- **Struktur File:**
  - `src/components/`: Berisi komponen UI seperti `LoginForm`, `AdminDashboard`, dll.
  - `src/services/auth.ts`: Logika autentikasi (saat ini masih hardcoded).
  - `src/App.tsx`: Komponen utama yang mengatur routing dan state aplikasi.

## Panduan Pengembangan
- Pastikan perubahan disinkronkan ke Google Drive melalui API yang tersedia.
- Folder `node_modules`, `dist`, dan `.vercel` diabaikan dalam pembacaan konteks untuk menghemat kuota.
