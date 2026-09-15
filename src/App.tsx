import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import LoginForm from './components/LoginForm'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load komponen berat: AdminDashboard berisi editor Quill, APanel hanya untuk admin.
// Keduanya dipecah ke chunk terpisah agar bundle awal tetap ringan.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const APanel = lazy(() => import('./components/APanel'))
// Halaman Undangan dipecah ke chunk terpisah — pdf-lib & template baru dimuat saat tombol generate ditekan.
const DownloadProposal = lazy(() => import('./components/DownloadProposal'))
const DataUmatForm = lazy(() => import('./components/DataUmatForm'))
const DataUmatExport = lazy(() => import('./components/DataUmatExport'))
const UndanganGenerator = lazy(() => import('./components/UndanganGenerator'))
import { toImageKitUrl, filterHtmlImages } from './utils/imageUtils'
import { supabase, type SupabaseProposal, type SupabaseUndangan } from './services/supabase'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { normalizeSubMenuKey } from './utils/menuUtils'
import { siteSettingsService, type SiteSettings } from './services/siteSettings'

import type { EditorSaveData } from './components/AdminDashboard'
import { fetchFromGoogleScript, postToGoogleScript } from './services/googleScript'
import type { DataJemaat } from './types/dataUmat'


// Types
type Tab = 'Beranda' | 'Jadwal Ibadah' | 'Direktori' | 'Data Umat' | 'Download' | 'Login' 
  | 'PA' | 'PT' | 'GP' | 'PKB' | 'PKP' | 'PKLU' 
  | 'Germasa' | 'PEG' | 'Inforkom-Litbang' | 'APanel' | (string & {});


interface ContentBlock {
  type: 'text' | 'image';
  value: string;
}

interface PageContent {
  title: string;
  content: string;
  blocks?: ContentBlock[]; // Opsional untuk migrasi
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
  proposals: SupabaseProposal[]; // New field for shared proposal history
}

const DEFAULT_CONTENT: FullContent = {
  settings: {
    logo: "/LOGO_GPIB_BANDA_ACEH.png",
    title: "GPIB BANDA ACEH",
    berandaPdf: ""
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
    'Direktori': {
      title: 'Fungsionaris GPIB Banda Aceh',
      content: '<p>Informasi mengenai Fungsionaris (PHMJ, Pendeta, Majelis Jemaat), Pelayanan Kategorial (Pelkat), dan Komisi-Komisi di GPIB Banda Aceh.</p>'
    },
    'PHMJ': {
      title: 'Pelaksana Harian Majelis Jemaat (PHMJ)',
      content: '<p>Informasi mengenai Pelaksana Harian Majelis Jemaat (PHMJ) GPIB Banda Aceh.</p>'
    },
    'Pendeta': {
      title: 'Pendeta GPIB Banda Aceh',
      content: '<p>Informasi mengenai Pendeta GPIB Banda Aceh.</p>'
    },
    'Majelis Jemaat': {
      title: 'Majelis Jemaat GPIB Banda Aceh',
      content: '<p>Informasi mengenai Majelis Jemaat GPIB Banda Aceh.</p>'
    },
    'PA': {
      title: 'Pelayanan Anak (PA)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melaksanakan pelayanan kategorial kepada anak-anak jemaat dalam rentang usia sekolah minggu (0-12 tahun).</p><p><strong>Fungsi:</strong><br>1. Menyelenggarakan Ibadah Hari Minggu Pelayanan Anak (IHMPA).<br>2. Membina iman anak melalui pengajaran Alkitab yang kreatif dan kontekstual.<br>3. Mengembangkan potensi dan bakat anak dalam lingkungan gerejawi.</p>'
    },
    'PT': {
      title: 'Pelayanan Teruna (PT)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melayani dan membina kaum teruna atau remaja jemaat (usia 13-17 tahun).</p><p><strong>Fungsi:</strong><br>1. Menyelenggarakan Ibadah Hari Minggu Pelayanan Teruna (IHMPT).<br>2. Mendampingi remaja dalam masa transisi mencari jati diri dengan nilai-nilai Kristiani.<br>3. Membangun persekutuan yang akrab di antara teruna.</p>'
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
    'PKLU': {
      title: 'Persekutuan Kaum Lanjut Usia (PKLU)',
      content: '<p><strong>Tugas Pokok:</strong><br>Melaksanakan pelayanan dan pembinaan kepada kaum lanjut usia/pensiunan di jemaat.</p><p><strong>Fungsi:</strong><br>1. Memberikan perhatian dan pendampingan rohani kepada lansia jemaat.<br>2. Menyelenggarakan persekutuan dan kegiatan yang mendukung kesehatan serta kesejahteraan lansia.<br>3. Menjadi wadah berbagi pengalaman hidup iman dan kebijaksanaan antargenerasi.</p>'
    },
    'Germasa': {
      title: 'Germasa',
      content: '<p><strong>Tugas Pokok:</strong><br>Menangani urusan hubungan gereja dengan masyarakat, antarumat beragama, serta kelestarian lingkungan hidup.</p><p><strong>Fungsi:</strong><br>1. Membangun dialog dan kerjasama oikumenis serta antariman di Banda Aceh.<br>2. Melaksanakan aksi sosial dan advokasi terhadap isu-isu kemasyarakatan.<br>3. Mengedukasi jemaat dalam upaya pelestarian lingkungan hidup.</p>'
    },
    'PEG': {
      title: 'Komisi Pembangunan Ekonomi Gereja (PEG)',
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

// Interval polling sinkronisasi Google Drive (detik). Setiap pengunjung memicu
// request ke Apps Script, jadi interval harus cukup longgar agar hemat kuota.
const POLL_INTERVAL_NORMAL = 60_000; // tab aktif
const POLL_INTERVAL_ERROR = 120_000; // saat sinkron bermasalah
const POLL_INTERVAL_HIDDEN = 300_000; // tab tidak terlihat

function App() {
  const { user, profile, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!user;
  const [activeTab, setActiveTab] = useState<Tab>('Beranda')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  
  const [siteContent, setSiteContent] = useState<FullContent>(() => {
    const saved = localStorage.getItem('gpibSiteContent')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          ...DEFAULT_CONTENT,
          ...parsed,
          pages: { ...DEFAULT_CONTENT.pages, ...parsed.pages },
          proposals: parsed.proposals || []
        }
      } catch {
        return DEFAULT_CONTENT
      }
    }
    return DEFAULT_CONTENT
  })
  
  const [isLoading, setIsLoading] = useState(() => {
    // Pengunjung ulang dengan cache lokal langsung melihat konten tanpa menunggu
    // cap 2,5 dtk / fetch eksternal — sinkronisasi tetap berjalan di latar belakang.
    try {
      return !localStorage.getItem('gpibSiteContent')
    } catch {
      return true
    }
  })
  const [syncError, setSyncError] = useState(false)
  const [supabaseProposals, setSupabaseProposals] = useState<SupabaseProposal[]>([])
  const [supabaseUndangan, setSupabaseUndangan] = useState<SupabaseUndangan[]>([])
  
  // Editor states
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editLogo, setEditLogo] = useState('')
  const [editSiteTitle, setEditSiteTitle] = useState('')
  const [editBerandaPdf, setEditBerandaPdf] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showPdfReader, setShowPdfReader] = useState(false)


  // Data Jemaat Baru (sesuai spesifikasi dbase GPIB)
  // Load awal langsung dari localStorage via lazy initializer
  // (pola sama dengan siteContent) agar tidak ada setState di dalam effect.
  const [dataJemaatList, setDataJemaatList] = useState<DataJemaat[]>(() => {
    try {
      const saved = localStorage.getItem('gpibDataJemaat');
      if (saved) {
        const parsed = JSON.parse(saved) as DataJemaat[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* abaikan error parsing */ }
    return [];
  });
  const [editingJemaat, setEditingJemaat] = useState<DataJemaat | null>(null)
  const [isSubmittingJemaat, setIsSubmittingJemaat] = useState(false)
  const [userJemaatSearch, setUserJemaatSearch] = useState('')
  const [userJemaatResult, setUserJemaatResult] = useState<DataJemaat | null>(null)
  const [hasUserJemaatSearched, setHasUserJemaatSearched] = useState(false)
  const [showUserJemaatForm, setShowUserJemaatForm] = useState(false)
  const [userJemaatSubmitMessage, setUserJemaatSubmitMessage] = useState<string | null>(null)

  // Tutup menu otomatis setiap kali tab berubah — pola "adjust state during render"
  const [lastActiveTab, setLastActiveTab] = useState<Tab>('Beranda')
  if (activeTab !== lastActiveTab) {
    setLastActiveTab(activeTab)
    setIsMobileMenuOpen(false)
    setIsDropdownOpen(false)
  }

  // Reset logo lama jika masih pakai LOGO_GPIB.jpg
  useEffect(() => {
  const saved = localStorage.getItem('gpibSiteContent');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.settings?.logo === '/LOGO_GPIB.jpg') {
        parsed.settings.logo = '/LOGO_GPIB_BANDA_ACEH.png';
        localStorage.setItem('gpibSiteContent', JSON.stringify(parsed));
      }
    } catch { /* abaikan error parsing */ }
  }
}, []);

  // Refactor fetchData to be reusable for polling
  const fetchData = async (isSilent = false) => {
    if (!isSilent) console.log("Memulai pengambilan data dari Google Drive...");
    try {
      const data = await fetchFromGoogleScript() as Partial<FullContent>
      setSyncError(false)
      if (!isSilent) console.log("Data berhasil diambil dari Drive:", data);
      
      // SAFETY: hanya aplikasikan data dari Google jika BENAR-BENAR berisi record.
      // Objek kosong ({} dari spreadsheet kosong / backend rusak / anti-abuse)
      // TIDAK BOLEH menimpa konten lokal yang baru dipublikasikan pengguna.
      const hasPages = !!data.pages && Object.keys(data.pages).length > 0;
      const hasSettings = !!data.settings && Object.keys(data.settings).length > 0;
      const hasUmat = Array.isArray(data.umat) && data.umat.length > 0;

      if (hasPages || hasSettings || hasUmat) {
        const remotePages: Record<string, PageContent> = hasPages ? { ...data.pages } : {};
        Object.keys(remotePages).forEach(key => {
          const page = remotePages[key];
          if (page && !page.content && page.blocks) {
            page.content = page.blocks.map((b: ContentBlock) => {
              if (b.type === 'text') return `<p>${b.value.replace(/\n/g, '<br>')}</p>`;
              if (b.type === 'image') return `<div class="content-image-wrapper"><img src="${toImageKitUrl(b.value, 800)}" class="content-image" /></div>`;
              return '';
            }).join('');
          }
        });

        setSiteContent(prev => {
          const mergedSettings = hasSettings
            ? { ...DEFAULT_CONTENT.settings, ...prev.settings, ...data.settings }
            : { ...DEFAULT_CONTENT.settings, ...prev.settings };

          const mergedContent = {
            ...prev,
            settings: mergedSettings,
            pages: hasPages ? { ...DEFAULT_CONTENT.pages, ...remotePages } : prev.pages,
            umat: hasUmat ? (data.umat as UmatRecord[]) : prev.umat
          };

          const isSameUmat = JSON.stringify(prev.umat) === JSON.stringify(mergedContent.umat);
          const isSamePages = JSON.stringify(prev.pages) === JSON.stringify(mergedContent.pages);
          const isSameSettings = JSON.stringify(prev.settings) === JSON.stringify(mergedContent.settings);
          
          if (!isSameUmat || !isSamePages || !isSameSettings) {
            if (!isSilent) console.log("Mendapatkan data baru, memperbarui state...");
            localStorage.setItem('gpibSiteContent', JSON.stringify(mergedContent));
            return mergedContent;
          }
          return prev;
        });
      }
    } catch (error) {
      if (!isSilent) console.error("Gagal mengambil data dari Google Drive:", error)
      setSyncError(true)
    } finally {
      if (!isSilent) setIsLoading(false)
    }
  }

  // Fetch data on mount (sekali) + batasi loading screen agar tidak menunggu
  // fetch eksternal yang lambat. Konten cache langsung tampil, fetch di latar belakang.
  useEffect(() => {
    // Panggil async lewat timer agar tidak ada setState sinkron di body effect
    const initialTimer = setTimeout(() => { void fetchData() }, 0)
    const loadingCap = setTimeout(() => setIsLoading(false), 2500)
    return () => {
      clearTimeout(initialTimer)
      clearTimeout(loadingCap)
    }
  }, [])

  // Polling adaptif non-tumpang-tindih: poll berikutnya baru dijadwalkan SETELAH
  // poll sebelumnya selesai (Apps Script bisa lambat, ~10-25 dtk). Interval dinaikkan
  // dari 15 dtk karena SETIAP pengunjung memicu request ke Apps Script — polling
  // agresif cepat menghabiskan kuota server. Saat tab tersembunyi, polling dijeda.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      // Tab tidak terlihat: tidak ada gunanya sinkron di background
      if (document.hidden) {
        if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_HIDDEN)
        return
      }
      await fetchData(true)
      if (!cancelled) {
        timer = setTimeout(poll, syncError ? POLL_INTERVAL_ERROR : POLL_INTERVAL_NORMAL)
      }
    }
    timer = setTimeout(poll, syncError ? POLL_INTERVAL_ERROR : POLL_INTERVAL_NORMAL)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [syncError])

  const fetchSupabaseProposals = async () => {
    console.log('Memulai fetch proposal dari Supabase...');
    try {
      const { data, error } = await supabase
        .from('riwayat_download')
        .select('*')
        .order('no_urut', { ascending: false });
      
      if (error) {
        console.error('Error Supabase fetch:', error.message);
        // If it's a 404 or table not found, we should probably warn the user
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          console.error('PENTING: Tabel riwayat_download belum dibuat di Supabase!');
        }
      } else if (data) {
        console.log('Berhasil fetch Supabase:', data.length, 'data ditemukan');
        setSupabaseProposals(data);
      }
    } catch (err) {
      console.error('Exception saat fetch Supabase:', err);
    }
  };

  const fetchSupabaseUndangan = async () => {
    try {
      const { data, error } = await supabase
        .from('riwayat_undangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error Supabase fetch undangan:', error.message);
        if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('schema cache')) {
          console.error('PENTING: Tabel riwayat_undangan belum dibuat di Supabase! Jalankan supabase/migrations/20260910_create_riwayat_undangan.sql.');
        }
      } else if (data) {
        setSupabaseUndangan(data);
      }
    } catch (err) {
      console.error('Exception saat fetch Supabase undangan:', err);
    }
  };

  // Riwayat undangan + realtime Supabase hanya aktif saat tab Undangan dibuka —
  // hemat bandwidth & koneksi websocket untuk pengunjung yang tidak membutuhkannya.
  useEffect(() => {
    if (activeTab !== 'Undangan') return;

    const initialTimer = setTimeout(() => { void fetchSupabaseUndangan(); }, 0);
    const channel = supabase
      .channel('public:riwayat_undangan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riwayat_undangan' }, () => {
        void fetchSupabaseUndangan();
      })
      .subscribe();

    return () => {
      clearTimeout(initialTimer);
      void supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // Riwayat download + realtime Supabase hanya aktif saat tab Download dibuka —
  // hemat bandwidth & koneksi websocket untuk pengunjung yang tidak membutuhkannya.
  useEffect(() => {
    if (activeTab !== 'Download') return;

    // Timer 0 ms agar tidak ada setState sinkron di body effect (pola react-hooks)
    const initialTimer = setTimeout(() => { void fetchSupabaseProposals(); }, 0);
    const channel = supabase
      .channel('public:riwayat_download')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riwayat_download' }, (payload) => {
        console.log('Real-time change detected!', payload);
        void fetchSupabaseProposals();
      })
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Supabase channel');
      clearTimeout(initialTimer);
      void supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // Sinkronkan field editor saat tab berubah (hanya saat login) — pola "adjust state during render"
  const [lastEditorSyncKey, setLastEditorSyncKey] = useState('')
  const editorPageKey = normalizeSubMenuKey(activeTab) || activeTab
  const editorSyncKey = isLoggedIn ? `${activeTab}|${editorPageKey}` : ''
  if (isLoggedIn && editorSyncKey !== lastEditorSyncKey) {
    setLastEditorSyncKey(editorSyncKey)
    setEditSiteTitle(siteContent.settings?.title || '')
    setEditLogo(siteContent.settings?.logo || '')
    setEditBerandaPdf(siteContent.settings?.berandaPdf || '')

    const pageData = siteContent.pages?.[editorPageKey] || siteContent.pages?.[activeTab] || {
      title: editorPageKey === 'PHMJ' ? 'Pelaksana Harian Majelis Jemaat (PHMJ)' :
             editorPageKey === 'Pendeta' ? 'Pendeta GPIB Banda Aceh' :
             editorPageKey === 'Majelis Jemaat' ? 'Majelis Jemaat GPIB Banda Aceh' :
             editorPageKey === 'PA' ? 'Pelayanan Anak (PA)' :
             editorPageKey === 'PT' ? 'Pelayanan Teruna (PT)' :
             editorPageKey === 'GP' ? 'Gerakan Pemuda (GP)' :
             editorPageKey === 'PKB' ? 'Persekutuan Kaum Bapak (PKB)' :
             editorPageKey === 'PKP' ? 'Persekutuan Kaum Perempuan (PKP)' :
             editorPageKey === 'Germasa' ? 'Germasa' :
             editorPageKey === 'PEG' ? 'Komisi Pembangunan Ekonomi Gereja (PEG)' :
             editorPageKey === 'Inforkom-Litbang' ? 'Inforkom-Litbang' : activeTab,
      content: `<p>Informasi & Kegiatan ${activeTab} GPIB Banda Aceh.</p>`
    };

    setEditTitle(pageData.title || '')
    setEditContent(pageData.content || '')
  }

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const settings = await siteSettingsService.getSettings();
        setSiteContent(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            ...settings
          }
        }));
      } catch (err) {
        console.error('Gagal memuat setelan situs:', err);
      }
    };
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    const bg = siteContent?.settings?.siteBgColor || '#ffffff';
    document.body.style.backgroundColor = bg;
  }, [siteContent?.settings?.siteBgColor]);

  const handleSaveSettings = async (newSettings: SiteSettings) => {
    const updatedContent = {
      ...siteContent,
      settings: newSettings
    };

    setSiteContent(updatedContent);

    try {
      localStorage.setItem('gpibSiteContent', JSON.stringify(updatedContent));
      localStorage.setItem('gpib_site_settings', JSON.stringify(newSettings));
    } catch { /* abaikan error localStorage */ }

    await siteSettingsService.saveSettings(newSettings);

    try {
      await postToGoogleScript({ action: 'updateContent', data: updatedContent });
    } catch (err) {
      console.error('Gagal mempublikasi kustomisasi ke Google Drive:', err);
    }
  };

  // Sinkronkan activeTab dari URL (pola "adjust state during render")
  const [lastSyncPath, setLastSyncPath] = useState('')
  if (location.pathname !== lastSyncPath) {
    setLastSyncPath(location.pathname);
    if (location.pathname === '/admin/apanel' || location.pathname === '/admin/manage') {
      setActiveTab('APanel');
    } else if (location.pathname.startsWith('/admin/submenu/')) {
      const rawSubId = location.pathname.replace('/admin/submenu/', '');
      const subId = normalizeSubMenuKey(rawSubId);
      if (subId) setActiveTab(subId);
    }
  }

  // Redirect pengguna sub-menu dari /admin atau /login (hanya efek samping navigasi)
  useEffect(() => {
    if (isLoggedIn && (profile?.sub_menu || profile?.sub_menu_id) && (location.pathname === '/admin' || location.pathname === '/login')) {
      const userSubKey = normalizeSubMenuKey(profile?.sub_menu || profile?.sub_menu_id);
      if (userSubKey) {
        navigate(`/admin/submenu/${userSubKey}`);
      }
    }
  }, [location.pathname, isLoggedIn, profile, navigate])

  const handleLogout = async () => {
    await authLogout();
    setActiveTab('Beranda');
    navigate('/login');
  };

  const saveChanges = async (updatedData?: EditorSaveData) => {
    setIsSaving(true)
    
    const pageKey = normalizeSubMenuKey(activeTab) || activeTab;
    const finalTitle = updatedData?.title !== undefined ? updatedData.title : editTitle
    const finalContent = updatedData?.content !== undefined ? updatedData.content : editContent
    
    const newContent = {
      ...siteContent,
      settings: { ...siteContent.settings, title: editSiteTitle, logo: editLogo, berandaPdf: editBerandaPdf },
      pages: {
        ...siteContent.pages,
        [pageKey]: { title: finalTitle, content: finalContent }
      }
    }
    
    setSiteContent(newContent)
    localStorage.setItem('gpibSiteContent', JSON.stringify(newContent))

    try {
      await postToGoogleScript({ action: 'updateContent', data: newContent })
      if (updatedData) {
        alert('Perubahan berhasil disimpan secara lokal. Sinkronisasi ke Google Drive berjalan otomatis — mohon tunggu beberapa detik sebelum merefresh halaman.');
      }
    } catch (error) {
      console.error("Gagal menyimpan ke Google Drive:", error)
      alert('Gagal sinkron ke Google Drive. Perubahan tetap tersimpan secara lokal.');
    } finally {
      setIsSaving(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA UMAT HANDLERS (sesuai spesifikasi dbase GPIB)
  // ═══════════════════════════════════════════════════════════════

  const handleJemaatSubmit = async (data: DataJemaat) => {
    setIsSubmittingJemaat(true);
    try {
      const newRecord: DataJemaat = {
        ...data,
        id: editingJemaat?.id || 'verify_' + Date.now(),
        isPending: !isLoggedIn,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newList = editingJemaat
        ? dataJemaatList.map(j => j.id === editingJemaat.id ? newRecord : j)
        : [...dataJemaatList, newRecord];

      setDataJemaatList(newList);
      localStorage.setItem('gpibDataJemaat', JSON.stringify(newList));

      try {
        await postToGoogleScript({ action: 'updateDataJemaat', data: newList });
      } catch (err) {
        console.error('Gagal sync ke Google Drive:', err);
      }

      const successMsg = isLoggedIn
        ? 'Data jemaat berhasil disimpan!'
        : 'Data berhasil dikirim untuk di-verifikasi admin GPIB Banda Aceh. Jika telah diverifikasi, data akan ter-update ke Database GPIB.';

      if (isLoggedIn) {
        alert(successMsg);
        setEditingJemaat(null);
      } else {
        setUserJemaatSubmitMessage(successMsg);
        setShowUserJemaatForm(false);
      }
    } catch (error) {
      console.error('Gagal menyimpan data jemaat:', error);
      alert('Gagal menyimpan data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmittingJemaat(false);
    }
  };

  const handleDeleteJemaat = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data jemaat ini?')) return;
    const newList = dataJemaatList.filter(j => j.id !== id);
    setDataJemaatList(newList);
    localStorage.setItem('gpibDataJemaat', JSON.stringify(newList));
    try {
      await postToGoogleScript({ action: 'updateDataJemaat', data: newList });
      alert('Data jemaat berhasil dihapus.');
    } catch (err) {
      console.error('Gagal sync hapus ke Google Drive:', err);
    }
  };

  const handleApproveJemaat = async (jemaat: DataJemaat) => {
    // ID deterministik dari data sumber (bukan Date.now) agar render tetap murni
    const approved: DataJemaat = { ...jemaat, isPending: false, id: 'approved_' + (jemaat.id || 'x') };
    const newList = dataJemaatList
      .filter(j => j.nama_lengkap.toLowerCase() !== jemaat.nama_lengkap.toLowerCase())
      .concat(approved);
    setDataJemaatList(newList);
    localStorage.setItem('gpibDataJemaat', JSON.stringify(newList));
    try {
      await postToGoogleScript({ action: 'updateDataJemaat', data: newList });
      alert('Data jemaat berhasil diverifikasi.');
    } catch (err) {
      console.error('Gagal sync approve:', err);
    }
  };

  const handleRejectJemaat = async (id: string) => {
    if (!window.confirm('Yakin ingin menolak pengajuan ini?')) return;
    const newList = dataJemaatList.filter(j => j.id !== id);
    setDataJemaatList(newList);
    localStorage.setItem('gpibDataJemaat', JSON.stringify(newList));
    try {
      await postToGoogleScript({ action: 'updateDataJemaat', data: newList });
      alert('Pengajuan berhasil ditolak.');
    } catch (err) {
      console.error('Gagal sync reject:', err);
    }
  };

  const handleUserJemaatSearch = () => {
    if (!userJemaatSearch.trim()) return;
    const official = dataJemaatList.filter(j => !j.isPending);
    const found = official.find(j =>
      j.nama_lengkap.toLowerCase().includes(userJemaatSearch.toLowerCase())
    );
    setUserJemaatResult(found || null);
    setHasUserJemaatSearched(true);
    setShowUserJemaatForm(false);
    setUserJemaatSubmitMessage(null);
  };

  const renderDataUmat = () => {
    const officialJemaat = dataJemaatList.filter(j => !j.isPending);
    const pendingJemaat = dataJemaatList.filter(j => j.isPending);

    return (
      <div className="page-card">
        <h2>📋 Data Umat GPIB Banda Aceh</h2>

        {isLoggedIn ? (
          <div className="admin-data-section">
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '15px' }}>
                {editingJemaat ? '✏️ Edit Data Jemaat' : '➕ Tambah Data Jemaat Baru'}
              </h3>
              <DataUmatForm
                key={editingJemaat?.id || 'new'}
                initialData={editingJemaat || undefined}
                onSubmit={handleJemaatSubmit}
                onCancel={editingJemaat ? () => setEditingJemaat(null) : undefined}
                isSubmitting={isSubmittingJemaat}
              />
            </div>

            <div style={{ marginBottom: '40px' }}>
              <DataUmatExport jemaatList={dataJemaatList} />
            </div>

            <div className="admin-umat-list">
              <h3>📚 Daftar Data Jemaat ({officialJemaat.length} orang)</h3>
              <div className="table-responsive">
                <table className="umat-table admin-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Lengkap</th>
                      <th>Status</th>
                      <th>Sektor</th>
                      <th>No. HP</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officialJemaat.length > 0 ? officialJemaat.map((j, idx) => (
                      <tr key={j.id}>
                        <td>{idx + 1}</td>
                        <td>{j.nama_lengkap}</td>
                        <td>{j.status_warga}</td>
                        <td>{j.sektor_pelayanan || '-'}</td>
                        <td>{j.no_telepon || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-edit-small" onClick={() => { setEditingJemaat(j); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                            <button className="btn-delete-small" onClick={() => handleDeleteJemaat(j.id)}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} style={{ textAlign: 'center' }}>Belum ada data jemaat.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pendingJemaat.length > 0 && (
              <div className="admin-verification-list">
                <h3 style={{ color: 'var(--primary-color)' }}>⏳ Antrean Verifikasi ({pendingJemaat.length})</h3>
                <div className="table-responsive">
                  <table className="umat-table admin-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Status</th>
                        <th>Sektor</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingJemaat.map((j, idx) => (
                        <tr key={j.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{j.nama_lengkap}</td>
                          <td>{j.status_warga}</td>
                          <td>{j.sektor_pelayanan || '-'}</td>
                          <td>
                            <div className="table-actions">
                              <button className="btn-save" style={{ padding: '6px 15px', fontSize: '0.8rem' }} onClick={() => handleApproveJemaat(j)}>✅ Setuju</button>
                              <button className="btn-delete" style={{ padding: '6px 15px', fontSize: '0.8rem', marginLeft: '8px' }} onClick={() => handleRejectJemaat(j.id)}>❌ Tolak</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="user-data-section">
            <div className="user-search-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Cari Nama Jemaat..."
                value={userJemaatSearch}
                onChange={e => setUserJemaatSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUserJemaatSearch()}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <button className="btn-save" onClick={handleUserJemaatSearch} style={{ padding: '0 30px' }}>CARI</button>
            </div>

            {hasUserJemaatSearched && (
              <div className="search-results-section">
                {userJemaatResult ? (
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px', fontWeight: '600' }}>✅ Data ditemukan: {userJemaatResult.nama_lengkap}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Status: {userJemaatResult.status_warga} | Sektor: {userJemaatResult.sektor_pelayanan || '-'}</p>
                    <button className="btn-edit-small" style={{ marginTop: '10px' }} onClick={() => { setEditingJemaat(userJemaatResult); setShowUserJemaatForm(true); setUserJemaatSubmitMessage(null); }}>✏️ Revisi Data</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                    <p>Data Tidak Ditemukan</p>
                    <button className="btn-save" onClick={() => { setEditingJemaat(null); setShowUserJemaatForm(true); setUserJemaatSubmitMessage(null); }}>📝 Isi Data Mandiri</button>
                  </div>
                )}
              </div>
            )}

            {showUserJemaatForm && (
              <div style={{ marginTop: '30px' }}>
                <DataUmatForm
                  initialData={editingJemaat || undefined}
                  onSubmit={handleJemaatSubmit}
                  onCancel={() => { setShowUserJemaatForm(false); setEditingJemaat(null); }}
                  isSubmitting={isSubmittingJemaat}
                />
              </div>
            )}

            {userJemaatSubmitMessage && (
              <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #c8e6c9' }}>
                {userJemaatSubmitMessage}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // END NEW DATA UMAT
  // ═══════════════════════════════════════════════════════════════

  const handleAddProposalSupabase = async (pemohon: string, tujuanSurat: string, noUrut: number, nomorSurat: string) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const tanggalSurat = `${dd}/${mm}/${yyyy}`;

    const newRecord = {
      nomor_surat: nomorSurat,
      tujuan_surat: tujuanSurat,
      pemohon,
      tanggal_surat: tanggalSurat,
      no_urut: noUrut,
      link_download: '-'
    };

    const { data, error } = await supabase
      .from('riwayat_download')
      .insert([newRecord])
      .select();

    if (error) {
      console.error('Error adding proposal:', error);
      throw error;
    }
    return data;
  };

  const handleEditProposalSupabase = async (id: number, updates: Partial<SupabaseProposal>) => {
    const { data, error } = await supabase
      .from('riwayat_download')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      console.error('Error updating proposal:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Gagal memperbaharui data. Akses (RLS) di Supabase memblokir edit. Pastikan RLS diizinkan untuk UPDATE atau matikan RLS pada tabel riwayat_download di Supabase SQL Editor.');
    }
    await fetchSupabaseProposals();
  };

  const handleDeleteProposalSupabase = async (id: number) => {
    const { data, error } = await supabase
      .from('riwayat_download')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Gagal menghapus data. Akses (RLS) di Supabase memblokir hapus. Pastikan RLS diizinkan untuk DELETE atau matikan RLS pada tabel riwayat_download di Supabase SQL Editor.');
    }
    await fetchSupabaseProposals();
  };

  const handleAddUndanganSupabase = async (namaUndangan: string, pic: string, tanggalUndangan: string) => {
    const newRecord = {
      nama_undangan: namaUndangan,
      pic,
      tanggal_undangan: tanggalUndangan
    };

    const { data, error } = await supabase
      .from('riwayat_undangan')
      .insert([newRecord])
      .select();

    if (error) {
      console.error('Error adding undangan:', error);
      if (error.message.includes('schema cache') || error.message.includes('not found')) {
        throw new Error('Tabel riwayat_undangan belum ada di Supabase. Jalankan supabase/migrations/20260910_create_riwayat_undangan.sql di Supabase SQL Editor.');
      }
      throw error;
    }
    return data;
  };

  const handleDeleteUndanganSupabase = async (id: number) => {
    const { data, error } = await supabase
      .from('riwayat_undangan')
      .delete()
      .eq('id', id)
      .select();
    if (error) {
      console.error('Error deleting undangan:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Gagal menghapus data. Akses (RLS) di Supabase memblokir hapus. Pastikan RLS diizinkan untuk DELETE pada tabel riwayat_undangan di Supabase SQL Editor.');
    }
    await fetchSupabaseUndangan();
  };

  const handleEditUndanganSupabase = async (id: number, updates: Partial<SupabaseUndangan>) => {
    const { data, error } = await supabase
      .from('riwayat_undangan')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) {
      console.error('Error updating undangan:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Gagal memperbaharui data. Akses (RLS) di Supabase memblokir edit. Pastikan RLS diizinkan untuk UPDATE pada tabel riwayat_undangan di Supabase SQL Editor.');
    }
    await fetchSupabaseUndangan();
  };


  const renderPage = () => {
    if (activeTab === 'APanel' || location.pathname === '/admin/apanel') {
      return <APanel settings={siteContent.settings} onSaveSettings={handleSaveSettings} onLogout={handleLogout} />;
    }

    if (activeTab === 'Login' && !isLoggedIn) {
      return (
        <LoginForm onLoginSuccess={() => {
          setActiveTab('Beranda');
          navigate('/');
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

    if (activeTab === 'Undangan') {
      return (
        <UndanganGenerator
          isLoggedIn={isLoggedIn}
          undanganList={supabaseUndangan}
          onAddUndangan={handleAddUndanganSupabase}
          onEditUndangan={handleEditUndanganSupabase}
          onDeleteUndangan={handleDeleteUndanganSupabase}
        />
      )
    }

    // Custom menu page: render folder icons for the active custom menu
    if (activeCustomMenu) {
      return (
        <div className="page-card">
          <h2>📂 {activeCustomMenu.name}</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '25px' }}>
            Klik dua kali pada folder di bawah ini untuk mengakses file di Google Drive atau layanan drive lainnya.
          </p>
          {activeCustomMenu.items.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {activeCustomMenu.items.map(item => {
                const isItemLocked = item.isLocked === true;
                const isAdminUser = isLoggedIn;
                const locked = isItemLocked && !isAdminUser;

                if (locked) {
                  // Locked folder: non-admin user sees locked message on click
                  return (
                    <div
                      key={item.id}
                      onClick={() => alert('🔒 Folder ini dikunci oleh admin. Hubungi admin untuk membuka folder.')}
                      onDoubleClick={() => alert('🔒 Folder ini dikunci oleh admin. Hubungi admin untuk membuka folder.')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '24px 16px',
                        backgroundColor: '#fffbeb',
                        border: '1px dashed #f59e0b',
                        borderRadius: '12px',
                        color: '#92400e',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'not-allowed',
                        opacity: 0.8
                      }}
                    >
                      <span style={{ fontSize: '3rem', marginBottom: '10px', lineHeight: 1 }}>🔒</span>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', textAlign: 'center' }}>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '6px', color: '#b45309', textAlign: 'center' }}>Dikunci oleh admin</span>
                    </div>
                  );
                }

                // Unlocked folder (or admin user): normal behavior
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onDoubleClick={() => { window.open(item.url, '_blank'); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '24px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: '#1e293b',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ fontSize: '3rem', marginBottom: '10px', lineHeight: 1 }}>{isItemLocked ? '🔒' : '📂'}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem', textAlign: 'center' }}>{item.name}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📂</p>
              <p>Belum ada folder tersedia.</p>
            </div>
          )}
        </div>
      );
    }

    const pageKey = normalizeSubMenuKey(activeTab) || activeTab;
    const currentPage = siteContent.pages[pageKey] || siteContent.pages[activeTab] || {
      title: pageKey === 'PHMJ' ? 'Pelaksana Harian Majelis Jemaat (PHMJ)' :
             pageKey === 'Pendeta' ? 'Pendeta GPIB Banda Aceh' :
             pageKey === 'Majelis Jemaat' ? 'Majelis Jemaat GPIB Banda Aceh' :
             pageKey === 'PA' ? 'Pelayanan Anak (PA)' :
             pageKey === 'PT' ? 'Pelayanan Teruna (PT)' :
             pageKey === 'GP' ? 'Gerakan Pemuda (GP)' :
             pageKey === 'PKB' ? 'Persekutuan Kaum Bapak (PKB)' :
             pageKey === 'PKP' ? 'Persekutuan Kaum Perempuan (PKP)' :
             pageKey === 'Germasa' ? 'Germasa' :
             pageKey === 'PEG' ? 'Komisi Pembangunan Ekonomi Gereja (PEG)' :
             pageKey === 'Inforkom-Litbang' ? 'Inforkom-Litbang' : activeTab,
      content: `<p>Informasi & Kegiatan ${activeTab} GPIB Banda Aceh.</p>`
    };

    const canEditCurrentPage = isLoggedIn;

    if (activeTab === 'Beranda') {
      return (
        <div className="page-content">
          {!canEditCurrentPage ? (
            <div className="page-card">
              <h2>{currentPage.title}</h2>
              <div 
                className="content-body" 
                dangerouslySetInnerHTML={{ __html: filterHtmlImages(currentPage.content || '') }} 
              />
              
              {siteContent.settings.berandaPdf && (
                <div className="pdf-viewer-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  {!showPdfReader ? (
                    <button className="btn-save" onClick={() => setShowPdfReader(true)}>Read More (Buka PDF)</button>
                  ) : (
                    <div className="pdf-reader-container">
                      <button className="btn-delete" onClick={() => setShowPdfReader(false)} style={{ marginBottom: '10px' }}>Tutup PDF</button>
                      <iframe 
                        src={`${siteContent.settings.berandaPdf}#toolbar=0`} 
                        width="100%" 
                        height="600px" 
                        style={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        title="PDF Viewer"
                      ></iframe>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px', fontStyle: 'italic' }}>
                        Catatan: Download dinonaktifkan untuk pengunjung umum.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <AdminDashboard 
              initialTitle={editTitle || ''}
              initialContent={editContent || ''}
              initialBerandaPdf={editBerandaPdf || ''}
              onSave={(data: EditorSaveData) => {
                setEditTitle(data.title || '');
                setEditContent(data.content || '');
              }}
              onPublish={(data: EditorSaveData) => saveChanges(data)}
              isSaving={isSaving}
            />
          )}
        </div>
      )
    }

    return (
      <div className="page-content">
        {!canEditCurrentPage ? (
          <div className="page-card">
            <h2>{currentPage.title}</h2>
            <div 
              className="content-body" 
              dangerouslySetInnerHTML={{ __html: filterHtmlImages(currentPage.content || '') }} 
            />
          </div>
        ) : (
          <AdminDashboard 
            initialTitle={editTitle || ''}
            initialContent={editContent || ''}
            initialBerandaPdf={editBerandaPdf || ''}
            onSave={(data: EditorSaveData) => {
              setEditTitle(data.title || '');
              setEditContent(data.content || '');
            }}
            onPublish={(data: EditorSaveData) => saveChanges(data)}
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
          <img src={toImageKitUrl(siteContent?.settings?.logo || "/LOGO_GPIB_BANDA_ACEH.png", 400)} alt="Logo GPIB Banda Aceh" />
        </div>
        <p>Membuka situs GPIB Banda Aceh...</p>
      </div>
    )
  }

  // Custom menus with position-based navbar rendering
  const customMenus = siteContent.settings.customMenus?.filter(m => m.isActive !== false) || [];
  const getMenusAtPosition = (pos: string) => customMenus.filter(m => m.position === pos);

  /** Find which custom menu matches the activeTab by name */
  const activeCustomMenu = customMenus.find(m => m.name === activeTab);


  const headerBgImage = siteContent.settings.headerBgImage;
  const headerBgOverlay = siteContent.settings.headerBgOverlay || 'rgba(0,0,0,0.2)';
  const headerInlineStyle: React.CSSProperties = {
    fontFamily: siteContent.settings.headerFontFamily || undefined,
    backgroundImage: headerBgImage ? `linear-gradient(${headerBgOverlay}, ${headerBgOverlay}), url(${toImageKitUrl(headerBgImage)})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderBottom: `4px solid ${siteContent.settings.primaryColor || '#8b0000'}`,
  };

  const headerTitleStyle: React.CSSProperties = {
    fontFamily: siteContent.settings.headerFontFamily || undefined,
    fontSize: siteContent.settings.headerFontSize || undefined,
    color: headerBgImage ? '#ffffff' : (siteContent.settings.headerTextColor || undefined),
    textShadow: headerBgImage ? '0 2px 8px rgba(0,0,0,0.7)' : undefined,
  };

  // Custom CSS properties (--var) tidak termasuk tipe CSSProperties, jadi objek di-cast
  const navInlineStyle = {
    backgroundColor: siteContent.settings.navBgColor || undefined,
    fontFamily: siteContent.settings.navFontFamily || undefined,
    fontSize: siteContent.settings.navFontSize || undefined,
    fontWeight: siteContent.settings.navFontWeight || undefined,
    color: siteContent.settings.navTextColor || undefined,
    '--nav-bg': siteContent.settings.navBgColor || '#1b3a2a',
  } as React.CSSProperties;

  const appContainerStyle = {
    '--primary-color': siteContent.settings.primaryColor || '#8b0000',
    '--nav-bg': siteContent.settings.navBgColor || '#1b3a2a',
    '--bg-color': siteContent.settings.siteBgColor || '#ffffff',
    backgroundColor: siteContent.settings.siteBgColor || '#ffffff',
  } as React.CSSProperties;

  const renderMainLayout = () => (
    <div className="app-container" style={appContainerStyle}>
      {syncError && (
        <div style={{
          backgroundColor: '#fef3c7',
          color: '#92400e',
          borderBottom: '1px solid #fcd34d',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem',
          fontFamily: "'Inter', sans-serif",
        }}>
          <span>
            {isLoggedIn
              ? '⚠️ Sinkronisasi data dengan Google Drive gagal — konten mungkin tidak terbarui. Periksa deployment Google Apps Script.'
              : '⚠️ Data mungkin belum terbarui — gagal menyinkronkan dengan server.'}
          </span>
          <button
            onClick={() => setSyncError(false)}
            title="Tutup"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '1rem', fontWeight: 700, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
      )}
      <header className="header" style={headerInlineStyle}>
        <div className="logo-container">
          <img src={toImageKitUrl(siteContent.settings.logo, 400)} alt="Logo GPIB" />
        </div>
        <h1 style={headerTitleStyle}>{siteContent.settings.title}</h1>
      </header>

      <nav className="navbar" style={navInlineStyle}>
        <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'} Menu
        </div>
        <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li 
            className={activeTab === 'Beranda' ? 'active' : ''}
            onClick={() => { setActiveTab('Beranda'); setIsMobileMenuOpen(false); navigate('/'); }}
          >
            Beranda
          </li>

          {getMenusAtPosition('after-Beranda').map(m => (
            <li key={m.id} className={activeTab === m.name ? 'active' : ''}
              onClick={() => { setActiveTab(m.name); setIsMobileMenuOpen(false); navigate('/'); }}>
              📂 {m.name}
            </li>
          ))}

          <li 
            className={activeTab === 'Jadwal Ibadah' ? 'active' : ''}
            onClick={() => { setActiveTab('Jadwal Ibadah'); setIsMobileMenuOpen(false); navigate('/'); }}
          >
            Jadwal Ibadah
          </li>

          {getMenusAtPosition('after-Jadwal Ibadah').map(m => (
            <li key={m.id} className={activeTab === m.name ? 'active' : ''}
              onClick={() => { setActiveTab(m.name); setIsMobileMenuOpen(false); navigate('/'); }}>
              📂 {m.name}
            </li>
          ))}

          <li className={`dropdown ${['Direktori', 'PHMJ', 'Pendeta', 'Majelis Jemaat', 'PA', 'PT', 'GP', 'PKB', 'PKP', 'PKLU', 'Germasa', 'PEG', 'Inforkom-Litbang'].includes(activeTab) ? 'active' : ''} ${isDropdownOpen ? 'dropdown-open' : ''}`}>
            <span onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              Direktori {isDropdownOpen ? '▴' : '▾'}
            </span>
            <ul className="dropdown-menu">
              <li className="dropdown-submenu">
                <span onClick={(e) => { e.stopPropagation(); setActiveTab('Direktori'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>FUNGSIONARIS ▸</span>
                <ul className="submenu-list">
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PHMJ'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>PHMJ</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('Pendeta'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Pendeta</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('Majelis Jemaat'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Majelis Jemaat</li>
                </ul>
              </li>
              <li className="dropdown-submenu">
                <span>PELKAT ▸</span>
                <ul className="submenu-list">
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PA'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Pelayanan Anak (PA)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PT'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Pelayanan Teruna (PT)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('GP'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Gerakan Pemuda (GP)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PKB'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Persekutuan Kaum Bapak (PKB)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PKP'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Persekutuan Kaum Perempuan (PKP)</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PKLU'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Persekutuan Kaum Lanjut Usia (PKLU)</li>
                </ul>
              </li>
              <li className="dropdown-submenu">
                <span>KOMISI ▸</span>
                <ul className="submenu-list">
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('Germasa'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Germasa</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('PEG'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Komisi PEG</li>
                  <li onClick={(e) => { e.stopPropagation(); setActiveTab('Inforkom-Litbang'); setIsMobileMenuOpen(false); setIsDropdownOpen(false); navigate('/'); }}>Inforkom-Litbang</li>
                </ul>
              </li>
            </ul>
          </li>

          {getMenusAtPosition('after-Organisasi Gereja').map(m => (
            <li key={m.id} className={activeTab === m.name ? 'active' : ''}
              onClick={() => { setActiveTab(m.name); setIsMobileMenuOpen(false); navigate('/'); }}>
              📂 {m.name}
            </li>
          ))}

          <li 
            className={activeTab === 'Data Umat' ? 'active' : ''}
            onClick={() => { setActiveTab('Data Umat'); setIsMobileMenuOpen(false); navigate('/'); }}
          >
            Data Umat
          </li>

          {getMenusAtPosition('after-Data Umat').map(m => (
            <li key={m.id} className={activeTab === m.name ? 'active' : ''}
              onClick={() => { setActiveTab(m.name); setIsMobileMenuOpen(false); navigate('/'); }}>
              📂 {m.name}
            </li>
          ))}

          <li 
            className={activeTab === 'Download' ? 'active' : ''}
            onClick={() => { setActiveTab('Download'); setIsMobileMenuOpen(false); navigate('/'); }}
          >
            PROPOSAL
          </li>

          <li 
            className={activeTab === 'Undangan' ? 'active' : ''}
            onClick={() => { setActiveTab('Undangan'); setIsMobileMenuOpen(false); navigate('/'); }}
          >
            Undangan
          </li>

          {isLoggedIn ? (
            <>
              <li 
                className={activeTab === 'APanel' || location.pathname === '/admin/apanel' ? 'active' : ''}
                onClick={() => { setActiveTab('APanel'); setIsMobileMenuOpen(false); navigate('/admin/apanel'); }}
                style={{ color: '#facc15', fontWeight: 'bold' }}
              >
                ⚙️ A.Panel
              </li>
              <li 
                style={{ color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              >
                🚪 Logout Admin
              </li>
            </>
          ) : (
            <li 
              className={activeTab === 'Login' ? 'active' : ''} 
              onClick={() => { setActiveTab('Login'); setIsMobileMenuOpen(false); navigate('/login'); }}
            >
              Login
            </li>
          )}

          {getMenusAtPosition('after-Login').map(m => (
            <li key={m.id} className={activeTab === m.name ? 'active' : ''}
              onClick={() => { setActiveTab(m.name); setIsMobileMenuOpen(false); navigate('/'); }}>
              📂 {m.name}
            </li>
          ))}
        </ul>
      </nav>

      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="page-card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>⏳ Memuat halaman...</p>
            </div>
          }>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="footer">
        &copy; 2026 GPIB BANDA ACEH. All Rights Reserved.
      </footer>
    </div>
  );

  return (
    <Routes>
      {/* Route Login */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            renderMainLayout()
          )
        }
      />

      {/* Route A.Panel */}
      <Route
        path="/admin/apanel"
        element={
          <ProtectedRoute>
            {renderMainLayout()}
          </ProtectedRoute>
        }
      />

      {/* Legacy route /admin/manage mapped to /admin/apanel */}
      <Route path="/admin/manage" element={<Navigate to="/admin/apanel" replace />} />

      {/* Protected Routes untuk /admin/* */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            {renderMainLayout()}
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/submenu/:subMenuId"
        element={
          <ProtectedRoute>
            {renderMainLayout()}
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            {renderMainLayout()}
          </ProtectedRoute>
        }
      />

      {/* Fallback / Public Route */}
      <Route path="*" element={renderMainLayout()} />
    </Routes>
  );

}

export default App
