import { supabase } from './supabase';
import { toImageKitUrl } from '../utils/imageUtils';

export interface CustomMenuItem {
  id: string;
  name: string;
  category: 'UTAMA' | 'PELKAT' | 'KOMISI';
  targetSlug: string;
  order?: number;
  isActive?: boolean;
}

export interface SiteSettings {
  logo: string;
  title: string;
  berandaPdf?: string;
  headerFontFamily?: string;
  headerFontSize?: string;
  headerTextColor?: string;
  headerBgImage?: string;
  headerBgOverlay?: string;
  headerHeight?: string;
  navFontFamily?: string;
  navFontSize?: string;
  navFontWeight?: string;
  navBgColor?: string;
  navTextColor?: string;
  primaryColor?: string;
  customMenus?: CustomMenuItem[];
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logo: '/LOGO_GPIB_BANDA_ACEH.png',
  title: 'GPIB BANDA ACEH',
  berandaPdf: '',
  headerFontFamily: "'Playfair Display', serif",
  headerFontSize: '3.2rem',
  headerTextColor: '#8b0000',
  headerBgImage: '',
  headerBgOverlay: 'rgba(0, 0, 0, 0.2)',
  headerHeight: 'auto',
  navFontFamily: "'Inter', sans-serif",
  navFontSize: '1rem',
  navFontWeight: '500',
  navBgColor: '#1b3a2a',
  navTextColor: '#ffffff',
  primaryColor: '#8b0000',
  customMenus: []
};

const LOCAL_STORAGE_KEY = 'gpib_site_settings';

export const siteSettingsService = {
  /**
   * Fetch site settings from localStorage / Supabase (with fallback to default values)
   */
  getSettings: async (): Promise<SiteSettings> => {
    // 1. Read from localStorage first for instant local cache
    let cachedSettings: Partial<SiteSettings> = {};
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        cachedSettings = JSON.parse(saved);
      } catch (e) {}
    }

    try {
      // 2. Try to sync from Supabase if table exists
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const remoteSettings: SiteSettings = {
          logo: toImageKitUrl(data.logo || cachedSettings.logo || DEFAULT_SITE_SETTINGS.logo),
          title: data.title || cachedSettings.title || DEFAULT_SITE_SETTINGS.title,
          berandaPdf: data.beranda_pdf || cachedSettings.berandaPdf || '',
          headerFontFamily: data.header_font_family || cachedSettings.headerFontFamily || DEFAULT_SITE_SETTINGS.headerFontFamily,
          headerFontSize: data.header_font_size || cachedSettings.headerFontSize || DEFAULT_SITE_SETTINGS.headerFontSize,
          headerTextColor: data.header_text_color || cachedSettings.headerTextColor || DEFAULT_SITE_SETTINGS.headerTextColor,
          headerBgImage: data.header_bg_image ? toImageKitUrl(data.header_bg_image) : (cachedSettings.headerBgImage || ''),
          headerBgOverlay: data.header_bg_overlay || cachedSettings.headerBgOverlay || DEFAULT_SITE_SETTINGS.headerBgOverlay,
          headerHeight: data.header_height || cachedSettings.headerHeight || DEFAULT_SITE_SETTINGS.headerHeight,
          navFontFamily: data.nav_font_family || cachedSettings.navFontFamily || DEFAULT_SITE_SETTINGS.navFontFamily,
          navFontSize: data.nav_font_size || cachedSettings.navFontSize || DEFAULT_SITE_SETTINGS.navFontSize,
          navFontWeight: data.nav_font_weight || cachedSettings.navFontWeight || DEFAULT_SITE_SETTINGS.navFontWeight,
          navBgColor: data.nav_bg_color || cachedSettings.navBgColor || DEFAULT_SITE_SETTINGS.navBgColor,
          navTextColor: data.nav_text_color || cachedSettings.navTextColor || DEFAULT_SITE_SETTINGS.navTextColor,
          primaryColor: data.primary_color || cachedSettings.primaryColor || DEFAULT_SITE_SETTINGS.primaryColor,
          customMenus: Array.isArray(data.custom_menus) ? data.custom_menus : (cachedSettings.customMenus || [])
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteSettings));
        return remoteSettings;
      }
    } catch (err) {
      console.warn('Unable to load site settings from Supabase, using local cache.', err);
    }

    return { ...DEFAULT_SITE_SETTINGS, ...cachedSettings };
  },

  /**
   * Save site settings to localStorage and Supabase
   */
  saveSettings: async (newSettings: SiteSettings): Promise<void> => {
    const cleanSettings: SiteSettings = {
      ...newSettings,
      logo: toImageKitUrl(newSettings.logo),
      headerBgImage: newSettings.headerBgImage ? toImageKitUrl(newSettings.headerBgImage) : ''
    };

    // Save to localStorage immediately so changes persist on reload
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanSettings));

    try {
      const dbPayload = {
        id: 1,
        title: cleanSettings.title,
        logo: cleanSettings.logo,
        beranda_pdf: cleanSettings.berandaPdf || '',
        header_font_family: cleanSettings.headerFontFamily,
        header_font_size: cleanSettings.headerFontSize,
        header_text_color: cleanSettings.headerTextColor,
        header_bg_image: cleanSettings.headerBgImage,
        header_bg_overlay: cleanSettings.headerBgOverlay,
        header_height: cleanSettings.headerHeight,
        nav_font_family: cleanSettings.navFontFamily,
        nav_font_size: cleanSettings.navFontSize,
        nav_font_weight: cleanSettings.navFontWeight,
        nav_bg_color: cleanSettings.navBgColor,
        nav_text_color: cleanSettings.navTextColor,
        primary_color: cleanSettings.primaryColor,
        custom_menus: cleanSettings.customMenus || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert([dbPayload], { onConflict: 'id' });

      if (error) {
        console.warn('Supabase site_settings upsert note:', error.message);
      }
    } catch (err: any) {
      console.warn('Saving to Supabase stored locally.', err?.message || err);
    }
  }
};
