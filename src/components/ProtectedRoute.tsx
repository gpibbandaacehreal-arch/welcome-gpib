import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeSubMenuKey } from '../utils/menuUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredSubMenuId?: string | number;
}

/**
 * Komponen Proteksi Route untuk area /admin/*
 * 1. Menolak user yang belum login (redirect ke /login)
 * 2. Mengizinkan super_admin membuka semua route /admin
 * 3. Membatasi admin_pelkat & admin_komisi hanya pada sub_menu_id / sub_menu miliknya
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredSubMenuId }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  const params = useParams<{ subMenuId?: string; tab?: string }>();

  // 0. Tampilkan loading spinner saat memverifikasi auth & profile dari Supabase
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1a365d',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>Memverifikasi sesi & hak akses admin...</p>
      </div>
    );
  }

  // 1. Belum login -> Redirect ke /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = profile?.role;
  const userSubKey = normalizeSubMenuKey(profile?.sub_menu || profile?.sub_menu_id);

  // 2. Role = super_admin -> Bebas akses ke semua /admin/*
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  // 3. Role = admin_pelkat atau admin_komisi -> Hanya izinkan sub_menu miliknya
  if (role === 'admin_pelkat' || role === 'admin_komisi') {
    const currentTarget = requiredSubMenuId || params.subMenuId || params.tab;

    if (currentTarget && userSubKey) {
      const targetSubKey = normalizeSubMenuKey(currentTarget);
      const isMatch = targetSubKey.toLowerCase() === userSubKey.toLowerCase();

      // Jika mencoba membuka sub_menu admin lain -> Redirect balik ke miliknya
      if (!isMatch) {
        return <Navigate to={`/admin/submenu/${userSubKey}`} replace />;
      }
    }

    return <>{children}</>;
  }

  // Default Fallback jika profile/role belum diset
  return <>{children}</>;
};

export default ProtectedRoute;
