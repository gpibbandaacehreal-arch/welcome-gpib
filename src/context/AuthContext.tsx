import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { authService, fetchAdminProfile, type AdminProfile, type AuthResponse } from '../services/auth';

export interface LocalUser {
  id: string;
  email: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | LocalUser | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkLocalAuth = useCallback(() => {
    if (authService.isAuthenticated()) {
      const storedProfile = authService.getProfile();
      setUser({ id: storedProfile?.id || 'super_admin_1', email: 'admingpib@gpib.org' });
      setProfile(storedProfile || { role: 'super_admin', sub_menu_id: null });
      return true;
    }
    return false;
  }, []);

  const loadUserProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      if (!checkLocalAuth()) {
        setProfile(null);
      }
      return;
    }

    try {
      const adminProfile = await fetchAdminProfile(currentUser.id);
      setProfile(adminProfile);
    } catch (err) {
      console.error('Error fetching admin profile in AuthContext:', err);
      if (!checkLocalAuth()) {
        setProfile(null);
      }
    }
  }, [checkLocalAuth]);

  useEffect(() => {
    // Baca state autentikasi lokal TANPA setState sinkron di body effect;
    // state hanya di-set di dalam callback async di bawah ini.
    const storedProfile = authService.isAuthenticated() ? (authService.getProfile() || null) : null;

    const applyInitialAuth = (session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        void loadUserProfile(currentUser).finally(() => setIsLoading(false));
      } else {
        if (storedProfile) {
          setUser({ id: storedProfile.id || 'super_admin_1', email: 'admingpib@gpib.org' });
          setProfile(storedProfile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applyInitialAuth(session);
    }).catch((err) => {
      // Jika getSession gagal (mis. jaringan), tetap terapkan auth lokal agar app tidak stuck
      console.error('Gagal mengambil session awal:', err);
      applyInitialAuth(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser);
      } else {
        if (!checkLocalAuth()) {
          setUser(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkLocalAuth, loadUserProfile]);

  const login = async (usernameOrEmail: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    const res = await authService.login(usernameOrEmail, password);
    if (res.success) {
      if (res.user) {
        setUser(res.user);
      } else {
        setUser({ id: 'super_admin_1', email: 'admingpib@gpib.org' });
      }
      setProfile(res.profile || { role: 'super_admin', sub_menu_id: null });
    }
    setIsLoading(false);
    return res;
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const refreshProfile = async () => {
    if (user && 'id' in user && user.id !== 'super_admin_1') {
      await loadUserProfile(user as User);
    } else {
      checkLocalAuth();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook untuk mengonsumsi context, bukan komponen UI
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
