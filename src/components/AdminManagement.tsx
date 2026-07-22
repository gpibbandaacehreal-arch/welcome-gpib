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
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State Modal Tambah Pelkat / Komisi
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSubMenuName, setNewSubMenuName] = useState<string>('');
  const [newSubMenuCategory, setNewSubMenuCategory] = useState<'PELKAT' | 'KOMISI'>('PELKAT');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');

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

      // 2. Fetch data admin_profile
      const { data: profiles, error: profileError } = await supabase
        .from('admin_profile')
        .select('*');

      const existingProfiles = (!profileError && profiles) ? profiles : [];

      const list: AdminUserRecord[] = [];

      // Tambahkan Super Admin / User Aktif lebih dulu
      const superAdminProfile = existingProfiles.find(p => p.role === 'super_admin' || p.id === user?.id);
      list.push({
        id: superAdminProfile?.id || user?.id || 'super_admin_1',
        nama_admin: superAdminProfile?.nama_admin || superAdminProfile?.email || user?.email || 'Super Admin GPIB',
        email: superAdminProfile?.email || user?.email || 'admingpib@gpib.org',
        role: 'super_admin',
        sub_menu_id: null,
        sub_menu_name: 'Akses Penuh (Super Admin)',
        password: '••••••••',
        isEditing: false,
      });

      // Untuk setiap unit Pelkat / Komisi di subMenuList, pastikan ada baris admin di tabel
      currentSubMenus.forEach((sub) => {
        const matched = existingProfiles.find(p => String(p.sub_menu_id) === String(sub.id));
        if (matched) {
          list.push({
            id: matched.id || matched.user_id,
            nama_admin: matched.nama_admin || matched.email || matched.username || `Admin ${sub.name}`,
            email: matched.email || `${String(sub.id).toLowerCase()}@gpib.org`,
            role: matched.role || (sub.category === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat'),
            sub_menu_id: sub.id,
            sub_menu_name: sub.name,
            password: '••••••••',
            isEditing: false,
          });
        } else {
          // Buat entri admin default untuk Pelkat/Komisi yang belum terhubung di admin_profile
          list.push({
            id: `new_${sub.id}`,
            nama_admin: `Admin ${sub.name}`,
            email: `${String(sub.id).toLowerCase().replace(/[^a-z0-9]/g, '')}@gpib.org`,
            role: sub.category === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat',
            sub_menu_id: sub.id,
            sub_menu_name: sub.name,
            password: '••••••••',
            isEditing: false,
          });
        }
      });

      setAdminList(list);
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
        let finalId = admin.id;

        // Jika password diisi dan bukan placeholder '••••••••'
        if (admin.password && admin.password !== '••••••••' && admin.email) {
          if (admin.id === user?.id) {
            const { error: passErr } = await supabase.auth.updateUser({
              password: admin.password,
            });
            if (passErr) console.warn('Update auth error:', passErr.message);
          } else {
            // Buat / daftarkan akun di Supabase Auth jika belum ada
            const { data: authData, error: signUpErr } = await supabase.auth.signUp({
              email: admin.email,
              password: admin.password,
            });
            if (!signUpErr && authData?.user) {
              finalId = authData.user.id;
            }
          }
        }

        // Upsert data ke admin_profile
        const { error: updateErr } = await supabase
          .from('admin_profile')
          .upsert({
            id: finalId.startsWith('new_') ? `profile_${admin.sub_menu_id}` : finalId,
            nama_admin: admin.nama_admin,
            email: admin.email,
            sub_menu_id: admin.sub_menu_id,
            role: admin.role,
          });

        if (updateErr) {
          console.warn('Upsert admin_profile warning:', updateErr.message);
        }
      }

      await refreshProfile();
      await fetchData();
      setMessage({ type: 'success', text: 'Data admin dan Pelkat/Komisi berhasil disimpan ke Supabase!' });
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

      // 2. Buat akun admin di Supabase Auth & admin_profile jika email & password diisi
      let newUserId = `profile_${createdSubId}`;
      const emailToUse = newAdminEmail.trim() || `${newSubMenuName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gpib.org`;

      if (newAdminPassword.trim()) {
        const { data: authData } = await supabase.auth.signUp({
          email: emailToUse,
          password: newAdminPassword.trim(),
        });
        if (authData?.user) {
          newUserId = authData.user.id;
        }
      }

      // Upsert profil admin di Supabase
      await supabase.from('admin_profile').upsert({
        id: newUserId,
        nama_admin: emailToUse,
        email: emailToUse,
        role: newSubMenuCategory === 'KOMISI' ? 'admin_komisi' : 'admin_pelkat',
        sub_menu_id: createdSubId,
      });

      setMessage({ type: 'success', text: `Pelkat/Komisi "${newSubMenuName}" dan akun admin berhasil ditambahkan!` });
      setNewSubMenuName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error adding Pelkat/Admin:', err);
      setNewSubMenuName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setShowAddModal(false);
      await fetchData();
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
                <th style={{ padding: '12px 16px' }}>NAMA ADMIN / EMAIL</th>
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
                      <div>
                        <div style={{ fontWeight: '500', color: '#1e293b' }}>{admin.nama_admin}</div>
                        {admin.email && admin.email !== admin.nama_admin && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{admin.email}</div>
                        )}
                      </div>
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
          ➕ Tambah Pelkat / Komisi Baru
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

      {/* Modal Tambah Pelkat / Komisi & Admin */}
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
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Tambah Pelkat / Komisi Baru & Akun Admin</h3>
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

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nama Pelkat / Komisi:</label>
                <input
                  type="text"
                  placeholder="Contoh: Persekutuan Kaum Bapak (PKB)"
                  value={newSubMenuName}
                  onChange={(e) => setNewSubMenuName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email / Username Admin:</label>
                <input
                  type="email"
                  placeholder="Contoh: pkb@gpib.org"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Password Admin:</label>
                <input
                  type="password"
                  placeholder="Ketik password untuk admin baru ini"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
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
                  Simpan & Tambah Admin
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
