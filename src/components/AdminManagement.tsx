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
  const { user, refreshProfile } = useAuth();
  const [adminList, setAdminList] = useState<AdminUserRecord[]>([]);
  const [subMenuList, setSubMenuList] = useState<SubMenuRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Input Admin & Pelkat Baru (Mirip Tampilan Menu Download)
  const [newSubMenuCategory, setNewSubMenuCategory] = useState<'PELKAT' | 'KOMISI'>('PELKAT');
  const [newSubMenuName, setNewSubMenuName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');

  // State Edit per baris
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editSubMenuId, setEditSubMenuId] = useState<string | number | null>('');
  const [editPassword, setEditPassword] = useState<string>('');

  // Load Data dari Supabase (sub_menu & admin_profile)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch sub_menu
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
      } else {
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
      }

      // Pastikan Pelkat standar (PA, PT, GP, PKB, PKP) selalu ada di daftar sub_menu
      const defaultUnits: SubMenuRecord[] = [
        { id: 'PA', name: 'Pelayanan Anak (PA)', category: 'PELKAT' },
        { id: 'PT', name: 'Pelayanan Taruna (PT)', category: 'PELKAT' },
        { id: 'GP', name: 'Gerakan Pemuda (GP)', category: 'PELKAT' },
        { id: 'PKB', name: 'Persekutuan Kaum Bapak (PKB)', category: 'PELKAT' },
        { id: 'PKP', name: 'Persekutuan Kaum Perempuan (PKP)', category: 'PELKAT' },
      ];

      defaultUnits.forEach((def) => {
        const defIdStr = String(def.id).toLowerCase();
        if (!currentSubMenus.some(s => String(s.id).toLowerCase() === defIdStr || s.name.toLowerCase().includes(defIdStr))) {
          currentSubMenus.push(def);
        }
      });

      setSubMenuList(currentSubMenus);

      // 2. Fetch admin_profile
      const { data: profiles, error: profileError } = await supabase
        .from('admin_profile')
        .select('*');

      const existingProfiles = (!profileError && profiles) ? profiles : [];
      const list: AdminUserRecord[] = [];

      // Super Admin
      const superAdminProfile = existingProfiles.find(p => p.role === 'super_admin' || p.id === user?.id);
      list.push({
        id: superAdminProfile?.id || user?.id || 'super_admin_1',
        nama_admin: superAdminProfile?.nama_admin || superAdminProfile?.email || user?.email || 'Super Admin GPIB',
        email: superAdminProfile?.email || user?.email || 'admingpib@gpib.org',
        role: 'super_admin',
        sub_menu_id: null,
        sub_menu_name: 'Akses Penuh (Super Admin)',
        password: '••••••••',
      });

      // Unit Pelkat & Komisi
      currentSubMenus.forEach((sub) => {
        const matched = existingProfiles.find(p => String(p.sub_menu_id) === String(sub.id));
        if (matched) {
          list.push({
            id: matched.id || matched.user_id,
            nama_admin: matched.nama_admin || matched.email || `Admin ${sub.name}`,
            email: matched.email || `${String(sub.id).toLowerCase()}@gpib.org`,
            role: matched.role || (sub.category === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat'),
            sub_menu_id: sub.id,
            sub_menu_name: sub.name,
            password: '••••••••',
          });
        } else {
          list.push({
            id: `new_${sub.id}`,
            nama_admin: `Admin ${sub.name}`,
            email: `${String(sub.id).toLowerCase().replace(/[^a-z0-9]/g, '')}@gpib.org`,
            role: sub.category === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat',
            sub_menu_id: sub.id,
            sub_menu_name: sub.name,
            password: '••••••••',
          });
        }
      });

      setAdminList(list);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Tambah Pelkat & Admin Baru via Form Atas
  const handleProsesTambah = async () => {
    if (!newSubMenuName.trim()) {
      alert('Nama Pelkat / Komisi harus diisi.');
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // 1. Insert ke sub_menu
      const { data: subData } = await supabase
        .from('sub_menu')
        .insert([
          {
            name: newSubMenuName.trim(),
            category: newSubMenuCategory,
          },
        ])
        .select();

      const createdSubId = subData && subData[0] ? subData[0].id : `custom_${Date.now()}`;
      const emailToUse = newAdminEmail.trim() || `${newSubMenuName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gpib.org`;
      let newUserId = `profile_${createdSubId}`;

      // 2. Buat akun di Supabase Auth jika password diisi
      if (newAdminPassword.trim()) {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: emailToUse,
          password: newAdminPassword.trim(),
        });
        if (!authErr && authData?.user) {
          newUserId = authData.user.id;
        }
      }

      // 3. Insert / Upsert ke admin_profile
      await supabase.from('admin_profile').upsert({
        id: newUserId,
        nama_admin: emailToUse,
        email: emailToUse,
        role: newSubMenuCategory === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat',
        sub_menu_id: createdSubId,
      });

      setMessage({ type: 'success', text: `Pelkat/Komisi "${newSubMenuName}" dan akun admin berhasil diproses ke Supabase!` });
      setNewSubMenuName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      await fetchData();
    } catch (err: any) {
      console.error('Error adding Pelkat/Admin:', err);
      setMessage({ type: 'error', text: err?.message || 'Gagal menambahkan Pelkat.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Edit per baris
  const handleStartEdit = (admin: AdminUserRecord) => {
    setEditingId(admin.id);
    setEditNama(admin.nama_admin);
    setEditEmail(admin.email || '');
    setEditSubMenuId(admin.sub_menu_id || '');
    setEditPassword('');
  };

  // Simpan Edit per baris
  const handleSaveEdit = async (admin: AdminUserRecord) => {
    setIsProcessing(true);
    setMessage(null);
    try {
      let finalId = admin.id;

      // Update password jika diisi
      if (editPassword.trim()) {
        if (admin.id === user?.id) {
          await supabase.auth.updateUser({ password: editPassword.trim() });
        } else if (editEmail.trim()) {
          const { data: authData } = await supabase.auth.signUp({
            email: editEmail.trim(),
            password: editPassword.trim(),
          });
          if (authData?.user) {
            finalId = authData.user.id;
          }
        }
      }

      // Upsert admin_profile
      await supabase.from('admin_profile').upsert({
        id: finalId.startsWith('new_') ? `profile_${editSubMenuId || admin.sub_menu_id}` : finalId,
        nama_admin: editNama.trim(),
        email: editEmail.trim(),
        sub_menu_id: editSubMenuId,
        role: admin.role,
      });

      setMessage({ type: 'success', text: `Data admin "${editNama}" berhasil disimpan ke Supabase!` });
      setEditingId(null);
      await refreshProfile();
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data admin.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hapus Admin
  const handleDeleteAdmin = async (admin: AdminUserRecord) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akses admin "${admin.nama_admin}"?`)) return;
    setIsProcessing(true);
    try {
      if (!admin.id.startsWith('new_')) {
        await supabase.from('admin_profile').delete().eq('id', admin.id);
      }
      setMessage({ type: 'success', text: `Akses admin "${admin.nama_admin}" berhasil dihapus.` });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data admin.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter List berdasarkan pencarian
  const filteredList = adminList.filter(a =>
    a.nama_admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.sub_menu_name && a.sub_menu_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-card">
      <h2>⚙️ Kelola & Tracking Admin Pelkat / Komisi</h2>

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

      {/* Form Input Pelkat & Admin (Seperti Menu Download) */}
      <div className="admin-data-form" style={{ marginBottom: '30px' }}>
        <h3>Form Input Pelkat & Admin (Real-time Global Supabase)</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Kategori Unit:</label>
            <select
              value={newSubMenuCategory}
              onChange={(e) => setNewSubMenuCategory(e.target.value as 'PELKAT' | 'KOMISI')}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="PELKAT">Pelayanan Kategorial (PELKAT)</option>
              <option value="KOMISI">Komisi</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nama Pelkat / Komisi:</label>
            <input
              type="text"
              placeholder="Contoh: Persekutuan Kaum Bapak (PKB)"
              value={newSubMenuName}
              onChange={(e) => setNewSubMenuName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email / Username Admin:</label>
            <input
              type="email"
              placeholder="Contoh: pkb@gpib.org"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password Admin:</label>
            <input
              type="password"
              placeholder="Password admin baru..."
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-action-buttons" style={{ marginTop: '15px' }}>
          <button className="btn-save" onClick={handleProsesTambah} disabled={isProcessing}>
            {isProcessing ? 'MEMPROSES...' : 'PROSES & TAMBAH ADMIN PELKAT'}
          </button>
        </div>
      </div>

      {/* Database Tracking & List Tabel (Seperti Menu Download) */}
      <div className="admin-umat-list">
        <div className="history-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Database Akses Admin Pelkat / Komisi</h3>
            <span style={{ fontSize: '0.8rem', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="pulse-indicator" style={{ width: '8px', height: '8px', backgroundColor: '#4CAF50', borderRadius: '50%', display: 'inline-block' }}></span>
              Database Sinkron Real-time (Supabase)
            </span>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Cari Nama Admin, Email, atau Pelkat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Memuat data admin dari Supabase...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="umat-table admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No</th>
                  <th>Nama Admin / Email</th>
                  <th>Hak Akses Pelkat / Komisi</th>
                  <th>Password</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map((admin, index) => (
                    <tr key={admin.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        {editingId === admin.id ? (
                          <div>
                            <input
                              type="text"
                              value={editNama}
                              onChange={(e) => setEditNama(e.target.value)}
                              placeholder="Nama Admin"
                              style={{ width: '100%', marginBottom: '4px', padding: '4px 8px' }}
                            />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email Admin"
                              style={{ width: '100%', padding: '4px 8px', fontSize: '0.85rem' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{admin.nama_admin}</div>
                            {admin.email && admin.email !== admin.nama_admin && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{admin.email}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {editingId === admin.id ? (
                          <select
                            value={editSubMenuId || ''}
                            onChange={(e) => setEditSubMenuId(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '4px', width: '100%' }}
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
                      <td>
                        {editingId === admin.id ? (
                          <input
                            type="password"
                            placeholder="Password baru..."
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            style={{ padding: '4px 8px', width: '100%' }}
                          />
                        ) : (
                          <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>••••••••</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editingId === admin.id ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-save"
                              onClick={() => handleSaveEdit(admin)}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              className="btn-cancel"
                              onClick={() => setEditingId(null)}
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-edit"
                              onClick={() => handleStartEdit(admin)}
                            >
                              Edit ✏️
                            </button>
                            {admin.role !== 'super_admin' && (
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDeleteAdmin(admin)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      Belum ada data admin Pelkat/Komisi yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tombol Logout Paling Bawah */}
      <div style={{ borderTop: '2px solid #f1f5f9', marginTop: '30px', paddingTop: '20px', textAlign: 'right' }}>
        <button
          type="button"
          className="btn-delete"
          onClick={onLogout}
          style={{ padding: '10px 20px', fontSize: '0.95rem', fontWeight: '600' }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default AdminManagement;
