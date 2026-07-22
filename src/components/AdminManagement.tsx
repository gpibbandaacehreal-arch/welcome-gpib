import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface AdminUserRecord {
  id: string;
  nama_admin: string;
  email?: string;
  role: string;
  sub_menu_id: string | number | null;
  sub_menu_name?: string;
  password?: string;
  isEditing?: boolean;
}

export interface SubMenuRecord {
  id: string | number;
  name: string;
  category?: string;
}

interface AdminManagementProps {
  onLogout: () => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ onLogout }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [adminList, setAdminList] = useState<AdminUserRecord[]>([]);
  const [subMenuList, setSubMenuList] = useState<SubMenuRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State Modal Tambah Pelkat / Komisi
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSubMenuName, setNewSubMenuName] = useState<string>('');
  const [newSubMenuCategory, setNewSubMenuCategory] = useState<'PELKAT' | 'KOMISI'>('PELKAT');

  // Load Data dari Supabase (sub_menu & admin_profile)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch data sub_menu
      const { data: subMenus, error: subMenuError } = await supabase
        .from('sub_menu')
        .select('*');

      let currentSubMenus: SubMenuRecord[] = [];
      if (!subMenuError && subMenus && subMenus.length > 0) {
        currentSubMenus = subMenus.map((item) => ({
          id: item.id,
          name: item.name || item.nama || item.title || `Sub Menu ${item.id}`,
          category: item.category || item.tipe || 'PELKAT',
        }));
        setSubMenuList(currentSubMenus);
      } else {
        // Fallback daftar standar Pelkat & Komisi jika belum terisi di DB
        currentSubMenus = [
          { id: 'PA', name: 'Pelayanan Anak (PA)', category: 'PELKAT' },
          { id: 'PT', name: 'Pelayanan Taruna (PT)', category: 'PELKAT' },
          { id: 'GP', name: 'Gerakan Pemuda (GP)', category: 'PELKAT' },
          { id: 'PKB', name: 'Persekutuan Kaum Bapak (PKB)', category: 'PELKAT' },
          { id: 'PKP', name: 'Persekutuan Kaum Perempuan (PKP)', category: 'PELKAT' },
          { id: 'GermasaLH', name: 'GermasaLH', category: 'KOMISI' },
          { id: 'PG', name: 'Komisi Pembangunan Gereja (PG)', category: 'KOMISI' },
          { id: 'Inforkom-Litbang', name: 'Inforkom-Litbang', category: 'KOMISI' },
        ];
        setSubMenuList(currentSubMenus);
      }

      // 2. Fetch data admin_profile
      const { data: profiles, error: profileError } = await supabase
        .from('admin_profile')
        .select('*');

      if (!profileError && profiles && profiles.length > 0) {
        const formatted: AdminUserRecord[] = profiles.map((p) => {
          const matchingSub = currentSubMenus.find(s => String(s.id) === String(p.sub_menu_id));
          return {
            id: p.id || p.user_id,
            nama_admin: p.nama_admin || p.email || p.username || (p.id === user?.id ? (user?.email || 'Admin Utama') : `Admin ${p.role || ''}`),
            email: p.email || (p.id === user?.id ? user?.email : ''),
            role: p.role || 'admin_pelkat',
            sub_menu_id: p.sub_menu_id,
            sub_menu_name: matchingSub ? matchingSub.name : (p.sub_menu_id ? `Sub Menu ${p.sub_menu_id}` : 'Akses Penuh (Super Admin)'),
            password: '••••••••',
            isEditing: false,
          };
        });
        setAdminList(formatted);
      } else {
        // Fallback user aktif saat ini
        setAdminList([
          {
            id: user?.id || '1',
            nama_admin: user?.email || 'Admin Utama',
            email: user?.email || '',
            role: profile?.role || 'super_admin',
            sub_menu_id: profile?.sub_menu_id || null,
            sub_menu_name: profile?.sub_menu?.name || 'Akses Penuh (Super Admin)',
            password: '••••••••',
            isEditing: false,
          }
        ]);
      }
    } catch (err: any) {
      console.error('Error loading admin data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Toggle Mode Edit per Baris
  const handleToggleEdit = (index: number) => {
    setAdminList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isEditing: !item.isEditing } : item))
    );
  };

  const handleFieldChange = (index: number, field: keyof AdminUserRecord, value: any) => {
    setAdminList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Simpan Perubahan ke Supabase
  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      for (const admin of adminList) {
        // Update data ke admin_profile
        const { error: updateErr } = await supabase
          .from('admin_profile')
          .upsert({
            id: admin.id,
            sub_menu_id: admin.sub_menu_id,
            role: admin.role,
          });

        if (updateErr) {
          console.warn('Upsert admin_profile warning:', updateErr.message);
        }

        // Jika password diubah untuk user yang sedang login
        if (admin.id === user?.id && admin.password && admin.password !== '••••••••') {
          const { error: passErr } = await supabase.auth.updateUser({
            password: admin.password,
          });

          if (passErr) {
            throw new Error(`Gagal memperbarui password: ${passErr.message}`);
          }
        }
      }

      await refreshProfile();
      setMessage({ type: 'success', text: 'Data admin dan Pelkat/Komisi berhasil disimpan ke Supabase!' });
      setAdminList((prev) => prev.map((a) => ({ ...a, isEditing: false, password: '••••••••' })));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal menyimpan perubahan.' });
    } finally {
      setSaving(false);
    }
  };

  // Tambah Pelkat / Komisi Baru
  const handleAddSubMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubMenuName.trim()) return;

    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('sub_menu')
        .insert([
          {
            name: newSubMenuName.trim(),
            category: newSubMenuCategory,
          },
        ]);

      if (error) {
        throw new Error(`Gagal menambah Pelkat/Komisi: ${error.message}`);
      }

      setMessage({ type: 'success', text: `Pelkat/Komisi "${newSubMenuName}" berhasil ditambahkan!` });
      setNewSubMenuName('');
      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      const newId = `custom_${Date.now()}`;
      setSubMenuList((prev) => [
        ...prev,
        { id: newId, name: newSubMenuName.trim(), category: newSubMenuCategory },
      ]);
      setMessage({ type: 'success', text: `Pelkat/Komisi "${newSubMenuName}" ditambahkan ke daftar.` });
      setNewSubMenuName('');
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ color: '#1a365d', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        ⚙️ Kelola Admin & Pelkat / Komisi
      </h2>

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

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div className="loader-small" style={{ margin: '0 auto 10px' }}></div>
          Memuat data admin dari Supabase...
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a365d', color: '#ffffff', textAlign: 'left', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px 16px', width: '50px' }}>NO</th>
                <th style={{ padding: '12px 16px' }}>NAMA ADMIN</th>
                <th style={{ padding: '12px 16px' }}>PELKAT / KOMISI</th>
                <th style={{ padding: '12px 16px' }}>PASSWORD</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px' }}>EDIT</th>
              </tr>
            </thead>
            <tbody>
              {adminList.map((admin, idx) => (
                <tr key={admin.id || idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {admin.isEditing ? (
                      <input
                        type="text"
                        value={admin.nama_admin}
                        onChange={(e) => handleFieldChange(idx, 'nama_admin', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                      />
                    ) : (
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>{admin.nama_admin}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {admin.isEditing ? (
                      <select
                        value={admin.sub_menu_id || ''}
                        onChange={(e) => handleFieldChange(idx, 'sub_menu_id', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                      >
                        <option value="">-- Pilih Akses Pelkat / Komisi --</option>
                        {subMenuList.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            [{sub.category || 'MENU'}] {sub.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {admin.sub_menu_name || 'Akses Penuh (Super Admin)'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {admin.isEditing ? (
                      <input
                        type="password"
                        placeholder="Ketik password baru"
                        value={admin.password === '••••••••' ? '' : admin.password}
                        onChange={(e) => handleFieldChange(idx, 'password', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                      />
                    ) : (
                      <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>••••••••</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleEdit(idx)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: admin.isEditing ? '#e2e8f0' : '#0284c7',
                        color: admin.isEditing ? '#334155' : '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.85rem'
                      }}
                    >
                      {admin.isEditing ? 'Selesai' : 'Edit ✏️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tombol di bawah kotak */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ➕ Tambah Pelkat / Komisi
        </button>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            padding: '10px 24px',
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {saving ? '💾 Menyimpan...' : '💾 Save'}
        </button>
      </div>

      {/* Modal Tambah Pelkat / Komisi */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', width: '90%', maxWidth: '450px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Tambah Pelkat / Komisi Baru</h3>
            <form onSubmit={handleAddSubMenu}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Kategori:</label>
                <select
                  value={newSubMenuCategory}
                  onChange={(e) => setNewSubMenuCategory(e.target.value as 'PELKAT' | 'KOMISI')}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="PELKAT">Pelayanan Kategorial (PELKAT)</option>
                  <option value="KOMISI">Komisi</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nama Pelkat / Komisi:</label>
                <input
                  type="text"
                  placeholder="Contoh: Komisi Pemuda / Pelkat GP"
                  value={newSubMenuName}
                  onChange={(e) => setNewSubMenuName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#94a3b8', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tombol Logout Paling Bawah */}
      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', textAlign: 'right' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default AdminManagement;
