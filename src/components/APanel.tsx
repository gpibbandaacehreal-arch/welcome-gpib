import React, { useState } from 'react';
import { uploadImageToCloud, toImageKitUrl } from '../utils/imageUtils';
import { getErrorMessage } from '../utils/errorUtils';
import type { SiteSettings, CustomMenuItem } from '../services/siteSettings';

interface APanelProps {
  settings: SiteSettings;
  onSaveSettings: (newSettings: SiteSettings) => Promise<void> | void;
  onLogout: () => void;
}

/** Position options for custom menus in the navbar */
const MENU_POSITIONS = [
  { label: 'Sebelah kanan Beranda', value: 'after-Beranda' },
  { label: 'Sebelah kanan Jadwal Ibadah', value: 'after-Jadwal Ibadah' },
  { label: 'Sebelah kanan Organisasi Gereja', value: 'after-Organisasi Gereja' },
  { label: 'Sebelah kanan Data Umat', value: 'after-Data Umat' },
  { label: 'Sebelah kanan Login', value: 'after-Login' },
];

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

const COLOR_PRESETS_SITE_BG = [
  { name: 'Putih Bersih (Default)', hex: '#ffffff' },
  { name: 'Krem Klasik', hex: '#fdfaf5' },
  { name: 'Abu Slate Soft', hex: '#f8fafc' },
  { name: 'Mint Soft', hex: '#f0fdf4' },
  { name: 'Biru Soft', hex: '#f0f9ff' },
  { name: 'Dark Slate', hex: '#0f172a' },
];

export const APanel: React.FC<APanelProps> = ({ settings, onSaveSettings, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'header' | 'menu' | 'theme'>('header');
  
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
  const [siteBgColor, setSiteBgColor] = useState(settings.siteBgColor || '#ffffff');

  // Custom Menu State
  const [customMenus, setCustomMenus] = useState<CustomMenuItem[]>(settings.customMenus || []);

  // Form: Tambah Menu Baru
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPosition, setNewMenuPosition] = useState('after-Beranda');
  const [newMenuItemWarta, setNewMenuItemWarta] = useState('');
  const [newMenuItemTata, setNewMenuItemTata] = useState('');

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
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengunggah logo: ' + getErrorMessage(err) });
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
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengunggah gambar header: ' + getErrorMessage(err) });
    } finally {
      setIsUploadingHeaderBg(false);
    }
  };

  // Add Custom Menu Baru (dengan isi: Warta Jemaat + Tata Ibadah)
  const handleAddCustomMenu = () => {
    if (!newMenuName.trim()) {
      alert('Nama menu harus diisi!');
      return;
    }

    const items: CustomMenuItem['items'] = [];
    if (newMenuItemWarta.trim()) {
      items.push({ id: `item_warta_${Date.now()}`, name: 'Warta Jemaat', url: newMenuItemWarta.trim() });
    }
    if (newMenuItemTata.trim()) {
      items.push({ id: `item_tata_${Date.now()}`, name: 'Tata Ibadah', url: newMenuItemTata.trim() });
    }

    const newMenuItem: CustomMenuItem = {
      id: `custom_${Date.now()}`,
      name: newMenuName.trim(),
      position: newMenuPosition,
      items,
      isActive: true
    };

    setCustomMenus(prev => [...prev, newMenuItem]);
    setNewMenuName('');
    setNewMenuItemWarta('');
    setNewMenuItemTata('');
    setMessage({ type: 'success', text: `Menu "${newMenuItem.name}" berhasil ditambahkan!` });
  };

  // Delete Custom Menu
  const handleDeleteCustomMenu = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus menu ini?')) {
      setCustomMenus(prev => prev.filter(m => m.id !== id));
      setMessage({ type: 'success', text: 'Menu berhasil dihapus.' });
    }
  };

  // Toggle menu active
  const handleToggleCustomMenu = (id: string) => {
    setCustomMenus(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  // Update menu position
  const handleUpdateMenuPosition = (id: string, newPosition: string) => {
    setCustomMenus(prev => prev.map(m => m.id === id ? { ...m, position: newPosition } : m));
  };

  // Update a folder item URL inside a custom menu
  const handleUpdateMenuItem = (menuId: string, itemId: string, newUrl: string) => {
    setCustomMenus(prev => prev.map(m => {
      if (m.id !== menuId) return m;
      return {
        ...m,
        items: m.items.map(it => it.id === itemId ? { ...it, url: newUrl } : it)
      };
    }));
  };

  // Delete a folder item from a custom menu
  const handleDeleteMenuItem = (menuId: string, itemId: string) => {
    setCustomMenus(prev => prev.map(m => {
      if (m.id !== menuId) return m;
      return { ...m, items: m.items.filter(it => it.id !== itemId) };
    }));
  };

  // Add a new folder item to an existing custom menu
  const [addItemMenuId, setAddItemMenuId] = useState<string | null>(null);
  const [addItemName, setAddItemName] = useState('');
  const [addItemUrl, setAddItemUrl] = useState('');
  const handleAddItemToMenu = (menuId: string) => {
    if (!addItemName.trim() || !addItemUrl.trim()) {
      alert('Nama item dan URL harus diisi!');
      return;
    }
    setCustomMenus(prev => prev.map(m => {
      if (m.id !== menuId) return m;
      return { ...m, items: [...m.items, { id: `item_${Date.now()}`, name: addItemName.trim(), url: addItemUrl.trim() }] };
    }));
    setAddItemName('');
    setAddItemUrl('');
    setAddItemMenuId(null);
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
      siteBgColor,
      customMenus,
    };

    try {
      await onSaveSettings(updatedSettings);
      setMessage({ type: 'success', text: '✨ Semua kustomisasi A.Panel berhasil disimpan dan disinkronkan ke Supabase & ImageKit!' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Gagal menyimpan setelan A.Panel.') });
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

      {/* Tabs Bar — 3 tabs only */}
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

      {/* TAB 2: MENU NAVIGASI & FONT + TAMBAH MENU BARU */}
      {activeTab === 'menu' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem' }}>🧭 Kustomisasi Menu Navigasi & Tambah Menu Baru</h3>
          
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

          {/* ───── FORM TAMBAH MENU BARU ───── */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
            <h4 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem' }}>➕ Tambah Menu Baru</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 18px 0' }}>
              Buat menu baru di taskbar. Pilih posisi, isi nama, dan tentukan isi menu berupa folder tautan (Warta Jemaat &amp; Tata Ibadah).
            </p>

            {/* Nama Menu */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>1️⃣ Nama Menu:</label>
              <input
                type="text"
                placeholder="Contoh: PROPOSAL / WARTA & TATA IBADAH"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              />
            </div>

            {/* Posisi Menu */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>2️⃣ Posisi Menu di Taskbar:</label>
              <select
                value={newMenuPosition}
                onChange={(e) => setNewMenuPosition(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              >
                {MENU_POSITIONS.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>

            {/* Isi Menu — Folder Links */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>3️⃣ Isi Menu (Folder Tautan):</label>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                Isi link Google Drive / Cloud untuk setiap item folder. User non-login akan melihat icon folder, klik dua kali untuk membuka link.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', minWidth: '130px', color: '#334155' }}>📄 Warta Jemaat:</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newMenuItemWarta}
                    onChange={(e) => setNewMenuItemWarta(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', minWidth: '130px', color: '#334155' }}>📄 Tata Ibadah:</span>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newMenuItemTata}
                    onChange={(e) => setNewMenuItemTata(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomMenu}
              style={{ padding: '11px 24px', fontSize: '0.95rem', fontWeight: '700', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              ➕ Tambahkan Menu Baru
            </button>
          </div>

          {/* ───── DAFTAR MENU AKTIF ───── */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '25px' }}>
            <h4 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem' }}>📋 Daftar Menu Aktif ({customMenus.length})</h4>
            {customMenus.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {customMenus.map(menu => {
                  return (
                    <div key={menu.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>📂 {menu.name}</span>
                          <select
                            value={menu.position}
                            onChange={(e) => handleUpdateMenuPosition(menu.id, e.target.value)}
                            style={{ marginLeft: '10px', padding: '3px 8px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '500', cursor: 'pointer' }}
                          >
                            {MENU_POSITIONS.map(pos => (
                              <option key={pos.value} value={pos.value}>{pos.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleToggleCustomMenu(menu.id)}
                            style={{
                              marginLeft: '10px',
                              padding: '3px 10px',
                              fontSize: '0.78rem',
                              borderRadius: '12px',
                              border: 'none',
                              fontWeight: '600',
                              cursor: 'pointer',
                              backgroundColor: menu.isActive ? '#dcfce7' : '#fef2f2',
                              color: menu.isActive ? '#15803d' : '#b91c1c'
                            }}
                          >
                            {menu.isActive ? '✅ Aktif' : '🚫 Nonaktif'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomMenu(menu.id)}
                          style={{ padding: '5px 12px', fontSize: '0.8rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🗑️ Hapus Menu
                        </button>
                      </div>

                      {/* Folder items inside this menu */}
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Isi Folder:</label>
                        {menu.items.length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f1f5f9' }}>
                                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.78rem' }}>Icon</th>
                                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.78rem' }}>Nama Folder</th>
                                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.78rem' }}>Link URL</th>
                                <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: '0.78rem', width: '60px' }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {menu.items.map(item => (
                                <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '6px 8px', fontSize: '1.2rem' }}>📂</td>
                                  <td style={{ padding: '6px 8px', fontWeight: '600', fontSize: '0.85rem' }}>{item.name}</td>
                                  <td style={{ padding: '6px 8px' }}>
                                    <input
                                      type="url"
                                      value={item.url}
                                      onChange={(e) => handleUpdateMenuItem(menu.id, item.id, e.target.value)}
                                      style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMenuItem(menu.id, item.id)}
                                      style={{ padding: '3px 6px', fontSize: '0.7rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>Belum ada folder isi.</p>
                        )}

                        {/* Add more items to this menu */}
                        {addItemMenuId === menu.id ? (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="Nama item (misal: Surat Edaran)"
                              value={addItemName}
                              onChange={(e) => setAddItemName(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', width: '180px' }}
                            />
                            <input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={addItemUrl}
                              onChange={(e) => setAddItemUrl(e.target.value)}
                              style={{ flex: 1, minWidth: '200px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                            <button type="button" onClick={() => handleAddItemToMenu(menu.id)} style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Simpan</button>
                            <button type="button" onClick={() => setAddItemMenuId(null)} style={{ padding: '6px 10px', fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setAddItemMenuId(menu.id); setAddItemName(''); setAddItemUrl(''); }}
                            style={{ marginTop: '8px', padding: '5px 12px', fontSize: '0.8rem', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            ➕ Tambah Folder Lagi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px solid #cbd5e1', marginTop: '12px' }}>
                Belum ada menu tambahan. Gunakan form di atas untuk menambahkan menu baru.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SKEMA WARNA & TEMA */}
      {activeTab === 'theme' && (
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem' }}>🎨 Skema Warna Utama & Background Situs</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
            Atur warna latar belakang (background) seluruh website serta warna aksen utama untuk tombol dan elemen penting.
          </p>

          {/* Warna Background Situs */}
          <div className="form-group" style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #cbd5e1' }}>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', fontSize: '1rem', color: '#0f172a' }}>
              🖼️ Warna Background Situs (Latar Belakang Website):
            </label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
              <input
                type="color"
                value={siteBgColor}
                onChange={(e) => setSiteBgColor(e.target.value)}
                style={{ width: '50px', height: '42px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '6px' }}
              />
              <input
                type="text"
                value={siteBgColor}
                onChange={(e) => setSiteBgColor(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '140px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {COLOR_PRESETS_SITE_BG.map(preset => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setSiteBgColor(preset.hex)}
                  style={{
                    backgroundColor: preset.hex,
                    color: preset.hex === '#0f172a' ? '#ffffff' : '#0f172a',
                    border: siteBgColor === preset.hex ? '3px solid #000' : '1px solid #cbd5e1',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Warna Aksen Utama */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', fontSize: '1rem', color: '#0f172a' }}>
              ✨ Warna Aksen Utama (Primary Accent Color):
            </label>
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

      {/* LIVE PREVIEW BOX */}
      <div style={{ backgroundColor: siteBgColor, padding: '20px', borderRadius: '12px', border: '2px dashed #cbd5e1', marginBottom: '30px', transition: 'background-color 0.3s ease' }}>
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
            {/* Show custom menus in preview at their position */}
            {customMenus.filter(m => m.isActive !== false && m.position === 'after-Beranda').map(m => (
              <li key={m.id} style={{ cursor: 'pointer', color: '#fef08a', fontWeight: '600' }}>📂 {m.name}</li>
            ))}
            {customMenus.filter(m => m.isActive !== false && m.position === 'after-Jadwal Ibadah').map(m => (
              <li key={m.id} style={{ cursor: 'pointer', color: '#fef08a', fontWeight: '600' }}>📂 {m.name}</li>
            ))}
            {customMenus.filter(m => m.isActive !== false && m.position === 'after-Organisasi Gereja').map(m => (
              <li key={m.id} style={{ cursor: 'pointer', color: '#fef08a', fontWeight: '600' }}>📂 {m.name}</li>
            ))}
            <li style={{ cursor: 'pointer' }}>Data Umat</li>
            {customMenus.filter(m => m.isActive !== false && m.position === 'after-Data Umat').map(m => (
              <li key={m.id} style={{ cursor: 'pointer', color: '#fef08a', fontWeight: '600' }}>📂 {m.name}</li>
            ))}
            <li style={{ cursor: 'pointer', color: '#facc15', fontWeight: 'bold' }}>⚙️ A.Panel</li>
          </ul>
        </div>
      </div>

      {/* Floating Save Button Bar */}
      <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Simpan kustomisasi A.Panel untuk menyinkronkan seluruh perubahan ke Supabase &amp; ImageKit Proxy secara online.
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
