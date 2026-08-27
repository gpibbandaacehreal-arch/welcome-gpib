/**
 * ═══════════════════════════════════════════════════════════════════
 * PANDUAN UPDATE GOOGLE APPS SCRIPT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Tambahkan action handler berikut di Google Apps Script deployment:
 * https://script.google.com/macros/s/AKfycby4IEYEAPeR8TqD54TjuZ4jIGxAEeJN3U-KJenLNkk7g_Wq1ui2nweS0MHM_x4kCU5D/exec
 *
 * Cara kerja:
 * 1. App mengirim POST dengan body: { action: 'updateDataJemaat', data: [...] }
 * 2. Apps Script menerima data array DataJemaat[]
 * 3. Tulis ke sheet "DataJemaat" di Google Spreadsheet yang sama
 *
 * ═══════════════════════════════════════════════════════════════════
 */

// ═══ COPY KE GOOGLE APPS SCRIPT ═══
/*

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);

  if (payload.action === 'updateDataJemaat') {
    return handleUpdateDataJemaat(payload.data);
  }
  // ... action lainnya (updateContent, updateUmat, dll)
}

function handleUpdateDataJemaat(dataArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Cari atau buat sheet "DataJemaat"
  let sheet = ss.getSheetByName('DataJemaat');
  if (!sheet) {
    sheet = ss.insertSheet('DataJemaat');
    // Header row
    sheet.appendRow([
      'id',
      'nama_lengkap', 'username_baru', 'golongan_darah', 'email_aktif',
      'no_telepon', 'status_warga',
      'tgl_baptis', 'tgl_sidi', 'status_perkawinan_gereja',
      'alamat_ktp', 'alamat_domisili', 'sektor_pelayanan',
      'berkas_A1', 'berkas_A2', 'berkas_A24', 'berkas_A3',
      'berkas_majelis_surat_kesediaan', 'berkas_majelis_surat_pilihan',
      'berkas_majelis_surat_loyalitas', 'berkas_majelis_surat_loyalitas_pasangan',
      'isPending'
    ]);
  }

  // Hapus semua data lama (kecuali header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  // Tulis data baru
  if (Array.isArray(dataArray) && dataArray.length > 0) {
    const rows = dataArray.map(j => [
      j.id || '',
      j.nama_lengkap || '',
      j.username_baru || '',
      j.golongan_darah || '',
      j.email_aktif || '',
      j.no_telepon || '',
      j.status_warga || '',
      j.tgl_baptis || '',
      j.tgl_sidi || '',
      j.status_perkawinan_gereja || '',
      j.alamat_ktp || '',
      j.alamat_domisili || '',
      j.sektor_pelayanan || '',
      j.berkas_A1 || '',
      j.berkas_A2 || '',
      j.berkas_A24 || '',
      j.berkas_A3 || '',
      j.berkas_majelis_surat_kesediaan || '',
      j.berkas_majelis_surat_pilihan || '',
      j.berkas_majelis_surat_loyalitas || '',
      j.berkas_majelis_surat_loyalitas_pasangan || '',
      j.isPending ? 'true' : 'false'
    ]);
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'Data jemaat updated' }))
    .setMimeType(ContentService.MimeType.JSON);
}

*/

// ═══ ALTERNATIF: SYNC LANGSUNG KE SUPABASE ═══
// Jika ingin sync langsung ke Supabase, gunakan kode di App.tsx:
//
// const { error } = await supabase
//   .from('data_jemaat')
//   .upsert(dataList.map(j => ({
//     ...j,
//     id: j.id || crypto.randomUUID(),
//   })), { onConflict: 'id' });
//
// ═══════════════════════════════════════════════════════════════════

export {};
