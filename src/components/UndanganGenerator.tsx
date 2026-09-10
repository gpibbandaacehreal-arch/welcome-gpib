import React, { useState } from 'react';
import { generateUndanganPDF } from '../utils/undanganPdfUtils';
import { getErrorMessage } from '../utils/errorUtils';
import { type SupabaseUndangan } from '../services/supabase';

interface UndanganGeneratorProps {
  undanganList: SupabaseUndangan[];
  onAddUndangan: (namaUndangan: string, pic: string, tanggalUndangan: string) => Promise<SupabaseUndangan[] | null>;
  onDeleteUndangan: (id: number) => Promise<void>;
}

const UndanganGenerator: React.FC<UndanganGeneratorProps> = ({ undanganList, onAddUndangan, onDeleteUndangan }) => {
  const [namaUndangan, setNamaUndangan] = useState('');
  const [pic, setPic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      const pdfBytes = await generateUndanganPDF({ namaUndangan: namaUndangan.trim() });
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baris1 = namaUndangan.trim().split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 40);
      link.download = `Undangan_${baris1 || 'GPIB'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setNamaUndangan('');
      alert('Undangan berhasil dibuat dan terunduh!');
    } catch (err) {
      console.error('ERROR UNDANGAN:', err);
      alert(`Gagal membuat undangan: ${getErrorMessage(err, 'Error tidak diketahui')}`);
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
                    <div style={{ whiteSpace: 'pre-wrap' }}>{record.nama_undangan}</div>
                  </td>
                  <td>{record.pic || '-'}</td>
                  <td>{record.tanggal_undangan || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-delete-small" onClick={() => handleDelete(record.id)}>Hapus</button>
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
      </div>
    </div>
  );
};

export default UndanganGenerator;
