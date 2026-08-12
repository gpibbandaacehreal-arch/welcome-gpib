-- ============================================================================
-- SUPABASE STORAGE — POLICY RLS UPLOAD GAMBAR & PDF
-- ============================================================================
-- Bucket : beranda-pdf  (gambar beranda, logo, header, foto umat, PDF warta)
-- Lokasi : Supabase Dashboard -> SQL Editor -> New query -> tempel & Run
-- Catatan: Jalankan SEKALI. Aman diulang (membersihkan policy lama dulu).
--
-- Kenapa perlu?  Error di aplikasi:
--   "new row violates row-level security policy"
-- Artinya tabel storage.objects (tempat file disimpan) belum punya policy
-- INSERT/UPDATE/DELETE, sehingga upload gambar/PDF dari panel admin diblokir.
-- Policy baca (SELECT) biasanya sudah ada dari toggle "Make public".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) BERSIHKAN policy lama yang namanya mengandung 'beranda-pdf' (jika ada)
-- ----------------------------------------------------------------------------
DO $$
DECLARE p TEXT;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'storage' AND tablename = 'objects'
             AND policyname LIKE '%beranda-pdf%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 1) BACA file — SEMUA pengunjung bisa melihat gambar & PDF di website
-- ----------------------------------------------------------------------------
CREATE POLICY "beranda-pdf baca public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'beranda-pdf');

-- ----------------------------------------------------------------------------
-- 2) UPLOAD file baru — berlaku untuk anon (fallback login) & authenticated
--    (sesi Supabase asli). Tanpa klausa TO = semua peran.
-- ----------------------------------------------------------------------------
CREATE POLICY "beranda-pdf upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'beranda-pdf');

-- ----------------------------------------------------------------------------
-- 3) TIMPA file (upsert / mengganti gambar atau PDF lama)
-- ----------------------------------------------------------------------------
CREATE POLICY "beranda-pdf timpa"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'beranda-pdf')
  WITH CHECK (bucket_id = 'beranda-pdf');

-- ----------------------------------------------------------------------------
-- 4) HAPUS file lama (dipakai saat mengganti PDF Warta Jemaat)
-- ----------------------------------------------------------------------------
CREATE POLICY "beranda-pdf hapus"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'beranda-pdf');

-- ----------------------------------------------------------------------------
-- 5) (OPSIONAL) Batasi ukuran maksimum satu file di bucket = 10 MB
--    Mencegah penyalahgunaan storage oleh pihak luar.
-- ----------------------------------------------------------------------------
UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'beranda-pdf';

-- ----------------------------------------------------------------------------
-- VERIFIKASI: jalankan query ini untuk memastikan policy sudah terpasang.
-- Seharusnya menampilkan 4 baris policy untuk tabel storage.objects.
-- ----------------------------------------------------------------------------
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE '%beranda-pdf%';

-- ============================================================================
-- TINGKATKAN KEAMANAN (opsional, setelah login memakai sesi Supabase asli):
-- Ganti policy upload/timpa/hapus di atas menjadi khusus peran authenticated:
--   CREATE POLICY "beranda-pdf upload" ON storage.objects
--     FOR INSERT TO authenticated WITH CHECK (bucket_id = 'beranda-pdf');
--   CREATE POLICY "beranda-pdf timpa" ON storage.objects
--     FOR UPDATE TO authenticated
--     USING (bucket_id = 'beranda-pdf') WITH CHECK (bucket_id = 'beranda-pdf');
--   CREATE POLICY "beranda-pdf hapus" ON storage.objects
--     FOR DELETE TO authenticated USING (bucket_id = 'beranda-pdf');
-- Pastikan akun admingpib@gpib.org sudah terdaftar di:
--   Authentication -> Users -> Add user
-- ============================================================================
