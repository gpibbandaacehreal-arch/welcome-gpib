import React, { useState } from 'react';
import { generateUndanganPDF, generateRiwayatUndanganPDF, type UndanganRiwayatRow } from '../utils/undanganPdfUtils';
import { getErrorMessage } from '../utils/errorUtils';
import { type SupabaseUndangan } from '../services/supabase';

interface UndanganGeneratorProps {
  isLoggedIn: boolean;
  undanganList: SupabaseUndangan[];
  onAddUndangan: (namaUndangan: string, pic: string, tanggalUndangan: string) => Promise<SupabaseUndangan[] | null>;
  onEditUndangan: (id: number, updates: Partial<SupabaseUndangan>) => Promise<void>;
  onDeleteUndangan: (id: number) => Promise<void>;
}

const UndanganGenerator: React.FC<UndanganGeneratorProps> = ({ isLoggedIn, undanganList, onAddUndangan, onEditUndangan, onDeleteUndangan }) => {
  const [namaUndangan, setNamaUndangan] = useState('');
  const [pic, setPic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // State edit inline pada tabel riwayat (khusus admin)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editPic, setEditPic] = useState('');
  const [editTanggal, setEditTanggal] = useState('');

  const handleProses = async () => {
    if (!namaUndangan.trim()) {
      alert('Nama Undangan harus diisi (bisa 1 atau 2 baris).');
      return;
    }
    if (!pic.trim()) {
      alert('PIC harus diisi.');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const tanggal = `${dd}/${mm}/${yyyy}`;

      // Simpan riwayat dulu (nama yang diketik user, 1-2 baris apa adanya)
      await onAddUndangan(namaUndangan.trim(), pic.trim(), tanggal);

      // Lalu generate & unduh PDF-nya
      await downloadUndanganPdf(namaUndangan.trim());

      setNamaUndangan('');
      setPic('');
      alert('Undangan berhasil dibuat dan terunduh!');
    } catch (err) {
      console.error('ERROR UNDANGAN:', err);
      alert(`Gagal membuat undangan: ${getErrorMessage(err, 'Error tidak diketahui')}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Generate + unduh PDF undangan untuk satu nama (dipakai form & tombol Download) */
  const downloadUndanganPdf = async (nama: string) => {
    const pdfBytes = await generateUndanganPDF({ namaUndangan: nama });
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baris1 = nama.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 40) || 'GPIB';
    link.download = `Undangan_${baris1}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleDownload = async (record: SupabaseUndangan) => {
    try {
      await downloadUndanganPdf(record.nama_undangan);
    } catch (err) {
      alert(`Gagal mendownload PDF: ${getErrorMessage(err, 'Error tidak diketahui')}`);
    }
  };

  const handleEdit = (record: SupabaseUndangan) => {
    setEditingId(record.id ?? null);
    setEditNama(record.nama_undangan);
    setEditPic(record.pic);
    setEditTanggal(record.tanggal_undangan);
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    setIsProcessing(true);
    try {
      await onEditUndangan(editingId, {
        nama_undangan: editNama,
        pic: editPic,
        tanggal_undangan: editTanggal,
      });
      setEditingId(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Gagal mengupdate riwayat undangan di Supabase.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus data undangan ini dari Supabase?')) return;
    setIsProcessing(true);
    try {
      await onDeleteUndangan(id);
    } catch (err) {
      alert(getErrorMessage(err, 'Gagal menghapus data undangan di Supabase.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EXPORT TABEL RIWAYAT (.xlsx & .pdf)
  // ═══════════════════════════════════════════════════════════
  const mapRiwayat = (): UndanganRiwayatRow[] =>
    undanganList.map((r, i) => ({
      no: undanganList.length - i,
      nama_undangan: r.nama_undangan,
      pic: r.pic || '-',
      tanggal_undangan: r.tanggal_undangan || '-',
    }));

  const handleExportExcel = async () => {
    const data = mapRiwayat();
    if (data.length === 0) {
      alert('Tidak ada data riwayat untuk disimpan.');
      return;
    }
    setIsExporting(true);
    try {
      // Dynamic import: xlsx (~400 KB) hanya dimuat saat tombol ditekan
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length + 2, ...data.map(row => String((row as unknown as Record<string, unknown>)[key] || '').length + 2)),
      }));
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Undangan');
      XLSX.writeFile(wb, `Riwayat_Undangan_GPIB_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    const data = mapRiwayat();
    if (data.length === 0) {
      alert('Tidak ada data riwayat untuk disimpan.');
      return;
    }
    setIsExporting(true);
    try {
      const pdfBytes = await generateRiwayatUndanganPDF(data);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Riwayat_Undangan_GPIB_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert(`Gagal membuat PDF riwayat: ${getErrorMessage(err, 'Error tidak diketahui')}`);
    } finally {
      setIsExporting(false);
    }
  };

  const history = undanganList.filter(p =>
    p.nama_undangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.pic && p.pic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-card">
      <h2> Undangan — Pembuat Undangan Digital</h2>
      <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '25px' }}>
        Isi <strong>Nama Undangan</strong> (1–2 baris, Enter untuk baris kedua) dan <strong>PIC</strong>, lalu klik
        tombol generate. Nama yang diketik otomatis dicetak ke kotak “Kepada Yth.” pada PDF undangan GPIB 30 Tahun.
      </p>

      <div className="admin-data-form" style={{ marginBottom: '30px' }}>
        <h3>Form Undangan</h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Nama Undangan (maks. 2 baris):</label>
            <textarea
              value={namaUndangan}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                // Batasi maksimal 2 baris agar sesuai kotak di PDF
                setNamaUndangan(lines.slice(0, 2).join('\n'));
              }}
              placeholder={'Contoh:\nBapak John Doe & Keluarga'}
              rows={2}
              maxLength={80}
            />
          </div>
          <div className="form-group full-width">
            <label>PIC:</label>
            <input
              type="text"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              placeholder="Masukkan nama PIC / petugas pencatat..."
              maxLength={60}
            />
          </div>
        </div>
        <div className="admin-action-buttons">
          <button className="btn-save" onClick={handleProses} disabled={isProcessing}>
            {isProcessing ? 'MEMPROSES...' : 'PROSES & GENERATE PDF'}
          </button>
        </div>
      </div>

      <div className="admin-umat-list">
        <div className="history-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Riwayat Undangan</h3>
            <span style={{ fontSize: '0.8rem', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="pulse-indicator" style={{ width: '8px', height: '8px', backgroundColor: '#4CAF50', borderRadius: '50%', display: 'inline-block' }}></span>
              Database Sinkron Real-time
            </span>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Cari Nama Undangan atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="umat-table admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Undangan</th>
                <th>PIC</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((record, index) => (
                <tr key={record.id ?? index}>
                  <td>{history.length - index}</td>
                  <td>
                    {editingId === record.id ? (
                      <textarea
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className="edit-input-small"
                        rows={2}
                        maxLength={80}
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{record.nama_undangan}</div>
                    )}
                  </td>
                  <td>
                    {editingId === record.id ? (
                      <input
                        type="text"
                        value={editPic}
                        onChange={(e) => setEditPic(e.target.value)}
                        className="edit-input-small"
                        maxLength={60}
                      />
                    ) : (
                      record.pic || '-'
                    )}
                  </td>
                  <td>
                    {editingId === record.id ? (
                      <input
                        type="text"
                        value={editTanggal}
                        onChange={(e) => setEditTanggal(e.target.value)}
                        className="edit-input-small"
                        placeholder="dd/mm/yyyy"
                      />
                    ) : (
                      record.tanggal_undangan || '-'
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {editingId === record.id ? (
                        <>
                          <button className="btn-save-small" onClick={handleSaveEdit} disabled={isProcessing}>Simpan</button>
                          <button className="btn-delete-small" onClick={() => setEditingId(null)}>Batal</button>
                        </>
                      ) : (
                        <>
                          {isLoggedIn && (
                            <>
                              <button className="btn-edit-small" onClick={() => handleEdit(record)}>Edit</button>
                              <button className="btn-delete-small" onClick={() => handleDelete(record.id)}>Hapus</button>
                            </>
                          )}
                          <button className="btn-edit-small" style={{ backgroundColor: '#2196F3' }} onClick={() => handleDownload(record)}>Download</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    {searchQuery ? 'Data tidak ditemukan.' : 'Belum ada riwayat undangan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Simpan tabel riwayat: .xlsx & .pdf */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button className="btn-save" onClick={() => { void handleExportExcel(); }} disabled={isExporting || history.length === 0}>
            📥 Simpan Excel (.xlsx)
          </button>
          <button className="btn-save" onClick={() => { void handleExportPdf(); }} disabled={isExporting || history.length === 0}>
            📥 Simpan PDF (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UndanganGenerator;
