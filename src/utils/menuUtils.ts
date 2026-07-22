/**
 * Helper utilities for mapping sub-menu keys, slugs, and display names consistently.
 */

export function normalizeSubMenuKey(val: any): string {
  if (!val) return '';
  let str = '';
  if (typeof val === 'object') {
    str = String(val.slug || val.name || val.sub_menu_name || val.title || val.sub_menu_id || val.id || '');
  } else {
    str = String(val).trim();
  }
  
  const lower = str.toLowerCase();
  
  if (lower === 'pa' || lower.includes('pelayanan anak')) return 'PA';
  if (lower === 'pt' || lower.includes('pelayanan taruna')) return 'PT';
  if (lower === 'gp' || lower.includes('gerakan pemuda')) return 'GP';
  if (lower === 'pkb' || lower.includes('kaum bapak')) return 'PKB';
  if (lower === 'pkp' || lower.includes('kaum perempuan')) return 'PKP';
  if (lower.includes('germasa')) return 'GermasaLH';
  if (lower === 'pg' || lower.includes('pembangunan gereja')) return 'PG';
  if (lower.includes('inforkom') || lower.includes('litbang')) return 'Inforkom-Litbang';
  
  return str;
}

export function getSubMenuDisplayName(val: any): string {
  const normalized = normalizeSubMenuKey(val);
  switch (normalized) {
    case 'PA': return 'PA (Pelayanan Anak)';
    case 'PT': return 'PT (Pelayanan Taruna)';
    case 'GP': return 'GP (Gerakan Pemuda)';
    case 'PKB': return 'PKB (Persekutuan Kaum Bapak)';
    case 'PKP': return 'PKP (Persekutuan Kaum Perempuan)';
    case 'GermasaLH': return 'GermasaLH';
    case 'PG': return 'Komisi PG';
    case 'Inforkom-Litbang': return 'Inforkom-Litbang';
    default: return normalized || 'Admin';
  }
}
