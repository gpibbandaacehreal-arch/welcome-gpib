import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Real-time features might not work.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

export interface SupabaseProposal {
  id?: number;
  nomor_surat: string;
  tujuan_surat: string;
  pemohon: string;
  tanggal_surat: string;
  no_urut: number;
  link_download: string;
}

/**
 * Tipe data untuk tabel riwayat_undangan di Supabase (menu "Undangan").
 * Nama undangan (1-2 baris) dicetak ke PDF; PIC hanya untuk catatan web.
 */
export interface SupabaseUndangan {
  id?: number;
  nama_undangan: string;
  pic: string;
  tanggal_undangan: string;
  created_at?: string;
}

/**
 * Tipe data untuk tabel data_jemaat di Supabase.
 * Digunakan untuk sinkronisasi langsung dengan Supabase.
 */
export interface SupabaseDataJemaat {
  id?: string;
  nama_lengkap: string;
  username_baru: string;
  golongan_darah: string;
  email_aktif: string;
  no_telepon: string;
  status_warga: string;
  tgl_baptis: string;
  tgl_sidi: string;
  status_perkawinan_gereja: string;
  alamat_ktp: string;
  alamat_domisili: string;
  sektor_pelayanan: string;
  berkas_A1: string;
  berkas_A2: string;
  berkas_A24: string;
  berkas_A3: string;
  berkas_majelis_surat_kesediaan: string;
  berkas_majelis_surat_pilihan: string;
  berkas_majelis_surat_loyalitas: string;
  berkas_majelis_surat_loyalitas_pasangan: string;
  is_pending: boolean;
  created_at?: string;
  updated_at?: string;
}
