import React, { useCallback } from 'react';
import type { DataJemaat } from '../types/dataUmat';

interface DataUmatExportProps {
  jemaatList: DataJemaat[];
}

/**
 * Helper: convert null/undefined/empty ke string aman untuk dbase.
 * - null/undefined/'' → "-"
 * - string biasa → tetap apa adanya
 */
function safe(val: unknown): string {
  if (val === null || val === undefined || val === '') return '-';
  return String(val);
}

/**
 * Mapping data jemaat ke format export sesuai spesifikasi dbase GPIB.
 * Kolom diurutkan persis sesuai urutan menu dbase.
 */
function mapToExportData(jemaatList: DataJemaat[]) {
  return jemaatList
    .filter(j => !j.isPending) // Hanya export data resmi
    .map(j => ({
      'NAMA LENGKAP': j.nama_lengkap.toUpperCase(),
      'USERNAME': j.username_baru || j.nama_lengkap.toLowerCase().replace(/\s+/g, ''),
      'GOLONGAN DARAH': safe(j.golongan_darah),
      'EMAIL': safe(j.email_aktif),
      'NO TELEPON': safe(j.no_telepon),
      'STATUS WARGA': safe(j.status_warga),
      'SEKTOR PELAYANAN': safe(j.sektor_pelayanan),
      'TANGGAL BAPTIS': safe(j.tgl_baptis),
      'TANGGAL SIDI': safe(j.tgl_sidi),
      'STATUS PERKAWINAN': safe(j.status_perkawinan_gereja),
      'ALAMAT KTP': safe(j.alamat_ktp),
      'ALAMAT DOMISILI': safe(j.alamat_domisili),
      'LINK BERKAS A1 (KKJ)': safe(j.berkas_A1),
      'LINK BERKAS A2 (SURAT GEREJAWI)': safe(j.berkas_A2),
      'LINK BERKAS A24 (NIKAH SIPIL)': safe(j.berkas_A24),
      'LINK BERKAS A3 (IJAZAH)': safe(j.berkas_A3),
      // Berkas Majelis (hanya jika ada)
      ...(j.status_warga === 'Presbiter' || j.status_warga === 'Majelis'
        ? {
            'LINK M1 (SURAT KESEDIAAN)': safe(j.berkas_majelis_surat_kesediaan),
            'LINK M2 (SURAT PILIHAN)': safe(j.berkas_majelis_surat_pilihan),
            'LINK M3 (SURAT LOYALITAS)': safe(j.berkas_majelis_surat_loyalitas),
            'LINK M4 (LOYALITAS SUAMI-ISTRI)': safe(j.berkas_majelis_surat_loyalitas_pasangan),
          }
        : {}),
    }));
}

const DataUmatExport: React.FC<DataUmatExportProps> = ({ jemaatList }) => {
  const exportToExcel = useCallback(async () => {
    const data = mapToExportData(jemaatList);
    if (data.length === 0) {
      alert('Tidak ada data untuk di-export.');
      return;
    }

    // Dynamic import: xlsx (~400 KB) hanya dimuat saat tombol export ditekan
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);

    // Atur lebar kolom otomatis
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length + 2, ...data.map(row => String((row as Record<string, unknown>)[key] || '').length + 2)),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Jemaat GPIB');

    const fileName = `Data_Jemaat_GPIB_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [jemaatList]);

  const exportToCSV = useCallback(async () => {
    const data = mapToExportData(jemaatList);
    if (data.length === 0) {
      alert('Tidak ada data untuk di-export.');
      return;
    }

    // Dynamic import: xlsx hanya dimuat saat tombol export ditekan
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Jemaat_GPIB_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [jemaatList]);

  const officialCount = jemaatList.filter(j => !j.isPending).length;
  const pendingCount = jemaatList.filter(j => j.isPending).length;

  return (
    <div className="export-section">
      <h3 className="form-section-title">
        <span className="section-number">📊</span>
        Export Data Jemaat
      </h3>
      <p className="form-section-desc">
        Download seluruh data jemaat untuk upload ke <strong>dbase.gpibapps.or.id</strong> atau keperluan pelaporan.
        <br />
        <small style={{ color: '#888' }}>Kolom kosong/-null otomatis dikonversi ke &quot;-&quot; agar tidak error saat import.</small>
      </p>

      <div className="export-stats">
        <div className="stat-item">
          <span className="stat-number">{officialCount}</span>
          <span className="stat-label">Data Resmi</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{pendingCount}</span>
          <span className="stat-label">Menunggu Verifikasi</span>
        </div>
      </div>

      <div className="export-buttons">
        <button
          className="btn-save"
          onClick={() => { void exportToExcel(); }}
          disabled={officialCount === 0}
        >
          📥 Download Excel (.xlsx)
        </button>
        <button
          className="btn-save"
          onClick={() => { void exportToCSV(); }}
          disabled={officialCount === 0}
          style={{ marginLeft: '10px' }}
        >
          📥 Download CSV (.csv)
        </button>
      </div>

      <p className="export-note">
        Format kolom sudah disesuaikan dengan spesifikasi <a href="https://dbase.gpibapps.or.id/" target="_blank" rel="noopener noreferrer">dbase GPIB</a>.
      </p>
    </div>
  );
};

export default DataUmatExport;
