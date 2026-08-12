import React, { useState } from 'react';
import HeaderAksi from './HeaderAksi';
import EditorUtama from './EditorUtama';
import SidebarSetelan from './SidebarSetelan';

/**
 * Data editor yang dikirim dari AdminDashboard ke App (onSave / onPublish).
 */
export interface EditorSaveData {
  title: string;
  content: string;
  label: string;
  jadwal: string;
  tautan: string;
  komentar: boolean;
  siteTitle: string;
  siteLogo: string;
  berandaPdf: string;
}

interface AdminDashboardProps {
  initialTitle: string;
  initialContent: string;
  initialSiteTitle: string;
  initialSiteLogo: string;
  initialBerandaPdf: string;
  onSave: (data: EditorSaveData) => void;
  onPublish: (data: EditorSaveData) => void;
  isSaving: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTitle, initialContent, 
  initialSiteTitle, initialSiteLogo, initialBerandaPdf,
  onSave, onPublish, isSaving
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [siteTitle, setSiteTitle] = useState(initialSiteTitle);
  const [siteLogo, setSiteLogo] = useState(initialSiteLogo);
  const [berandaPdf, setBerandaPdf] = useState(initialBerandaPdf);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Sidebar states
  const [label, setLabel] = useState('');
  const [jadwal, setJadwal] = useState('');
  const [tautan, setTautan] = useState('');
  const [komentar, setKomentar] = useState(true);

  // Sinkronkan state editor ketika props awal berubah (ganti tab) —
  // pakai pola "adjust state during render" agar tidak memicu cascading render.
  const [lastInitialKey, setLastInitialKey] = useState('');
  const initialKey = [initialTitle, initialContent, initialSiteTitle, initialSiteLogo, initialBerandaPdf].join('|');
  if (initialKey !== lastInitialKey) {
    setLastInitialKey(initialKey);
    setTitle(initialTitle);
    setContent(initialContent);
    setSiteTitle(initialSiteTitle);
    setSiteLogo(initialSiteLogo);
    setBerandaPdf(initialBerandaPdf);
  }

  const handlePublish = () => {
    onPublish({ title, content, label, jadwal, tautan, komentar, siteTitle, siteLogo, berandaPdf });
  };

  const handlePreview = () => {
    onSave({ title, content, label, jadwal, tautan, komentar, siteTitle, siteLogo, berandaPdf });
  };

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="dashboard-layout">
        <div className="editor-container">
          <EditorUtama 
            title={title} 
            setTitle={setTitle} 
            content={content} 
            setContent={setContent} 
            berandaPdf={berandaPdf}
          />
        </div>
        
        <div className="sidebar-container">
          <div className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '▶' : '◀'} Setelan
          </div>
          <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : 'closed'}`}>
            <SidebarSetelan 
              label={label} setLabel={setLabel}
              jadwal={jadwal} setJadwal={setJadwal}
              tautan={tautan} setTautan={setTautan}
              komentar={komentar} setKomentar={setKomentar}
              siteTitle={siteTitle} setSiteTitle={setSiteTitle}
              siteLogo={siteLogo} setSiteLogo={setSiteLogo}
              berandaPdf={berandaPdf} setBerandaPdf={setBerandaPdf}
            />
          </div>
        </div>
      </div>

      <HeaderAksi 
        onPublish={handlePublish} 
        onPreview={handlePreview} 
        isSaving={isSaving} 
      />
    </div>
  );
};

export default AdminDashboard;
