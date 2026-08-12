/**
 * Helper utilities for mapping sub-menu keys, slugs, and display names consistently.
 */

/**
 * Tipe input yang diterima oleh fungsi-fungsi mapping sub-menu:
 * bisa berupa slug/string langsung, atau objek sub-menu dari Supabase.
 */
export type SubMenuKeyInput =
  | string
  | number
  | null
  | undefined
  | {
      id?: string | number | null;
      slug?: string;
      name?: string;
      sub_menu_name?: string;
      title?: string;
    };

export function normalizeSubMenuKey(val: SubMenuKeyInput): string {
  if (!val) return '';
  
  let rawStr: string;
  if (typeof val === 'object') {
    const idStr = String(val.id || '').trim();
    if (['pa', 'pt', 'gp', 'pkb', 'pkp', 'germasalh', 'pg', 'inforkom-litbang'].includes(idStr.toLowerCase())) {
      const idLower = idStr.toLowerCase();
      if (idLower === 'pa') return 'PA';
      if (idLower === 'pt') return 'PT';
      if (idLower === 'gp') return 'GP';
      if (idLower === 'pkb') return 'PKB';
      if (idLower === 'pkp') return 'PKP';
      if (idLower === 'germasalh') return 'GermasaLH';
      if (idLower === 'pg') return 'PG';
      if (idLower === 'inforkom-litbang') return 'Inforkom-Litbang';
    }
    rawStr = `${val.id || ''} ${val.slug || ''} ${val.name || ''} ${val.sub_menu_name || ''} ${val.title || ''}`;
  } else {
    rawStr = String(val).trim();
  }

  // URL decode if needed (e.g., Pelkat%20/%20Komisi%20PA)
  try {
    rawStr = decodeURIComponent(rawStr);
  } catch { /* abaikan error decode */ }

  const lower = rawStr.toLowerCase();

  if (/\bpa\b/i.test(lower) || lower.includes('pelayanan anak')) return 'PA';
  if (/\bpt\b/i.test(lower) || lower.includes('pelayanan taruna')) return 'PT';
  if (/\bgp\b/i.test(lower) || lower.includes('gerakan pemuda')) return 'GP';
  if (/\bpkb\b/i.test(lower) || lower.includes('kaum bapak')) return 'PKB';
  if (/\bpkp\b/i.test(lower) || lower.includes('kaum perempuan')) return 'PKP';
  if (lower.includes('germasa')) return 'GermasaLH';
  if (/\bpg\b/i.test(lower) || lower.includes('pembangunan gereja')) return 'PG';
  if (lower.includes('inforkom') || lower.includes('litbang')) return 'Inforkom-Litbang';

  return rawStr;
}

export function getSubMenuDisplayName(val: SubMenuKeyInput): string {
  const normalized = normalizeSubMenuKey(val);
  switch (normalized) {
    case 'PA': return 'PA';
    case 'PT': return 'PT';
    case 'GP': return 'GP';
    case 'PKB': return 'PKB';
    case 'PKP': return 'PKP';
    case 'GermasaLH': return 'GermasaLH';
    case 'PG': return 'PG';
    case 'Inforkom-Litbang': return 'Inforkom-Litbang';
    default: return normalized || 'Admin';
  }
}
