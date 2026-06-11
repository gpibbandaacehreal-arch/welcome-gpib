import React, { useState, useEffect } from 'react';
import { generateProposalPDF, type ProposalData } from '../utils/pdfUtils';

interface ProposalRecord extends ProposalData {
  id: string;
  noUrut: number;
}

interface DownloadProposalProps {
  isLoggedIn: boolean;
  proposals: ProposalRecord[];
  onUpdateProposals: (updated: ProposalRecord[]) => Promise<void>;
}

const DownloadProposal: React.FC<DownloadProposalProps> = ({ isLoggedIn, proposals, onUpdateProposals }) => {
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTujuan, setEditTujuan] = useState('');
  const [editNomor, setEditNomor] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sort proposals by noUrut descending for display
  const history = [...proposals].sort((a, b) => b.noUrut - a.noUrut);

  const getNextNoUrut = () => {
    if (proposals.length === 0) return 13;
    const lastNo = Math.max(...proposals.map(h => h.noUrut));
    return lastNo + 1;
  };

  const getCurrentDateInfo = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = now.getMonth() + 1; // numeric month
    const yyyy = now.getFullYear();
    const yyShort = String(yyyy).slice(-2);
    
    // Convert to Roman Numeral
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const mmRoman = romanMonths[mm - 1];
    
    return { dd, mm: String(mm).padStart(2, '0'), mmRoman, yyyy, yyShort };
  };

  const generateNomorSurat = (noUrut: number) => {
    const { mmRoman, yyShort } = getCurrentDateInfo();
    return `${noUrut}/${mmRoman}-‘${yyShort}/MJ-BA/PPSGGR30-1`;
  };

  const handleProses = async () => {
    if (!tujuanSurat.trim()) {
      alert('Tujuan Proposal harus diisi.');
      return;
    }

    setIsProcessing(true);
    const nextNo = getNextNoUrut();
    const { dd, mm, yyyy } = getCurrentDateInfo();
    const tanggalSurat = `${dd}/${mm}/${yyyy}`;
    const nomorSurat = generateNomorSurat(nextNo);

    const newRecord: ProposalRecord = {
      id: Date.now().toString(),
      noUrut: nextNo,
      nomorSurat,
      tujuanSurat,
      tanggalSurat,
    };

    const updatedHistory = [...proposals, newRecord];
    
    try {
      await onUpdateProposals(updatedHistory);
      setTujuanSurat('');
      alert('Proposal berhasil diproses secara global!');
    } catch (err) {
      alert('Gagal menyimpan proposal ke server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (record: ProposalRecord) => {
    setEditingId(record.id);
    setEditTujuan(record.tujuanSurat);
    setEditNomor(record.nomorSurat);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsProcessing(true);
    const updatedHistory = proposals.map(h => 
      h.id === editingId ? { ...h, tujuanSurat: editTujuan, nomorSurat: editNomor } : h
    );
    
    try {
      await onUpdateProposals(updatedHistory);
      setEditingId(null);
    } catch (err) {
      alert('Gagal mengupdate proposal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini secara permanen untuk semua orang?')) return;
    
    setIsProcessing(true);
    const updatedHistory = proposals.filter(h => h.id !== id);
    
    try {
      await onUpdateProposals(updatedHistory);
    } catch (err) {
      alert('Gagal menghapus proposal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (record: ProposalRecord) => {
    try {
      const pdfBytes = await generateProposalPDF(record);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeFileName = `Proposal_${record.nomorSurat.replace(/\//g, '-')}.pdf`;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      alert(`Gagal mendownload PDF: ${err.message || 'Error tidak diketahui'}`);
    }
  };

  return (
    <div className="page-card">
      <h2>Download Proposal</h2>
      
      <div className="admin-data-form" style={{ marginBottom: '30px' }}>
        <h3>Form Input Proposal (Real-time Global)</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Nomor Surat Selanjutnya (Otomatis):</label>
            <input type="text" value={generateNomorSurat(getNextNoUrut())} disabled style={{ backgroundColor: '#f0f0f0' }} />
          </div>
          <div className="form-group">
            <label>Tujuan Proposal:</label>
            <textarea 
              value={tujuanSurat} 
              onChange={(e) => setTujuanSurat(e.target.value)} 
              placeholder="Masukkan tujuan proposal... (Gunakan Enter untuk baris baru)"
              rows={3}
            />
          </div>
        </div>
        <div className="admin-action-buttons">
          <button className="btn-save" onClick={handleProses} disabled={isProcessing}>
            {isProcessing ? 'MEMPROSES...' : 'PROSES'}
          </button>
        </div>
      </div>

      <div className="admin-umat-list">
        <h3>Riwayat Download Global</h3>
        <div className="table-responsive">
          <table className="umat-table admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Surat</th>
                <th>Tujuan Surat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((record, index) => (
                <tr key={record.id}>
                  <td>{history.length - index}</td>
                  <td>
                    {editingId === record.id ? (
                      <input 
                        type="text" 
                        value={editNomor} 
                        onChange={(e) => setEditNomor(e.target.value)} 
                        className="edit-input-small"
                      />
                    ) : record.nomorSurat}
                  </td>
                  <td>
                    {editingId === record.id ? (
                      <textarea 
                        value={editTujuan} 
                        onChange={(e) => setEditTujuan(e.target.value)} 
                        className="edit-input-small"
                        rows={2}
                      />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{record.tujuanSurat}</div>
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
                          <button className="btn-edit-small" onClick={() => handleDownload(record)}>Download</button>
                          {isLoggedIn && (
                            <>
                              <button className="btn-edit-small" style={{ backgroundColor: '#2196F3' }} onClick={() => handleEdit(record)}>Edit</button>
                              <button className="btn-delete-small" onClick={() => handleDelete(record.id)}>Hapus</button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Belum ada riwayat proposal global.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DownloadProposal;
