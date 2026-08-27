import { supabase } from '../services/supabase';

/**
 * Generate nama file otomatis untuk dokumen jemaat.
 * Format: {kode_berkas}_{nama_jemaat}_{timestamp}.{ext}
 */
export function generateDocFileName(
  kodeBerkas: string,
  namaJemaat: string,
  originalFileName: string
): string {
  const cleanName = namaJemaat
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
  const ext = originalFileName.split('.').pop()?.toLowerCase() || 'pdf';
  const timestamp = Date.now();
  return `dokumen/${kodeBerkas}_${cleanName}_${timestamp}.${ext}`;
}

/**
 * Validasi file sebelum upload.
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
): { valid: boolean; error?: string } {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File terlalu besar! Maksimal ${maxSizeMB} MB.` };
  }
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung! Gunakan: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Upload dokumen ke Supabase Storage dan return public URL.
 */
export async function uploadDocument(
  file: File,
  namaJemaat: string,
  kodeBerkas: string
): Promise<string> {
  const fileName = generateDocFileName(kodeBerkas, namaJemaat, file.name);
  const contentType = file.type || 'application/pdf';

  const { error } = await supabase.storage
    .from('beranda-pdf')
    .upload(fileName, file, { contentType, upsert: true });

  if (error) {
    throw new Error('Gagal mengunggah dokumen: ' + error.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('beranda-pdf')
    .getPublicUrl(fileName);

  return publicUrl;
}
