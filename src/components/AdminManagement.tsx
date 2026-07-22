import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface AdminManagementProps {
  onLogout: () => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ onLogout }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cleanupPelkatKomisiAccounts = async () => {
    try {
      // Delete any pelkat & komisi admin rows from Supabase admin_profile table
      const { error } = await supabase
        .from('admin_profile')
        .delete()
        .neq('role', 'super_admin');

      if (!error) {
        setMessage({
          type: 'success',
          text: 'Semua data username & password Pelkat dan Komisi telah dibersihkan dari Supabase. Hanya Super Admin (admingpib) yang aktif.'
        });
      }
    } catch (err: any) {
      console.error('Error cleaning up pelkat/komisi accounts:', err);
    }
  };

  useEffect(() => {
    cleanupPelkatKomisiAccounts();
  }, []);

  return (
    <div className="page-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>⚙️ Setelan Hak Akses Administrator</h2>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.95rem'
        }}>
          {message.type === 'success' ? '✅ ' : '⚠️ '}
          {message.text}
        </div>
      )}

      <div className="admin-data-form" style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          🔒 Hak Akses Tunggal Super Admin
        </h3>
        <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
          Sistem telah dikembalikan ke kondisi awal. Seluruh data username dan password untuk unit <strong>Pelkat</strong> dan <strong>Komisi</strong> telah dihapus. 
          Hanya akun <strong>Super Admin</strong> yang memiliki hak akses eksklusif untuk mengedit dan mengelola seluruh konten website GPIB.
        </p>

        <div style={{ marginTop: '20px', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', width: '200px', color: '#334155' }}>Username Super Admin:</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>Aktif (Super Admin)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#334155' }}>Password Super Admin:</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}>••••••••</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#334155' }}>Hak Akses Edit:</td>
                <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '600' }}>
                  Akses Penuh Pengelolaan Konten (Semua Halaman, Pelkat & Komisi)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', textAlign: 'right' }}>
        <button
          type="button"
          className="btn-delete"
          onClick={onLogout}
          style={{ padding: '10px 24px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default AdminManagement;
