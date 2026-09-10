-- ============================================================
-- Tabel: riwayat_undangan
-- Deskripsi: Riwayat pembuatan undangan (menu "Undangan").
--             Nama undangan (1-2 baris) dicetak ke kotak
--             "Kepada Yth." pada PDF undangan; PIC hanya
--             sebagai pencatat di halaman web.
-- Created: 2026-09-10
-- Idempotent: aman dijalankan berulang kali.
-- ============================================================

CREATE TABLE IF NOT EXISTS riwayat_undangan (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Nama undangan yang dicetak ke PDF (bisa 2 baris, dipisah newline)
  nama_undangan TEXT NOT NULL,
  -- Nama PIC / petugas pencatat (hanya tampil di halaman web)
  pic TEXT NOT NULL,
  -- Tanggal pembuatan undangan (dd/mm/yyyy)
  tanggal_undangan TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_riwayat_undangan_nama ON riwayat_undangan(nama_undangan);
CREATE INDEX IF NOT EXISTS idx_riwayat_undangan_pic ON riwayat_undangan(pic);
CREATE INDEX IF NOT EXISTS idx_riwayat_undangan_created ON riwayat_undangan(created_at DESC);

-- ============================================================
-- RLS (Row Level Security) Policy
-- Mengikuti pola tabel riwayat_download: anon bisa insert & read,
-- supaya pengunjung dapat membuat undangan tanpa login.
-- DROP ... IF EXISTS membuat blok ini aman dijalankan ulang
-- (memperbaiki tabel yang sudah dibuat tanpa policy).
-- ============================================================

ALTER TABLE riwayat_undangan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read riwayat_undangan" ON riwayat_undangan;
DROP POLICY IF EXISTS "Public can insert riwayat_undangan" ON riwayat_undangan;
DROP POLICY IF EXISTS "Admin can update riwayat_undangan" ON riwayat_undangan;
DROP POLICY IF EXISTS "Admin can delete riwayat_undangan" ON riwayat_undangan;

CREATE POLICY "Public can read riwayat_undangan"
  ON riwayat_undangan FOR SELECT
  USING (true);

CREATE POLICY "Public can insert riwayat_undangan"
  ON riwayat_undangan FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update riwayat_undangan"
  ON riwayat_undangan FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete riwayat_undangan"
  ON riwayat_undangan FOR DELETE
  USING (true);
