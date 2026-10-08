-- Tambah kolom run text (teks berjalan di bawah navbar) ke tabel site_settings.
-- Jalankan di Supabase Dashboard → SQL Editor sebelum menyimpan dari A.Panel,
-- agar payload upsert running_text tidak ditolak.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS running_text text NOT NULL DEFAULT '';
