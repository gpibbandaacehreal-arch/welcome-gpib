# Panduan Deployment Backend Google Apps Script

Panduan ini untuk memperbaiki sinkronisasi data situs GPIB Banda Aceh.
Backend lama (deployment `SCRIPT_URL`) sudah **tidak aktif (404/hang)**.
Ikuti langkah di bawah untuk membuat deployment baru yang sehat.

---

## Langkah 1 — Siapkan Spreadsheet penyimpanan

1. Buka [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Beri nama, misal `GPIB Data Store`.
3. Salin **ID Spreadsheet**: di URL `https://docs.google.com/spreadsheets/d/XXXX/edit`,
   bagian `XXXX` itulah ID-nya.

## Langkah 2 — Buat project Apps Script baru

1. Buka [script.google.com](https://script.google.com) → **+ New project**.
2. Hapus isi `Code.gs` default, tempel seluruh isi **`apps-script/Code.gs`** dari repo ini.
3. Ganti baris `SPREADSHEET_ID: 'ISI_DENGAN_ID_SPREADSHEET'` dengan ID dari Langkah 1.
4. Tekan **💾 Save** (Ctrl+S).

## Langkah 3 — Otorisasi & buat tab

1. Di toolbar editor, pilih fungsi **`setupSheets`** pada dropdown ▶.
2. Tekan **Run** → muncul dialog izin → **Review permissions** → pilih akun Anda →
   **Allow** (peringatan "unverified" bisa dilewati dengan **Advanced → Go to project**).
3. Cek log (**View → Logs**) — harus muncul `Sheet siap. Sekarang Deploy...`

## Langkah 4 — Deploy sebagai Web App

1. Klik **Deploy → New deployment**.
2. Klik ikon ⚙️ (Configure) → pilih **Web app**.
3. Isi:
   - **Description**: `GPIB production`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` ← **WAJIB**, jika tidak, pengunjung situs dapat 404/403
4. Klik **Deploy** → salin **Web app URL** (berakhiran `/exec`).

> ✅ **Catatan:** URL `/exec` yang mengarahkan (302 redirect) ke `script.googleusercontent.com`
> adalah **perilaku normal** Google Apps Script — bukan masalah.

## Langkah 5 — Pasang URL baru di frontend

Edit **`src/services/googleScript.ts`**:

```ts
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/<URL_BARU_ANDA>/exec';
```

Commit & push, lalu deploy frontend (Vercel).

## Langkah 6 — Uji

**Dari terminal:**
```bash
curl "https://script.google.com/macros/s/<URL_BARU_ANDA>/exec?t=1"
```
Harus mengembalikan JSON `{ "settings": {...}, "pages": {...}, "umat": [...] }`.

**Dari situs:** login admin → buka salah satu halaman → ubah konten → **Simpan**.
Refresh halaman — konten baru harus muncul (sinkron via polling 15 detik).
Banner peringatan kuning otomatis hilang.

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `404 Not Found` setelah redirect | Deployment dihapus / project hilang / URL salah | Buat deployment baru, pastikan URL `/exec` benar |
| `403 Forbidden` | Akses dibatasi | Deploy ulang dengan **Who has access: Anyone** |
| `500` dengan teks error | Script error saat eksekusi | Buka **View → Executions** untuk melihat stack trace |
| GET sukses tapi data kosong | Tab belum terisi | Login admin → tekan **Simpan** sekali untuk menulis data awal |
| Respons sangat lambat (>8 dtk) | Deployment lama / kena limit | Gunakan deployment baru; jangan banyak versi |
| Timeout `AbortError` di console | Server tidak merespons dalam 10 detik | Cek Executions; pastikan tidak ada infinite loop di script |

## Tips penting

- **Jangan pernah menghapus deployment** yang sedang dipakai situs — buat *New deployment* baru.
- Simpan **Google Spreadsheet + project Apps Script** di akun Google yang sama dengan pemilik situs.
- Saat menguji di browser, pastikan tidak memakai akun Google yang sama dengan pemilik
  script (untuk memastikan akses publik benar-benar "Anyone").
