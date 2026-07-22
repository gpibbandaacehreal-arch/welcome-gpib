import { supabase } from './supabase';

export interface SubMenu {
  id: string | number;
  name?: string;
  slug?: string;
  title?: string;
  [key: string]: any;
}

export interface AdminProfile {
  id?: string;
  role: string; // 'super_admin'
  sub_menu_id: string | number | null;
  sub_menu?: SubMenu | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  profile?: AdminProfile | null;
}

export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  return {
    id: userId,
    role: 'super_admin',
    sub_menu_id: null,
    sub_menu: null
  };
}

export const authService = {
  login: async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
    try {
      const cleanUser = usernameOrEmail.trim();
      const cleanPassword = password.trim();
      const targetLower = cleanUser.toLowerCase();

      // Checks for Super Admin credentials: username admingpib / admingpib@gpib.org & password admin123
      const isSuperAdminUser = targetLower === 'admingpib' || targetLower === 'admingpib@gpib.org';
      
      if (isSuperAdminUser && cleanPassword === 'admin123') {
        const superProfile: AdminProfile = {
          id: 'super_admin_1',
          role: 'super_admin',
          sub_menu_id: null,
          sub_menu: null
        };
        localStorage.setItem('isGPBAdmin', 'true');
        localStorage.setItem('adminToken', 'super_admin_active_token');
        localStorage.setItem('adminProfile', JSON.stringify(superProfile));

        return {
          success: true,
          user: { id: 'super_admin_1', email: 'admingpib@gpib.org' },
          profile: superProfile,
        };
      }

      // Secondary check via Supabase Auth for admingpib@gpib.org
      if (isSuperAdminUser) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'admingpib@gpib.org',
          password: cleanPassword,
        });

        if (!error && data?.user) {
          const superProfile: AdminProfile = {
            id: data.user.id,
            role: 'super_admin',
            sub_menu_id: null,
            sub_menu: null
          };
          localStorage.setItem('isGPBAdmin', 'true');
          localStorage.setItem('adminToken', data.session?.access_token || 'true');
          localStorage.setItem('adminProfile', JSON.stringify(superProfile));

          return {
            success: true,
            token: data.session?.access_token,
            user: data.user,
            profile: superProfile,
          };
        }
      }

      return {
        success: false,
        message: 'Username atau password yang Anda masukkan salah. Hanya Super Admin (admingpib) yang memiliki hak akses.',
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err?.message || 'Gagal menghubungkan ke server. Periksa koneksi internet Anda.',
      };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('isGPBAdmin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminProfile');
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('isGPBAdmin') === 'true';
  },

  getProfile: (): AdminProfile | null => {
    const raw = localStorage.getItem('adminProfile');
    return raw ? JSON.parse(raw) : { role: 'super_admin', sub_menu_id: null };
  }
};
