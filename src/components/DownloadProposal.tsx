import React, { useState } from 'react';
import { generateProposalPDF, type ProposalData } from '../utils/pdfUtils';

interface ProposalRecord extends ProposalData {
  id: string;
  noUrut: number;
}

interface DownloadProposalProps {
  isLoggedIn: boolean;
}

const DownloadProposal: React.FC<DownloadProposalProps> = ({ isLoggedIn }) => {
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTujuan, setEditTujuan] = useState('');
  const [editNomor, setEditNomor] = useState('');
  
  const [history, setHistory] = useState<ProposalRecord[]>(() => {
    const saved = localStorage.getItem('proposalHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [nextNoUrut, setNextNoUrut] = useState<number>(() => {
    const saved = localStorage.getItem('proposalHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          const lastNo = Math.max(...parsed.map((h: ProposalRecord) => h.noUrut));
          return lastNo + 1;
        }
      } catch (e) {
        return 1;
      }
    }
    return 1;
  });

  const getCurrentDateInfo = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return { dd, mm, yyyy };
  };

  const generateNomorSurat = (noUrut: number) => {
    const { mm, yyyy } = getCurrentDateInfo();
    const xxx = String(noUrut).padStart(3, '0');
    return `${xxx}/GPIB.30THN/${mm}/${yyyy}`;
  };

  const handleProses = () => {
    if (!tujuanSurat.trim()) {
      alert('Tujuan Proposal harus diisi.');
      return;
    }

    const { dd, mm, yyyy } = getCurrentDateInfo();
    const tanggalSurat = `${dd}/${mm}/${yyyy}`;
    const nomorSurat = generateNomorSurat(nextNoUrut);

    const newRecord: ProposalRecord = {
      id: Date.now().toString(),
      noUrut: nextNoUrut,
      nomorSurat,
      tujuanSurat,
      tanggalSurat,
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    setNextNoUrut(nextNoUrut + 1);
    setTujuanSurat('');

    localStorage.setItem('proposalHistory', JSON.stringify(updatedHistory));
  };

  const handleEdit = (record: ProposalRecord) => {
    setEditingId(record.id);
    setEditTujuan(record.tujuanSurat);
    setEditNomor(record.nomorSurat);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const updatedHistory = history.map(h => 
      h.id === editingId ? { ...h, tujuanSurat: editTujuan, nomorSurat: editNomor } : h
    );
    setHistory(updatedHistory);
    localStorage.setItem('proposalHistory', JSON.stringify(updatedHistory));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('proposalHistory', JSON.stringify(updatedHistory));

    // Reset nextNoUrut if history is empty or if we deleted the highest number
    if (updatedHistory.length === 0) {
      setNextNoUrut(1);
    } else {
      const lastNo = Math.max(...updatedHistory.map(h => h.noUrut));
      setNextNoUrut(lastNo + 1);
    }
  };

  const handleDownload = async (record: ProposalRecord) => {
    try {
      const pdfBytes = await generateProposalPDF(record);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposal_${record.nomorSurat.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mendownload PDF. Pastikan file COVER.pdf dan ISI.pdf ada di folder public.');
    }
  };

  return (
    <div className="page-card">
      <h2>Download Proposal</h2>
      
      <div className="admin-data-form" style={{ marginBottom: '30px' }}>
        <h3>Form Input Proposal</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Nomor Surat (Otomatis):</label>
            <input type="text" value={generateNomorSurat(nextNoUrut)} disabled style={{ backgroundColor: '#f0f0f0' }} />
          </div>
          <div className="form-group">
            <label>Tujuan Proposal:</label>
            <input 
              type="text" 
              value={tujuanSurat} 
              onChange={(e) => setTujuanSurat(e.target.value)} 
              placeholder="Masukkan tujuan proposal..."
            />
          </div>
        </div>
        <div className="admin-action-buttons">
          <button className="btn-save" onClick={handleProses}>PROSES</button>
        </div>
      </div>

      <div className="admin-umat-list">
        <h3>Riwayat Download</h3>
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
                      <input 
                        type="text" 
                        value={editTujuan} 
                        onChange={(e) => setEditTujuan(e.target.value)} 
                        className="edit-input-small"
                      />
                    ) : record.tujuanSurat}
                  </td>
                  <td>
                    <div className="table-actions">
                      {editingId === record.id ? (
                        <>
                          <button className="btn-save-small" onClick={handleSaveEdit}>Simpan</button>
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
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>Belum ada riwayat proposal.</td>
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
