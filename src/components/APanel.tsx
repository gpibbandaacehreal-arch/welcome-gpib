import React, { useState } from 'react';
import { uploadImageToCloud, toImageKitUrl } from '../utils/imageUtils';
import type { SiteSettings, CustomMenuItem } from '../services/siteSettings';
import { supabase } from '../services/supabase';

interface APanelProps {
  settings: SiteSettings;
  onSaveSettings: (newSettings: SiteSettings) => Promise<void> | void;
  onLogout: () => void;
}

const FONT_FAMILIES_HEADER = [
  { label: 'Playfair Display (Klasik & Elegant)', value: "'Playfair Display', serif" },
  { label: 'Outfit (Modern Clean)', value: "'Outfit', sans-serif" },
  { label: 'Cinzel (Gothic / Megah)', value: "'Cinzel', serif" },
  { label: 'Poppins (Bulat & Modern)', value: "'Poppins', sans-serif" },
  { label: 'Montserrat (Bold Clean)', value: "'Montserrat', sans-serif" },
  { label: 'Inter (Standar Minimalis)', value: "'Inter', sans-serif" },
  { label: 'Roboto (Geometris)', value: "'Roboto', sans-serif" },
  { label: 'Georgia (Serif Formal)', value: "Georgia, serif" },
];

const FONT_FAMILIES_NAV = [
  { label: 'Inter (Standar Minimalis Rapi)', value: "'Inter', sans-serif" },
  { label: 'Outfit (Modern Trendy)', value: "'Outfit', sans-serif" },
  { label: 'Poppins (Ramah & Bulat)', value: "'Poppins', sans-serif" },
  { label: 'Montserrat (Serbaguna Clean)', value: "'Montserrat', sans-serif" },
  { label: 'Roboto (Sederhana)', value: "'Roboto', sans-serif" },
  { label: 'Open Sans (Klasik Digital)', value: "'Open Sans', sans-serif" },
  { label: 'Playfair Display (Serif Elegant)', value: "'Playfair Display', serif" },
];

const COLOR_PRESETS_PRIMARY = [
  { name: 'Red Crimson (Default)', hex: '#8b0000' },
  { name: 'Navy Blue', hex: '#1a365d' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Warm Gold', hex: '#d4af37' },
  { name: 'Deep Purple', hex: '#7c3aed' },
  { name: 'Midnight Dark', hex: '#0f172a' },
];

const COLOR_PRESETS_NAV = [
  { name: 'Hijau Tua GPIB (Default)', hex: '#1b3a2a' },
  { name: 'Navy Biru', hex: '#1a365d' },
  { name: 'Kuning Emas', hex: '#b45309' },
  { name: 'Gelap Midnight', hex: '#0f172a' },
  { name: 'Merah Tua Crimson', hex: '#8b0000' },
  { name: 'Abu-abu Slate', hex: '#334155' },
];

export const APanel: React.FC<APanelProps> = ({ settings, onSaveSettings, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'header' | 'menu' | 'theme' | 'admin'>('header');
  
  // Settings State
  const [siteTitle, setSiteTitle] = useState(settings.title || 'GPIB BANDA ACEH');
  const [logoUrl, setLogoUrl] = useState(settings.logo || '/LOGO_GPIB_BANDA_ACEH.png');
  const [headerFontFamily, setHeaderFontFamily] = useState(settings.headerFontFamily || "'Playfair Display', serif");
  const [headerFontSize, setHeaderFontSize] = useState(settings.headerFontSize || '3.2rem');
  const [headerTextColor, setHeaderTextColor] = useState(settings.headerTextColor || '#8b0000');
  const [headerBgImage, setHeaderBgImage] = useState(settings.headerBgImage || '');
  const [headerBgOverlay, setHeaderBgOverlay] = useState(settings.headerBgOverlay || 'rgba(0, 0, 0, 0.2)');

  const [navFontFamily, setNavFontFamily] = useState(settings.navFontFamily || "'Inter', sans-serif");
  const [navFontSize, setNavFontSize] = useState(settings.navFontSize || '1rem');
  const [navFontWeight, setNavFontWeight] = useState(settings.navFontWeight || '500');
  const [navBgColor, setNavBgColor] = useState(settings.navBgColor || '#1b3a2a');
  const [navTextColor, setNavTextColor] = useState(settings.navTextColor || '#ffffff');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#8b0000');

  // Custom Menu State
  const [customMenus, setCustomMenus] = useState<CustomMenuItem[]>(settings.customMenus || []);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<'UTAMA' | 'PELKAT' | 'KOMISI'>('UTAMA');
  const [newMenuSlug, setNewMenuSlug] = useState('');

  // Upload & Status states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHeaderBg, setIsUploadingHeaderBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload Handler (Logo)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      let finalUrl = await uploadImageToCloud(file);
      finalUrl = toImageKitUrl(finalUrl);
      setLogoUrl(finalUrl);
      setMessage({ type: 'success', text: 'Gambar logo berhasil diunggah via ImageKit Proxy!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengunggah logo: ' + (err?.message || 'Error') });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Upload Handler (Header Background JPG/GIF/PNG)
  const handleHeaderBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHeaderBg(true);
    try {
      let finalUrl = await uploadImageToCloud(file);
      finalUrl = toImageKitUrl(finalUrl);
      setHeaderBgImage(finalUrl);
      setMessage({ type: 'success', text: 'Gambar/GIF Header berhasil diunggah via ImageKit Proxy!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengunggah gambar header: ' + (err?.message || 'Error') });
    } finally {
      setIsUploadingHeaderBg(false);
    }
  };

  // Add Custom Menu
  const handleAddCustomMenu = () => {
    if (!newMenuName.trim()) {
      alert('Nama menu harus diisi!');
      return;
    }

    const slug = newMenuSlug.trim() || newMenuName.trim().replace(/\s+/g, '-');
    const newMenuItem: CustomMenuItem = {
      id: `custom_${Date.now()}`,
      name: newMenuName.trim(),
      category: newMenuCategory,
      targetSlug: slug,
      isActive: true
    };

    setCustomMenus(prev => [...prev, newMenuItem]);
    setNewMenuName('');
    setNewMenuSlug('');
    setMessage({ type: 'success', text: `Menu kustom "${newMenuItem.name}" berhasil ditambahkan!` });
  };

  // Delete Custom Menu
  const handleDeleteCustomMenu = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus menu kustom ini?')) {
      setCustomMenus(prev => prev.filter(m => m.id !== id));
      setMessage({ type: 'success', text: 'Menu kustom berhasil dihapus.' });
    }
  };

  // Clean up pelkat/komisi accounts from Supabase
  const handleCleanupAccounts = async () => {
    try {
      const { error } = await supabase
        .from('admin_profile')
        .delete()
        .neq('role', 'super_admin');

      if (!error) {
        setMessage({
          type: 'success',
          text: 'Semua akun non-Super Admin telah dibersihkan dari database.'
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal membersihkan data akun: ' + err.message });
    }
  };

  // Save All Settings
  const handleSaveAll = async () => {
    setIsSaving(true);
    setMessage(null);

    const updatedSettings: SiteSettings = {
      ...settings,
      title: siteTitle,
      logo: toImageKitUrl(logoUrl),
      headerFontFamily,
      headerFontSize,
      headerTextColor,
      headerBgImage: headerBgImage ? toImageKitUrl(headerBgImage) : '',
      headerBgOverlay,
      navFontFamily,
      navFontSize,
      navFontWeight,
      navBgColor,
      navTextColor,
      primaryColor,
      customMenus,
    };

    try {
      await onSaveSettings(updatedSettings);
      setMessage({ type: 'success', text: '✨ Semua kustomisasi A.Panel berhasil disimpan dan disinkronkan ke Supabase & ImageKit!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Gagal menyimpan setelan A.Panel.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-card" style={{ maxWidth: '1150px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem' }}>
            ⚙️ A.Panel (Admin Panel & Customizer)
          </h2>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Pusat Pengaturan Dapur Website GPIB Banda Aceh: Kelola Menu, Ukuran & Jenis Font Navigasi, Gambar Header (.jpg/.gif), dan Skema Warna.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
            👑 Super Admin Active
          </span>
          <button onClick={onLogout} style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {message.type === 'success' ? '✅ ' : '⚠️ '}
          {message.text}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'header' ? '3px solid #8b0000' : '3px solid transparent',
            backgroundColor: activeTab === 'header' ? '#f8fafc' : 'transparent',
            color: activeTab === 'header' ? '#8b0000' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🖼️ Header & Gambar Banner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'menu' ? '3px solid #8b0000' : '3px solid transparent',
            backgroundColor: activeTab === 'menu' ? '#f8fafc' : 'transparent',
            color: activeTab === 'menu' ? '#8b0000' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🧭 Menu Navigasi & Font
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'theme' ? '3px solid #8b0000' : '3px solid transparent',
            backgroundColor: activeTab === 'theme' ? '#f8fafc' : 'transparent',
            color: activeTab === 'theme' ? '#8b0000' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🎨 Warna & Tema Situs
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'admin' ? '3px solid #8b0000' : '3px solid transparent',
            backgroundColor: activeTab === 'admin' ? '#f8fafc' : 'transparent',
            color: activeTab === 'admin' ? '#8b0000' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔒 Hak Akses Super Admin
        </button>
      </div>

      {/* TAB 1: HEADER & BANNER */}
      {activeTab === 'header' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem' }}>🖼️ Kustomisasi Header & Gambar Banner (.jpg / .gif)</h3>
          
          <div className="form-grid" style={{ gap: '20px' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Judul Utama Situs (Header Title):</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="Contoh: GPIB BANDA ACEH"
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Jenis Font Judul Header:</label>
              <select
                value={headerFontFamily}
                onChange={(e) => setHeaderFontFamily(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {FONT_FAMILIES_HEADER.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Ukuran Font Judul Header:</label>
              <select
                value={headerFontSize}
                onChange={(e) => setHeaderFontSize(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="1.8rem">Kecil (1.8rem)</option>
                <option value="2.2rem">Sedang (2.2rem)</option>
                <option value="2.8rem">Besar (2.8rem)</option>
                <option value="3.2rem">Sangat Besar / Default (3.2rem)</option>
                <option value="3.8rem">Ekstra Besar (3.8rem)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Warna Teks Judul Header:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Background Image Header */}
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
            <h4 style={{ marginTop: 0, color: '#0f172a' }}>🏞️ Gambar Background Header (.jpg / .gif / .png)</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 12px 0' }}>
              Anda dapat mengunggah file gambar atau GIF animasi sebagai latar belakang header website. Semua gambar akan diproses via <strong>ImageKit Proxy</strong>.
            </p>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleHeaderBgUpload}
                disabled={isUploadingHeaderBg}
                style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff' }}
              />
              {isUploadingHeaderBg && <span style={{ color: '#0284c7', fontSize: '0.9rem' }}>⏳ Mengunggah gambar header...</span>}
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Atau Masukkan URL Gambar/GIF:</label>
              <input
                type="text"
                placeholder="https://... / gambar.gif"
                value={headerBgImage}
                onChange={(e) => setHeaderBgImage(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '250px' }}
              />
              {headerBgImage && (
                <button
                  type="button"
                  onClick={() => setHeaderBgImage('')}
                  style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Hapus Background
                </button>
              )}
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Kegelapan Overlay Background (Supaya Teks Tetap Jelas):
              </label>
              <select
                value={headerBgOverlay}
                onChange={(e) => setHeaderBgOverlay(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', maxWidth: '300px' }}
              >
                <option value="rgba(0, 0, 0, 0.0)">Tanpa Overlay (0% Gelap)</option>
                <option value="rgba(0, 0, 0, 0.2)">Tipis (20% Gelap - Default)</option>
                <option value="rgba(0, 0, 0, 0.4)">Sedang (40% Gelap)</option>
                <option value="rgba(0, 0, 0, 0.6)">Pekat (60% Gelap)</option>
              </select>
            </div>
          </div>

          {/* Logo Header */}
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
            <h4 style={{ marginTop: 0, color: '#0f172a' }}>🔰 Logo Header Situs (.jpg / .png / .gif)</h4>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleLogoUpload}
                disabled={isUploadingLogo}
                style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff' }}
              />
              {isUploadingLogo && <span style={{ color: '#0284c7', fontSize: '0.9rem' }}>⏳ Mengunggah logo...</span>}
            </div>

            {logoUrl && (
              <div style={{ marginTop: '15px', backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'inline-block' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '8px' }}>Pratinjau Logo (Proxy ImageKit):</span>
                <img src={toImageKitUrl(logoUrl, 300)} alt="Preview Logo" style={{ height: '90px', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MENU NAVIGASI & FONT */}
      {activeTab === 'menu' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem' }}>🧭 Kustomisasi Menu Navigasi & Jenis/Ukuran Font</h3>
          
          <div className="form-grid" style={{ gap: '20px', marginBottom: '30px' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Jenis Font Menu Navigasi:</label>
              <select
                value={navFontFamily}
                onChange={(e) => setNavFontFamily(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {FONT_FAMILIES_NAV.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Ukuran Font Menu Navigasi:</label>
              <select
                value={navFontSize}
                onChange={(e) => setNavFontSize(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="0.85rem">Sangat Kecil (0.85rem / 13px)</option>
                <option value="0.95rem">Kecil (0.95rem / 15px)</option>
                <option value="1rem">Standar / Default (1.0rem / 16px)</option>
                <option value="1.1rem">Sedang (1.1rem / 17.5px)</option>
                <option value="1.2rem">Besar (1.2rem / 19px)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Ketebalan Font (Font Weight):</label>
              <select
                value={navFontWeight}
                onChange={(e) => setNavFontWeight(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500 - Default)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="700">Bold (700)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Warna Latar Belakang Navbar:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={navBgColor}
                  onChange={(e) => setNavBgColor(e.target.value)}
                  style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <select
                  value={navBgColor}
                  onChange={(e) => setNavBgColor(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }}
                >
                  <option value={navBgColor}>Kustom ({navBgColor})</option>
                  {COLOR_PRESETS_NAV.map(preset => (
                    <option key={preset.hex} value={preset.hex}>{preset.name} ({preset.hex})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: '600', marginBottom: '6px' }}>Warna Teks Menu Navigasi:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={navTextColor}
                  onChange={(e) => setNavTextColor(e.target.value)}
                  style={{ width: '45px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={navTextColor}
                  onChange={(e) => setNavTextColor(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Form Tambah Menu Baru */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
            <h4 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem' }}>➕ Tambah Menu Kustom Baru (DAPUR Customizer)</h4>
            <div className="form-grid" style={{ gap: '15px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Nama Menu:</label>
                <input
                  type="text"
                  placeholder="Contoh: Berita & Pengumuman"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Kategori Penempatan Menu:</label>
                <select
                  value={newMenuCategory}
                  onChange={(e) => setNewMenuCategory(e.target.value as 'UTAMA' | 'PELKAT' | 'KOMISI')}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="UTAMA">Navbar Utama (Navigasi Atas)</option>
                  <option value="PELKAT">Submenu PELKAT</option>
                  <option value="KOMISI">Submenu KOMISI</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Target Slug / Path (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: berita-pengumuman"
                  value={newMenuSlug}
                  onChange={(e) => setNewMenuSlug(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-save"
              onClick={handleAddCustomMenu}
              style={{ marginTop: '15px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: '600', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              ➕ Tambahkan Menu Baru
            </button>
          </div>

          {/* Daftar Menu Kustom */}
          <div>
            <h4 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.05rem' }}>📋 Daftar Menu Kustom Aktif ({customMenus.length})</h4>
            {customMenus.length > 0 ? (
              <div className="table-responsive">
                <table className="umat-table admin-table" style={{ width: '100%', backgroundColor: '#ffffff', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Nama Menu</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Kategori Penempatan</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Target Slug</th>
                      <th style={{ width: '100px', textAlign: 'center', padding: '10px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customMenus.map(menu => (
                      <tr key={menu.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}><strong>{menu.name}</strong></td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ backgroundColor: menu.category === 'UTAMA' ? '#e0f2fe' : menu.category === 'PELKAT' ? '#fef3c7' : '#f3e8ff', color: menu.category === 'UTAMA' ? '#0369a1' : menu.category === 'PELKAT' ? '#b45309' : '#6b21a8', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                            {menu.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{menu.targetSlug}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDeleteCustomMenu(menu.id)}
                            style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            🗑️ Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px solid #cbd5e1' }}>
                Belum ada menu kustom tambahan. Gunakan form di atas untuk menambahkan menu baru.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SKEMA WARNA & TEMA */}
      {activeTab === 'theme' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem' }}>🎨 Skema Warna Utama & Aksen Situs</h3>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Pilih Warna Aksen Utama (Primary Accent Color):</label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: '50px', height: '42px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '140px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {COLOR_PRESETS_PRIMARY.map(preset => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setPrimaryColor(preset.hex)}
                  style={{
                    backgroundColor: preset.hex,
                    color: '#ffffff',
                    border: primaryColor === preset.hex ? '3px solid #000' : 'none',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HAK AKSES SUPER ADMIN */}
      {activeTab === 'admin' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            🔒 Hak Akses Tunggal Super Admin (admingpib)
          </h3>
          <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Hanya akun <strong>Super Admin (admingpib)</strong> yang memiliki hak akses eksklusif untuk mengedit dan mengelola seluruh konten serta kustomisasi website GPIB Banda Aceh.
          </p>

          <div style={{ marginTop: '20px', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', width: '220px', color: '#334155' }}>Username Super Admin:</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '1.05rem', color: '#0f172a', fontWeight: '600' }}>admingpib / admingpib@gpib.org</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#334155' }}>Status Akses:</td>
                  <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '600' }}>
                    ✅ Akses Penuh Kustomisasi Situs & A.Panel
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCleanupAccounts}
              style={{ padding: '10px 18px', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
            >
              🧹 Bersihkan Akun Non-Super Admin
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: '600', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              🚪 Logout Admin
            </button>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW BOX */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '2px dashed #cbd5e1', marginBottom: '30px' }}>
        <h4 style={{ marginTop: 0, color: '#475569', fontSize: '0.95rem' }}>👁️ Pratinjau Tampilan Langsung (Live Preview Header & Navbar):</h4>
        
        {/* Header Preview */}
        <div style={{
          textAlign: 'center',
          padding: '40px 15px',
          backgroundImage: headerBgImage ? `linear-gradient(${headerBgOverlay}, ${headerBgOverlay}), url(${toImageKitUrl(headerBgImage)})` : undefined,
          backgroundColor: headerBgImage ? '#0f172a' : '#ffffff',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: `4px solid ${primaryColor}`,
          borderRadius: '8px 8px 0 0',
          transition: 'all 0.3s ease'
        }}>
          {logoUrl && <img src={toImageKitUrl(logoUrl, 300)} alt="Header Logo" style={{ height: '75px', marginBottom: '10px', objectFit: 'contain' }} />}
          <h1 style={{
            margin: 0,
            fontFamily: headerFontFamily,
            fontSize: headerFontSize,
            color: headerBgImage ? '#ffffff' : headerTextColor,
            textTransform: 'uppercase',
            textShadow: headerBgImage ? '0 2px 8px rgba(0,0,0,0.7)' : undefined
          }}>
            {siteTitle}
          </h1>
        </div>

        {/* Navbar Preview */}
        <div style={{ backgroundColor: navBgColor, padding: '14px 20px', textAlign: 'center', borderRadius: '0 0 8px 8px' }}>
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            fontFamily: navFontFamily,
            fontSize: navFontSize,
            fontWeight: navFontWeight,
            color: navTextColor,
            flexWrap: 'wrap'
          }}>
            <li style={{ cursor: 'pointer', fontWeight: 'bold' }}>Beranda</li>
            <li style={{ cursor: 'pointer' }}>Jadwal Ibadah</li>
            <li style={{ cursor: 'pointer' }}>Organisasi Gereja ▾</li>
            {customMenus.filter(m => m.category === 'UTAMA').map(m => (
              <li key={m.id} style={{ cursor: 'pointer', color: '#fef08a' }}>{m.name}</li>
            ))}
            <li style={{ cursor: 'pointer' }}>Data Umat</li>
            <li style={{ cursor: 'pointer', color: '#facc15', fontWeight: 'bold' }}>⚙️ A.Panel</li>
          </ul>
        </div>
      </div>

      {/* Floating Save Button Bar */}
      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Simpan kustomisasi A.Panel untuk menyinkronkan seluruh perubahan ke Supabase & ImageKit Proxy secara online.
        </span>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          style={{ padding: '12px 30px', fontSize: '1rem', fontWeight: '700', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)' }}
        >
          {isSaving ? '⏳ MENYIMPAN KE SUPABASE & IMAGEKIT...' : '💾 SIMPAN SEMUA PERUBAHAN A.PANEL'}
        </button>
      </div>
    </div>
  );
};

export default APanel;
