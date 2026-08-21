import React, { useState } from 'react';
import HeaderAksi from './HeaderAksi';
import EditorUtama from './EditorUtama';

/**
 * Data editor yang dikirim dari AdminDashboard ke App (onSave / onPublish).
 * Sidebar settings (siteTitle, siteLogo, berandaPdf, label, jadwal, tautan, komentar)
 * sudah dipindahkan ke A.Panel.
 */
export interface EditorSaveData {
  title: string;
  content: string;
}

interface AdminDashboardProps {
  initialTitle: string;
  initialContent: string;
  initialBerandaPdf?: string;
  onSave: (data: EditorSaveData) => void;
  onPublish: (data: EditorSaveData) => void;
  isSaving: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTitle, initialContent,
  initialBerandaPdf,
  onSave, onPublish, isSaving
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // Sinkronkan state editor ketika props awal berubah (ganti tab) —
  // pakai pola "adjust state during render" agar tidak memicu cascading render.
  const [lastInitialKey, setLastInitialKey] = useState('');
  const initialKey = `${initialTitle}|${initialContent}`;
  if (initialKey !== lastInitialKey) {
    setLastInitialKey(initialKey);
    setTitle(initialTitle);
    setContent(initialContent);
  }

  const handlePublish = () => {
    onPublish({ title, content });
  };

  const handlePreview = () => {
    onSave({ title, content });
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-layout">
        <div className="editor-container">
          <EditorUtama 
            title={title} 
            setTitle={setTitle} 
            content={content} 
            setContent={setContent} 
            berandaPdf={initialBerandaPdf}
          />
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
