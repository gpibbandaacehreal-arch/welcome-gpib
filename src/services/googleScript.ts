/**
 * Konfigurasi terpusat sinkronisasi data dengan Google Apps Script.
 *
 * Jika deployment Google Apps Script dibuat ulang / di-deploy ulang,
 * cukup perbarui URL di bawah ini — seluruh pemanggilan (GET & POST)
 * di aplikasi otomatis memakai URL terbaru.
 */
export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbycROw7gCO_xEwHmberQzMDfUf_nJIRVUuN-90o7DpSrhV1p8yZhQEqCUL9LEB_I-WF0g/exec';

/** Batas waktu tunggu respons server (ms). Deployment yang bermasalah sering menggantung tanpa respons. */
const REQUEST_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Ambil data lengkap dari Google Apps Script (GET). Melempar error jika bukan respons 2xx / timeout. */
export async function fetchFromGoogleScript(): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Kirim aksi tulis (updateContent / updateUmat) ke Google Apps Script.
 * Memakai mode 'no-cors' (sama seperti sebelumnya): permintaan tetap terkirim,
 * tapi respons tidak dapat dibaca — jadi kegagalan server tidak terdeteksi di sini.
 * Timeout mencegah tombol/UI menggantung jika server tidak merespons.
 */
export async function postToGoogleScript(payload: Record<string, unknown>): Promise<void> {
  await fetchWithTimeout(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}
