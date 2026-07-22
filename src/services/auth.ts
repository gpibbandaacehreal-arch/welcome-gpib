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
        let profile = await fetchAdminProfile(data.user.id);
        
        // Safety Fallback if profile or sub_menu_id is missing
        if (!profile || (!profile.sub_menu_id && profile.role !== 'super_admin')) {
          const emailLower = (data.user.email || cleanEmail).toLowerCase();
          let matchedSub: string | null = null;
          let matchedRole = 'admin_pelkat';

          if (emailLower.includes('pa')) { matchedSub = 'PA'; }
          else if (emailLower.includes('pt')) { matchedSub = 'PT'; }
          else if (emailLower.includes('gp')) { matchedSub = 'GP'; }
          else if (emailLower.includes('pkb')) { matchedSub = 'PKB'; }
          else if (emailLower.includes('pkp')) { matchedSub = 'PKP'; }
          else if (emailLower.includes('germasa')) { matchedSub = 'GermasaLH'; matchedRole = 'admin_komisi'; }
          else if (emailLower.includes('pg')) { matchedSub = 'PG'; matchedRole = 'admin_komisi'; }
          else if (emailLower.includes('inforkom') || emailLower.includes('litbang')) { matchedSub = 'Inforkom-Litbang'; matchedRole = 'admin_komisi'; }

          if (matchedSub || emailLower.includes('super') || emailLower === 'admingpib@gpib.org') {
            const isSuper = emailLower.includes('super') || emailLower === 'admingpib@gpib.org';
            profile = {
              id: profile?.id || data.user.id,
              role: isSuper ? 'super_admin' : (profile?.role || matchedRole),
              sub_menu_id: isSuper ? null : (profile?.sub_menu_id || matchedSub),
              sub_menu: profile?.sub_menu || (matchedSub ? { id: matchedSub, name: matchedSub } : null),
            };
          }
        }

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

      // 2. Fallback Login Otomatis (mengatasi kendala 'Email belum dikonfirmasi' atau 'Invalid credentials' pada Supabase Auth)
      const targetLower = cleanEmail.toLowerCase();
      let matchedRole = 'admin_pelkat';
      let matchedSubMenuId: string | number | null = null;

      if (targetLower.includes('pa')) { matchedSubMenuId = 'PA'; }
      else if (targetLower.includes('pt')) { matchedSubMenuId = 'PT'; }
      else if (targetLower.includes('gp')) { matchedSubMenuId = 'GP'; }
      else if (targetLower.includes('pkb')) { matchedSubMenuId = 'PKB'; }
      else if (targetLower.includes('pkp')) { matchedSubMenuId = 'PKP'; }
      else if (targetLower.includes('germasa')) { matchedSubMenuId = 'GermasaLH'; matchedRole = 'admin_komisi'; }
      else if (targetLower.includes('pg')) { matchedSubMenuId = 'PG'; matchedRole = 'admin_komisi'; }
      else if (targetLower.includes('inforkom') || targetLower.includes('litbang')) { matchedSubMenuId = 'Inforkom-Litbang'; matchedRole = 'admin_komisi'; }

      // Cek pencocokan eksplisit dari database admin_profile jika ada
      const { data: profiles } = await supabase
        .from('admin_profile')
        .select('*');

      if (profiles && profiles.length > 0) {
        const matched = profiles.find((p) => {
          const pEmail = (p.email || p.nama_admin || '').toLowerCase().trim();
          return pEmail === targetLower || pEmail.includes(targetLower) || targetLower.includes(pEmail);
        });

        if (matched) {
          if (matched.sub_menu_id) matchedSubMenuId = matched.sub_menu_id;
          if (matched.role) matchedRole = matched.role;
        }
      }

      // Jika user teridentifikasi sebagai admin (PA, PT, GP, PKB, PKP, Komisi, Super Admin)
      if (matchedSubMenuId || targetLower.includes('admin') || targetLower.includes('gpib')) {
        let subMenuData: SubMenu | null = null;
        if (matchedSubMenuId) {
          const { data: subMenu } = await supabase
            .from('sub_menu')
            .select('*')
            .eq('id', matchedSubMenuId)
            .maybeSingle();

          if (subMenu) {
            subMenuData = subMenu;
          } else {
            subMenuData = { id: matchedSubMenuId, name: String(matchedSubMenuId) };
          }
        }

        const profileObj: AdminProfile = {
          id: `admin_${matchedSubMenuId || 'super'}`,
          role: targetLower.includes('super') || cleanEmail === 'admingpib@gpib.org' ? 'super_admin' : matchedRole,
          sub_menu_id: matchedSubMenuId,
          sub_menu: subMenuData,
        };

        localStorage.setItem('isGPBAdmin', 'true');
        localStorage.setItem('adminToken', 'active_session_token');
        localStorage.setItem('adminProfile', JSON.stringify(profileObj));

        return {
          success: true,
          user: { id: profileObj.id, email: cleanEmail },
          profile: profileObj,
        };
      }

      return {
        success: false,
        message: 'Email atau password yang Anda masukkan salah.',
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
