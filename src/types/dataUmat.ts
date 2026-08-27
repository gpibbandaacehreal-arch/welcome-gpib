/**
 * Tipe data untuk Data Umat sesuai spesifikasi dbase GPIB.
 * Source: https://dbase.gpibapps.or.id/
 */

export interface DataJemaat {
  id: string;
  // 1. Identitas Diri
  nama_lengkap: string;
  username_baru: string;
  golongan_darah: '' | 'A' | 'B' | 'AB' | 'O';
  email_aktif: string;
  no_telepon: string;
  status_warga: 'Jemaat Biasa' | 'Simpatisan' | 'Presbiter' | 'Majelis';

  // 2. Riwayat Sawkramen & Gerejawi
  tgl_baptis: string;    // YYYY-MM-DD
  tgl_sidi: string;       // YYYY-MM-DD
  status_perkawinan_gereja: 'Belum Menikah' | 'Menikah' | 'Janda/Duda';

  // 3. Alamat & Domisili
  alamat_ktp: string;
  alamat_domisili: string;
  sektor_pelayanan: string;  // Sektor 1, Sektor 2, etc.

  // 4. Upload Dokumen (URL dari cloud storage)
  berkas_A1: string;       // Kartu Keluarga Jemaat (KKJ)
  berkas_A2: string;       // Surat Gerejawi (Baptis/Sidi/Nikah)
  berkas_A24: string;      // Surat Perkawinan Catatan Sipil
  berkas_A3: string;       // Ijazah Pendidikan Terakhir

  // Berkas Majelis (hanya untuk Presbiter/Majelis)
  berkas_majelis_surat_kesediaan: string;
  berkas_majelis_surat_pilihan: string;
  berkas_majelis_surat_loyalitas: string;
  berkas_majelis_surat_loyalitas_pasangan: string;

  // Metadata
  isPending?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_DATA_JEMAAT: Omit<DataJemaat, 'id'> = {
  nama_lengkap: '',
  username_baru: '',
  golongan_darah: '',
  email_aktif: '',
  no_telepon: '',
  status_warga: 'Jemaat Biasa',
  tgl_baptis: '',
  tgl_sidi: '',
  status_perkawinan_gereja: 'Belum Menikah',
  alamat_ktp: '',
  alamat_domisili: '',
  sektor_pelayanan: '',
  berkas_A1: '',
  berkas_A2: '',
  berkas_A24: '',
  berkas_A3: '',
  berkas_majelis_surat_kesediaan: '',
  berkas_majelis_surat_pilihan: '',
  berkas_majelis_surat_loyalitas: '',
  berkas_majelis_surat_loyalitas_pasangan: '',
};

export const GOLONGAN_DARAH_OPTIONS = ['A', 'B', 'AB', 'O'] as const;

export const STATUS_WARGA_OPTIONS = ['Jemaat Biasa', 'Simpatisan', 'Presbiter', 'Majelis'] as const;

export const STATUS_PERKAWINAN_OPTIONS = ['Belum Menikah', 'Menikah', 'Janda/Duda'] as const;

export const SEKTOR_OPTIONS = [
  'Sektor 1',
  'Sektor 2',
  'Sektor 3',
] as const;
