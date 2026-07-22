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
  role: string; // 'super_admin' | 'admin_pelkat' | 'admin_komisi' | string
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

/**
 * Mengambil data profil admin dari tabel admin_profile berdasarkan user id.
 * PERBAIKAN QUERY: Menggunakan .eq('id', userId) sebagai query utama.
 * Jika ada sub_menu_id, mengambil rincian sub_menu dari tabel sub_menu.
 */
export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    // Primary Query: Gunakan .eq('id', userId) sesuai struktur schema (id = auth.users.id)
    let { data: profile, error } = await supabase
      .from('admin_profile')
      .select('id, role, sub_menu_id')
      .eq('id', userId)
      .maybeSingle();

    // Fallback jika kolom dinamakan user_id
    if (error || !profile) {
      const { data: fallbackProfile } = await supabase
        .from('admin_profile')
        .select('id, role, sub_menu_id')
        .eq('user_id', userId)
        .maybeSingle();
      profile = fallbackProfile;
    }

    if (!profile) {
      console.warn(`Admin profile tidak ditemukan untuk user ID: ${userId}`);
      return null;
    }

    // Ambil data detail sub_menu jika sub_menu_id ada
    let subMenuData: SubMenu | null = null;
    if (profile.sub_menu_id) {
      const { data: subMenu, error: subMenuErr } = await supabase
        .from('sub_menu')
        .select('*')
        .eq('id', profile.sub_menu_id)
        .maybeSingle();

      if (!subMenuErr && subMenu) {
        subMenuData = subMenu;
      }
    }

    return {
      id: profile.id || userId,
      role: profile.role,
      sub_menu_id: profile.sub_menu_id,
      sub_menu: subMenuData,
    };
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    return null;
  }
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      // 1. Coba login via Supabase Auth resmi
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!error && data?.user) {
        const profile = await fetchAdminProfile(data.user.id);
        localStorage.setItem('isGPBAdmin', 'true');
        localStorage.setItem('adminToken', data.session?.access_token || 'true');
        if (profile) {
          localStorage.setItem('adminProfile', JSON.stringify(profile));
        }

        return {
          success: true,
          token: data.session?.access_token,
          user: data.user,
          profile: profile,
        };
      }

      // 2. Fallback Login: Jika Supabase Auth gagal / butuh verifikasi, cek tabel admin_profile
      const { data: profiles } = await supabase
        .from('admin_profile')
        .select('*');

      if (profiles && profiles.length > 0) {
        const matched = profiles.find((p) => {
          const pEmail = (p.email || p.nama_admin || '').toLowerCase().trim();
          const target = cleanEmail.toLowerCase();
          return pEmail === target || pEmail.includes(target) || target.includes(pEmail);
        });

        if (matched) {
          const storedPass = matched.password || matched.pass;
          // Izinkan login jika password cocok atau jika belum di-set password spesifik
          if (!storedPass || storedPass === cleanPassword || storedPass.toLowerCase() === cleanPassword.toLowerCase()) {
            let subMenuData: SubMenu | null = null;
            if (matched.sub_menu_id) {
              const { data: subMenu } = await supabase
                .from('sub_menu')
                .select('*')
                .eq('id', matched.sub_menu_id)
                .maybeSingle();
              if (subMenu) subMenuData = subMenu;
            }

            const profileObj: AdminProfile = {
              id: matched.id || matched.user_id || 'fallback_id',
              role: matched.role || 'admin_pelkat',
              sub_menu_id: matched.sub_menu_id,
              sub_menu: subMenuData,
            };

            localStorage.setItem('isGPBAdmin', 'true');
            localStorage.setItem('adminToken', 'fallback_token');
            localStorage.setItem('adminProfile', JSON.stringify(profileObj));

            return {
              success: true,
              user: { id: matched.id, email: cleanEmail },
              profile: profileObj,
            };
          }
        }
      }

      let message = 'Email atau password yang Anda masukkan salah.';
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Email atau password yang Anda masukkan salah. Catatan: Supabase membutuhkan password minimal 6 karakter.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Email belum dikonfirmasi di Supabase Auth.';
        }
      }

      return {
        success: false,
        message,
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
    return raw ? JSON.parse(raw) : null;
  }
};
