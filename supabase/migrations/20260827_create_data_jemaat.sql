-- ============================================================
-- Tabel: data_jemaat
-- Deskripsi: Menyimpan data jemaat GPIB Banda Aceh
--           sesuai spesifikasi dbase.gpibapps.or.id
-- Created: 2026-08-27
-- ============================================================

CREATE TABLE IF NOT EXISTS data_jemaat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 1. Identitas Diri
  nama_lengkap TEXT NOT NULL,
  username_baru TEXT NOT NULL,
  golongan_darah TEXT,
  email_aktif TEXT,
  no_telepon TEXT NOT NULL,
  status_warga TEXT NOT NULL DEFAULT 'Jemaat Biasa',

  -- 2. Riwayat Sawkramen & Gerejawi
  tgl_baptis TEXT,
  tgl_sidi TEXT,
  status_perkawinan_gereja TEXT DEFAULT 'Belum Menikah',

  -- 3. Alamat & Domisili
  alamat_ktp TEXT,
  alamat_domisili TEXT,
  sektor_pelayanan TEXT NOT NULL,

  -- 4. Upload Dokumen
  berkas_A1 TEXT,           -- Kartu Keluarga Jemaat (KKJ)
  berkas_A2 TEXT,           -- Surat Gerejawi
  berkas_A24 TEXT,          -- Surat Perkawinan Catatan Sipil
  berkas_A3 TEXT,           -- Ijazah Pendidikan Terakhir

  -- Berkas Majelis (wajib jika Presbiter/Majelis)
  berkas_majelis_surat_kesediaan TEXT,
  berkas_majelis_surat_pilihan TEXT,
  berkas_majelis_surat_loyalitas TEXT,
  berkas_majelis_surat_loyalitas_pasangan TEXT,

  -- Metadata
  is_pending BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_data_jemaat_nama ON data_jemaat(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_data_jemaat_sektor ON data_jemaat(sektor_pelayanan);
CREATE INDEX IF NOT EXISTS idx_data_jemaat_status ON data_jemaat(status_warga);
CREATE INDEX IF NOT EXISTS idx_data_jemaat_pending ON data_jemaat(is_pending);

-- ============================================================
-- RLS (Row Level Security) Policy
-- ============================================================

ALTER TABLE data_jemaat ENABLE ROW LEVEL SECURITY;

-- Admin bisa membaca semua data
CREATE POLICY "Admin can read all data_jemaat"
  ON data_jemaat FOR SELECT
  USING (true);

-- Admin bisa insert
CREATE POLICY "Admin can insert data_jemaat"
  ON data_jemaat FOR INSERT
  WITH CHECK (true);

-- Admin bisa update
CREATE POLICY "Admin can update data_jemaat"
  ON data_jemaat FOR UPDATE
  USING (true);

-- Admin bisa delete
CREATE POLICY "Admin can delete data_jemaat"
  ON data_jemaat FOR DELETE
  USING (true);

-- ============================================================
-- Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_data_jemaat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_jemaat_timestamp
  BEFORE UPDATE ON data_jemaat
  FOR EACH ROW
  EXECUTE FUNCTION update_data_jemaat_timestamp();
