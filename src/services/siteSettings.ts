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
   * Fetch site settings from Supabase (with fallback to localStorage / default values)
   */
  getSettings: async (): Promise<SiteSettings> => {
    try {
      // 1. Try to load from Supabase site_settings table
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        const settings: SiteSettings = {
          logo: toImageKitUrl(data.logo || DEFAULT_SITE_SETTINGS.logo),
          title: data.title || DEFAULT_SITE_SETTINGS.title,
          berandaPdf: data.beranda_pdf || '',
          headerFontFamily: data.header_font_family || DEFAULT_SITE_SETTINGS.headerFontFamily,
          headerFontSize: data.header_font_size || DEFAULT_SITE_SETTINGS.headerFontSize,
          headerTextColor: data.header_text_color || DEFAULT_SITE_SETTINGS.headerTextColor,
          headerBgImage: data.header_bg_image ? toImageKitUrl(data.header_bg_image) : '',
          headerBgOverlay: data.header_bg_overlay || DEFAULT_SITE_SETTINGS.headerBgOverlay,
          headerHeight: data.header_height || DEFAULT_SITE_SETTINGS.headerHeight,
          navFontFamily: data.nav_font_family || DEFAULT_SITE_SETTINGS.navFontFamily,
          navFontSize: data.nav_font_size || DEFAULT_SITE_SETTINGS.navFontSize,
          navFontWeight: data.nav_font_weight || DEFAULT_SITE_SETTINGS.navFontWeight,
          navBgColor: data.nav_bg_color || DEFAULT_SITE_SETTINGS.navBgColor,
          navTextColor: data.nav_text_color || DEFAULT_SITE_SETTINGS.navTextColor,
          primaryColor: data.primary_color || DEFAULT_SITE_SETTINGS.primaryColor,
          customMenus: Array.isArray(data.custom_menus) ? data.custom_menus : []
        };
        // Backup to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        return settings;
      }
    } catch (err) {
      console.warn('Unable to load site settings from Supabase, falling back to local cache.', err);
    }

    // 2. Fallback to localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SITE_SETTINGS, ...parsed };
      } catch (e) {
        // ignore
      }
    }

    return DEFAULT_SITE_SETTINGS;
  },

  /**
   * Save site settings to Supabase and update localStorage
   */
  saveSettings: async (newSettings: SiteSettings): Promise<void> => {
    // Process all images through ImageKit Proxy
    const cleanSettings: SiteSettings = {
      ...newSettings,
      logo: toImageKitUrl(newSettings.logo),
      headerBgImage: newSettings.headerBgImage ? toImageKitUrl(newSettings.headerBgImage) : ''
    };

    // Save to localStorage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanSettings));

    try {
      // Upsert to Supabase site_settings table
      const dbPayload = {
        id: 'default',
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
        console.warn('Supabase upsert warning for site_settings:', error.message);
      }
    } catch (err: any) {
      console.warn('Saving to Supabase failed, changes stored locally.', err?.message || err);
    }
  }
};
