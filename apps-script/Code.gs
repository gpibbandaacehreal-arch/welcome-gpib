/**
 * ============================================================
 * GPIB Banda Aceh — Backend Google Apps Script
 * ============================================================
 * Backend ini dipanggil oleh frontend React (src/services/googleScript.ts):
 *  - GET  ?t=<timestamp>  → mengembalikan { settings, pages, umat }
 *  - POST body JSON       → action "updateContent" (simpan penuh)
 *                         → action "updateUmat"   (simpan daftar umat)
 *
 * Penyimpanan: Google Spreadsheet dengan 3 tab:
 *   Settings | Pages | Umat
 *
 * Cara pakai:
 *   1. Buat Google Spreadsheet, salin ID-nya (bagian panjang di URL
 *      antara /d/ dan /edit), tempel ke CONFIG.SPREADSHEET_ID di bawah.
 *   2. Salin seluruh file ini ke script.google.com (Project baru).
 *   3. Jalankan fungsi `setupSheets()` SEKALI untuk membuat tab & otorisasi.
 *   4. Deploy → New deployment → Web app → Execute as: Me →
 *      Who has access: Anyone → Deploy.
 *   5. Salin URL /exec, tempel ke GOOGLE_SCRIPT_URL di
 *      src/services/googleScript.ts (frontend).
 */

var CONFIG = {
  // GANTI: ID Spreadsheet (lihat URL spreadsheet: .../d/INI_ID_NYA/edit)
  SPREADSHEET_ID: 'ISI_DENGAN_ID_SPREADSHEET',
  SHEET_SETTINGS: 'Settings',
  SHEET_PAGES: 'Pages',
  SHEET_UMAT: 'Umat'
};

/** Semua kunci setting yang dikenal frontend (SiteSettings). */
var SETTING_KEYS = [
  'logo', 'title', 'berandaPdf',
  'headerFontFamily', 'headerFontSize', 'headerTextColor',
  'headerBgImage', 'headerBgOverlay', 'headerHeight',
  'navFontFamily', 'navFontSize', 'navFontWeight',
  'navBgColor', 'navTextColor',
  'primaryColor', 'siteBgColor', 'customMenus'
];

/** Header kolom untuk tab Umat. */
var UMAT_HEADERS = ['id', 'nama', 'status', 'nik', 'alamat', 'noHp', 'photo', 'kk', 'isPending'];

// ---------------------------------------------------------------------------
// Handler utama
// ---------------------------------------------------------------------------

/** GET — baca seluruh data konten (dipanggil frontend saat polling). */
function doGet() {
  try {
    return jsonOutput_(buildFullContent());
  } catch (err) {
    return jsonOutput_({ error: 'Gagal membaca data: ' + err });
  }
}

/** POST — terima aksi tulis dari frontend. */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'updateContent') {
      saveFullContent(body.data);
    } else if (action === 'updateUmat') {
      saveUmat_(body.data);
    } else {
      return jsonOutput_({ status: 'error', message: 'Aksi tidak dikenal: ' + action });
    }
    return jsonOutput_({ status: 'ok' });
  } catch (err) {
    return jsonOutput_({ status: 'error', message: 'Gagal menyimpan: ' + err });
  }
}

// ---------------------------------------------------------------------------
// Membaca
// ---------------------------------------------------------------------------

/** Bangun objek lengkap { settings, pages, umat } sesuai kontrak frontend. */
function buildFullContent() {
  return {
    settings: readSettings_(),
    pages: readPages_(),
    umat: readUmat_()
  };
}

/** Baca tab Settings: dua kolom [key, value]. customMenus di-parse dari JSON. */
function readSettings_() {
  var sheet = getSheet_(CONFIG.SHEET_SETTINGS, true);
  var values = sheet.getDataRange().getValues();
  var out = {};
  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0]).trim();
    if (!key) continue;
    var value = values[i][1];
    if (key === 'customMenus') {
      try { value = JSON.parse(value); } catch (err) { value = []; }
    }
    out[key] = value;
  }
  return out;
}

/** Baca tab Pages: tiga kolom [key, title, content] (baris 1 = header). */
function readPages_() {
  var sheet = getSheet_(CONFIG.SHEET_PAGES, true);
  var values = sheet.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (!key) continue;
    out[key] = {
      title: String(values[i][1] || ''),
      content: String(values[i][2] || '')
    };
  }
  return out;
}

/** Baca tab Umat: baris per data umat (baris 1 = header). */
function readUmat_() {
  var sheet = getSheet_(CONFIG.SHEET_UMAT, true);
  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    if (!String(values[i][1] || '').trim()) continue; // lewati baris tanpa nama
    out.push({
      id: String(values[i][0] || ''),
      nama: String(values[i][1] || ''),
      status: String(values[i][2] || 'Jemaat'),
      nik: String(values[i][3] || ''),
      alamat: String(values[i][4] || ''),
      noHp: String(values[i][5] || ''),
      photo: String(values[i][6] || ''),
      kk: String(values[i][7] || ''),
      isPending: String(values[i][8]).toLowerCase() === 'true'
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Menyimpan
// ---------------------------------------------------------------------------

/** Simpan konten lengkap (frontend mengirim seluruh data saat "Simpan"). */
function saveFullContent(data) {
  if (data.settings) saveSettings_(data.settings);
  if (data.pages) savePages_(data.pages);
  if (data.umat) saveUmat_(data.umat);
}

/** Tulis semua kunci setting yang dikenal (mode timpa penuh). */
function saveSettings_(settings) {
  var sheet = getSheet_(CONFIG.SHEET_SETTINGS, true);
  var rows = [];
  SETTING_KEYS.forEach(function (key) {
    var value = settings[key];
    if (value === undefined || value === null) value = '';
    if (typeof value === 'object') value = JSON.stringify(value);
    rows.push([key, String(value)]);
  });
  sheet.clearContents();
  if (rows.length) sheet.getRange(1, 1, rows.length, 2).setValues(rows);
}

/** Tulis semua halaman (mode timpa penuh). */
function savePages_(pages) {
  var sheet = getSheet_(CONFIG.SHEET_PAGES, true);
  var rows = [['key', 'title', 'content']];
  Object.keys(pages).forEach(function (key) {
    var page = pages[key] || {};
    rows.push([key, String(page.title || ''), String(page.content || '')]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
}

/** Tulis seluruh daftar umat (mode timpa penuh — frontend kirim daftar utuh). */
function saveUmat_(umat) {
  var sheet = getSheet_(CONFIG.SHEET_UMAT, true);
  var rows = [UMAT_HEADERS];
  (umat || []).forEach(function (u) {
    rows.push([
      String(u.id || ''),
      String(u.nama || ''),
      String(u.status || 'Jemaat'),
      String(u.nik || ''),
      String(u.alamat || ''),
      String(u.noHp || ''),
      String(u.photo || ''),
      String(u.kk || ''),
      u.isPending ? 'true' : 'false'
    ]);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, 9).setValues(rows);
}

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

/** Ambil sheet berdasarkan nama; buat otomatis jika belum ada. */
function getSheet_(name, createIfMissing) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet && createIfMissing) {
    sheet = ss.insertSheet(name);
  }
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  return sheet;
}

/** Bungkus objek sebagai respons JSON untuk ContentService. */
function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * JALANKAN SEKALI di editor Apps Script (ikon Play → pilih setupSheets)
 * untuk membuat tab & memicu otorisasi akses Spreadsheet.
 */
function setupSheets() {
  getSheet_(CONFIG.SHEET_SETTINGS, true);
  getSheet_(CONFIG.SHEET_PAGES, true);
  getSheet_(CONFIG.SHEET_UMAT, true);
  Logger.log('Sheet siap. Sekarang Deploy → New deployment → Web app.');
}
