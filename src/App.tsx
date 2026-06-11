import React, { useState, useEffect } from 'react'
import './App.css'
import LoginForm from './components/LoginForm'
import { authService } from './services/auth'
import AdminDashboard from './components/AdminDashboard'
import { compressImage } from './utils/imageUtils'
import DownloadProposal from './components/DownloadProposal'

// Types
type Tab = 'Beranda' | 'Jadwal Ibadah' | 'Organisasi Gereja' | 'Data Umat' | 'Download' | 'Login' 
  | 'PA' | 'PT' | 'GP' | 'PKB' | 'PKP' 
  | 'GermasaLH' | 'PG' | 'Inforkom-Litbang';

interface ContentBlock {
  type: 'text' | 'image';
  value: string;
}

interface PageContent {
  title: string;
  content: string;
  blocks?: ContentBlock[]; // Opsional untuk migrasi
}

interface SiteSettings {
  logo: string;
  title: string;
}

interface UmatRecord {
  id: string;
  nama: string;
  status: string;
  nik: string;
  alamat: string;
  noHp: string;
  photo: string;
  kk: string;
  isPending?: boolean; // New flag for verification queue
}

interface FullContent {
  settings: SiteSettings;
  pages: Record<string, PageContent>;
  umat: UmatRecord[];
  proposals: any[]; // New field for shared proposal history
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnXm-7uc82ZXbcqLVp6wSDmhtelLbods2bHTHEjqov06jzTGf-eCXuXsDnzzGlFDBkTw/exec';

const DEFAULT_CONTENT: FullContent = {
  settings: {
    logo: "/LOGO_GPIB.jpg",
    title: "GPIB BANDA ACEH"
  },
  pages: {
    'Beranda': {
      title: 'Selamat Datang di GPIB Banda Aceh',
      content: '<p>Membangun jemaat yang misioner, inklusif, dan transformatif di tengah masyarakat Banda Aceh.</p><p>GPIB Banda Aceh hadir untuk menjadi berkat bagi sesama dengan semangat pelayanan dan kasih Kristus.</p>'
    },
    'Jadwal Ibadah': {
      title: 'Jadwal Ibadah Mingguan',
      content: '<p><strong>Ibadah Hari Minggu:</strong> 09.00 WIB<br><strong>Ibadah Keluarga:</strong> Rabu, 19.30 WIB<br><strong>Ibadah Pelkat PA/PT:</strong> Sabtu, 16.00 WIB</p>'
    },
    'Organisasi Gereja': {
      title: 'Struktur Organisasi & Majelis',
      content: '<p>Informasi mengenai struktur organisasi Majelis Jemaat, Pelayanan Kategorial (Pelkat), dan Komisi-Komisi di GPIB Banda Aceh.</p>'
    },
    'PA': {
      title: 'Pelayanan Anak (PA)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melaksanakan pelayanan kategorial kepada anak-anak jemaat dalam rentang usia sekolah minggu (0-12 tahun).</p><p><strong>Fungsi:</strong><br>1. Menyelenggarakan Ibadah Hari Minggu Pelayanan Anak (IHMPA).<br>2. Membina iman anak melalui pengajaran Alkitab yang kreatif dan kontekstual.<br>3. Mengembangkan potensi dan bakat anak dalam lingkungan gerejawi.</p>'
    },
    'PT': {
      title: 'Pelayanan Taruna (PT)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melayani dan membina kaum taruna atau remaja jemaat (usia 13-17 tahun).</p><p><strong>Fungsi:</strong><br>1. Menyelenggarakan Ibadah Hari Minggu Pelayanan Taruna (IHMPT).<br>2. Mendampingi remaja dalam masa transisi mencari jati diri dengan nilai-nilai Kristiani.<br>3. Membangun persekutuan yang akrab di antara taruna.</p>'
    },
    'GP': {
      title: 'Gerakan Pemuda (GP)',
      content: '<p><strong>Tugas Pokok:</strong><br>Menghimpun dan melayani pemuda-pemudi gereja (usia 18-35 tahun) untuk terlibat aktif dalam misi gereja.</p><p><strong>Fungsi:</strong><br>1. Wadah pembinaan kepemimpinan dan spiritualitas pemuda.<br>2. Menggerakkan pemuda dalam berbagai aksi pelayanan kasih dan kemasyarakatan.<br>3. Menjadi garda terdepan dalam inovasi dan kegiatan kreatif gereja.</p>'
    },
    'PKP': {
      title: 'Persekutuan Kaum Perempuan (PKP)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melaksanakan pelayanan dan pembinaan kepada kaum perempuan/ibu di jemaat.</p><p><strong>Fungsi:</strong><br>1. Meningkatkan kualitas iman dan peran perempuan dalam keluarga dan gereja.<br>2. Menyelenggarakan persekutuan doa dan studi Alkitab khusus kaum perempuan.<br>3. Melaksanakan kegiatan pemberdayaan ekonomi dan sosial.</p>'
    },
    'PKB': {
      title: 'Persekutuan Kaum Bapak (PKB)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melaksanakan pelayanan dan pembinaan kepada kaum bapak/pria di jemaat.</p><p><strong>Fungsi:</strong><br>1. Menguatkan peran bapak sebagai imam dalam keluarga Kristen.<br>2. Membangun persekutuan bapak yang solider dan bertanggung jawab terhadap pelayanan gereja.<br>3. Menyelenggarakan kegiatan yang mendukung pertumbuhan iman dan tanggung jawab profesi.</p>'
    },
    'GermasaLH': {
      title: 'Komisi Gereja, Masyarakat, Agama dan Lingkungan Hidup (GermasaLH)',
      content: '<p><strong>Tugas Pokok:</strong><br>Menangani urusan hubungan gereja dengan masyarakat, antarumat beragama, serta kelestarian lingkungan hidup.</p><p><strong>Fungsi:</strong><br>1. Membangun dialog dan kerjasama oikumenis serta antariman di Banda Aceh.<br>2. Melaksanakan aksi sosial dan advokasi terhadap isu-isu kemasyarakatan.<br>3. Mengedukasi jemaat dalam upaya pelestarian lingkungan hidup.</p>'
    },
    'PG': {
      title: 'Komisi Pembangunan Gereja (PG)',
      content: '<p><strong>Tugas Pokok:</strong><br>Bertanggung jawab atas perencanaan, pelaksanaan, dan pengawasan pembangunan serta pemeliharaan sarana prasarana gereja.</p><p><strong>Fungsi:</strong><br>1. Menyusun rencana induk pembangunan fisik gereja.<br>2. Mengelola proses renovasi dan perawatan gedung serta aset gereja.<br>3. Memastikan ketersediaan fasilitas yang representatif untuk ibadah dan pelayanan.</p>'
    },
    'Inforkom-Litbang': {
      title: 'Komisi Informasi, Organisasi, Komunikasi, Penelitian dan Pengembangan (Inforkom-Litbang)',
      content: '<p><strong>Tugas Pokok:</strong><br>Mengelola sistem informasi, komunikasi publik, tata organisasi, serta melakukan penelitian dan pengembangan jemaat.</p><p><strong>Fungsi:</strong><br>1. Mengelola media komunikasi gereja (website, media sosial, warta jemaat).<br>2. Melakukan pendataan dan pengolahan data umat secara digital.<br>3. Melakukan kajian dan evaluasi program kerja untuk pengembangan kualitas jemaat ke depan.</p>'
    }
  },
  umat: [],
  proposals: []
};

import { supabase, type SupabaseProposal } from './services/supabase'

// ... (previous imports and types remain)

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Beranda')
  // ... (isLoggedIn, isMobileMenuOpen, isDropdownOpen remain)
  
  const [siteContent, setSiteContent] = useState<FullContent>(() => {
    // ... (same initial state logic)
  })

  // Add a dedicated state for proposals fetched from Supabase
  const [supabaseProposals, setSupabaseProposals] = useState<SupabaseProposal[]>([])

  // ... (isLoading, editor states, etc. remain)

  // Fetch proposals from Supabase
  const fetchSupabaseProposals = async () => {
    const { data, error } = await supabase
      .from('riwayat_download')
      .select('*')
      .order('no_urut', { ascending: false });
    
    if (error) {
      console.error('Error fetching proposals from Supabase:', error);
    } else if (data) {
      setSupabaseProposals(data);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    fetchSupabaseProposals();

    const channel = supabase
      .channel('public:riwayat_download')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riwayat_download' }, () => {
        fetchSupabaseProposals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Modify handleUpdateProposals to use Supabase
  const handleUpdateProposals = async (updatedProposals: any[]) => {
    // We only need the latest record for insertion if it's a new one
    // But for simplicity in this migration, let's detect if it's an add, edit, or delete
    // For "PROSES" button, it's an add.
    
    // NOTE: DownloadProposal component still passes the whole array.
    // We should ideally change DownloadProposal to use supabase directly, 
    // but to minimize breaking changes, let's compare with current state.
  };

  const handleAddProposalSupabase = async (newProposal: Omit<SupabaseProposal, 'id'>) => {
    const { error } = await supabase
      .from('riwayat_download')
      .insert([newProposal]);
    
    if (error) {
      console.error('Error adding proposal to Supabase:', error);
      throw error;
    }
  };

  const handleDeleteProposalSupabase = async (id: number) => {
    const { error } = await supabase
      .from('riwayat_download')
      .delete()
      .match({ id });
    
    if (error) {
      console.error('Error deleting proposal from Supabase:', error);
      throw error;
    }
  };

  const handleEditProposalSupabase = async (id: number, updates: Partial<SupabaseProposal>) => {
    const { error } = await supabase
      .from('riwayat_download')
      .update(updates)
      .match({ id });
    
    if (error) {
      console.error('Error updating proposal in Supabase:', error);
      throw error;
    }
  };

  const renderPage = () => {
    if (activeTab === 'Login' && !isLoggedIn) {
      return (
        <LoginForm onLoginSuccess={() => {
          setIsLoggedIn(true);
          setActiveTab('Beranda');
        }} />
      )
    }

    if (activeTab === 'Data Umat') {
      return renderDataUmat()
    }

    if (activeTab === 'Download') {
      return (
        <DownloadProposal 
          isLoggedIn={isLoggedIn} 
          proposals={supabaseProposals}
          onAddProposal={handleAddProposalSupabase}
          onEditProposal={handleEditProposalSupabase}
          onDeleteProposal={handleDeleteProposalSupabase}
        />
      )
    }

    const currentPage = siteContent.pages[activeTab]
    if (!currentPage) return null

    return (
      <div className="page-content">
        {!isLoggedIn ? (
          <div className="page-card">
            <h2>{currentPage.title}</h2>
            <div 
              className="content-body" 
              dangerouslySetInnerHTML={{ __html: currentPage.content || '' }} 
            />
          </div>
        ) : (
          <AdminDashboard 
            initialTitle={editTitle || ''}
            initialContent={editContent || ''}
            initialSiteTitle={editSiteTitle || ''}
            initialSiteLogo={editLogo || ''}
            onSave={(data: any) => {
              setEditTitle(data.title || '');
              setEditContent(data.content || '');
              setEditSiteTitle(data.siteTitle || '');
              setEditLogo(data.siteLogo || '');
            }}
            onPublish={(data: any) => saveChanges(data)}
            isSaving={isSaving}
          />
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo-container">
          <img src={siteContent?.settings?.logo || "/LOGO_GPIB.jpg"} alt="Logo GPIB" />
        </div>
        <p>Membuka situs GPIB Banda Aceh...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <img src={siteContent.settings.logo} alt="Logo GPIB" />
        </div>
        <h1>{siteContent.settings.title}</h1>
      </header>

      <nav className="navbar">
        <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'} Menu
        </div>
        <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li 
            className={activeTab === 'Beranda' ? 'active' : ''}
            onClick={() => { setActiveTab('Beranda'); setIsMobileMenuOpen(false); }}
          >
            Beranda
          </li>
          <li 
            className={activeTab === 'Jadwal Ibadah' ? 'active' : ''}
            onClick={() => { setActiveTab('Jadwal Ibadah'); setIsMobileMenuOpen(false); }}
          >
            Jadwal Ibadah
          </li>
          
          <li className={`dropdown ${['Organisasi Gereja', 'PA', 'PT', 'GP', 'PKB', 'PKP', 'GermasaLH', 'PG', 'Inforkom-Litbang'].includes(activeTab) ? 'active' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`}>
            <span onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              Organisasi Gereja {isDropdownOpen ? '▴' : '▾'}
            </span>
            <ul className="dropdown-menu">
              <li onClick={() => { setActiveTab('Organisasi Gereja'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Struktur Organisasi</li>
              <li className="dropdown-submenu">
                <span>Pelayanan Kategorial (PELKAT) ▸</span>
                <ul className="submenu-list">
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PA'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Pelayanan Anak (PA)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PT'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Pelayanan Taruna (PT)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('GP'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Gerakan Pemuda (GP)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PKB'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Persekutuan Kaum Bapak (PKB)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PKP'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Persekutuan Kaum Perempuan (PKP)</li>
                </ul>
              </li>
              <li className="dropdown-submenu">
                <span>KOMISI ▸</span>
                <ul className="submenu-list">
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('GermasaLH'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>GermasaLH (Gereja, Masyarakat, Agama, Lingkungan Hidup)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PG'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>PG (Pembangunan Gereja)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('Inforkom-Litbang'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); }}>Inforkom-Litbang (Info, Orga, Kom, Litbang)</li>
                </ul>
              </li>
            </ul>
          </li>

          <li 
            className={activeTab === 'Data Umat' ? 'active' : ''}
            onClick={() => { setActiveTab('Data Umat'); setIsMobileMenuOpen(false); }}
          >
            Data Umat
          </li>

          {isLoggedIn ? (
            <li onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>Logout (Admin)</li>
          ) : (
            <li 
              className={activeTab === 'Login' ? 'active' : ''} 
              onClick={() => { setActiveTab('Login'); setIsMobileMenuOpen(false); }}
            >
              Login
            </li>
          )}

          <li 
            className={activeTab === 'Download' ? 'active' : ''}
            onClick={() => { setActiveTab('Download'); setIsMobileMenuOpen(false); }}
          >
            Download
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>

      <footer className="footer">
        &copy; 2026 GPIB BANDA ACEH. All Rights Reserved.
      </footer>
    </div>
  )
}

export default App
