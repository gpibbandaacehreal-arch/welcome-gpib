-- ============================================================
-- CLEANUP: Hapus tabel riwayat menu "PROPOSAL" & "UNDANGAN"
-- Tanggal: 2026-10-04
-- Latar belakang: Menu PROPOSAL (riwayat_download) dan UNDANGAN
--                 (riwayat_undangan) sudah dihapus dari situs karena
--                 acara kegiatan GPIB 30 Tahun sudah selesai.
--
-- Cara pakai: jalankan di Supabase Dashboard → SQL Editor.
-- PERHATIAN: Irreversible — seluruh data riwayat di kedua tabel
--            akan hilang permanen.
-- Idempotent: aman dijalankan berulang kali.
-- ============================================================

-- Hapus tabel riwayat undangan (beserta index & RLS policy ikut terhapus)
DROP TABLE IF EXISTS public.riwayat_undangan CASCADE;

-- Hapus tabel riwayat download/proposal (beserta index & RLS policy ikut terhapus)
DROP TABLE IF EXISTS public.riwayat_download CASCADE;

-- Verifikasi: tabel berikut seharusnya tidak ada lagi.
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--     AND table_name IN ('riwayat_download', 'riwayat_undangan');
